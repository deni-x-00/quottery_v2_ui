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
const PUBLIC_RPC_REQUESTS_PER_MINUTE = Number(process.env.PUBLIC_RPC_REQUESTS_PER_MINUTE || 30);
const PUBLIC_EVENT_VOLUME_REFRESH_LIMIT = Number(process.env.PUBLIC_EVENT_VOLUME_REFRESH_LIMIT || 6);
const SOURCE_CACHE_MS = Number(process.env.SOURCE_CACHE_MS || 3000);
const STATUS_CACHE_MS = Number(process.env.STATUS_CACHE_MS || 3000);
const BOB_STATUS_TIMEOUT_MS = Number(process.env.BOB_STATUS_TIMEOUT_MS || 2500);
const PUBLIC_TICK_TOLERANCE = Number(process.env.PUBLIC_TICK_TOLERANCE || 15);
const SC_INDEX = 2;
const FUNC_GET_ORDERS = 3;
const PUBLIC_RPC_BASE_URL = 'https://rpc.qubic.org/live/v1';
const STATUS_RESPONSE_KEYS = [
  'currentProcessingEpoch',
  'currentFetchingTick',
  'currentFetchingLogTick',
  'currentVerifyLoggingTick',
  'currentIndexingTick',
  'initialTick',
];
const BUILD_DIR = path.join(__dirname, '..', 'build');
const INDEX_HTML = path.join(BUILD_DIR, 'index.html');

const bobTargetUrls = String(BOB_TARGET_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (bobTargetUrls.length === 0) {
  console.error('BOB_TARGET_URL is required. Example: BOB_TARGET_URL=http://bob-node-host or http://bob1,http://bob2');
  process.exit(1);
}

const bobTargets = bobTargetUrls.map((targetUrl, index) => {
  const url = new URL(targetUrl);
  return {
    index,
    url,
    label: url.toString().replace(/\/$/, ''),
    transport: url.protocol === 'https:' ? https : http,
  };
});

let sourceCache = { at: 0, source: 'bob', bobTargetIndex: 0, tickInfo: null };
let statusCache = { at: 0, body: null, pending: null };
let publicRpcQueue = Promise.resolve();
let nextPublicRpcAt = 0;
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

function hasCachedEventVolume(eventId) {
  return (volumeCache.updatedAtByEventId[eventId] || 0) > 0;
}

function getBobTargetOrder(preferredIndex = null) {
  if (preferredIndex === null || preferredIndex === undefined) return bobTargets;

  const preferred = bobTargets.find((target) => target.index === preferredIndex);
  if (!preferred) return bobTargets;

  return [
    preferred,
    ...bobTargets.filter((target) => target.index !== preferredIndex),
  ];
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withPublicRpcLimit(task) {
  const minIntervalMs = Math.ceil(60000 / Math.max(1, PUBLIC_RPC_REQUESTS_PER_MINUTE));
  const run = publicRpcQueue.then(async () => {
    const waitMs = Math.max(0, nextPublicRpcAt - Date.now());
    if (waitMs > 0) {
      await delay(waitMs);
    }

    nextPublicRpcAt = Date.now() + minIntervalMs;
    return task();
  });

  publicRpcQueue = run.catch(() => {});
  return run;
}

function getJsonFromUrl(urlString, timeoutMs = Number(process.env.PUBLIC_RPC_TIMEOUT_MS || process.env.BOB_PROXY_TIMEOUT_MS || 30000)) {
  const targetUrl = new URL(urlString);
  const targetTransport = targetUrl.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = targetTransport.request({
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
      method: 'GET',
      path: `${targetUrl.pathname}${targetUrl.search}`,
      headers: {
        accept: 'application/json',
      },
      timeout: timeoutMs,
    }, (response) => {
      const chunks = [];

      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let parsed;
        try {
          parsed = text ? JSON.parse(text) : {};
        } catch {
          reject(new Error(`Non-JSON response (${response.statusCode}): ${text.slice(0, 160)}`));
          return;
        }

        if (response.statusCode < 200 || response.statusCode >= 300 || parsed?.error) {
          reject(new Error(parsed?.error || parsed?.message || `HTTP ${response.statusCode}`));
          return;
        }

        resolve(parsed);
      });
    });

    req.on('timeout', () => req.destroy(new Error('GET request timeout')));
    req.on('error', reject);
    req.end();
  });
}

