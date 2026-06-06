const WebSocket = require('ws');
const { closePool, withTransaction } = require('./db');
const { normalizeIdentity } = require('./identity');
const { refreshPositionPnls, updateStats } = require('./store');
const {
  GARTH_ASSET_NAME,
  LOG_TYPES,
  QTRYGOV_ASSET_NAME,
  QUOTTERY_IDENTITY,
  QUOTTERY_SC_INDEX,
  SC_LOG_TYPES,
} = require('./constants');

const args = parseArgs(process.argv.slice(2));
const MODE = args.mode || 'endpoint';
const CAPTURE_MS = Number(args.captureMs || process.env.END_EPOCH_CAPTURE_MS || 50000);
const SCAN_DELAY_MS = Number(args.scanDelayMs || process.env.END_EPOCH_SCAN_DELAY_MS || 0);
const CHUNK_SIZE = Number(args.chunkSize || process.env.END_EPOCH_LOG_CHUNK_SIZE || 100);
const EMPTY_RETRY_MS = Number(args.emptyRetryMs || process.env.END_EPOCH_EMPTY_RETRY_MS || 5000);
const EMPTY_RETRIES = Number(args.emptyRetries || process.env.END_EPOCH_EMPTY_RETRIES || 6);
const DRY_RUN = args.dryRun || process.env.END_EPOCH_DRY_RUN === '1' || process.env.END_EPOCH_DRY_RUN === 'true';
const WS_URL = process.env.BOB_WS_URL
  || process.env.QUBIC_WS_URL
  || deriveWsUrl(process.env.BOB_TARGET_URL)
  || 'ws://localhost:40420/ws/qubic';
const HTTP_BASES = getHttpBases();

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--capture') parsed.mode = 'capture';
    else if (arg === '--scan') parsed.mode = 'endpoint';
    else if (arg === '--endpoint') parsed.mode = 'endpoint';
    else if (arg === '--range-scan') parsed.mode = 'range-scan';
    else if (arg === '--run') parsed.mode = 'run';
    else if (arg === '--dry-run') parsed.dryRun = true;
    else if (arg === '--epoch') parsed.epoch = Number(argv[++i]);
    else if (arg === '--from') parsed.from = Number(argv[++i]);
    else if (arg === '--capture-ms') parsed.captureMs = Number(argv[++i]);
    else if (arg === '--scan-delay-ms') parsed.scanDelayMs = Number(argv[++i]);
    else if (arg === '--chunk-size') parsed.chunkSize = Number(argv[++i]);
    else if (arg === '--empty-retry-ms') parsed.emptyRetryMs = Number(argv[++i]);
    else if (arg === '--empty-retries') parsed.emptyRetries = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return parsed;
}

function deriveWsUrl(bobTargetUrl) {
  const first = String(bobTargetUrl || '').split(',')[0]?.trim();
  if (!first) return '';
  try {
    const url = new URL(first);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws/qubic';
    url.search = '';
    return url.toString();
  } catch {
    return '';
  }
}

function getHttpBases() {
  const explicit = process.env.BOB_LOG_URL || process.env.BOB_HTTP_URL || process.env.BOB_TARGET_URL || '';
  const candidates = String(explicit)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      try {
        const url = new URL(item);
        url.protocol = url.protocol === 'wss:' ? 'https:' : url.protocol === 'ws:' ? 'http:' : url.protocol;
        url.pathname = '';
        url.search = '';
        return url.toString().replace(/\/$/, '');
      } catch {
        return '';
      }
    })
    .filter(Boolean);

  return candidates.length ? candidates : ['http://localhost:40420'];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getResult(message) {
  return message?.params?.result || message?.result || message;
}

function getTick(result) {
  return Number(result?.tick || result?.tickNumber || 0);
}

function getEpoch(result) {
  return Number(result?.epoch || 0) || null;
}

function getTxHash(tx) {
  return tx?.hash || tx?.txHash || tx?.transactionHash || '';
}

