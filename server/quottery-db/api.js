const { getDatabaseUrl, query } = require('./db');
const { normalizeIdentity } = require('./identity');
const { QUOTTERY_IDENTITY } = require('./constants');

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

async function getAccount(identity) {
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
      WHERE owner = $1
      GROUP BY owner
    )
    SELECT a.*, s.open_bid_volume, s.open_ask_volume, s.traded_volume,
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
    FROM accounts a
    LEFT JOIN account_stats s ON s.identity = a.identity
    LEFT JOIN position_rollup p ON p.owner = a.identity
    WHERE a.identity = $1
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
  const normalized = String(q || '').trim().toUpperCase();
  if (!normalized) return [];

  const result = await query(`
    WITH position_rollup AS (
      SELECT owner, COALESCE(sum(realized_pnl), 0) AS realized_pnl
      FROM positions
      GROUP BY owner
    )
    SELECT a.identity, s.traded_volume, COALESCE(p.realized_pnl, s.realized_pnl, 0) AS realized_pnl, s.trade_count, a.last_seen_tick
    FROM accounts a
    LEFT JOIN account_stats s ON s.identity = a.identity
    LEFT JOIN position_rollup p ON p.owner = a.identity
    WHERE a.identity LIKE $1
    ORDER BY a.last_seen_tick DESC NULLS LAST
    LIMIT $2
  `, [`${normalized}%`, limit]);
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
    WHERE COALESCE(p.realized_pnl, s.realized_pnl, 0) <> 0
      OR COALESCE(s.traded_volume, 0) <> 0
      OR COALESCE(s.trade_count, 0) <> 0
    ORDER BY COALESCE(${sortColumn}, 0) DESC, a.last_seen_tick DESC NULLS LAST, a.identity ASC
    LIMIT $1
  `, [limit, normalizeIdentity(QUOTTERY_IDENTITY)]);
  return result.rows;
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

async function handleQuotteryDbApi(req, res, requestUrl, sendJson) {
  if (!requestUrl.pathname.startsWith('/api/quottery')) return false;

  if (!isEnabled()) {
    sendJson(res, 503, { error: 'Quottery DB API is disabled because DATABASE_URL is not set' });
    return true;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return true;
  }

  const parts = routeParts(requestUrl.pathname);
  const apiParts = parts[0] === 'api' && parts[1] === 'quottery' ? parts.slice(2) : [];
  const limit = parseLimit(requestUrl.searchParams.get('limit'));

  try {
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
      else sendJson(res, 404, { error: 'Not found' });
      return true;
    }

    sendJson(res, 404, { error: 'Not found' });
    return true;
  } catch (error) {
    sendJson(res, 500, { error: 'Quottery DB API failed', details: error.message });
    return true;
  }
}

module.exports = {
  handleQuotteryDbApi,
};