function postJsonToUrl(urlString, payload) {
  const targetUrl = new URL(urlString);
  const targetTransport = targetUrl.protocol === 'https:' ? https : http;
  const body = Buffer.from(JSON.stringify(payload));

  return new Promise((resolve, reject) => {
    const req = targetTransport.request({
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
      method: 'POST',
      path: `${targetUrl.pathname}${targetUrl.search}`,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'content-length': body.length,
      },
      timeout: Number(process.env.PUBLIC_RPC_TIMEOUT_MS || process.env.BOB_PROXY_TIMEOUT_MS || 30000),
    }, (response) => {
      const chunks = [];

      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let parsed;
        try {
          parsed = text ? JSON.parse(text) : {};
        } catch {
          reject(new Error(`Non-JSON public RPC response (${response.statusCode}): ${text.slice(0, 160)}`));
          return;
        }

        if (response.statusCode < 200 || response.statusCode >= 300 || parsed?.error) {
          reject(new Error(parsed?.error || parsed?.message || `HTTP ${response.statusCode}`));
          return;
        }

        resolve(parsed);
      });
    });

    req.on('timeout', () => req.destroy(new Error('Public RPC timeout')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function bobPostJsonToTarget(target, pathname, payload, maxRetries = 10) {
  const upstreamUrl = new URL(pathname, target.url);
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

      const upstreamReq = target.transport.request(options, (upstreamRes) => {
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

async function bobPostJson(pathname, payload, maxRetries = 10, preferredTargetIndex = null) {
  const errors = [];

  for (const target of getBobTargetOrder(preferredTargetIndex)) {
    try {
      return await bobPostJsonToTarget(target, pathname, payload, maxRetries);
    } catch (error) {
      errors.push(`${target.label}: ${error.message}`);
      console.warn(`[bob-proxy] Bob POST ${pathname} failed via ${target.label}:`, error.message);
    }
  }

  throw new Error(errors.length > 0 ? errors.join('; ') : 'All Bob targets failed');
}

async function querySmartContractViaPublicRpc(funcNumber, inputHex = '') {
  const inputSize = Math.floor((inputHex || '').length / 2);
  const payload = {
    contractIndex: SC_INDEX,
    inputType: funcNumber,
    inputSize,
    requestData: inputHex ? Buffer.from(inputHex, 'hex').toString('base64') : '',
  };

  return withPublicRpcLimit(async () => {
    const body = await postJsonToUrl(`${PUBLIC_RPC_BASE_URL}/querySmartContract`, payload);
    if (!body?.responseData) {
      throw new Error('Public RPC response does not include responseData');
    }
    return Buffer.from(body.responseData, 'base64');
  });
}

function extractBobProcessedTick(data) {
  const tick = Number(data?.lastProcessedTick ?? data?.currentFetchingTick ?? 0);
  return Number.isFinite(tick) && tick > 0 ? tick : 0;
}

async function getBobProcessedTick(target) {
  try {
    const data = await getJsonFromUrl(new URL('/status', target.url).toString(), BOB_STATUS_TIMEOUT_MS);
    return {
      target,
      tick: extractBobProcessedTick(data),
      error: null,
    };
  } catch (error) {
    return {
      target,
      tick: 0,
      error: error.message,
    };
  }
}

async function getBobStatus(target) {
  try {
    const data = await getJsonFromUrl(new URL('/status', target.url).toString(), BOB_STATUS_TIMEOUT_MS);
    return {
      target,
      data,
      tick: extractBobProcessedTick(data),
      error: null,
    };
  } catch (error) {
    return {
      target,
      data: null,
      tick: 0,
      error: error.message,
    };
  }
}

async function getPublicTick() {
  try {
    const data = await getJsonFromUrl(`${PUBLIC_RPC_BASE_URL}/tick-info`);
    const tick = Number(data?.tickInfo?.tick || data?.tick || 0);
    return Number.isFinite(tick) && tick > 0 ? tick : 0;
  } catch {
    return 0;
  }
}

function pickStatusResponse(data) {
  return STATUS_RESPONSE_KEYS.reduce((acc, key) => {
    if (data && data[key] !== undefined) {
      acc[key] = data[key];
    }
    return acc;
  }, {});
}

async function getPreferredDataSource() {
  const now = Date.now();
  if (sourceCache.tickInfo && now - sourceCache.at < SOURCE_CACHE_MS) {
    return sourceCache;
  }

  const [bobStatuses, publicTick] = await Promise.all([
    Promise.all(bobTargets.map((target) => getBobProcessedTick(target))),
    getPublicTick(),
  ]);
  const eligibleBobStatuses = bobStatuses
    .map((status) => ({
      ...status,
      lag: status.tick && publicTick ? publicTick - status.tick : 0,
    }))
    .filter((status) => status.tick > 0)
    .filter((status) => !publicTick || status.lag <= PUBLIC_TICK_TOLERANCE)
    .sort((a, b) => b.tick - a.tick);

  const bestBob = eligibleBobStatuses[0] || null;
  const bestObservedBob = [...bobStatuses].sort((a, b) => b.tick - a.tick)[0] || null;

  sourceCache = {
    at: now,
    source: bestBob ? 'bob' : 'public',
    bobTargetIndex: bestBob?.target.index ?? bestObservedBob?.target.index ?? 0,
    tickInfo: {
      bobTick: bestBob?.tick || bestObservedBob?.tick || 0,
      bobTarget: bestBob?.target.label || bestObservedBob?.target.label || null,
      bobStatuses: bobStatuses.map((status) => ({
        target: status.target.label,
        tick: status.tick,
        error: status.error,
      })),
      publicTick,
      lag: bestBob?.lag ?? (
        bestObservedBob?.tick && publicTick ? publicTick - bestObservedBob.tick : 0
      ),
    },
  };
  return sourceCache;
}

async function querySmartContract(funcNumber, inputHex = '') {
  const sourceInfo = await getPreferredDataSource();
  if (sourceInfo.source === 'public') {
    return querySmartContractViaPublicRpc(funcNumber, inputHex);
  }

  const nonce = Math.floor(Math.random() * 0xffffffff) + 1;
  try {
    const resp = await bobPostJson(
      '/querySmartContract',
      {
        nonce,
        scIndex: SC_INDEX,
        funcNumber,
        data: inputHex,
      },
      10,
      sourceInfo.bobTargetIndex
    );

    if (!resp?.data) return Buffer.alloc(0);
    return Buffer.from(resp.data, 'hex');
  } catch (error) {
    sourceCache = {
      at: Date.now(),
      source: 'public',
      bobTargetIndex: sourceInfo.bobTargetIndex,
      tickInfo: {
        ...(sourceCache.tickInfo || {}),
        bobError: error.message,
      },
    };
    console.warn('[event-volumes] All Bob querySmartContract attempts failed; switching event volume source to public RPC:', error.message);
    return querySmartContractViaPublicRpc(funcNumber, inputHex);
  }
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
        return { eventId, ok: true, volume };
      })
      .catch((error) => {
        console.warn(`[event-volumes] Failed to fetch volume for event ${eventId}:`, error.message);
        volumeCache.failedAtByEventId[eventId] = Date.now();
        return {
          eventId,
          ok: false,
          error: error.message,
          volume: hasCachedEventVolume(eventId) ? volumeCache.volumes[eventId] : null,
        };
      })
      .finally(() => {
        delete volumeCache.pendingByEventId[eventId];
      });
  }

  return volumeCache.pendingByEventId[eventId];
}

async function refreshEventVolumes(eventIds) {
  const queue = [...eventIds];
  const results = [];
  const workerCount = Math.max(1, Math.min(EVENT_VOLUME_REFRESH_CONCURRENCY, queue.length));
  const workers = Array.from({ length: workerCount }, async () => {
    while (queue.length > 0) {
      const eventId = queue.shift();
      results.push(await refreshEventVolume(eventId));
    }
  });

  await Promise.all(workers);
  return results;
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

    // Never treat failed fresh attempts as usable cache before this event has
    // had at least one successful volume fetch.
    if (!hasCachedEventVolume(eventId)) return true;

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
    const sourceInfo = await getPreferredDataSource();
    const source = sourceInfo.source;
    const refreshEventIds = source === 'public'
      ? staleEventIds.slice(0, Math.max(1, PUBLIC_EVENT_VOLUME_REFRESH_LIMIT))
      : staleEventIds;
    const deferredEventIds = staleEventIds.slice(refreshEventIds.length);
    const results = await refreshEventVolumes(refreshEventIds);
    const failedEvents = results
      .filter((result) => result && result.ok === false)
      .map((result) => ({ eventId: result.eventId, error: result.error }));
    const failedEventIds = failedEvents.map((result) => result.eventId);
    const missingEventIds = eventIds.filter((eventId) => !hasCachedEventVolume(eventId));

    if (missingEventIds.length === eventIds.length && deferredEventIds.length === 0) {
      sendJson(res, 502, {
        error: 'Failed to refresh event volumes',
        volumes: {},
        cached: false,
        source,
        lastUpdatedAt: volumeCache.lastUpdatedAt,
        ttlMs: EVENT_VOLUME_CACHE_MS,
        failedEvents,
        failedEventIds,
        missingEventIds,
      });
      return;
    }

    sendJson(res, 200, {
      volumes: pickEventVolumes(eventIds),
      cached: false,
      source,
      lastUpdatedAt: volumeCache.lastUpdatedAt,
      ttlMs: EVENT_VOLUME_CACHE_MS,
      partial: missingEventIds.length > 0 || failedEventIds.length > 0 || deferredEventIds.length > 0,
      failedEvents,
      failedEventIds,
      missingEventIds,
      deferredEventIds,
    });
  } catch (error) {
    sendJson(res, 502, { error: 'Failed to refresh event volumes', details: error.message });
  }
}

async function handleBobStatus(req, res) {
  const now = Date.now();
  if (statusCache.body && now - statusCache.at < STATUS_CACHE_MS) {
    sendJson(res, 200, statusCache.body);
    return;
  }

  if (statusCache.pending) {
    try {
      const body = await statusCache.pending;
      sendJson(res, 200, body);
    } catch (error) {
      sendJson(res, 502, { error: 'All Bob status endpoints unavailable' });
    }
    return;
  }

  statusCache.pending = resolveBobStatusResponse()
    .then((body) => {
      statusCache = { at: Date.now(), body, pending: null };
      return body;
    })
    .catch((error) => {
      statusCache = { at: 0, body: null, pending: null };
      throw error;
    });

  try {
    const body = await statusCache.pending;
    sendJson(res, 200, body);
  } catch (error) {
    sendJson(res, 502, { error: 'All Bob status endpoints unavailable' });
  }
}

async function resolveBobStatusResponse() {
  const statuses = await Promise.all(bobTargets.map((target) => getBobStatus(target)));
  const successfulStatuses = statuses
    .filter((status) => status.data)
    .sort((a, b) => b.tick - a.tick);
  const bestStatus = successfulStatuses[0];

  if (!bestStatus) {
    throw new Error('All Bob status endpoints unavailable');
  }

  return pickStatusResponse(bestStatus.data);
}

function proxyRequestToBobTarget(target, req, body, upstreamPath, search, headers) {
  const upstreamUrl = new URL(`${upstreamPath}${search}`, target.url);
  const requestHeaders = { ...headers };
  if (body.length > 0) {
    requestHeaders['content-length'] = body.length;
  } else {
    delete requestHeaders['content-length'];
  }

  return new Promise((resolve, reject) => {
    const upstreamReq = target.transport.request({
      protocol: upstreamUrl.protocol,
      hostname: upstreamUrl.hostname,
      port: upstreamUrl.port || (upstreamUrl.protocol === 'https:' ? 443 : 80),
      method: req.method,
      path: `${upstreamUrl.pathname}${upstreamUrl.search}`,
      headers: requestHeaders,
      timeout: Number(process.env.BOB_PROXY_TIMEOUT_MS || 30000),
    }, (upstreamRes) => {
      const chunks = [];
      upstreamRes.on('data', (chunk) => chunks.push(chunk));
      upstreamRes.on('end', () => {
        resolve({
          statusCode: upstreamRes.statusCode || 502,
          headers: upstreamRes.headers,
          body: Buffer.concat(chunks),
        });
      });
    });

    upstreamReq.on('timeout', () => upstreamReq.destroy(new Error('Bob upstream timeout')));
    upstreamReq.on('error', reject);

    if (body.length > 0) {
      upstreamReq.write(body);
    }

    upstreamReq.end();
  });
}

function shouldTryNextBob(response) {
  if ([502, 503, 504].includes(Number(response?.statusCode))) return true;

  try {
    const body = JSON.parse(Buffer.from(response?.body || '').toString('utf8') || '{}');
    const message = String(body?.error || body?.message || '').toLowerCase();
    return message.includes('no connection') || message.includes('unavailable') || message.includes('timeout');
  } catch {
    return false;
  }
}

async function proxyToBob(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const upstreamPath = requestUrl.pathname.slice(BOB_PROXY_PREFIX.length) || '/';

  if (req.method === 'GET' && upstreamPath === '/status') {
    await handleBobStatus(req, res);
    return;
  }

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

  const errors = [];
  const preferredIndex = sourceCache.source === 'bob' ? sourceCache.bobTargetIndex : null;
  const targetOrder = getBobTargetOrder(preferredIndex);
  const lastTargetIndex = targetOrder[targetOrder.length - 1]?.index;

  for (const target of targetOrder) {
    try {
      const response = await proxyRequestToBobTarget(
        target,
        req,
        body,
        upstreamPath,
        requestUrl.search,
        headers
      );

      if (shouldTryNextBob(response) && target.index !== lastTargetIndex) {
        errors.push(`${target.label}: HTTP ${response.statusCode}`);
        continue;
      }

      setCorsHeaders(res);
      res.setHeader('X-Proxy-Bob-Target', target.label);
      res.writeHead(response.statusCode, response.headers);
      res.end(response.body);
      return;
    } catch (error) {
      errors.push(`${target.label}: ${error.message}`);
    }
  }

  sendJson(res, 502, {
    error: 'All Bob upstreams unavailable',
    details: errors.join('; '),
  });
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