function logIdOf(log) {
  const value = log?.logId ?? log?.id ?? log?.body?.logId ?? log?.index;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function logTypeOf(log) {
  return Number(log?.type ?? log?.logType ?? log?.log_type ?? log?.body?.logType ?? -1);
}

function scIndexOf(log) {
  return Number(log?.body?.scIndex ?? log?.body?.contractIndex ?? log?.scIndex ?? log?.contractIndex ?? -1);
}

function scLogTypeOf(log) {
  return Number(
    log?.body?.scLogType
    ?? log?.body?.contractLogType
    ?? log?.scLogType
    ?? log?.contractLogType
    ?? log?.contractMessageType
    ?? -1
  );
}

function txHashOfLog(log, fallback = '') {
  return log?.txHash || log?.transactionHash || log?.hash || fallback || '';
}

function tickOfLog(log, fallback = 0) {
  return Number(log?.tick || log?.tickNumber || log?.body?.tick || fallback || 0) || 0;
}

function endEpochTxRef(tick) {
  return tick ? `SC_END_EPOCH_TX_${tick}` : '';
}

function syntheticTxHashOfLog(log) {
  const tick = tickOfLog(log);
  return txHashOfLog(log) || endEpochTxRef(tick);
}

function parseTimestamp(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const millis = value > 100000000000 ? value : value * 1000;
    return new Date(millis).toISOString();
  }

  const text = String(value).trim();
  if (!text) return null;

  const shortYearMatch = text.match(/^(\d{2})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (shortYearMatch) {
    const [, yy, month, day, hour, minute, second] = shortYearMatch;
    return new Date(Date.UTC(2000 + Number(yy), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second))).toISOString();
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function endEpochFallbackTimestamp(now = new Date()) {
  const utc = new Date(now);
  const day = utc.getUTCDay();
  let daysSinceWednesday = (day - 3 + 7) % 7;
  if (daysSinceWednesday === 0 && utc.getUTCHours() < 12) daysSinceWednesday = 7;
  const target = new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate() - daysSinceWednesday, 12, 0, 0));
  return target.toISOString();
}

function timestampOfLog(log, context = {}) {
  const value = [
    log?.timestamp,
    log?.timestampISO,
    log?.time,
    log?.body?.timestamp,
    log?.body?.time,
    context.timestamp,
  ].find((item) => item !== null && item !== undefined && item !== '');
  return parseTimestamp(value) || context.fallbackTimestamp || null;
}

function bodyOf(log) {
  return log?.body || {};
}

function contentOf(log) {
  const body = bodyOf(log);
  return String(body.content || body.rawData || log.rawData || log.data || log.extraData || log.content || '').replace(/^0x/i, '');
}

function collectLogsFromTickResult(result) {
  const logs = [];
  const tick = getTick(result);
  const epoch = getEpoch(result);
  const transactions = Array.isArray(result?.transactions) ? result.transactions : [];

  for (const log of Array.isArray(result?.logs) ? result.logs : []) {
    logs.push({ ...log, tick: tickOfLog(log, tick), epoch: Number(log.epoch || epoch || 0) || null });
  }

  for (const tx of transactions) {
    const txHash = getTxHash(tx);
    for (const key of ['logs', 'events', 'executionLogs']) {
      const nested = tx?.[key];
      if (!Array.isArray(nested)) continue;
      for (const log of nested) {
        logs.push({
          ...log,
          txHash: txHashOfLog(log, txHash),
          tick: tickOfLog(log, Number(tx.tick || tick || 0)),
          epoch: Number(log.epoch || tx.epoch || epoch || 0) || null,
        });
      }
    }
  }

  return logs;
}

function looksLikeLog(value) {
  return value && typeof value === 'object'
    && (
      value.body
      || value.logType !== undefined
      || value.log_type !== undefined
      || value.scLogType !== undefined
      || value.contractLogType !== undefined
    );
}

function normalizeEndpointLog(log, context = {}) {
  return {
    ...log,
    txHash: txHashOfLog(log, context.txHash),
    tick: tickOfLog(log, context.tick),
    epoch: Number(log.epoch || context.epoch || 0) || null,
    timestamp: timestampOfLog(log, context),
  };
}

