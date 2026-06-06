const WebSocket = require('ws');
const { closePool, query } = require('./db');
const { decodeTickMessage } = require('./decoder');
const { saveDecodedTick } = require('./store');
const {
  QUOTTERY_IDENTITY,
} = require('./constants');

const DEFAULT_RECONNECT_MS = Number(process.env.INDEXER_RECONNECT_MS || 5000);
const START_TICK = Number(process.env.INDEXER_START_TICK || 0);
const DRY_RUN = process.env.INDEXER_DRY_RUN === '1' || process.env.INDEXER_DRY_RUN === 'true';
const PRINT_RAW = process.env.INDEXER_PRINT_RAW === '1' || process.env.INDEXER_PRINT_RAW === 'true';
const PRINT_SUMMARY = process.env.INDEXER_PRINT_SUMMARY !== '0' && process.env.INDEXER_PRINT_SUMMARY !== 'false';
const EXIT_AFTER_MS = Number(process.env.INDEXER_EXIT_AFTER_MS || 0);
const WS_CONNECT_TIMEOUT_MS = Number(process.env.INDEXER_WS_CONNECT_TIMEOUT_MS || 10000);
const WS_SUBSCRIBE_TIMEOUT_MS = Number(process.env.INDEXER_WS_SUBSCRIBE_TIMEOUT_MS || 15000);
const WS_TICK_STALE_MS = Number(process.env.INDEXER_WS_TICK_STALE_MS || 0);
const WS_STATUS_TIMEOUT_MS = Number(process.env.INDEXER_WS_STATUS_TIMEOUT_MS || 5000);
const WS_IDLE_LOG_MS = Number(process.env.INDEXER_WS_IDLE_LOG_MS || 60000);
const WS_TICKDATA_CHECK = process.env.INDEXER_WS_TICKDATA_CHECK !== '0'
  && process.env.INDEXER_WS_TICKDATA_CHECK !== 'false';
const WS_TICKDATA_REQUIRE_DIGEST = process.env.INDEXER_WS_TICKDATA_REQUIRE_DIGEST === '1'
  || process.env.INDEXER_WS_TICKDATA_REQUIRE_DIGEST === 'true';
const WS_URLS = buildWsUrls();

let stopped = false;
let currentSocket = null;
let currentWsIndex = 0;
let messageQueue = Promise.resolve();
let lastProcessedTick = null;
let lastProcessedEpoch = null;
let activeConnection = null;

function splitEndpointList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeWsUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `ws://${raw}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol === 'https:') url.protocol = 'wss:';
    else if (url.protocol === 'http:') url.protocol = 'ws:';
    else if (url.protocol !== 'ws:' && url.protocol !== 'wss:') return '';
    if (!url.pathname || url.pathname === '/') url.pathname = '/ws/qubic';
    url.search = '';
    return url.toString();
  } catch {
    return '';
  }
}

function wsUrlToHttpBase(wsUrl) {
  try {
    const url = new URL(wsUrl);
    url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    url.pathname = '/';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function buildWsUrls() {
  const directUrls = [
    ...splitEndpointList(process.env.BOB_WS_URL),
    ...splitEndpointList(process.env.QUBIC_WS_URL),
  ].map(normalizeWsUrl).filter(Boolean);

  const bobTargetUrls = splitEndpointList(process.env.BOB_TARGET_URL)
    .map(normalizeWsUrl)
    .filter(Boolean);

  const urls = directUrls.length ? directUrls : bobTargetUrls;
  return [...new Set(urls.length ? urls : ['ws://localhost:40420/ws/qubic'])];
}

function statusTick(body) {
  const tick = Number(
    body?.lastProcessedTick
    ?? body?.currentFetchingTick
    ?? body?.status?.lastProcessedTick
    ?? body?.status?.currentFetchingTick
    ?? body?.data?.lastProcessedTick
    ?? body?.data?.currentFetchingTick
    ?? body?.result?.lastProcessedTick
    ?? body?.result?.currentFetchingTick
    ?? 0
  );
  return Number.isFinite(tick) && tick > 0 ? tick : 0;
}

async function fetchStatusTick(wsUrl) {
  const base = wsUrlToHttpBase(wsUrl);
  if (!base) throw new Error('Cannot derive HTTP status URL from WS URL');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WS_STATUS_TIMEOUT_MS);
  try {
    const response = await fetch(`${base}/status`, { signal: controller.signal });
    const text = await response.text();
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 200)}`);
    const body = text ? JSON.parse(text) : null;
    const tick = statusTick(body);
    if (!tick) throw new Error(`status response has no processed tick: ${text.slice(0, 200)}`);
    return tick;
  } finally {
    clearTimeout(timer);
  }
}

