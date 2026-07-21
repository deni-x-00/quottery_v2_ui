const { getDatabaseUrl, query, withTransaction } = require('./db');
const { normalizeIdentity, pubkeyToIdentity } = require('./identity');
const { QUOTTERY_IDENTITY } = require('./constants');

const PROFILE_NAME_FIRST_FEE = 1;
const PROFILE_NAME_CHANGE_FEE = 100000;
const PROFILE_MAX_AVATAR_BYTES = 256 * 1024;
const PROFILE_MAX_BODY_BYTES = 512 * 1024;
const PROFILE_GAME_OPERATOR_CACHE_MS = 30000;
const PUBLIC_RPC_BASE_URLS = [
  'https://rpc.qubic.org/live/v1',
  'https://rpc.qubic.org/v1',
];
let gameOperatorCache = { value: '', expiresAt: 0 };

function isEnabled() {
  return Boolean(getDatabaseUrl());
}

function parseLimit(value, fallback = 100) {
  const limit = Number(value || fallback);
  return Math.min(1000, Math.max(1, Number.isFinite(limit) ? limit : fallback));
}

function parseEventIds(value) {
  return String(value || '')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item >= 0)
    .filter((item, index, array) => array.indexOf(item) === index)
    .slice(0, 1000);
}

function routeParts(pathname) {
  return pathname.split('/').filter(Boolean);
}

function requestError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseRankTimestamp(value, fieldName) {
  const text = String(value || '').trim();
  if (!text) throw requestError(`${fieldName} is required`);
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(text)) {
    throw requestError(`${fieldName} must include a timezone`);
  }
  const timestamp = new Date(text);
  if (!Number.isFinite(timestamp.getTime())) throw requestError(`${fieldName} is invalid`);
  return timestamp;
}

function parseRankSort(value) {
  const sortBy = String(value || '').trim().toLowerCase();
  if (sortBy === 'vol' || sortBy === 'volume') return 'vol';
  if (sortBy === 'pnl') return 'pnl';
  throw requestError('sortby must be either vol or pnl');
}

function rankNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

async function readJsonBody(req, maxBytes = PROFILE_MAX_BODY_BYTES) {
  const chunks = [];
  let length = 0;

  for await (const chunk of req) {
    length += chunk.length;
    if (length > maxBytes) throw new Error('Request body is too large');
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Request body must be valid JSON');
  }
}

function normalizeDisplayName(value) {
  const name = String(value || '').trim().replace(/\s+/gu, ' ');
  const length = Array.from(name).length;
  if (length < 2 || length > 32) {
    throw new Error('Display name must be between 2 and 32 characters');
  }
  if (/[\p{Cc}\p{Cs}]/u.test(name)) {
    throw new Error('Display name contains unsupported control characters');
  }
  return name;
}

function normalizeOptionalDisplayName(value) {
  if (value === undefined) return undefined;
  if (value === null || String(value).trim() === '') return null;
  return normalizeDisplayName(value);
}

function parseAvatar(value) {
  if (value === null || value === undefined || value === '') {
    return { mimeType: null, data: null };
  }
  if (typeof value !== 'string') throw new Error('Avatar must be an image data URL');

  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/i.exec(value);
  if (!match) throw new Error('Avatar must be a PNG, JPEG, or WebP image');

  const data = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (data.length === 0 || data.length > PROFILE_MAX_AVATAR_BYTES) {
    throw new Error(`Avatar must be smaller than ${Math.floor(PROFILE_MAX_AVATAR_BYTES / 1024)} KB`);
  }

  const mimeType = match[1].toLowerCase();
  const isPng = mimeType === 'image/png' && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = mimeType === 'image/jpeg' && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  const isWebp = mimeType === 'image/webp' && data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP';
  if (!isPng && !isJpeg && !isWebp) throw new Error('Avatar image data is invalid');

  return { mimeType, data };
}