function collectLogsFromEndEpochResponse(body, epoch, options = {}) {
  const logs = [];
  const root = body?.result ?? body?.data ?? body;
  const fallbackTimestamp = options.fallbackTimestamp || endEpochFallbackTimestamp();

  function visit(value, context = {}, depth = 0) {
    if (!value || depth > 8) return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item, context, depth + 1);
      return;
    }
    if (typeof value !== 'object') return;

    if (looksLikeLog(value)) {
      logs.push(normalizeEndpointLog(value, { ...context, epoch }));
      return;
    }

    const nextContext = {
      epoch: Number(value.epoch || context.epoch || epoch || 0) || null,
      tick: Number(value.tick || value.tickNumber || context.tick || 0) || 0,
      txHash: getTxHash(value) || context.txHash || '',
      timestamp: parseTimestamp(value.timestamp || value.timestampISO || value.time) || context.timestamp || null,
      fallbackTimestamp,
    };

    for (const key of ['logs', 'events', 'executionLogs', 'transactions', 'txs', 'result', 'data']) {
      if (value[key] !== undefined) visit(value[key], nextContext, depth + 1);
    }
  }

  visit(root, { epoch, fallbackTimestamp });
  return logs;
}

function isQtryTransferLog(log) {
  if (logTypeOf(log) !== LOG_TYPES.ASSET_OWNERSHIP_CHANGE) return false;
  const body = bodyOf(log);
  return normalizeIdentity(body.sourcePublicKey || body.source || body.from) === normalizeIdentity(QUOTTERY_IDENTITY)
    || normalizeIdentity(body.destinationPublicKey || body.destination || body.to) === normalizeIdentity(QUOTTERY_IDENTITY);
}

function isQuotteryScLog(log) {
  return logTypeOf(log) === LOG_TYPES.SC_INFO && scIndexOf(log) === QUOTTERY_SC_INDEX;
}

function isRelevantEndEpochLog(log) {
  return isQtryTransferLog(log) || isQuotteryScLog(log);
}

function decodeArchiveEventId(log) {
  if (!isQuotteryScLog(log) || scLogTypeOf(log) !== SC_LOG_TYPES.ARCHIVE_EVENT) return null;
  const content = contentOf(log);
  if (!content || content.length < 64) return null;
  const buffer = Buffer.from(content, 'hex');
  if (buffer.length < 32) return null;
  return Number(buffer.readBigUInt64LE(24));
}

function tokenOfTransfer(log) {
  const token = String(bodyOf(log).assetName || '').replace(/\0/g, '').trim().toUpperCase();
  if (token === 'QUSD' || token === 'QUS' || token === 'QTRY') return GARTH_ASSET_NAME;
  if (token === GARTH_ASSET_NAME || token === QTRYGOV_ASSET_NAME) return token;
  return '';
}

function transferFromLog(log) {
  const body = bodyOf(log);
  const token = tokenOfTransfer(log);
  if (!token) return null;
  return {
    token,
    source: normalizeIdentity(body.sourcePublicKey || body.source || body.from),
    destination: normalizeIdentity(body.destinationPublicKey || body.destination || body.to),
    amount: String(body.numberOfShares ?? body.amount ?? 0),
  };
}

function groupKey(log) {
  return syntheticTxHashOfLog(log) || `tick:${tickOfLog(log) || 0}`;
}

async function captureBeforeEndLogId() {
  console.log(`[end-epoch] Capturing unfiltered WS ${WS_URL} for ${CAPTURE_MS}ms`);
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(WS_URL);
    const state = { maxLogId: 0, epoch: null, tick: 0, logCount: 0 };
    let finished = false;

    function finish(error = null) {
      if (finished) return;
      finished = true;
      try { socket.close(); } catch {}
      if (error) reject(error);
      else resolve(state);
    }

    const timer = setTimeout(() => finish(), CAPTURE_MS);

    socket.on('open', () => {
      socket.send(JSON.stringify({
        jsonrpc: '2.0',
        method: 'qubic_subscribe',
        params: ['tickStream', {
          skipEmptyTicks: false,
          includeInputData: true,
          excludeTxs: false,
          excludeLogs: false,
        }],
        id: 1,
      }));
    });

    socket.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(raw.toString('utf8'));
      } catch {
        return;
      }
      if (message.error) {
        clearTimeout(timer);
        finish(new Error(`WS JSON-RPC error: ${JSON.stringify(message.error)}`));
        return;
      }
      if (message.result && message.id === 1) return;

      const result = getResult(message);
      const epoch = getEpoch(result);
      const tick = getTick(result);
      if (epoch) state.epoch = epoch;
      if (tick) state.tick = tick;

      for (const log of collectLogsFromTickResult(result)) {
        const logId = logIdOf(log);
        if (!logId) continue;
        state.logCount += 1;
        if (logId > state.maxLogId) state.maxLogId = logId;
      }
    });

    socket.on('error', (error) => {
      clearTimeout(timer);
      finish(error);
    });
  });
}

