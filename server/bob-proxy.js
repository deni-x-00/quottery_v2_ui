const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 40421);
const BOB_TARGET_URL = process.env.BOB_TARGET_URL;
const BOB_PROXY_PREFIX = '/api/bob';
const EVENT_VOLUMES_PATH = '/api/event-volumes';
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 10 * 1024 * 1024);
const EVENT_VOLUME_CACHE_MS = Number(process.env.EVENT_VOLUME_CACHE_MS || 10 * 60 * 1000);
const EVENT_VOLUME_ERROR_RETRY_MS = Number(process.env.EVENT_VOLUME_ERROR_RETRY_MS || 30 * 1000);
const EVENT_VOLUME_REFRESH_CONCURRENCY = Number(process.env.EVENT_VOLUME_REFRESH_CONCURRENCY || 1);
const SC_INDEX = 2;
const FUNC_GET_ORDERS = 3;
const BUILD_DIR = path.join(__dirname, '..', 'build');
const INDEX_HTML = path.join(BUILD_DIR, 'index.html');

if (!BOB_TARGET_URL) {
  console.error('BOB_TARGET_URL is required. Example: BOB_TARGET_URL=http://bob-node-host');
  process.exit(1);
}

const bobTarget = new URL(BOB_TARGET_URL);
const transport = bobTarget.protocol === 'https:' ? https : http;
const volumeCache = {
  lastUpdatedAt: 0,
  volumes: {},
  updatedAtByEventId: {},
  failedAtByEventId: {},
  pendingByEventId: {},
};

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

function pack4xUint64LE(a, b, c, d) {
  const buf = Buffer.alloc(32);
  buf.writeBigUInt64LE(BigInt(a), 0);
  buf.writeBigUInt64LE(BigInt(b), 8);
  buf.writeBigUInt64LE(BigInt(c), 16);
  buf.writeBigUInt64LE(BigInt(d), 24);
  return buf.toString('hex');
}

function readInt64LE(buffer, offset) {
  return Number(buffer.readBigInt64LE(offset));
}

function normalizeEventIds(idsParam) {
  return String(idsParam || '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value >= 0)
    .filter((value, index, array) => array.indexOf(value) === index)
    .sort((a, b) => a - b);
}

function bobPostJson(pathname, payload, maxRetries = 10) {
  const upstreamUrl = new URL(pathname, bobTarget);
  const body = Buffer.from(JSON.stringify(payload));

  return new Promise((resolve, reject) => {
    const attempt = (attemptIndex) => {
      const options = {
        protocol: upstreamUrl.protocol,
        hostname: upstreamUrl.hostname,
        port: upstreamUrl.port || (upstreamUrl.protocol === 'https:' ? 443 : 80),
        method: 'POST',
        path: `${upstreamUrl.pathname}${upstreamUrl.search}`,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'content-length': body.length,
        },
        timeout: Number(process.env.BOB_PROXY_TIMEOUT_MS || 30000),
      };

      const upstreamReq = transport.request(options, (upstreamRes) => {
        const chunks = [];

        upstreamRes.on('data', (chunk) => chunks.push(chunk));
        upstreamRes.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let parsed;
          try {
            parsed = text ? JSON.parse(text) : {};
          } catch (error) {
            if (attemptIndex < maxRetries - 1 && upstreamRes.statusCode >= 200 && upstreamRes.statusCode < 300) {
              setTimeout(() => attempt(attemptIndex + 1), 250);
              return;
            }
            reject(new Error(`Non-JSON Bob response (${upstreamRes.statusCode}): ${text.slice(0, 160)}`));
            return;
          }

          if ((parsed?.error === 'pending' || parsed?.pending === true) && attemptIndex < maxRetries - 1) {
            setTimeout(() => attempt(attemptIndex + 1), 250);
            return;
          }

          if (upstreamRes.statusCode < 200 || upstreamRes.statusCode >= 300 || parsed?.error) {
            reject(new Error(parsed?.error || parsed?.message || `HTTP ${upstreamRes.statusCode}`));
            return;
          }

          resolve(parsed);
        });
      });

      upstreamReq.on('timeout', () => upstreamReq.destroy(new Error('Bob upstream timeout')));
      upstreamReq.on('error', reject);
      upstreamReq.write(body);
      upstreamReq.end();
    };

    attempt(0);
  });
}

async function querySmartContract(funcNumber, inputHex = '') {
  const nonce = Math.floor(Math.random() * 0xffffffff) + 1;
  const resp = await bobPostJson('/querySmartContract', {
    nonce,
    scIndex: SC_INDEX,
    funcNumber,
    data: inputHex,
  });

  if (!resp?.data) return Buffer.alloc(0);
  return Buffer.from(resp.data, 'hex');
}