async function postPublicRpc(url, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.error || body?.ok === false) {
      throw new Error(body?.error || body?.message || `HTTP ${response.status}`);
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function getCurrentGameOperator(chainGateway = null) {
  if (gameOperatorCache.value && gameOperatorCache.expiresAt > Date.now()) {
    return gameOperatorCache.value;
  }

  let lastError = null;
  if (typeof chainGateway?.querySmartContract === 'function') {
    try {
      const raw = await chainGateway.querySmartContract(1, '');
      if (!Buffer.isBuffer(raw) || raw.length < 112) throw new Error('BasicInfo response is too short');
      const identity = await pubkeyToIdentity(raw.subarray(80, 112));
      if (!normalizeIdentity(identity)) throw new Error('BasicInfo has no valid game operator');
      gameOperatorCache = { value: identity, expiresAt: Date.now() + PROFILE_GAME_OPERATOR_CACHE_MS };
      return identity;
    } catch (error) {
      lastError = error;
    }
  }

  for (const baseUrl of PUBLIC_RPC_BASE_URLS) {
    try {
      const body = await postPublicRpc(`${baseUrl}/querySmartContract`, {
        contractIndex: 2,
        inputType: 1,
        inputSize: 0,
        requestData: '',
      });
      const encoded = body?.responseData || body?.data;
      const raw = Buffer.from(String(encoded || ''), 'base64');
      if (raw.length < 112) throw new Error('BasicInfo response is too short');
      const identity = await pubkeyToIdentity(raw.subarray(80, 112));
      if (!normalizeIdentity(identity)) throw new Error('BasicInfo has no valid game operator');
      gameOperatorCache = { value: identity, expiresAt: Date.now() + PROFILE_GAME_OPERATOR_CACHE_MS };
      return identity;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Unable to load current game operator: ${lastError?.message || 'unknown error'}`);
}

function transactionHash(tx) {
  return String(tx?.hash || tx?.txHash || tx?.transactionHash || tx?.transactionId || tx?.id || '').trim().toLowerCase();
}

function transactionIdentity(tx, keys) {
  for (const key of keys) {
    const value = tx?.[key] ?? tx?.transaction?.[key] ?? tx?.data?.[key];
    const identity = normalizeIdentity(value);
    if (identity) return identity;
  }
  return '';
}

function transactionAmount(tx) {
  const value = tx?.amount ?? tx?.amountOfQubic ?? tx?.moneyFlew?.amount ?? tx?.transaction?.amount ?? tx?.data?.amount;
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

function transactionTick(tx) {
  const value = tx?.tick ?? tx?.tickNumber ?? tx?.executedTick ?? tx?.transaction?.tick;
  const tick = Number(value);
  return Number.isInteger(tick) && tick > 0 ? tick : null;
}

function extractTransactions(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.transactions)) return body.transactions;
  if (Array.isArray(body?.transactionsForTick)) return body.transactionsForTick;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

async function getConfirmedTransaction(txHash, scheduledTick, sourceIdentity, chainGateway = null) {
  const normalizedHash = String(txHash || '').trim().toLowerCase();
  if (!/^[a-z0-9]{20,128}$/.test(normalizedHash)) throw new Error('Invalid payment transaction hash');

  if (typeof chainGateway?.getTransactionByHash === 'function') {
    const lookup = await chainGateway.getTransactionByHash(normalizedHash, scheduledTick, sourceIdentity);
    if (lookup?.source === 'bob') {
      return lookup.transaction || null;
    }
  }

  for (const baseUrl of PUBLIC_RPC_BASE_URLS) {
    try {
      const body = await postPublicRpc(`${baseUrl}/getTransactionByHash`, { hash: normalizedHash });
      if (transactionHash(body) === normalizedHash) return body;
    } catch {
      // Some public RPC deployments only resolve a transaction through its tick.
    }
  }

  const tick = Number(scheduledTick);
  const identity = normalizeIdentity(sourceIdentity);
  if (!Number.isInteger(tick) || tick <= 0 || !identity) return null;

  for (const baseUrl of PUBLIC_RPC_BASE_URLS) {
    try {
      const body = await postPublicRpc(`${baseUrl}/getTransactionsForTick`, {
        tickNumber: tick,
        filters: { source: identity },
      });
      const transaction = extractTransactions(body)
        .find((item) => transactionHash(item) === normalizedHash);
      if (transaction) return transaction;
    } catch {
      // Try the next public RPC endpoint.
    }
  }

  return null;
}

async function getProfileAvatar(identity) {
  const result = await query(`
    SELECT avatar_mime_type, avatar_data
    FROM profiles
    WHERE identity = $1
      AND avatar_data IS NOT NULL
  `, [identity]);
  return result.rows[0] || null;
}

async function isDisplayNameAvailable(displayName, identity, client = null) {
  const executor = client || { query };
  const result = await executor.query(`
    SELECT 1
    FROM profiles
    WHERE lower(display_name) = lower($1)
      AND identity <> $2
    LIMIT 1
  `, [displayName, identity || '']);
  return result.rowCount === 0;
}

function displayNameTakenError() {
  const error = new Error('Display name is already taken');
  error.statusCode = 409;
  return error;
}

async function saveProfile(identity, payload, chainGateway = null) {
  const hasDisplayNameUpdate = Object.prototype.hasOwnProperty.call(payload || {}, 'displayName');
  const hasAvatarUpdate = Object.prototype.hasOwnProperty.call(payload || {}, 'avatarDataUrl');
  if (!hasDisplayNameUpdate && !hasAvatarUpdate) {
    throw new Error('Profile update does not contain any changes');
  }
  const requestedDisplayName = hasDisplayNameUpdate
    ? normalizeOptionalDisplayName(payload?.displayName)
    : undefined;
  const avatar = parseAvatar(payload?.avatarDataUrl);
  const existingResult = await query(`
    SELECT display_name, name_change_count
    FROM profiles
    WHERE identity = $1
  `, [identity]);
  const existing = existingResult.rows[0] || null;
  const existingDisplayName = existing?.display_name || null;
  if (hasDisplayNameUpdate && requestedDisplayName === null && existingDisplayName) {
    throw new Error('Display name cannot be removed');
  }
  const displayName = hasDisplayNameUpdate ? requestedDisplayName : existingDisplayName;
  const nameChanged = Boolean(displayName)
    && String(existingDisplayName || '').toLocaleLowerCase() !== displayName.toLocaleLowerCase();
  const paymentAmount = nameChanged
    ? Number(existing?.name_change_count || 0) > 0 ? PROFILE_NAME_CHANGE_FEE : PROFILE_NAME_FIRST_FEE
    : 0;
  if (nameChanged && !(await isDisplayNameAvailable(displayName, identity))) {
    throw displayNameTakenError();
  }
  const gameOperator = await getCurrentGameOperator(chainGateway);
  const transaction = await getConfirmedTransaction(payload?.txHash, payload?.scheduledTick, identity, chainGateway);

  if (!transaction) {
    const error = new Error('Payment transaction is not confirmed yet. Wait for its scheduled tick and try again.');
    error.statusCode = 409;
    throw error;
  }
  if (
    transaction?.executed === false
    || transaction?.success === false
    || (paymentAmount > 0 && transaction?.moneyFlew === false)
  ) {
    throw new Error('Payment transaction did not execute');
  }

  const source = transactionIdentity(transaction, ['sourceId', 'source', 'from', 'sourcePublicKey', 'sender']);
  const destination = transactionIdentity(transaction, ['destinationId', 'destination', 'to', 'destinationPublicKey', 'recipient']);
  const amount = transactionAmount(transaction);
  const confirmedTick = transactionTick(transaction);
  if (!confirmedTick) {
    const error = new Error('Payment transaction is not confirmed yet. Wait for its scheduled tick and try again.');
    error.statusCode = 409;
    throw error;
  }
  if (source !== identity || destination !== gameOperator || amount !== paymentAmount) {
    throw new Error('Payment does not match this profile update');
  }

  const normalizedTxHash = transactionHash(transaction) || String(payload?.txHash || '').trim().toLowerCase();

  try {
    return await withTransaction(async (client) => {
      const lockedResult = await client.query(`
      SELECT display_name, name_change_count
      FROM profiles
      WHERE identity = $1
      FOR UPDATE
      `, [identity]);
      const locked = lockedResult.rows[0] || null;
      const lockedDisplayName = locked?.display_name || null;
      if (hasDisplayNameUpdate && requestedDisplayName === null && lockedDisplayName) {
        throw new Error('Display name cannot be removed');
      }
      const nextDisplayName = hasDisplayNameUpdate ? requestedDisplayName : lockedDisplayName;
      const lockedNameChanged = Boolean(nextDisplayName)
        && String(lockedDisplayName || '').toLocaleLowerCase() !== nextDisplayName.toLocaleLowerCase();
      const lockedPaymentAmount = lockedNameChanged
        ? Number(locked?.name_change_count || 0) > 0 ? PROFILE_NAME_CHANGE_FEE : PROFILE_NAME_FIRST_FEE
        : 0;
      if (lockedPaymentAmount !== paymentAmount) {
        throw new Error('Profile changed while this payment was pending. Refresh and try again.');
      }
      if (lockedNameChanged && !(await isDisplayNameAvailable(nextDisplayName, identity, client))) {
        throw displayNameTakenError();
      }

      const insertedPayment = await client.query(`
      INSERT INTO profile_payments(tx_hash, identity, game_operator, amount, scheduled_tick, confirmed_tick)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (tx_hash) DO NOTHING
      RETURNING tx_hash
      `, [normalizedTxHash, identity, gameOperator, paymentAmount, Number(payload?.scheduledTick) || null, confirmedTick]);
      if (insertedPayment.rowCount === 0) throw new Error('This payment transaction was already used');

      const nextCount = Number(locked?.name_change_count || 0) + (lockedNameChanged ? 1 : 0);
      const result = await client.query(`
      INSERT INTO profiles(identity, display_name, avatar_mime_type, avatar_data, name_change_count, avatar_updated_at)
      VALUES ($1, $2, $3, $4, $5, CASE WHEN $6::boolean THEN now() ELSE NULL END)
      ON CONFLICT (identity) DO UPDATE SET
        display_name = CASE WHEN $7::boolean THEN EXCLUDED.display_name ELSE profiles.display_name END,
        avatar_mime_type = CASE WHEN $6::boolean THEN EXCLUDED.avatar_mime_type ELSE profiles.avatar_mime_type END,
        avatar_data = CASE WHEN $6::boolean THEN EXCLUDED.avatar_data ELSE profiles.avatar_data END,
        name_change_count = EXCLUDED.name_change_count,
        avatar_updated_at = CASE WHEN $6::boolean THEN now() ELSE profiles.avatar_updated_at END,
        updated_at = now()
      RETURNING identity, display_name, name_change_count, avatar_updated_at, avatar_data IS NOT NULL AS has_avatar
      `, [identity, nextDisplayName, avatar.mimeType, avatar.data, nextCount, hasAvatarUpdate, hasDisplayNameUpdate]);
      return { profile: result.rows[0], paymentAmount, gameOperator, confirmedTick };
    });
  } catch (error) {
    if (error?.code === '23505' && String(error?.constraint || '').includes('profiles_display_name_ci_uidx')) {
      throw displayNameTakenError();
    }
    throw error;
  }
}

async function getAccount(identity) {
  const result = await query(`
    WITH profile_target AS (
      SELECT $1::text AS identity
    ),
    position_rollup AS (
      SELECT
        owner,
        COALESCE(sum(realized_pnl), 0) AS realized_pnl,
        COALESCE(sum(COALESCE(realized_trade_cost, 0)), 0)
          + COALESCE(sum(amount * avg_entry_price) FILTER (
            WHERE status IN ('win', 'lose')
              AND amount > 0
              AND avg_entry_price IS NOT NULL
          ), 0) AS cost
      FROM positions
      WHERE owner = $1
      GROUP BY owner
    )
    SELECT COALESCE(a.identity, prof.identity) AS identity,
      a.first_seen_tick, a.last_seen_tick, a.created_at, a.updated_at,
      prof.display_name, prof.name_change_count, prof.avatar_updated_at,
      (prof.avatar_data IS NOT NULL) AS has_avatar,
      s.open_bid_volume, s.open_ask_volume, s.traded_volume,
      CASE
        WHEN a.first_seen_tick IS NOT NULL AND EXISTS (
          SELECT 1 FROM raw_logs rl WHERE rl.sc_end_epoch = true AND rl.tick = a.first_seen_tick
          UNION ALL
          SELECT 1 FROM transfers tr WHERE tr.sc_end_epoch = true AND tr.tick = a.first_seen_tick AND (tr.source = a.identity OR tr.destination = a.identity)
          UNION ALL
          SELECT 1 FROM payouts py WHERE py.sc_end_epoch = true AND py.tick = a.first_seen_tick AND py.owner = a.identity
        ) THEN 'SC_END_EPOCH_TX_' || a.first_seen_tick::text
        ELSE a.first_seen_tick::text
      END AS first_seen_tick_ref,
      CASE
        WHEN a.last_seen_tick IS NOT NULL AND EXISTS (
          SELECT 1 FROM raw_logs rl WHERE rl.sc_end_epoch = true AND rl.tick = a.last_seen_tick
          UNION ALL
          SELECT 1 FROM transfers tr WHERE tr.sc_end_epoch = true AND tr.tick = a.last_seen_tick AND (tr.source = a.identity OR tr.destination = a.identity)
          UNION ALL
          SELECT 1 FROM payouts py WHERE py.sc_end_epoch = true AND py.tick = a.last_seen_tick AND py.owner = a.identity
        ) THEN 'SC_END_EPOCH_TX_' || a.last_seen_tick::text
        ELSE a.last_seen_tick::text
      END AS last_seen_tick_ref,
      COALESCE(p.realized_pnl, s.realized_pnl, 0) AS realized_pnl,
      s.trade_count,
      COALESCE((
        SELECT count(*)
        FROM transfers tr
        WHERE (tr.source = a.identity OR tr.destination = a.identity)
          AND NOT (
            tr.sc_end_epoch = true
            AND tr.token = 'GARTH'
            AND tr.source = $2
            AND tr.event_id IS NOT NULL
          )
      ), 0) AS transfer_count,
      COALESCE(p.cost, 0) AS closed_position_cost,
      CASE
        WHEN COALESCE(p.cost, 0) > 0 THEN COALESCE(p.realized_pnl, 0) * 100.0 / p.cost
        ELSE NULL
      END AS pnl_percent
    FROM profile_target target
    LEFT JOIN accounts a ON a.identity = target.identity
    LEFT JOIN account_stats s ON s.identity = a.identity
    LEFT JOIN position_rollup p ON p.owner = a.identity
    LEFT JOIN profiles prof ON prof.identity = target.identity
    WHERE COALESCE(a.identity, prof.identity) = $1
  `, [identity, normalizeIdentity(QUOTTERY_IDENTITY)]);
  return result.rows[0] || null;
}

async function getOrders(identity, limit) {
  const result = await query(`
    SELECT o.*, e.description, e.option0, e.option1, e.status AS event_status
    FROM orders o
    LEFT JOIN events e ON e.event_id = o.event_id
    WHERE o.owner = $1
    ORDER BY COALESCE(o.closed_tick, o.created_tick) DESC, o.created_tick DESC
    LIMIT $2
  `, [identity, limit]);
  return result.rows;
}

async function getOrderEvents(identity, limit) {
  const result = await query(`
    SELECT oe.*, e.description, e.option0, e.option1, e.status AS event_status
    FROM order_events oe
    LEFT JOIN events e ON e.event_id = oe.event_id
    WHERE oe.owner = $1
    ORDER BY oe.tick DESC
    LIMIT $2
  `, [identity, limit]);
  return result.rows;
}

async function getPositions(identity, limit) {
  const result = await query(`
    SELECT p.*, e.description, e.option0, e.option1, e.result, e.status AS event_status, e.win_payout_per_share,
      CASE WHEN p.option = e.result THEN COALESCE(py.actual_payout, 0) ELSE 0 END AS actual_payout
    FROM positions p
    LEFT JOIN events e ON e.event_id = p.event_id
    LEFT JOIN LATERAL (
      SELECT sum(amount) AS actual_payout
      FROM payouts py
      WHERE py.owner = p.owner
        AND py.event_id = p.event_id
    ) py ON true
    WHERE p.owner = $1
    ORDER BY p.updated_at DESC
    LIMIT $2
  `, [identity, limit]);
  return result.rows;
}

async function getPositionEvents(identity, limit) {
  const result = await query(`
    SELECT *
    FROM position_events
    WHERE owner = $1
    ORDER BY tick DESC
    LIMIT $2
  `, [identity, limit]);
  return result.rows;
}

async function getTrades(identity, limit) {
  const result = await query(`
    SELECT t.*, e.description, e.option0, e.option1, COALESCE(t.taker, rt.tx_from) AS taker
    FROM trades t
    LEFT JOIN events e ON e.event_id = t.event_id
    LEFT JOIN raw_transactions rt ON rt.tx_hash = t.tx_hash
    WHERE t.address_a = $1 OR t.address_b = $1
    ORDER BY t.tick DESC
    LIMIT $2
  `, [identity, limit]);
  return result.rows;
}

async function getTransfers(identity, limit) {
  const result = await query(`
    SELECT *,
      CASE
        WHEN sc_end_epoch = true AND tick IS NOT NULL THEN 'SC_END_EPOCH_TX_' || tick::text
        ELSE tick::text
      END AS tick_ref
    FROM transfers
    WHERE (source = $1 OR destination = $1)
      AND NOT (
        sc_end_epoch = true
        AND token = 'GARTH'
        AND source = $3
        AND event_id IS NOT NULL
      )
    ORDER BY tick DESC
    LIMIT $2
  `, [identity, limit, normalizeIdentity(QUOTTERY_IDENTITY)]);
  return result.rows;
}

async function getPayouts(identity, limit) {
  const result = await query(`
    SELECT p.*, e.description, e.option0, e.option1, e.result,
      CASE
        WHEN p.sc_end_epoch = true AND p.tick IS NOT NULL THEN 'SC_END_EPOCH_TX_' || p.tick::text
        ELSE p.tick::text
      END AS tick_ref
    FROM payouts p
    LEFT JOIN events e ON e.event_id = p.event_id
    WHERE p.owner = $1
      AND p.reason <> 'finalize_return'
    ORDER BY p.tick DESC
    LIMIT $2
  `, [identity, limit]);
  return result.rows;
}

async function getNotifications(identity, limit) {
  const result = await query(`
    WITH notifications AS (
      SELECT
        'position:' || p.owner || ':' || p.event_id::text || ':' || p.option::text || ':' || p.status || ':' || COALESCE(p.closed_tick::text, '0') AS notification_id,
        CASE WHEN p.status = 'win' THEN 'position_win' ELSE 'position_lose' END AS type,
        p.event_id,
        p.option,
        NULL::text AS side,
        p.amount,
        p.avg_entry_price AS price,
        p.realized_pnl AS pnl,
        NULL::text AS token,
        p.closed_tick AS tick,
        NULL::text AS tx_hash,
        COALESCE(e.finalized_tx_timestamp, e.archived_tx_timestamp, p.updated_at) AS occurred_at,
        e.description,
        e.option0,
        e.option1,
        e.status AS event_status
      FROM positions p
      LEFT JOIN events e ON e.event_id = p.event_id
      WHERE p.owner = $1
        AND p.status IN ('win', 'lose')
        AND p.amount > 0

      UNION ALL

      SELECT
        'order:' || oe.order_event_uid AS notification_id,
        CASE
          WHEN oe.action IN ('matched', 'missing_matched') THEN 'order_matched'
          WHEN oe.action IN ('removed_by_user', 'missing_removed_by_user') THEN 'order_canceled'
          ELSE 'order_returned'
        END AS type,
        oe.event_id,
        oe.option,
        oe.side,
        oe.amount,
        oe.price,
        NULL::numeric AS pnl,
        NULL::text AS token,
        oe.tick,
        oe.tx_hash,
        COALESCE(oe.tx_timestamp, oe.created_at) AS occurred_at,
        e.description,
        e.option0,
        e.option1,
        e.status AS event_status
      FROM order_events oe
      LEFT JOIN events e ON e.event_id = oe.event_id
      WHERE oe.owner = $1
        AND oe.action IN (
          'matched', 'missing_matched',
          'removed_by_user', 'missing_removed_by_user',
          'removed_by_system', 'missing_removed_by_system'
        )

      UNION ALL

      SELECT
        'payout:' || py.payout_uid AS notification_id,
        'reward_claimed' AS type,
        py.event_id,
        e.result AS option,
        NULL::text AS side,
        py.amount,
        NULL::numeric AS price,
        NULL::numeric AS pnl,
        py.token,
        py.tick,
        py.tx_hash,
        COALESCE(py.tx_timestamp, py.created_at) AS occurred_at,
        e.description,
        e.option0,
        e.option1,
        e.status AS event_status
      FROM payouts py
      LEFT JOIN events e ON e.event_id = py.event_id
      WHERE py.owner = $1
        AND py.reason = 'user_claim_reward'

      UNION ALL

      SELECT
        'transfer:' || tr.transfer_uid AS notification_id,
        'transfer_received' AS type,
        tr.event_id,
        NULL::smallint AS option,
        NULL::text AS side,
        tr.amount,
        NULL::numeric AS price,
        NULL::numeric AS pnl,
        tr.token,
        tr.tick,
        tr.tx_hash,
        COALESCE(tr.tx_timestamp, tr.created_at) AS occurred_at,
        e.description,
        e.option0,
        e.option1,
        e.status AS event_status
      FROM transfers tr
      LEFT JOIN events e ON e.event_id = tr.event_id
      WHERE tr.destination = $1
        AND tr.source IS DISTINCT FROM $1
        AND NOT (
          tr.sc_end_epoch = true
          AND tr.token = 'GARTH'
          AND tr.source = $3
          AND tr.event_id IS NOT NULL
        )
    )
    SELECT *
    FROM notifications
    ORDER BY tick DESC NULLS LAST, occurred_at DESC NULLS LAST, notification_id DESC
    LIMIT $2
  `, [identity, limit, normalizeIdentity(QUOTTERY_IDENTITY)]);
  return result.rows;
}

async function getProfile(identity, limit) {
  const eventLimit = Math.max(limit, 500);
  const [account, orders, orderEvents, positions, positionEvents, trades, transfers, payouts] = await Promise.all([
    getAccount(identity),
    getOrders(identity, limit),
    getOrderEvents(identity, eventLimit),
    getPositions(identity, limit),
    getPositionEvents(identity, limit),
    getTrades(identity, limit),
    getTransfers(identity, limit),
    getPayouts(identity, limit),
  ]);

  return {
    account,
    orders,
    orderEvents,
    positions,
    positionEvents,
    trades,
    transfers,
    payouts,
  };
}

async function getIndexerStatus() {
  const result = await query(`
    SELECT value, updated_at
    FROM indexer_state
    WHERE key = 'quottery:last_tick'
  `);
  const row = result.rows[0] || null;
  const value = row?.value || {};
  const tick = Number(value.tick || 0);
  const epoch = Number(value.epoch || 0);
  return {
    lastIndexedTick: Number.isFinite(tick) && tick > 0 ? tick : null,
    lastIndexedEpoch: Number.isFinite(epoch) && epoch > 0 ? epoch : null,
    updatedAt: row?.updated_at || null,
  };
}

async function searchAccounts(q, limit) {
  const search = String(q || '').trim();
  const normalizedIdentity = search.toUpperCase();
  if (!search) return [];

  const result = await query(`
    WITH position_rollup AS (
      SELECT owner, COALESCE(sum(realized_pnl), 0) AS realized_pnl
      FROM positions
      GROUP BY owner
    )
    SELECT identities.identity, prof.display_name, prof.avatar_updated_at, (prof.avatar_data IS NOT NULL) AS has_avatar,
      s.traded_volume, COALESCE(p.realized_pnl, s.realized_pnl, 0) AS realized_pnl, s.trade_count, a.last_seen_tick
    FROM (
      SELECT identity FROM accounts
      UNION
      SELECT identity FROM profiles
    ) identities
    LEFT JOIN accounts a ON a.identity = identities.identity
    LEFT JOIN account_stats s ON s.identity = a.identity
    LEFT JOIN position_rollup p ON p.owner = a.identity
    LEFT JOIN profiles prof ON prof.identity = identities.identity
    WHERE identities.identity LIKE $1
      OR prof.display_name ILIKE '%' || $2 || '%'
    ORDER BY
      CASE
        WHEN lower(prof.display_name) = lower($2) THEN 0
        WHEN prof.display_name ILIKE $2 || '%' THEN 1
        WHEN identities.identity LIKE $1 THEN 2
        ELSE 3
      END,
      a.last_seen_tick DESC NULLS LAST
    LIMIT $3
  `, [`${normalizedIdentity}%`, search, limit]);
  return result.rows;
}

async function getLeaderboard(metric, limit) {
  const normalizedMetric = String(metric || '').trim().toLowerCase();
  const sortColumn = normalizedMetric === 'volume' ? 's.traded_volume' : 'COALESCE(p.realized_pnl, s.realized_pnl)';

  const result = await query(`
    WITH position_rollup AS (
      SELECT
        owner,
        COALESCE(sum(realized_pnl), 0) AS realized_pnl,
        COALESCE(sum(COALESCE(realized_trade_cost, 0)), 0)
          + COALESCE(sum(amount * avg_entry_price) FILTER (
            WHERE status IN ('win', 'lose')
              AND amount > 0
              AND avg_entry_price IS NOT NULL
          ), 0) AS cost
      FROM positions
      GROUP BY owner
    )
    SELECT
      ROW_NUMBER() OVER (ORDER BY COALESCE(${sortColumn}, 0) DESC, a.last_seen_tick DESC NULLS LAST, a.identity ASC) AS rank,
      a.identity,
      prof.display_name,
      prof.avatar_updated_at,
      (prof.avatar_data IS NOT NULL) AS has_avatar,
      a.first_seen_tick,
      a.last_seen_tick,
      CASE
        WHEN a.first_seen_tick IS NOT NULL AND EXISTS (
          SELECT 1 FROM raw_logs rl WHERE rl.sc_end_epoch = true AND rl.tick = a.first_seen_tick
          UNION ALL
          SELECT 1 FROM transfers tr WHERE tr.sc_end_epoch = true AND tr.tick = a.first_seen_tick AND (tr.source = a.identity OR tr.destination = a.identity)
          UNION ALL
          SELECT 1 FROM payouts py WHERE py.sc_end_epoch = true AND py.tick = a.first_seen_tick AND py.owner = a.identity
        ) THEN 'SC_END_EPOCH_TX_' || a.first_seen_tick::text
        ELSE a.first_seen_tick::text
      END AS first_seen_tick_ref,
      CASE
        WHEN a.last_seen_tick IS NOT NULL AND EXISTS (
          SELECT 1 FROM raw_logs rl WHERE rl.sc_end_epoch = true AND rl.tick = a.last_seen_tick
          UNION ALL
          SELECT 1 FROM transfers tr WHERE tr.sc_end_epoch = true AND tr.tick = a.last_seen_tick AND (tr.source = a.identity OR tr.destination = a.identity)
          UNION ALL
          SELECT 1 FROM payouts py WHERE py.sc_end_epoch = true AND py.tick = a.last_seen_tick AND py.owner = a.identity
        ) THEN 'SC_END_EPOCH_TX_' || a.last_seen_tick::text
        ELSE a.last_seen_tick::text
      END AS last_seen_tick_ref,
      COALESCE(p.realized_pnl, s.realized_pnl, 0) AS realized_pnl,
      COALESCE(s.traded_volume, 0) AS traded_volume,
      COALESCE(s.open_bid_volume, 0) AS open_bid_volume,
      COALESCE(s.open_ask_volume, 0) AS open_ask_volume,
      COALESCE(s.trade_count, 0) AS trade_count,
      COALESCE((
        SELECT count(*)
        FROM transfers tr
        WHERE (tr.source = a.identity OR tr.destination = a.identity)
          AND NOT (
            tr.sc_end_epoch = true
            AND tr.token = 'GARTH'
            AND tr.source = $2
            AND tr.event_id IS NOT NULL
          )
      ), 0) AS transfer_count,
      COALESCE(p.cost, 0) AS closed_position_cost,
      CASE
        WHEN COALESCE(p.cost, 0) > 0 THEN COALESCE(p.realized_pnl, 0) * 100.0 / p.cost
        ELSE NULL
      END AS pnl_percent
    FROM accounts a
    LEFT JOIN account_stats s ON s.identity = a.identity
    LEFT JOIN position_rollup p ON p.owner = a.identity
    LEFT JOIN profiles prof ON prof.identity = a.identity
    WHERE COALESCE(p.realized_pnl, s.realized_pnl, 0) <> 0
      OR COALESCE(s.traded_volume, 0) <> 0
      OR COALESCE(s.trade_count, 0) <> 0
    ORDER BY COALESCE(${sortColumn}, 0) DESC, a.last_seen_tick DESC NULLS LAST, a.identity ASC
    LIMIT $1
  `, [limit, normalizeIdentity(QUOTTERY_IDENTITY)]);
  return result.rows;
}

async function getPeriodRanks(startTime, endTime, sortBy, limit) {
  const sortColumn = sortBy === 'vol' ? 'vol' : 'pnl';
  const secondarySortColumn = sortBy === 'vol' ? 'pnl' : 'vol';
  const result = await query(`
    WITH trade_legs AS (
      SELECT
        t.address_a AS walletid,
        t.amount * t.price0 AS vol
      FROM trades t
      WHERE t.tx_timestamp >= $1::timestamptz
        AND t.tx_timestamp <= $2::timestamptz

      UNION ALL

      SELECT
        t.address_b AS walletid,
        t.amount * CASE WHEN t.price1 > 0 THEN t.price1 ELSE t.price0 END AS vol
      FROM trades t
      WHERE t.tx_timestamp >= $1::timestamptz
        AND t.tx_timestamp <= $2::timestamptz
    ),
    volume_by_wallet AS (
      SELECT walletid, COALESCE(sum(vol), 0) AS vol
      FROM trade_legs
      WHERE walletid IS NOT NULL
      GROUP BY walletid
    ),
    trade_pnl_by_wallet AS (
      SELECT
        pe.owner AS walletid,
        COALESCE(sum(COALESCE((pe.details ->> 'realizedTradePnlDelta')::numeric, 0)), 0) AS pnl
      FROM position_events pe
      WHERE pe.action = 'ask_matched'
        AND pe.tx_timestamp >= $1::timestamptz
        AND pe.tx_timestamp <= $2::timestamptz
      GROUP BY pe.owner
    ),
    settlement_pnl_by_wallet AS (
      SELECT
        p.owner AS walletid,
        COALESCE(sum(p.settlement_pnl), 0) AS pnl
      FROM positions p
      JOIN events e ON e.event_id = p.event_id
      WHERE COALESCE(e.finalized_tx_timestamp, e.archived_tx_timestamp) >= $1::timestamptz
        AND COALESCE(e.finalized_tx_timestamp, e.archived_tx_timestamp) <= $2::timestamptz
        AND p.status IN ('win', 'lose')
      GROUP BY p.owner
    ),
    wallets AS (
      SELECT walletid FROM volume_by_wallet
      UNION
      SELECT walletid FROM trade_pnl_by_wallet
      UNION
      SELECT walletid FROM settlement_pnl_by_wallet
    ),
    metrics AS (
      SELECT
        w.walletid,
        COALESCE(tp.pnl, 0) + COALESCE(sp.pnl, 0) AS pnl,
        COALESCE(v.vol, 0) AS vol
      FROM wallets w
      LEFT JOIN volume_by_wallet v ON v.walletid = w.walletid
      LEFT JOIN trade_pnl_by_wallet tp ON tp.walletid = w.walletid
      LEFT JOIN settlement_pnl_by_wallet sp ON sp.walletid = w.walletid
    ),
    ranked AS (
      SELECT
        ROW_NUMBER() OVER (
          ORDER BY ${sortColumn} DESC, ${secondarySortColumn} DESC, walletid ASC
        ) AS rank,
        walletid,
        pnl,
        vol
      FROM metrics
      WHERE pnl <> 0 OR vol <> 0
    )
    SELECT rank, walletid, pnl, vol
    FROM ranked
    ORDER BY rank
    LIMIT $3
  `, [startTime.toISOString(), endTime.toISOString(), limit]);

  return result.rows.map((row) => ({
    rank: Number(row.rank),
    walletid: row.walletid,
    pnl: rankNumber(row.pnl),
    vol: rankNumber(row.vol),
  }));
}

async function getEventSummary(eventId) {
  const result = await query(`
    SELECT e.*,
      CASE
        WHEN e.archived_sc_end_epoch = true AND e.archived_tick IS NOT NULL THEN 'SC_END_EPOCH_TX_' || e.archived_tick::text
        ELSE e.archived_tick::text
      END AS archived_tick_ref,
      COALESCE(v.open_order_volume, 0) AS open_order_volume,
      COALESCE(v.traded_volume, 0) AS traded_volume
    FROM events e
    LEFT JOIN event_volume_summary v ON v.event_id = e.event_id
    WHERE e.event_id = $1
  `, [eventId]);
  return result.rows[0] || null;
}

async function getEvents(status, limit) {
  const normalizedStatus = String(status || '').trim().toLowerCase();
  const whereSql = normalizedStatus === 'archived'
    ? "WHERE e.status = 'archived' OR e.archived_tick IS NOT NULL"
    : normalizedStatus
      ? 'WHERE e.status = $1'
      : '';
  const params = normalizedStatus && normalizedStatus !== 'archived' ? [normalizedStatus, limit] : [limit];
  const limitParam = params.length;

  const result = await query(`
    SELECT e.*,
      CASE
        WHEN e.archived_sc_end_epoch = true AND e.archived_tick IS NOT NULL THEN 'SC_END_EPOCH_TX_' || e.archived_tick::text
        ELSE e.archived_tick::text
      END AS archived_tick_ref,
      COALESCE(v.open_order_volume, 0) AS open_order_volume,
      COALESCE(v.traded_volume, 0) AS traded_volume
    FROM events e
    LEFT JOIN event_volume_summary v ON v.event_id = e.event_id
    ${whereSql}
    ORDER BY
      COALESCE(e.archived_tick, e.finalized_tick, e.result_tick, e.created_tick) DESC NULLS LAST,
      e.event_id DESC
    LIMIT $${limitParam}
  `, params);
  return result.rows;
}

function normalizeOrderPrice(price, flipPrice = false) {
  const rawPrice = Number(price ?? 0);
  if (!Number.isFinite(rawPrice) || rawPrice <= 0) return null;
  const nextPrice = flipPrice ? 100000 - rawPrice : rawPrice;
  if (!Number.isFinite(nextPrice) || nextPrice <= 0 || nextPrice >= 100000) return null;
  return nextPrice;
}

function pickBestBid(...prices) {
  const clean = prices.filter((price) => price !== null && price !== undefined);
  return clean.length ? Math.max(...clean) : null;
}

function pickBestAsk(...prices) {
  const clean = prices.filter((price) => price !== null && price !== undefined);
  return clean.length ? Math.min(...clean) : null;
}

function calculateProbability(row, option) {
  const directBid = normalizeOrderPrice(option === 0 ? row.bid0 : row.bid1);
  const directAsk = normalizeOrderPrice(option === 0 ? row.ask0 : row.ask1);
  const oppositeAsk = normalizeOrderPrice(option === 0 ? row.ask1 : row.ask0, true);
  const oppositeBid = normalizeOrderPrice(option === 0 ? row.bid1 : row.bid0, true);
  const bestBid = pickBestBid(directBid, oppositeAsk);
  const bestAsk = pickBestAsk(directAsk, oppositeBid);

  let price = null;
  if (bestBid !== null && bestAsk !== null) price = Math.round((bestBid + bestAsk) / 2);
  else price = bestBid ?? bestAsk;

  if (price === null) return null;
  return {
    option,
    price,
    percent: (price / 100000) * 100,
  };
}

async function getEventMetrics(eventIds) {
  if (!eventIds.length) {
    return {
      volumes: {},
      tradedVolumes: {},
      openOrderVolumes: {},
      probabilities: {},
      source: 'db',
      cached: false,
      lastUpdatedAt: Date.now(),
    };
  }

  const result = await query(`
    WITH requested_events AS (
      SELECT unnest($1::bigint[]) AS event_id
    ),
    open_orderbook AS (
      SELECT
        event_id,
        COALESCE(sum(open_amount * price), 0) AS open_order_volume,
        max(price) FILTER (WHERE option = 0 AND side = 'bid') AS bid0,
        min(price) FILTER (WHERE option = 0 AND side = 'ask') AS ask0,
        max(price) FILTER (WHERE option = 1 AND side = 'bid') AS bid1,
        min(price) FILTER (WHERE option = 1 AND side = 'ask') AS ask1
      FROM orders
      WHERE event_id = ANY($1::bigint[])
        AND status IN ('open', 'partially_matched')
        AND open_amount > 0
      GROUP BY event_id
    )
    SELECT
      r.event_id,
      COALESCE(v.open_order_volume, o.open_order_volume, 0) AS open_order_volume,
      COALESCE(v.traded_volume, 0) AS traded_volume,
      o.bid0,
      o.ask0,
      o.bid1,
      o.ask1
    FROM requested_events r
    LEFT JOIN open_orderbook o ON o.event_id = r.event_id
    LEFT JOIN event_volume_summary v ON v.event_id = r.event_id
  `, [eventIds]);

  const byEventId = new Map(result.rows.map((row) => [Number(row.event_id), row]));
  const volumes = {};
  const tradedVolumes = {};
  const openOrderVolumes = {};
  const probabilities = {};

  for (const eventId of eventIds) {
    const row = byEventId.get(eventId) || { open_order_volume: 0, traded_volume: 0 };
    const tradedVolume = Number(row.traded_volume || 0);
    const openOrderVolume = Number(row.open_order_volume || 0);
    volumes[eventId] = tradedVolume;
    tradedVolumes[eventId] = tradedVolume;
    openOrderVolumes[eventId] = openOrderVolume;
    probabilities[eventId] = calculateProbability(row, 0);
  }

  return {
    volumes,
    tradedVolumes,
    openOrderVolumes,
    probabilities,
    source: 'db',
    cached: false,
    lastUpdatedAt: Date.now(),
  };
}

async function handleQuotteryDbApi(req, res, requestUrl, sendJson, chainGateway = null) {
  const isRanksAlias = requestUrl.pathname === '/ranks';
  if (!requestUrl.pathname.startsWith('/api/quottery') && !isRanksAlias) return false;

  if (!isEnabled()) {
    sendJson(res, 503, { error: 'Quottery DB API is disabled because DATABASE_URL is not set' });
    return true;
  }

  const parts = routeParts(requestUrl.pathname);
  const apiParts = isRanksAlias
    ? ['ranks']
    : parts[0] === 'api' && parts[1] === 'quottery' ? parts.slice(2) : [];
  const limit = parseLimit(requestUrl.searchParams.get('limit'), apiParts[0] === 'ranks' ? 1000 : 100);

  try {
    if (apiParts[0] === 'profiles' && apiParts[1] === 'name-availability') {
      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return true;
      }
      const identity = normalizeIdentity(requestUrl.searchParams.get('identity'));
      const displayName = normalizeDisplayName(requestUrl.searchParams.get('name'));
      sendJson(res, 200, { available: await isDisplayNameAvailable(displayName, identity) });
      return true;
    }

    if (apiParts[0] === 'profiles' && apiParts[1] && apiParts[2] === 'avatar') {
      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return true;
      }
      const identity = normalizeIdentity(apiParts[1]);
      if (!identity) {
        sendJson(res, 400, { error: 'Invalid identity' });
        return true;
      }
      const avatar = await getProfileAvatar(identity);
      if (!avatar) {
        sendJson(res, 404, { error: 'Avatar not found' });
        return true;
      }
      res.writeHead(200, {
        'Content-Type': avatar.avatar_mime_type || 'application/octet-stream',
        'Content-Length': avatar.avatar_data.length,
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(avatar.avatar_data);
      return true;
    }

    if (apiParts[0] === 'profiles' && apiParts[1]) {
      if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return true;
      }
      const identity = normalizeIdentity(apiParts[1]);
      if (!identity) {
        sendJson(res, 400, { error: 'Invalid identity' });
        return true;
      }
      const payload = await readJsonBody(req);
      const result = await saveProfile(identity, payload, chainGateway);
      sendJson(res, 200, result);
      return true;
    }

    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return true;
    }

    if (apiParts[0] === 'ranks') {
      const startTime = parseRankTimestamp(requestUrl.searchParams.get('starttime'), 'starttime');
      const endTime = parseRankTimestamp(requestUrl.searchParams.get('endtime'), 'endtime');
      if (startTime.getTime() > endTime.getTime()) {
        throw requestError('starttime must be before or equal to endtime');
      }
      const sortBy = parseRankSort(requestUrl.searchParams.get('sortby'));
      sendJson(res, 200, {
        success: true,
        starttime: startTime.toISOString(),
        endtime: endTime.toISOString(),
        sortby: sortBy,
        ranks: await getPeriodRanks(startTime, endTime, sortBy, limit),
      });
      return true;
    }

    if (apiParts[0] === 'search') {
      sendJson(res, 200, { results: await searchAccounts(requestUrl.searchParams.get('q'), limit) });
      return true;
    }

    if (apiParts[0] === 'leaderboard') {
      const metric = requestUrl.searchParams.get('metric') === 'volume' ? 'volume' : 'pnl';
      sendJson(res, 200, { metric, leaders: await getLeaderboard(metric, limit) });
      return true;
    }

    if (apiParts[0] === 'event-metrics') {
      sendJson(res, 200, await getEventMetrics(parseEventIds(requestUrl.searchParams.get('ids'))));
      return true;
    }

    if (apiParts[0] === 'indexer-status') {
      sendJson(res, 200, { status: await getIndexerStatus() });
      return true;
    }

    if (apiParts[0] === 'events' && !apiParts[1]) {
      sendJson(res, 200, { events: await getEvents(requestUrl.searchParams.get('status'), limit) });
      return true;
    }

    if (apiParts[0] === 'events' && apiParts[1]) {
      const eventId = Number(apiParts[1]);
      if (!Number.isInteger(eventId)) {
        sendJson(res, 400, { error: 'Invalid event id' });
        return true;
      }

      sendJson(res, 200, { event: await getEventSummary(eventId) });
      return true;
    }

    if (apiParts[0] === 'accounts' && apiParts[1]) {
      const identity = normalizeIdentity(apiParts[1]);
      if (!identity) {
        sendJson(res, 400, { error: 'Invalid identity' });
        return true;
      }

      const section = apiParts[2] || 'profile';
      if (section === 'profile') sendJson(res, 200, await getProfile(identity, limit));
      else if (section === 'orders') sendJson(res, 200, { orders: await getOrders(identity, limit), orderEvents: await getOrderEvents(identity, limit) });
      else if (section === 'positions') sendJson(res, 200, { positions: await getPositions(identity, limit), positionEvents: await getPositionEvents(identity, limit) });
      else if (section === 'trades') sendJson(res, 200, { trades: await getTrades(identity, limit) });
      else if (section === 'transfers') sendJson(res, 200, { transfers: await getTransfers(identity, limit) });
      else if (section === 'payouts') sendJson(res, 200, { payouts: await getPayouts(identity, limit) });
      else if (section === 'notifications') sendJson(res, 200, { notifications: await getNotifications(identity, limit) });
      else sendJson(res, 404, { error: 'Not found' });
      return true;
    }

    sendJson(res, 404, { error: 'Not found' });
    return true;
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;
    sendJson(res, statusCode, { error: 'Quottery DB API failed', details: error.message });
    return true;
  }
}

module.exports = {
  handleQuotteryDbApi,
};