function tickDataFromBody(body) {
  return body?.tickdata || body?.tickData || body?.data?.tickdata || body?.data?.tickData || body?.result?.tickdata || body?.result?.tickData || null;
}

function validateTickData(body, requestedTick) {
  const tickdata = tickDataFromBody(body);
  if (!tickdata) {
    throw new Error('tickdata response has no tickdata object');
  }

  const outerTick = Number(body?.tick || body?.data?.tick || body?.result?.tick || 0);
  const innerTick = Number(tickdata.tick || 0);
  const epoch = Number(tickdata.epoch || 0);
  const signature = String(tickdata.signature || '');
  const zeroSignature = !signature || /^0+$/.test(signature);

  if (outerTick && outerTick !== requestedTick) {
    throw new Error(`tickdata outer tick ${outerTick} != requested ${requestedTick}`);
  }
  if (innerTick !== requestedTick) {
    throw new Error(`tickdata.tick ${innerTick || 0} != requested ${requestedTick}`);
  }
  if (!Number.isFinite(epoch) || epoch <= 0) {
    throw new Error(`tickdata epoch is invalid: ${epoch || 0}`);
  }
  if (zeroSignature) {
    throw new Error('tickdata signature is empty/zero');
  }
  if (WS_TICKDATA_REQUIRE_DIGEST && (!Array.isArray(tickdata.transactionDigests) || tickdata.transactionDigests.length === 0)) {
    throw new Error('tickdata transactionDigests is empty');
  }

  return {
    tick: innerTick,
    epoch,
    transactionDigestCount: Array.isArray(tickdata.transactionDigests) ? tickdata.transactionDigests.length : 0,
    voteCount: Array.isArray(body?.votes) ? body.votes.length : 0,
  };
}