async function fetchOrders(eventId, option, isBid) {
  const raw = await querySmartContract(
    FUNC_GET_ORDERS,
    pack4xUint64LE(eventId, option, isBid ? 1 : 0, 0)
  );
  const orders = [];

  for (let i = 0; i < 256; i += 1) {
    const base = i * 48;
    if (base + 48 > raw.length) break;

    const entity = raw.subarray(base, base + 32);
    if (entity.every((byte) => byte === 0)) break;

    const amount = readInt64LE(raw, base + 32);
    const price = readInt64LE(raw, base + 40);
    if (Number.isFinite(amount) && Number.isFinite(price) && amount > 0 && price > 0) {
      orders.push({ amount, price });
    }
  }

  return orders;
}

async function fetchEventOpenVolume(eventId) {
  const sides = await Promise.all([
    fetchOrders(eventId, 0, true),
    fetchOrders(eventId, 0, false),
    fetchOrders(eventId, 1, true),
    fetchOrders(eventId, 1, false),
  ]);

  return sides
    .flat()
    .reduce((sum, order) => sum + (Number(order.amount || 0) * Number(order.price || 0)), 0);
}

async function refreshEventVolume(eventId) {
  if (!volumeCache.pendingByEventId[eventId]) {
    volumeCache.pendingByEventId[eventId] = fetchEventOpenVolume(eventId)
      .then((volume) => {
        volumeCache.volumes[eventId] = volume;
        volumeCache.updatedAtByEventId[eventId] = Date.now();
        delete volumeCache.failedAtByEventId[eventId];
        volumeCache.lastUpdatedAt = Math.max(volumeCache.lastUpdatedAt, volumeCache.updatedAtByEventId[eventId]);
        return volume;
      })
      .catch((error) => {
        console.warn(`[event-volumes] Failed to fetch volume for event ${eventId}:`, error.message);
        volumeCache.failedAtByEventId[eventId] = Date.now();
        return volumeCache.volumes[eventId] || 0;
      })
      .finally(() => {
        delete volumeCache.pendingByEventId[eventId];
      });
  }

  return volumeCache.pendingByEventId[eventId];
}

async function refreshEventVolumes(eventIds) {
  const queue = [...eventIds];
  const workerCount = Math.max(1, Math.min(EVENT_VOLUME_REFRESH_CONCURRENCY, queue.length));
  const workers = Array.from({ length: workerCount }, async () => {
    while (queue.length > 0) {
      const eventId = queue.shift();
      await refreshEventVolume(eventId);
    }
  });

  await Promise.all(workers);
}

function pickEventVolumes(eventIds) {
  return eventIds.reduce((acc, eventId) => {
    acc[eventId] = volumeCache.volumes[eventId] || 0;
    return acc;
  }, {});
}

async function handleEventVolumes(req, res, requestUrl) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const eventIds = normalizeEventIds(requestUrl.searchParams.get('ids'));
  if (eventIds.length === 0) {
    sendJson(res, 200, { volumes: {}, cached: true, lastUpdatedAt: volumeCache.lastUpdatedAt });
    return;
  }

  const now = Date.now();
  const staleEventIds = eventIds.filter((eventId) => {
    const updatedAt = volumeCache.updatedAtByEventId[eventId] || 0;
    if (updatedAt > 0) return now - updatedAt >= EVENT_VOLUME_CACHE_MS;

    const failedAt = volumeCache.failedAtByEventId[eventId] || 0;
    return !failedAt || now - failedAt >= EVENT_VOLUME_ERROR_RETRY_MS;
  });

  if (staleEventIds.length === 0) {
    sendJson(res, 200, {
      volumes: pickEventVolumes(eventIds),
      cached: true,
      lastUpdatedAt: volumeCache.lastUpdatedAt,
      ttlMs: EVENT_VOLUME_CACHE_MS,
    });
    return;
  }

  try {
    await refreshEventVolumes(staleEventIds);
    sendJson(res, 200, {
      volumes: pickEventVolumes(eventIds),
      cached: false,
      lastUpdatedAt: volumeCache.lastUpdatedAt,
      ttlMs: EVENT_VOLUME_CACHE_MS,
    });
  } catch (error) {
    sendJson(res, 502, { error: 'Failed to refresh event volumes', details: error.message });
  }
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

  if (requestUrl.pathname === EVENT_VOLUMES_PATH) {
    await handleEventVolumes(req, res, requestUrl);
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
