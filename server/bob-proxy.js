const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 40421);
const BOB_TARGET_URL = process.env.BOB_TARGET_URL;
const BOB_PROXY_PREFIX = '/api/bob';
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 10 * 1024 * 1024);
const BUILD_DIR = path.join(__dirname, '..', 'build');
const INDEX_HTML = path.join(BUILD_DIR, 'index.html');

if (!BOB_TARGET_URL) {
  console.error('BOB_TARGET_URL is required. Example: BOB_TARGET_URL=http://bob-node-host');
  process.exit(1);
}

const bobTarget = new URL(BOB_TARGET_URL);
const transport = bobTarget.protocol === 'https:' ? https : http;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function sendJson(res, statusCode, body) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
  };

  return types[ext] || 'application/octet-stream';
}

function sendFile(res, filePath) {
  fs.createReadStream(filePath)
    .on('error', () => sendJson(res, 500, { error: 'Failed to read file' }))
    .pipe(res);
}

function serveStatic(req, res, requestUrl) {
  if (!fs.existsSync(INDEX_HTML)) {
    sendJson(res, 404, {
      error: 'Frontend build not found',
      details: 'Run yarn build before using this server for production.',
    });
    return;
  }

  const decodedPath = decodeURIComponent(requestUrl.pathname);
  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const filePath = path.normalize(path.join(BUILD_DIR, requestedPath));
  const relativePath = path.relative(BUILD_DIR, filePath);
  const isInsideBuild = relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);

  if (isInsideBuild && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    sendFile(res, filePath);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  sendFile(res, INDEX_HTML);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function proxyToBob(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const upstreamPath = requestUrl.pathname.slice(BOB_PROXY_PREFIX.length) || '/';
  const upstreamUrl = new URL(`${upstreamPath}${requestUrl.search}`, bobTarget);

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    return sendJson(res, 413, { error: error.message });
  }

  const headers = {
    accept: req.headers.accept || 'application/json',
  };

  if (req.headers['content-type']) {
    headers['content-type'] = req.headers['content-type'];
  }

  if (body.length > 0) {
    headers['content-length'] = body.length;
  }

  const options = {
    protocol: upstreamUrl.protocol,
    hostname: upstreamUrl.hostname,
    port: upstreamUrl.port || (upstreamUrl.protocol === 'https:' ? 443 : 80),
    method: req.method,
    path: `${upstreamUrl.pathname}${upstreamUrl.search}`,
    headers,
    timeout: Number(process.env.BOB_PROXY_TIMEOUT_MS || 30000),
  };

  const upstreamReq = transport.request(options, (upstreamRes) => {
    setCorsHeaders(res);
    res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
    upstreamRes.pipe(res);
  });

  upstreamReq.on('timeout', () => {
    upstreamReq.destroy(new Error('Bob upstream timeout'));
  });

  upstreamReq.on('error', (error) => {
    if (!res.headersSent) {
      sendJson(res, 502, { error: 'Bob upstream unavailable', details: error.message });
    } else {
      res.destroy(error);
    }
  });

  if (body.length > 0) {
    upstreamReq.write(body);
  }

  upstreamReq.end();
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (requestUrl.pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      upstreamConfigured: true,
    });
    return;
  }

  const isBobProxyPath = requestUrl.pathname === BOB_PROXY_PREFIX
    || requestUrl.pathname.startsWith(`${BOB_PROXY_PREFIX}/`);

  if (!isBobProxyPath) {
    if (req.method === 'GET' || req.method === 'HEAD') {
      serveStatic(req, res, requestUrl);
    } else {
      sendJson(res, 404, { error: 'Not found' });
    }
    return;
  }

  if (!['GET', 'POST'].includes(req.method || '')) {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  await proxyToBob(req, res);
});

server.listen(PORT, () => {
  console.log(`Bob proxy listening on port ${PORT}`);
  console.log(`Forwarding ${BOB_PROXY_PREFIX}/* to configured Bob upstream`);
});