async function fetchLogRange(epoch, from, to) {
  let lastError = null;
  for (const base of HTTP_BASES) {
    const url = `${base}/log/${epoch}/${from}/${to}`;
    try {
      const response = await fetch(url);
      const text = await response.text();
      let body;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 200)}`);
      return body;
    } catch (error) {
      lastError = error;
      console.warn(`[end-epoch] GET ${url} failed: ${error.message}`);
    }
  }
  throw lastError || new Error('No Bob HTTP base configured');
}

async function fetchEndEpochLog(epoch) {
  let lastError = null;
  for (const base of HTTP_BASES) {
    const url = `${base}/getEndEpochLog/${epoch}`;
    try {
      const response = await fetch(url);
      const text = await response.text();
      let body;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 200)}`);
      return body;
    } catch (error) {
      lastError = error;
      console.warn(`[end-epoch] GET ${url} failed: ${error.message}`);
    }
  }
  throw lastError || new Error('No Bob HTTP base configured');
}

async function fetchStatus() {
  let lastError = null;
  for (const base of HTTP_BASES) {
    const url = `${base}/status`;
    try {
      const response = await fetch(url);
      const text = await response.text();
      let body;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 200)}`);
      return body;
    } catch (error) {
      lastError = error;
      console.warn(`[end-epoch] GET ${url} failed: ${error.message}`);
    }
  }
  throw lastError || new Error('No Bob HTTP base configured');
}

async function resolveEpoch() {
  const explicitEpoch = Number(args.epoch || process.env.END_EPOCH_EPOCH || 0);
  if (explicitEpoch > 0) return explicitEpoch;

  const status = await fetchStatus();
  const epoch = Number(
    status?.currentProcessingEpoch
    ?? status?.status?.currentProcessingEpoch
    ?? status?.data?.currentProcessingEpoch
    ?? status?.result?.currentProcessingEpoch
    ?? 0
  );
  if (!epoch) {
    throw new Error(`Could not resolve currentProcessingEpoch from /status: ${JSON.stringify(status).slice(0, 500)}`);
  }
  console.log(`[end-epoch] resolved epoch=${epoch} from /status`);
  return epoch;
}

function unwrapLogResponse(body) {
  const source = Array.isArray(body)
    ? body
    : Array.isArray(body?.logs)
      ? body.logs
      : Array.isArray(body?.result)
        ? body.result
        : body && typeof body === 'object'
          ? Object.values(body)
          : [];

  const logs = [];
  let notFoundAt = null;

  for (const item of source) {
    if (!item) continue;
    if (item.ok === false || item.error === 'not_found') {
      if (item.error === 'not_found') notFoundAt = Number(item.logId || item.id || 0) || notFoundAt;
      continue;
    }
    const log = item.log || item.result || item;
    if (log && typeof log === 'object') logs.push(log);
  }

  return { logs, notFoundAt };
}

async function upsertAccount(client, identity, tick = null) {
  if (!identity) return;
  await client.query(`
    INSERT INTO accounts(identity, first_seen_tick, last_seen_tick)
    VALUES ($1,$2,$2)
    ON CONFLICT (identity) DO UPDATE SET
      first_seen_tick = COALESCE(accounts.first_seen_tick, EXCLUDED.first_seen_tick),
      last_seen_tick = GREATEST(COALESCE(accounts.last_seen_tick, 0), COALESCE(EXCLUDED.last_seen_tick, 0)),
      updated_at = now()
  `, [identity, tick || null]);
}

async function saveRawEndEpochLog(client, epoch, log) {
  const logId = logIdOf(log);
  const tick = tickOfLog(log) || 0;
  const txHash = syntheticTxHashOfLog(log) || null;
  const timestamp = timestampOfLog(log);
  await client.query(`
    INSERT INTO raw_logs(log_uid, tx_hash, epoch, tick, log_timestamp, log_id, log_type, sc_index, sc_log_type, sc_end_epoch, raw)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10)
    ON CONFLICT (log_uid) DO UPDATE SET
      tx_hash = EXCLUDED.tx_hash,
      epoch = EXCLUDED.epoch,
      tick = EXCLUDED.tick,
      log_timestamp = EXCLUDED.log_timestamp,
      sc_end_epoch = true,
      raw = EXCLUDED.raw,
      log_id = EXCLUDED.log_id,
      log_type = EXCLUDED.log_type,
      sc_index = EXCLUDED.sc_index,
      sc_log_type = EXCLUDED.sc_log_type
  `, [
    `end_epoch:${epoch}:${logId || txHash || groupKey(log)}`,
    txHash,
    epoch,
    tick,
    timestamp,
    logId,
    logTypeOf(log),
    scIndexOf(log) > -1 ? scIndexOf(log) : null,
    scLogTypeOf(log) > -1 ? scLogTypeOf(log) : null,
    {
      ...log,
      epoch,
      tick,
      timestamp,
      logId,
      txHash,
      endEpochGroup: groupKey(log),
      decodedArchiveEventId: decodeArchiveEventId(log),
    },
  ]);
}

async function saveArchiveEvent(client, epoch, log, eventId) {
  const tick = tickOfLog(log) || 0;
  const txHash = syntheticTxHashOfLog(log) || null;
  const timestamp = timestampOfLog(log);
  await client.query(`
    INSERT INTO events(event_id, status, archived_tick, archived_tx_timestamp, archived_sc_end_epoch, updated_at)
    VALUES ($1,'archived',$2,$3,true,now())
    ON CONFLICT (event_id) DO UPDATE SET
      status = 'archived',
      archived_tick = COALESCE(events.archived_tick, EXCLUDED.archived_tick),
      archived_tx_timestamp = COALESCE(events.archived_tx_timestamp, EXCLUDED.archived_tx_timestamp),
      archived_sc_end_epoch = true,
      updated_at = now()
  `, [eventId, tick || null, timestamp]);

  await client.query(`
    UPDATE orders
    SET status = 'removed_by_system',
        open_amount = 0,
        closed_tick = COALESCE(closed_tick, $2),
        closed_tx_hash = COALESCE(closed_tx_hash, $3),
        closed_tx_timestamp = COALESCE(closed_tx_timestamp, $4),
        updated_at = now()
    WHERE event_id = $1 AND status IN ('open', 'partially_matched')
  `, [eventId, tick || null, txHash, timestamp]);

  await client.query(`
    UPDATE positions p
    SET status = CASE WHEN p.option = e.result THEN 'win' ELSE 'lose' END,
        amount = p.amount + p.locked_amount,
        locked_amount = 0,
        closed_tick = COALESCE(p.closed_tick, $2),
        updated_at = now()
    FROM events e
    WHERE e.event_id = p.event_id
      AND p.event_id = $1
      AND e.result IS NOT NULL
  `, [eventId, tick || null]);

  console.log(`[end-epoch] archived event ${eventId} epoch=${epoch} tick=${tick || '-'} logId=${logIdOf(log) || '-'}`);
}

async function saveTransferLog(client, epoch, log, transfer) {
  const logId = logIdOf(log);
  const tick = tickOfLog(log) || 0;
  const txHash = syntheticTxHashOfLog(log) || null;
  const timestamp = timestampOfLog(log);
  await upsertAccount(client, transfer.source, tick);
  await upsertAccount(client, transfer.destination, tick);
  const uid = `end_epoch:transfer:${epoch}:${logId || txHash || groupKey(log)}:${transfer.token}:${transfer.source}:${transfer.destination}:${transfer.amount}`;
  await client.query(`
    INSERT INTO transfers(transfer_uid, token, source, destination, amount, reason, event_id, tick, tx_timestamp, tx_hash, log_uid, sc_end_epoch, raw)
    VALUES ($1,$2,$3,$4,$5,'sc_end_epoch',NULL,$6,$7,$8,$9,true,$10)
    ON CONFLICT (transfer_uid) DO UPDATE SET
      raw = EXCLUDED.raw,
      reason = EXCLUDED.reason,
      sc_end_epoch = true,
      tx_timestamp = COALESCE(transfers.tx_timestamp, EXCLUDED.tx_timestamp),
      tx_hash = COALESCE(transfers.tx_hash, EXCLUDED.tx_hash)
  `, [
    uid,
    transfer.token,
    transfer.source || null,
    transfer.destination || null,
    transfer.amount,
    tick,
    timestamp,
    txHash,
    `end_epoch:${epoch}:${logId || txHash || groupKey(log)}`,
    {
      ...log,
      epoch,
      tick,
      timestamp,
      logId,
      txHash,
      endEpochGroup: groupKey(log),
    },
  ]);
}

async function candidateArchivedEventIds(client, transferRow) {
  const raw = transferRow.raw || {};
  const group = raw.endEpochGroup || transferRow.tx_hash || `tick:${transferRow.tick || 0}`;
  const result = await client.query(`
    SELECT raw
    FROM raw_logs
    WHERE epoch = $1
      AND log_type = $2
      AND sc_index = $3
      AND sc_log_type = $4
      AND (
        ($5::text <> '' AND tx_hash = $5)
        OR ($6::bigint > 0 AND tick = $6)
        OR raw->>'endEpochGroup' = $7
      )
    ORDER BY log_id ASC NULLS LAST
  `, [
    Number(raw.epoch || transferRow.raw?.epoch || 0) || null,
    LOG_TYPES.SC_INFO,
    QUOTTERY_SC_INDEX,
    SC_LOG_TYPES.ARCHIVE_EVENT,
    transferRow.tx_hash || '',
    Number(transferRow.tick || 0),
    group,
  ]);

  const ids = result.rows
    .map((row) => Number(row.raw?.decodedArchiveEventId || decodeArchiveEventId(row.raw)))
    .filter((eventId) => Number.isFinite(eventId) && eventId >= 0);

  if (ids.length) return [...new Set(ids)];

  const fallback = await client.query(`
    SELECT event_id
    FROM events
    WHERE archived_tick = $1
    ORDER BY event_id
  `, [transferRow.tick]);
  return fallback.rows.map((row) => Number(row.event_id)).filter(Number.isFinite);
}

async function resolveEndEpochPayouts(client) {
  const transfers = await client.query(`
    SELECT *
    FROM transfers
    WHERE reason = 'sc_end_epoch'
      AND token = 'GARTH'
      AND source = $1
      AND destination IS NOT NULL
      AND event_id IS NULL
    ORDER BY tick ASC, transfer_uid ASC
  `, [normalizeIdentity(QUOTTERY_IDENTITY)]);

  let matched = 0;
  for (const transfer of transfers.rows) {
    const eventIds = await candidateArchivedEventIds(client, transfer);
    if (!eventIds.length) continue;

    const candidates = await client.query(`
      SELECT
        p.event_id,
        (p.amount * e.win_payout_per_share) - COALESCE((
          SELECT sum(py.amount)
          FROM payouts py
          WHERE py.owner = p.owner
            AND py.event_id = p.event_id
            AND py.reason = 'sc_end_epoch'
        ), 0) AS remaining_payout
      FROM positions p
      JOIN events e ON e.event_id = p.event_id
      WHERE p.owner = $1
        AND p.event_id = ANY($2::bigint[])
        AND e.result IS NOT NULL
        AND p.option = e.result
        AND p.status = 'win'
      ORDER BY p.event_id
    `, [transfer.destination, eventIds]);

    const amount = String(transfer.amount);
    const exact = candidates.rows.find((row) => String(row.remaining_payout).split('.')[0] === amount);
    const fallback = candidates.rows.length === 1 ? candidates.rows[0] : null;
    const match = exact || fallback;
    if (!match) {
      console.warn(`[end-epoch] Could not match GARTH payout ${amount} to ${transfer.destination} among events ${eventIds.join(',')}`);
      continue;
    }

    await client.query(`
      UPDATE transfers
      SET event_id = $2,
          raw = raw || $3::jsonb
      WHERE transfer_uid = $1
    `, [transfer.transfer_uid, match.event_id, { matchedEventId: Number(match.event_id) }]);

    await client.query(`
      INSERT INTO payouts(payout_uid, owner, event_id, token, amount, reason, tick, tx_timestamp, tx_hash, sc_end_epoch, raw)
      VALUES ($1,$2,$3,'GARTH',$4,'sc_end_epoch',$5,$6,$7,true,$8)
      ON CONFLICT (payout_uid) DO UPDATE SET
        amount = EXCLUDED.amount,
        event_id = EXCLUDED.event_id,
        sc_end_epoch = true,
        tx_timestamp = COALESCE(payouts.tx_timestamp, EXCLUDED.tx_timestamp),
        raw = EXCLUDED.raw
    `, [
      `sc_end_epoch:payout:${transfer.transfer_uid}`,
      transfer.destination,
      match.event_id,
      transfer.amount,
      transfer.tick,
      transfer.tx_timestamp || null,
      transfer.tx_hash || null,
      transfer.raw,
    ]);
    matched += 1;
    console.log(`[end-epoch] matched payout ${transfer.amount} ${transfer.destination} -> event ${match.event_id}`);
  }
  return matched;
}

async function processLogs(epoch, logs) {
  const relevant = logs.filter(isRelevantEndEpochLog);
  if (!relevant.length) return { relevant: 0, archives: 0, transfers: 0, payouts: 0 };

  if (DRY_RUN) {
    console.log(`[end-epoch] dry-run relevant logs=${relevant.length}`);
    return { relevant: relevant.length, archives: 0, transfers: 0, payouts: 0 };
  }

  return withTransaction(async (client) => {
    let archives = 0;
    let transfers = 0;

    for (const log of relevant) {
      await saveRawEndEpochLog(client, epoch, log);
    }

    for (const log of relevant) {
      const eventId = decodeArchiveEventId(log);
      if (eventId !== null) {
        await saveArchiveEvent(client, epoch, log, eventId);
        archives += 1;
      }
    }

    for (const log of relevant) {
      if (!isQtryTransferLog(log)) continue;
      const transfer = transferFromLog(log);
      if (!transfer) continue;
      await saveTransferLog(client, epoch, log, transfer);
      transfers += 1;
    }

    const payouts = await resolveEndEpochPayouts(client);
    await refreshPositionPnls(client);
    await updateStats(client);
    return { relevant: relevant.length, archives, transfers, payouts };
  });
}

async function saveCursor(epoch, patch) {
  if (DRY_RUN) return;
  await withTransaction(async (client) => {
    await client.query(`
      INSERT INTO end_epoch_log_cursors(epoch, before_end_log_id, last_scanned_log_id, scan_started_at, scan_finished_at, status, details, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,now())
      ON CONFLICT (epoch) DO UPDATE SET
        before_end_log_id = COALESCE(EXCLUDED.before_end_log_id, end_epoch_log_cursors.before_end_log_id),
        last_scanned_log_id = COALESCE(EXCLUDED.last_scanned_log_id, end_epoch_log_cursors.last_scanned_log_id),
        scan_started_at = COALESCE(EXCLUDED.scan_started_at, end_epoch_log_cursors.scan_started_at),
        scan_finished_at = COALESCE(EXCLUDED.scan_finished_at, end_epoch_log_cursors.scan_finished_at),
        status = EXCLUDED.status,
        details = end_epoch_log_cursors.details || EXCLUDED.details,
        updated_at = now()
    `, [
      epoch,
      patch.beforeEndLogId ?? null,
      patch.lastScannedLogId ?? null,
      patch.scanStartedAt ?? null,
      patch.scanFinishedAt ?? null,
      patch.status || 'pending',
      patch.details || {},
    ]);
  });
}

async function getCursor(epoch) {
  let row = null;
  await withTransaction(async (client) => {
    const result = await client.query('SELECT * FROM end_epoch_log_cursors WHERE epoch = $1', [epoch]);
    row = result.rows[0] || null;
  });
  return row;
}

async function scanLogs(epoch, startFrom) {
  if (!HTTP_BASES.length) throw new Error('No Bob HTTP base configured');
  let from = startFrom;
  let emptyRetries = 0;
  let totals = { relevant: 0, archives: 0, transfers: 0, payouts: 0 };
  await saveCursor(epoch, { lastScannedLogId: from - 1, scanStartedAt: new Date().toISOString(), status: 'scanning' });

  while (true) {
    const to = from + CHUNK_SIZE - 1;
    const body = await fetchLogRange(epoch, from, to);
    const { logs, notFoundAt } = unwrapLogResponse(body);
    const maxFoundLogId = logs.reduce((max, log) => Math.max(max, logIdOf(log) || 0), 0);

    if (logs.length) {
      emptyRetries = 0;
      const result = await processLogs(epoch, logs);
      totals = {
        relevant: totals.relevant + result.relevant,
        archives: totals.archives + result.archives,
        transfers: totals.transfers + result.transfers,
        payouts: totals.payouts + result.payouts,
      };
      await saveCursor(epoch, {
        lastScannedLogId: maxFoundLogId || to,
        status: 'scanning',
        details: { totals },
      });
      console.log(`[end-epoch] scanned ${from}-${to}: logs=${logs.length}, relevant=${result.relevant}, archives=${result.archives}, transfers=${result.transfers}, payouts=${result.payouts}`);
    }

    if (notFoundAt || !logs.length) {
      if (logs.length && notFoundAt) {
        from = notFoundAt;
      }
      emptyRetries += 1;
      if (emptyRetries > EMPTY_RETRIES) {
        await saveCursor(epoch, {
          lastScannedLogId: (maxFoundLogId || from) - 1,
          scanFinishedAt: new Date().toISOString(),
          status: 'complete',
          details: { totals, stoppedAt: notFoundAt || from },
        });
        console.log(`[end-epoch] complete at logId=${notFoundAt || from}, totals=${JSON.stringify(totals)}`);
        return totals;
      }
      console.log(`[end-epoch] not_found/empty at ${notFoundAt || from}, retry ${emptyRetries}/${EMPTY_RETRIES} in ${EMPTY_RETRY_MS}ms`);
      await sleep(EMPTY_RETRY_MS);
      continue;
    }

    from = to + 1;
  }
}

async function scanEndEpochEndpoint(epoch) {
  await saveCursor(epoch, { scanStartedAt: new Date().toISOString(), status: 'endpoint_scanning' });
  const body = await fetchEndEpochLog(epoch);
  const logs = collectLogsFromEndEpochResponse(body, epoch);
  const result = await processLogs(epoch, logs);
  await saveCursor(epoch, {
    scanFinishedAt: new Date().toISOString(),
    status: 'complete',
    details: {
      endpoint: 'getEndEpochLog',
      totalLogs: logs.length,
      totals: result,
    },
  });
  console.log(`[end-epoch] endpoint complete epoch=${epoch}: logs=${logs.length}, relevant=${result.relevant}, archives=${result.archives}, transfers=${result.transfers}, payouts=${result.payouts}`);
  return result;
}

async function main() {
  if (!Number.isFinite(CHUNK_SIZE) || CHUNK_SIZE <= 0) throw new Error('Invalid chunk size');

  if (MODE === 'capture' || MODE === 'run') {
    const capture = await captureBeforeEndLogId();
    if (!capture.epoch) {
      throw new Error(`Could not capture epoch from WS: ${JSON.stringify(capture)}`);
    }
    console.log(`[end-epoch] captured epoch=${capture.epoch}, maxLogId=${capture.maxLogId}, tick=${capture.tick}, logs=${capture.logCount}`);
    await saveCursor(capture.epoch, {
      beforeEndLogId: capture.maxLogId,
      lastScannedLogId: capture.maxLogId,
      status: MODE === 'capture' ? 'captured' : 'captured_waiting_scan',
      details: { capture },
    });
    if (MODE === 'capture') return;

    if (SCAN_DELAY_MS > 0) {
      console.log(`[end-epoch] waiting ${SCAN_DELAY_MS}ms before scan`);
      await sleep(SCAN_DELAY_MS);
    }
    await scanEndEpochEndpoint(capture.epoch);
    return;
  }

  if (MODE === 'endpoint') {
    const epoch = await resolveEpoch();
    await scanEndEpochEndpoint(epoch);
    return;
  }

  if (MODE === 'range-scan') {
    const epoch = await resolveEpoch();
    let from = Number(args.from || process.env.END_EPOCH_FROM_LOG_ID || 0);
    if (!from) {
      const cursor = await getCursor(epoch);
      from = Number(cursor?.last_scanned_log_id || cursor?.before_end_log_id || 0) + 1;
    }
    if (!from) throw new Error('--from is required when cursor is empty');
    await scanLogs(epoch, from);
    return;
  }

  throw new Error(`Unsupported mode: ${MODE}`);
}

main()
  .catch((error) => {
    console.error('[end-epoch] Fatal:', error);
    process.exitCode = 1;
  })
  .finally(closePool);