async function fetchTickDataHealth(wsUrl, tick) {
  const base = wsUrlToHttpBase(wsUrl);
  if (!base) throw new Error('Cannot derive HTTP tickdata URL from WS URL');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WS_STATUS_TIMEOUT_MS);
  try {
    const response = await fetch(`${base}/tick/${tick}`, { signal: controller.signal });
    const text = await response.text();
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 200)}`);
    const body = text ? JSON.parse(text) : null;
    return validateTickData(body, tick);
  } finally {
    clearTimeout(timer);
  }
}

async function selectHealthyWsIndex(startTick) {
  if (!startTick) return currentWsIndex;

  const initialIndex = currentWsIndex;
  const failures = [];
  for (let attempt = 0; attempt < WS_URLS.length; attempt += 1) {
    const index = (initialIndex + attempt) % WS_URLS.length;
    const wsUrl = WS_URLS[index];
    try {
      const tick = await fetchStatusTick(wsUrl);
      if (tick >= startTick) {
        const tickData = WS_TICKDATA_CHECK ? await fetchTickDataHealth(wsUrl, startTick) : null;
        if (index !== currentWsIndex) {
          console.log(`[quottery-indexer] Selected ${wsUrl}: statusTick=${tick} >= startTick=${startTick}${tickData ? `, tickdata epoch=${tickData.epoch}, txDigests=${tickData.transactionDigestCount}, votes=${tickData.voteCount}` : ''}`);
        }
        return index;
      }
      failures.push(`${wsUrl} statusTick=${tick} < startTick=${startTick}`);
    } catch (error) {
      failures.push(`${wsUrl} status failed: ${error.message}`);
    }
  }

  console.warn(`[quottery-indexer] No WS endpoint is confirmed at startTick=${startTick}; using ${WS_URLS[initialIndex]}. Checked: ${failures.join(' | ')}`);
  return initialIndex;
}

async function getResumeTick() {
  if (DRY_RUN) return START_TICK > 0 ? START_TICK : 0;

  const result = await query("SELECT value->>'tick' AS tick FROM indexer_state WHERE key = 'quottery:last_tick'");
  const lastTick = Number(result.rows[0]?.tick || 0);
  if (lastTick > 0) return lastTick + 1;
  return START_TICK > 0 ? START_TICK : 0;
}

function buildSubscription(startTick) {
  return {
    jsonrpc: '2.0',
    method: 'qubic_subscribe',
    params: ['tickStream', {
      txFilters: [
        {
          to: QUOTTERY_IDENTITY,
        },
      ],
      startTick,
      skipEmptyTicks: true,
      includeInputData: true,
      excludeTxs: false,
      excludeLogs: false,
    }],
    id: 1,
  };
}

function lastTickLabel() {
  if (!lastProcessedTick) return 'lastTick=pending';
  return `lastTick=${lastProcessedTick}${lastProcessedEpoch ? ` epoch=${lastProcessedEpoch}` : ''}`;
}

function switchToNextWsUrl() {
  currentWsIndex = (currentWsIndex + 1) % WS_URLS.length;
}

async function handleMessage(raw) {
  if (activeConnection) activeConnection.lastMessageAt = Date.now();
  let message;
  try {
    message = JSON.parse(raw.toString('utf8'));
  } catch (error) {
    console.warn('[quottery-indexer] Ignoring non-JSON WS message:', error.message);
    return;
  }

  if (message.error) {
    console.error('[quottery-indexer] WS JSON-RPC error:', JSON.stringify(message.error));
    return;
  }

  if (message.result && message.id === 1) {
    console.log(`[quottery-indexer] Subscribed: ${message.result}`);
    if (activeConnection) {
      activeConnection.subscribed = true;
      activeConnection.lastMessageAt = Date.now();
    }
    return;
  }

  const decoded = await decodeTickMessage(message);
  if (PRINT_RAW) {
    console.log('[quottery-indexer] raw message:', JSON.stringify(message));
  }

  if (decoded.control?.catchUpProgress) {
    console.log(`[quottery-indexer] Catch-up ${decoded.control.percent}% ${lastTickLabel()} (position ${decoded.control.current}/${decoded.control.total}, matched ${decoded.control.matched})`);
    return;
  }
  if (decoded.control?.catchUpComplete) {
    console.log(`[quottery-indexer] Catch-up complete ${lastTickLabel()} (position ${decoded.control.lastPosition})`);
    return;
  }
  if (!decoded.tick) return;

  if (DRY_RUN && PRINT_SUMMARY) {
    printDecodedSummary(decoded);
  }

  if (!DRY_RUN) {
    await saveDecodedTick(decoded);
  }

  lastProcessedTick = decoded.tick.tick;
  lastProcessedEpoch = decoded.tick.epoch;
  if (activeConnection) activeConnection.lastTickAt = Date.now();

  if ((decoded.domainEvents || []).length > 0) {
    console.log(`[quottery-indexer] tick ${decoded.tick.tick}: ${decoded.domainEvents.length} domain events`);
    if (DRY_RUN) {
      console.log(JSON.stringify(decoded.domainEvents, null, 2));
    }
  } else if (DRY_RUN) {
    console.log(`[quottery-indexer] tick ${decoded.tick.tick}: no Quottery domain events`);
  }
}

function enqueueMessage(raw) {
  messageQueue = messageQueue
    .then(() => handleMessage(raw))
    .catch((error) => {
      console.error('[quottery-indexer] Failed to process message:', error);
    });
}

function printDecodedSummary(decoded) {
  const logsByTxHash = new Map();
  for (const log of decoded.logs || []) {
    const key = log.txHash || 'no_tx_hash';
    if (!logsByTxHash.has(key)) logsByTxHash.set(key, []);
    logsByTxHash.get(key).push(log);
  }

  console.log(
    `[quottery-indexer] tick ${decoded.tick.tick}: txs=${decoded.transactions.length}, logs=${decoded.logs.length}, domainEvents=${decoded.domainEvents.length}`
  );

  for (const tx of decoded.transactions) {
    const txLogs = logsByTxHash.get(tx.hash) || [];
    const logTypes = txLogs
      .map((log) => log.scLogType ? `${log.logType}:${log.scLogType}` : String(log.logType))
      .join(', ');

    console.log(
      `  tx ${tx.hash} from=${tx.from || '-'} to=${tx.to || '-'} inputType=${tx.inputType} inputSize=${tx.inputSize} logs=${txLogs.length}${logTypes ? ` [${logTypes}]` : ''}`
    );
  }
}

async function connect() {
  const startTick = await getResumeTick();
  currentWsIndex = await selectHealthyWsIndex(startTick);
  const wsUrl = WS_URLS[currentWsIndex % WS_URLS.length];
  console.log(`[quottery-indexer] Connecting ${wsUrl} (${currentWsIndex + 1}/${WS_URLS.length}), startTick=${startTick || 'current'}, dryRun=${DRY_RUN}`);

  const socket = new WebSocket(wsUrl);
  currentSocket = socket;
  const connection = {
    wsUrl,
    opened: false,
    subscribed: false,
    lastMessageAt: Date.now(),
    lastTickAt: Date.now(),
    lastIdleLogAt: 0,
    timers: [],
  };
  activeConnection = connection;

  const closeAsUnhealthy = (reason) => {
    if (stopped || activeConnection !== connection || socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) return;
    console.warn(`[quottery-indexer] ${reason} on ${wsUrl}, switching to next endpoint`);
    connection.switchOnClose = true;
    socket.close();
  };

  connection.timers.push(setTimeout(() => {
    if (!connection.opened) closeAsUnhealthy(`WS connect timeout after ${WS_CONNECT_TIMEOUT_MS}ms`);
  }, WS_CONNECT_TIMEOUT_MS));

  connection.timers.push(setInterval(() => {
    if (!connection.subscribed) {
      if (Date.now() - connection.lastMessageAt >= WS_SUBSCRIBE_TIMEOUT_MS) {
        closeAsUnhealthy(`WS subscribe timeout after ${WS_SUBSCRIBE_TIMEOUT_MS}ms`);
      }
      return;
    }

    if (WS_TICK_STALE_MS > 0 && Date.now() - connection.lastTickAt >= WS_TICK_STALE_MS) {
      closeAsUnhealthy(`WS tick stale timeout after ${WS_TICK_STALE_MS}ms`);
    }

    if (WS_IDLE_LOG_MS > 0 && Date.now() - connection.lastMessageAt >= WS_IDLE_LOG_MS && Date.now() - connection.lastIdleLogAt >= WS_IDLE_LOG_MS) {
      connection.lastIdleLogAt = Date.now();
      fetchStatusTick(wsUrl)
        .then((tick) => {
          console.log(`[quottery-indexer] idle ${Math.round((Date.now() - connection.lastMessageAt) / 1000)}s on ${wsUrl}: statusTick=${tick}, startTick=${startTick}, ${WS_TICK_STALE_MS > 0 ? 'stale watchdog enabled' : 'waiting for filtered txs'}`);
        })
        .catch((error) => {
          console.warn(`[quottery-indexer] idle status check failed on ${wsUrl}: ${error.message}`);
        });
    }
  }, WS_TICK_STALE_MS > 0
    ? Math.min(15000, Math.max(1000, Math.floor(WS_TICK_STALE_MS / 3)))
    : Math.min(15000, Math.max(1000, Math.floor(WS_IDLE_LOG_MS / 3)))));

  socket.on('open', () => {
    connection.opened = true;
    connection.lastMessageAt = Date.now();
    socket.send(JSON.stringify(buildSubscription(startTick)));
  });

  socket.on('message', enqueueMessage);

  socket.on('error', (error) => {
    console.error(`[quottery-indexer] WS error ${wsUrl}:`, error.message);
  });

  socket.on('close', (code, reasonBuffer) => {
    for (const timer of connection.timers) clearTimeout(timer);
    if (stopped) return;
    if (activeConnection === connection) activeConnection = null;
    if (connection.switchOnClose || !connection.opened || !connection.subscribed) {
      switchToNextWsUrl();
    }
    const reason = reasonBuffer?.toString?.() || '';
    const nextUrl = WS_URLS[currentWsIndex];
    console.warn(`[quottery-indexer] WS closed ${wsUrl}${code ? ` code=${code}` : ''}${reason ? ` reason=${reason}` : ''}, next=${nextUrl}, reconnecting in ${DEFAULT_RECONNECT_MS}ms`);
    setTimeout(() => connect().catch((error) => {
      console.error('[quottery-indexer] Reconnect failed:', error);
    }), DEFAULT_RECONNECT_MS);
  });
}

function stop() {
  stopped = true;
  if (currentSocket) {
    currentSocket.close();
  }
  closePool().finally(() => process.exit(0));
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

connect().catch((error) => {
  console.error('[quottery-indexer] Fatal startup error:', error);
  process.exitCode = 1;
});

if (EXIT_AFTER_MS > 0) {
  setTimeout(() => {
    console.log(`[quottery-indexer] Exiting after ${EXIT_AFTER_MS}ms`);
    stop();
  }, EXIT_AFTER_MS);
}
