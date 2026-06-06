const { withTransaction } = require('./db');

function asNumberString(value, fallback = '0') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function orderUid(owner, eventId, option, side, price, txHash = 'manual') {
  return [owner, eventId, option, side, price, txHash].join(':');
}

function eventUid(prefix, tick, txHash, logUid, extra = '') {
  return [prefix, tick || 0, txHash || 'no_tx', logUid || 'no_log', extra].join(':');
}

function eventTimestamp(tx, log) {
  return log?.timestamp || tx?.timestamp || null;
}

async function upsertAccount(client, identity, tick = null) {
  if (!identity) return;
  await client.query(`
    INSERT INTO accounts(identity, first_seen_tick, last_seen_tick)
    VALUES ($1, $2, $2)
    ON CONFLICT (identity) DO UPDATE SET
      first_seen_tick = COALESCE(accounts.first_seen_tick, EXCLUDED.first_seen_tick),
      last_seen_tick = GREATEST(COALESCE(accounts.last_seen_tick, 0), COALESCE(EXCLUDED.last_seen_tick, 0)),
      updated_at = now()
  `, [identity, tick]);

  await client.query(`
    INSERT INTO account_stats(identity)
    VALUES ($1)
    ON CONFLICT (identity) DO NOTHING
  `, [identity]);
}

async function saveRawTransactions(client, transactions) {
  for (const tx of transactions) {
    await upsertAccount(client, tx.from, tx.tick);
    await upsertAccount(client, tx.to, tx.tick);
    await client.query(`
      INSERT INTO raw_transactions(
        tx_hash, epoch, tick, tx_timestamp, tx_from, tx_to, amount, input_type, input_size, input_data, executed, raw
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (tx_hash) DO UPDATE SET
        epoch = EXCLUDED.epoch,
        tick = EXCLUDED.tick,
        tx_timestamp = EXCLUDED.tx_timestamp,
        tx_from = EXCLUDED.tx_from,
        tx_to = EXCLUDED.tx_to,
        amount = EXCLUDED.amount,
        input_type = EXCLUDED.input_type,
        input_size = EXCLUDED.input_size,
        input_data = EXCLUDED.input_data,
        executed = EXCLUDED.executed,
        raw = EXCLUDED.raw
    `, [
      tx.hash,
      tx.epoch,
      tx.tick,
      tx.timestamp,
      tx.from || null,
      tx.to || null,
      tx.amount,
      tx.inputType,
      tx.inputSize,
      tx.inputData,
      tx.executed,
      tx.raw,
    ]);
  }
}

async function saveRawLogs(client, logs) {
  for (const log of logs) {
    await client.query(`
      INSERT INTO raw_logs(log_uid, tx_hash, epoch, tick, log_timestamp, log_id, log_type, sc_index, sc_log_type, raw)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (log_uid) DO UPDATE SET
        tx_hash = EXCLUDED.tx_hash,
        epoch = EXCLUDED.epoch,
        tick = EXCLUDED.tick,
        log_timestamp = EXCLUDED.log_timestamp,
        log_id = EXCLUDED.log_id,
        log_type = EXCLUDED.log_type,
        sc_index = EXCLUDED.sc_index,
        sc_log_type = EXCLUDED.sc_log_type,
        raw = EXCLUDED.raw
    `, [
      log.logUid,
      log.txHash,
      log.epoch,
      log.tick,
      log.timestamp,
      log.logId,
      log.logType,
      log.scIndex,
      log.scLogType,
      log.raw,
    ]);
  }
}

async function saveCreatedEvent(client, domainEvent) {
  const { tx, event } = domainEvent;
  const assignedEventId = await assignCreatedEventId(client, event.eventId);
  await upsertAccount(client, tx.from, tx.tick);
  await client.query(`
    INSERT INTO events(
      event_id, creator, description, option0, option1, open_date, end_date,
      created_tick, created_tx_hash, created_tx_timestamp, status
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending')
    ON CONFLICT (event_id) DO UPDATE SET
      creator = COALESCE(events.creator, EXCLUDED.creator),
      description = COALESCE(EXCLUDED.description, events.description),
      option0 = COALESCE(EXCLUDED.option0, events.option0),
      option1 = COALESCE(EXCLUDED.option1, events.option1),
      open_date = COALESCE(EXCLUDED.open_date, events.open_date),
      end_date = COALESCE(EXCLUDED.end_date, events.end_date),
      created_tick = COALESCE(events.created_tick, EXCLUDED.created_tick),
      created_tx_hash = COALESCE(events.created_tx_hash, EXCLUDED.created_tx_hash),
      created_tx_timestamp = COALESCE(events.created_tx_timestamp, EXCLUDED.created_tx_timestamp),
      updated_at = now()
  `, [
    assignedEventId,
    tx.from || null,
    event.description,
    event.option0,
    event.option1,
    event.openDate || tx.timestamp || null,
    event.endDate,
    tx.tick,
    tx.hash,
    tx.timestamp,
  ]);
}

async function assignCreatedEventId(client, inputEventId) {
  const parsed = Number(inputEventId);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  const result = await client.query('SELECT COALESCE(MAX(event_id), 0) + 1 AS next_event_id FROM events');
  return Number(result.rows[0]?.next_event_id || 1);
}

async function saveOrderAdded(client, domainEvent) {
  const { tx, log, order } = domainEvent;
  const uid = orderUid(order.owner, order.eventId, order.option, order.side, order.price, tx.hash || log?.txHash);
  const actionUid = eventUid('order_added', log?.tick || tx.tick, tx.hash, log?.logUid, uid);

  await upsertAccount(client, order.owner, log?.tick || tx.tick);
  await client.query(`
    INSERT INTO orders(
      order_uid, owner, event_id, option, side, original_amount, open_amount, price,
      status, created_tick, created_tx_hash, created_tx_timestamp, created_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$6,$7,'open',$8,$9,$10,$11)
    ON CONFLICT (order_uid) DO NOTHING
  `, [
    uid,
    order.owner,
    order.eventId,
    order.option,
    order.side,
    order.amount,
    order.price,
    log?.tick || tx.tick,
    tx.hash || log?.txHash || null,
    eventTimestamp(tx, log),
    null,
  ]);

  await client.query(`
    INSERT INTO order_events(
      order_event_uid, order_uid, owner, event_id, option, side, action, amount, price, tick, tx_timestamp, tx_hash, log_uid, details
    )
    VALUES ($1,$2,$3,$4,$5,$6,'created',$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (order_event_uid) DO NOTHING
  `, [
    actionUid,
    uid,
    order.owner,
    order.eventId,
    order.option,
    order.side,
    order.amount,
    order.price,
    log?.tick || tx.tick,
    eventTimestamp(tx, log),
    tx.hash || log?.txHash || null,
    log?.logUid || null,
    { source: 'sc_log' },
  ]);

  if (order.side === 'ask') {
    await applyPositionDelta(client, {
      owner: order.owner,
      eventId: order.eventId,
      option: order.option,
      amountDelta: `-${order.amount}`,
      lockedDelta: order.amount,
      price: order.price,
      action: 'ask_locked',
      tick: log?.tick || tx.tick,
      txHash: tx.hash || log?.txHash,
      logUid: log?.logUid,
      txTimestamp: eventTimestamp(tx, log),
    });
  }
}

async function saveOrderRemoved(client, domainEvent) {
  const { tx, order, status } = domainEvent;
  const side = order.side;
  const result = await client.query(`
    SELECT order_uid, open_amount
    FROM orders
    WHERE owner = $1 AND event_id = $2 AND option = $3 AND side = $4 AND price = $5
      AND status IN ('open', 'partially_matched')
    ORDER BY created_tick ASC, order_uid ASC
  `, [order.owner, order.eventId, order.option, side, order.price]);

  const removedAmount = asNumberString(order.amount);
  let remaining = BigInt(String(removedAmount).split('.')[0]);
  const touchedOrders = [];
  await upsertAccount(client, order.owner, tx.tick);

  for (const existing of result.rows) {
    if (remaining <= 0n) break;
    const openAmount = BigInt(String(existing.open_amount || '0').split('.')[0]);
    if (openAmount <= 0n) continue;

    const usedAmount = openAmount < remaining ? openAmount : remaining;
    const nextOpen = openAmount - usedAmount;
    remaining -= usedAmount;
    touchedOrders.push({ uid: existing.order_uid, amount: usedAmount.toString() });

    await client.query(`
      UPDATE orders
      SET open_amount = $2::numeric,
          status = CASE WHEN $2::numeric = 0 THEN $3 ELSE 'partially_matched' END,
          closed_tick = CASE WHEN $2::numeric = 0 THEN $4 ELSE closed_tick END,
          closed_tx_hash = CASE WHEN $2::numeric = 0 THEN $5 ELSE closed_tx_hash END,
          closed_tx_timestamp = CASE WHEN $2::numeric = 0 THEN $6 ELSE closed_tx_timestamp END,
          updated_at = now()
      WHERE order_uid = $1
    `, [existing.order_uid, nextOpen.toString(), status, tx.tick, tx.hash, tx.timestamp]);
  }

  if (touchedOrders.length === 0) {
    const uid = orderUid(order.owner, order.eventId, order.option, side, order.price, tx.hash);
    await client.query(`
      INSERT INTO orders(
        order_uid, owner, event_id, option, side, original_amount, open_amount, price,
        status, created_tick, closed_tick, created_tx_hash, closed_tx_hash, closed_tx_timestamp
      )
      VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8,$9,$9,$10,$10,$11)
      ON CONFLICT (order_uid) DO NOTHING
    `, [uid, order.owner, order.eventId, order.option, side, removedAmount, order.price, status, tx.tick, tx.hash, tx.timestamp]);
    touchedOrders.push({ uid, amount: removedAmount });
    remaining = 0n;
  }

  for (const touched of touchedOrders) {
    await client.query(`
      INSERT INTO order_events(
        order_event_uid, order_uid, owner, event_id, option, side, action, amount, price, tick, tx_timestamp, tx_hash, details
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (order_event_uid) DO NOTHING
    `, [
      eventUid('order_removed', tx.tick, tx.hash, null, touched.uid),
      touched.uid,
      order.owner,
      order.eventId,
      order.option,
      side,
      status,
      touched.amount,
      order.price,
      tx.tick,
      tx.timestamp,
      tx.hash,
      { source: 'tx_input', requestedAmount: removedAmount },
    ]);
  }

  if (side === 'ask') {
    await applyPositionDelta(client, {
      owner: order.owner,
      eventId: order.eventId,
      option: order.option,
      amountDelta: removedAmount,
      lockedDelta: `-${removedAmount}`,
      price: order.price,
      action: 'ask_unlocked',
      tick: tx.tick,
      txHash: tx.hash,
      txTimestamp: tx.timestamp,
    });
  }
}

async function reduceOpenOrder(client, { owner, eventId, option, side, amount, price = null, priceMode = 'exact', tick, txHash, logUid, txTimestamp = null }) {
  const params = [owner, eventId, option, side];
  let priceSql = '';
  if (price !== null && price !== undefined) {
    params.push(price);
    if (priceMode === 'exact') {
      priceSql = `AND price = $${params.length}::numeric`;
    } else if (priceMode === 'compatible') {
      priceSql = `AND (($4 = 'bid' AND price >= $${params.length}::numeric) OR ($4 = 'ask' AND price <= $${params.length}::numeric))`;
    }
  }
  const modeParamIndex = params.length + 1;
  const txHashParamIndex = params.length + 2;

  const result = await client.query(`
    SELECT order_uid, open_amount
    FROM orders
    WHERE owner = $1 AND event_id = $2 AND option = $3 AND side = $4
      AND status IN ('open', 'partially_matched')
      ${priceSql}
    ORDER BY
      CASE WHEN $${modeParamIndex}::text = 'compatible' AND created_tx_hash = $${txHashParamIndex}::text THEN 1 ELSE 0 END DESC,
      CASE WHEN $${modeParamIndex}::text = 'compatible' THEN created_tick END DESC,
      CASE WHEN side = 'bid' THEN price END DESC,
      CASE WHEN side = 'ask' THEN price END ASC,
      created_tick ASC,
      order_uid ASC
  `, [...params, priceMode, txHash || null]);

  const existing = result.rows[0];
  if (!existing) {
    if (price === null || price === undefined) return null;

    const syntheticOrderUid = eventUid('synthetic_order_matched', tick, txHash, logUid, `${owner}:${eventId}:${option}:${side}:${amount}:${price}`);
    await client.query(`
      INSERT INTO orders(
        order_uid, owner, event_id, option, side, original_amount, open_amount, price,
        status, created_tick, closed_tick, created_tx_hash, closed_tx_hash, created_tx_timestamp, closed_tx_timestamp
      )
      VALUES ($1,$2,$3,$4,$5,$6,0,$7,'matched',$8,$8,$9,$9,$10,$10)
      ON CONFLICT (order_uid) DO NOTHING
    `, [
      syntheticOrderUid,
      owner,
      eventId,
      option,
      side,
      amount,
      price,
      tick,
      txHash,
      txTimestamp,
    ]);

    await client.query(`
      INSERT INTO order_events(
        order_event_uid, order_uid, owner, event_id, option, side, action, amount, price, tick, tx_timestamp, tx_hash, log_uid
      )
      VALUES ($1,$2,$3,$4,$5,$6,'missing_matched',$7,$8,$9,$10,$11,$12)
      ON CONFLICT (order_event_uid) DO NOTHING
    `, [
      eventUid('missing_order_matched', tick, txHash, logUid, syntheticOrderUid),
      syntheticOrderUid,
      owner,
      eventId,
      option,
      side,
      amount,
      price,
      tick,
      txTimestamp,
      txHash,
      logUid,
    ]);

    return syntheticOrderUid;
  }

  let remaining = BigInt(String(amount || '0').split('.')[0]);
  let lastOrderUid = null;
  for (const openOrder of result.rows) {
    if (remaining <= 0n) break;
    const openAmount = BigInt(String(openOrder.open_amount || '0').split('.')[0]);
    if (openAmount <= 0n) continue;

    const usedAmount = openAmount < remaining ? openAmount : remaining;
    const nextOpen = openAmount - usedAmount;
    remaining -= usedAmount;
    lastOrderUid = openOrder.order_uid;

    await client.query(`
      UPDATE orders
      SET open_amount = $2::numeric,
          status = CASE
            WHEN $2::numeric = 0 THEN 'matched'
            ELSE 'partially_matched'
          END,
          closed_tick = CASE WHEN $2::numeric = 0 THEN $3 ELSE closed_tick END,
          closed_tx_hash = CASE WHEN $2::numeric = 0 THEN $4 ELSE closed_tx_hash END,
          closed_tx_timestamp = CASE WHEN $2::numeric = 0 THEN $5 ELSE closed_tx_timestamp END,
          updated_at = now()
      WHERE order_uid = $1
    `, [openOrder.order_uid, nextOpen.toString(), tick, txHash, txTimestamp]);

    await client.query(`
      INSERT INTO order_events(
        order_event_uid, order_uid, owner, event_id, option, side, action, amount, price, tick, tx_timestamp, tx_hash, log_uid
      )
      VALUES ($1,$2,$3,$4,$5,$6,'matched',$7,$8,$9,$10,$11,$12)
      ON CONFLICT (order_event_uid) DO NOTHING
    `, [
      eventUid('order_matched', tick, txHash, logUid, openOrder.order_uid),
      openOrder.order_uid,
      owner,
      eventId,
      option,
      side,
      usedAmount.toString(),
      price,
      tick,
      txTimestamp,
      txHash,
      logUid,
    ]);
  }

  return lastOrderUid;
}

function tradeLegs(trade) {
  if (trade.matchType === 100009 || trade.matchType === 100010) {
    const option = trade.matchType === 100009 ? 0 : 1;
    return [
      { address: trade.addressA, side: 'sell', option, price: trade.price0 },
      { address: trade.addressB, side: 'buy', option, price: trade.price0 },
    ];
  }

  if (trade.matchType === 100011) {
    return [
      { address: trade.addressA, side: 'sell', option: 0, price: trade.price0 },
      { address: trade.addressB, side: 'sell', option: 1, price: trade.price1 },
    ];
  }

  if (trade.matchType === 100012) {
    return [
      { address: trade.addressA, side: 'buy', option: 0, price: trade.price0 },
      { address: trade.addressB, side: 'buy', option: 1, price: trade.price1 },
    ];
  }

  return [];
}

function tradePerspective(tx, trade) {
  const legs = tradeLegs(trade);
  const takerLeg = legs.find((leg) => leg.address && leg.address === tx.from) || null;
  const makerLeg = takerLeg ? legs.find((leg) => leg !== takerLeg) || null : null;

  return {
    taker: tx.from || null,
    maker: makerLeg?.address || null,
    takerSide: takerLeg?.side || null,
    makerSide: makerLeg?.side || null,
    takerOption: takerLeg?.option ?? null,
    makerOption: makerLeg?.option ?? null,
    takerPrice: takerLeg?.price || null,
    makerPrice: makerLeg?.price || null,
  };
}

async function saveTrade(client, domainEvent) {
  const { tx, log, trade } = domainEvent;
  const uid = eventUid('trade', log?.tick || tx.tick, tx.hash || log?.txHash, log?.logUid, trade.matchType);
  const tick = log?.tick || tx.tick;
  const txHash = tx.hash || log?.txHash || null;
  const txTimestamp = eventTimestamp(tx, log);
  const perspective = tradePerspective(tx, trade);

  await upsertAccount(client, trade.addressA, tick);
  await upsertAccount(client, trade.addressB, tick);
  await upsertAccount(client, perspective.taker, tick);
  await upsertAccount(client, perspective.maker, tick);
  await client.query(`
    INSERT INTO trades(
      trade_uid, event_id, match_type, option, address_a, address_b,
      taker, maker, taker_side, maker_side, taker_option, maker_option, taker_price, maker_price,
      amount, price0, price1, tick, tx_timestamp, tx_hash, log_uid, raw
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
    ON CONFLICT (trade_uid) DO UPDATE SET
      taker = COALESCE(EXCLUDED.taker, trades.taker),
      maker = COALESCE(EXCLUDED.maker, trades.maker),
      taker_side = COALESCE(EXCLUDED.taker_side, trades.taker_side),
      maker_side = COALESCE(EXCLUDED.maker_side, trades.maker_side),
      taker_option = COALESCE(EXCLUDED.taker_option, trades.taker_option),
      maker_option = COALESCE(EXCLUDED.maker_option, trades.maker_option),
      taker_price = COALESCE(EXCLUDED.taker_price, trades.taker_price),
      maker_price = COALESCE(EXCLUDED.maker_price, trades.maker_price),
      raw = EXCLUDED.raw
  `, [
    uid,
    trade.eventId,
    trade.matchType,
    trade.option === 2 ? null : trade.option,
    trade.addressA,
    trade.addressB,
    perspective.taker,
    perspective.maker,
    perspective.takerSide,
    perspective.makerSide,
    perspective.takerOption,
    perspective.makerOption,
    perspective.takerPrice,
    perspective.makerPrice,
    trade.amount,
    trade.price0,
    trade.price1 || '0',
    tick,
    txTimestamp,
    txHash,
    log?.logUid || null,
    trade,
  ]);

  if (trade.matchType === 100009 || trade.matchType === 100010) {
    const option = trade.matchType === 100009 ? 0 : 1;
    await reduceOpenOrder(client, { owner: trade.addressA, eventId: trade.eventId, option, side: 'ask', amount: trade.amount, price: trade.price0, priceMode: trade.addressA === perspective.taker ? 'compatible' : 'exact', tick, txHash, logUid: log?.logUid, txTimestamp });
    await reduceOpenOrder(client, { owner: trade.addressB, eventId: trade.eventId, option, side: 'bid', amount: trade.amount, price: trade.price0, priceMode: trade.addressB === perspective.taker ? 'compatible' : 'exact', tick, txHash, logUid: log?.logUid, txTimestamp });
    await applyPositionDelta(client, {
      owner: trade.addressA,
      eventId: trade.eventId,
      option,
      amountDelta: '0',
      lockedDelta: `-${trade.amount}`,
      realizedPnlDelta: '0',
      price: trade.price0,
      action: 'ask_matched',
      tick,
      txHash,
      logUid: log?.logUid,
      txTimestamp,
    });
    await applyPositionDelta(client, {
      owner: trade.addressB,
      eventId: trade.eventId,
      option,
      amountDelta: trade.amount,
      price: trade.price0,
      action: 'bid_matched',
      tick,
      txHash,
      logUid: log?.logUid,
      txTimestamp,
    });
  } else if (trade.matchType === 100011) {
    await reduceOpenOrder(client, { owner: trade.addressA, eventId: trade.eventId, option: 0, side: 'ask', amount: trade.amount, price: trade.price0, priceMode: trade.addressA === perspective.taker ? 'compatible' : 'exact', tick, txHash, logUid: log?.logUid, txTimestamp });
    await reduceOpenOrder(client, { owner: trade.addressB, eventId: trade.eventId, option: 1, side: 'ask', amount: trade.amount, price: trade.price1, priceMode: trade.addressB === perspective.taker ? 'compatible' : 'exact', tick, txHash, logUid: log?.logUid, txTimestamp });
    await applyPositionDelta(client, { owner: trade.addressA, eventId: trade.eventId, option: 0, amountDelta: '0', lockedDelta: `-${trade.amount}`, realizedPnlDelta: '0', price: trade.price0, action: 'ask_matched', tick, txHash, logUid: log?.logUid, txTimestamp });
    await applyPositionDelta(client, { owner: trade.addressB, eventId: trade.eventId, option: 1, amountDelta: '0', lockedDelta: `-${trade.amount}`, realizedPnlDelta: '0', price: trade.price1, action: 'ask_matched', tick, txHash, logUid: log?.logUid, txTimestamp });
  } else if (trade.matchType === 100012) {
    await reduceOpenOrder(client, { owner: trade.addressA, eventId: trade.eventId, option: 0, side: 'bid', amount: trade.amount, price: trade.price0, priceMode: trade.addressA === perspective.taker ? 'compatible' : 'exact', tick, txHash, logUid: log?.logUid, txTimestamp });
    await reduceOpenOrder(client, { owner: trade.addressB, eventId: trade.eventId, option: 1, side: 'bid', amount: trade.amount, price: trade.price1, priceMode: trade.addressB === perspective.taker ? 'compatible' : 'exact', tick, txHash, logUid: log?.logUid, txTimestamp });
    await applyPositionDelta(client, { owner: trade.addressA, eventId: trade.eventId, option: 0, amountDelta: trade.amount, price: trade.price0, action: 'bid_matched', tick, txHash, logUid: log?.logUid, txTimestamp });
    await applyPositionDelta(client, { owner: trade.addressB, eventId: trade.eventId, option: 1, amountDelta: trade.amount, price: trade.price1, action: 'bid_matched', tick, txHash, logUid: log?.logUid, txTimestamp });
  }
}

function multiply(a, b) {
  return (BigInt(asNumberString(a)) * BigInt(asNumberString(b))).toString();
}

async function applyPositionDelta(client, delta) {
  await upsertAccount(client, delta.owner, delta.tick);
  const saleAccounting = await positionSaleAccounting(client, delta);
  await client.query(`
    INSERT INTO positions(
      owner, event_id, option, amount, locked_amount, avg_entry_price,
      realized_trade_cost, realized_trade_pnl, settlement_pnl, realized_pnl, opened_tick
    )
    VALUES ($1,$2,$3,GREATEST($4::numeric, 0), GREATEST($5::numeric, 0),
      CASE WHEN $10::text = 'bid_matched' AND $4::numeric > 0 AND $6::numeric > 0 THEN $6::numeric ELSE NULL END,
      $8::numeric, $9::numeric, 0, $9::numeric, $7)
    ON CONFLICT (owner, event_id, option) DO UPDATE SET
      avg_entry_price = CASE
        WHEN $10::text = 'bid_matched'
          AND $4::numeric > 0
          AND $6::numeric > 0
          AND positions.amount + positions.locked_amount + $4::numeric > 0
          THEN ((COALESCE(positions.avg_entry_price, 0) * (positions.amount + positions.locked_amount)) + ($6::numeric * $4::numeric))
            / (positions.amount + positions.locked_amount + $4::numeric)
        ELSE positions.avg_entry_price
      END,
      amount = GREATEST(positions.amount + $4::numeric, 0),
      locked_amount = GREATEST(positions.locked_amount + $5::numeric, 0),
      realized_trade_cost = positions.realized_trade_cost + $8::numeric,
      realized_trade_pnl = positions.realized_trade_pnl + $9::numeric,
      realized_pnl = positions.realized_trade_pnl + $9::numeric + positions.settlement_pnl,
      opened_tick = COALESCE(positions.opened_tick, $7),
      updated_at = now()
  `, [
    delta.owner,
    delta.eventId,
    delta.option,
    asNumberString(delta.amountDelta),
    asNumberString(delta.lockedDelta),
    asNumberString(delta.price),
    delta.tick,
    saleAccounting.cost,
    saleAccounting.pnl,
    delta.action,
  ]);

  await client.query(`
    INSERT INTO position_events(
      position_event_uid, owner, event_id, option, action, amount_delta, price, tick, tx_timestamp, tx_hash, log_uid, details
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (position_event_uid) DO NOTHING
  `, [
    eventUid('position', delta.tick, delta.txHash, delta.logUid, `${delta.owner}:${delta.eventId}:${delta.option}:${delta.action}`),
    delta.owner,
    delta.eventId,
    delta.option,
    delta.action,
    asNumberString(delta.amountDelta),
    asNumberString(delta.price, null),
    delta.tick,
    delta.txTimestamp || null,
    delta.txHash || null,
    delta.logUid || null,
    {
      lockedDelta: asNumberString(delta.lockedDelta),
      realizedTradeCostDelta: saleAccounting.cost,
      realizedTradePnlDelta: saleAccounting.pnl,
    },
  ]);
}

async function positionSaleAccounting(client, delta) {
  if (delta.action !== 'ask_matched') return { cost: '0', pnl: '0' };
  const soldAmount = asNumberString(String(delta.lockedDelta || '').startsWith('-')
    ? String(delta.lockedDelta).slice(1)
    : delta.amount || delta.amountDelta || '0');
  if (soldAmount === '0') return { cost: '0', pnl: '0' };

  const result = await client.query(`
    SELECT
      ($4::numeric * COALESCE(avg_entry_price, $5::numeric))::text AS cost,
      ($4::numeric * ($5::numeric - COALESCE(avg_entry_price, $5::numeric)))::text AS pnl
    FROM positions
    WHERE owner = $1 AND event_id = $2 AND option = $3
  `, [delta.owner, delta.eventId, delta.option, soldAmount, asNumberString(delta.price)]);

  return {
    cost: result.rows[0]?.cost || multiply(soldAmount, asNumberString(delta.price)),
    pnl: result.rows[0]?.pnl || '0',
  };
}

async function saveTransfer(client, domainEvent) {
  const { tx, log, transfer, type } = domainEvent;
  const tick = log?.tick || tx.tick;
  const txHash = tx.hash || log?.txHash || null;
  const txTimestamp = eventTimestamp(tx, log);
  const uid = eventUid('transfer', tick, txHash, log?.logUid, `${transfer.token}:${transfer.source}:${transfer.destination}:${transfer.amount}`);

  await upsertAccount(client, transfer.source, tick);
  await upsertAccount(client, transfer.destination, tick);
  await client.query(`
    INSERT INTO transfers(
      transfer_uid, token, source, destination, amount, reason, tick, tx_timestamp, tx_hash, log_uid, raw
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (transfer_uid) DO NOTHING
  `, [
    uid,
    transfer.token,
    transfer.source || null,
    transfer.destination || null,
    asNumberString(transfer.amount),
    type,
    tick,
    txTimestamp,
    txHash,
    log?.logUid || null,
    domainEvent,
  ]);
}

async function saveRewardClaimed(client, domainEvent) {
  const { tx, log, event } = domainEvent;
  const tick = log?.tick || tx.tick;
  const txHash = tx.hash || log?.txHash || null;
  const txTimestamp = eventTimestamp(tx, log);
  const owner = tx.from || null;
  const amount = asNumberString(event.amount);
  if (!owner || amount === '0') return;

  await upsertAccount(client, owner, tick);
  await client.query(`
    INSERT INTO payouts(payout_uid, owner, event_id, token, amount, reason, tick, tx_timestamp, tx_hash, log_uid, raw)
    VALUES ($1,$2,$3,'GARTH',$4,'user_claim_reward',$5,$6,$7,$8,$9)
    ON CONFLICT (payout_uid) DO UPDATE SET
      amount = EXCLUDED.amount,
      reason = EXCLUDED.reason,
      raw = EXCLUDED.raw
  `, [
    eventUid('payout', tick, txHash, log?.logUid, `${owner}:${event.eventId}:${amount}`),
    owner,
    event.eventId,
    amount,
    tick,
    txTimestamp,
    txHash,
    log?.logUid || null,
    domainEvent,
  ]);
}

async function closeEventOpenOrdersBySystem(client, { eventId, tick, txHash, txTimestamp }) {
  const result = await client.query(`
    SELECT order_uid, owner, option, side, open_amount, price
    FROM orders
    WHERE event_id = $1 AND status IN ('open', 'partially_matched') AND open_amount > 0
    ORDER BY created_tick ASC, order_uid ASC
  `, [eventId]);

  for (const order of result.rows) {
    await client.query(`
      INSERT INTO order_events(
        order_event_uid, order_uid, owner, event_id, option, side, action, amount, price, tick, tx_timestamp, tx_hash, details
      )
      VALUES ($1,$2,$3,$4,$5,$6,'removed_by_system',$7,$8,$9,$10,$11,$12)
      ON CONFLICT (order_event_uid) DO NOTHING
    `, [
      eventUid('order_removed_by_system', tick, txHash, null, order.order_uid),
      order.order_uid,
      order.owner,
      eventId,
      order.option,
      order.side,
      asNumberString(order.open_amount),
      asNumberString(order.price),
      tick,
      txTimestamp,
      txHash,
      { source: 'event_finalized' },
    ]);
  }

  await client.query(`
    UPDATE orders
    SET status = 'removed_by_system',
        open_amount = 0,
        closed_tick = COALESCE(closed_tick, $2),
        closed_tx_hash = COALESCE(closed_tx_hash, $3),
        closed_tx_timestamp = COALESCE(closed_tx_timestamp, $4),
        updated_at = now()
    WHERE event_id = $1 AND status IN ('open', 'partially_matched')
  `, [eventId, tick, txHash, txTimestamp]);
}

async function saveEventState(client, domainEvent) {
  const { tx, log, event, type } = domainEvent;
  const tick = log?.tick || tx.tick;
  const txHash = tx.hash || log?.txHash || null;
  const txTimestamp = eventTimestamp(tx, log);

  if (type === 'event_result_published') {
    await client.query(`
      INSERT INTO events(event_id, result, status, result_tick, result_tx_timestamp, updated_at)
      VALUES ($1,$2,'published',$3,$4,now())
      ON CONFLICT (event_id) DO UPDATE SET
        result = EXCLUDED.result,
        status = 'published',
        result_tick = COALESCE(events.result_tick, EXCLUDED.result_tick),
        result_tx_timestamp = COALESCE(events.result_tx_timestamp, EXCLUDED.result_tx_timestamp),
        updated_at = now()
    `, [event.eventId, event.option, tick, txTimestamp]);
  } else if (type === 'event_finalized') {
    await client.query(`
      INSERT INTO events(event_id, result, status, finalized_tick, finalized_tx_timestamp, updated_at)
      VALUES ($1,$2,'finalized',$3,$4,now())
      ON CONFLICT (event_id) DO UPDATE SET
        result = COALESCE(EXCLUDED.result, events.result),
        status = 'finalized',
        finalized_tick = COALESCE(events.finalized_tick, EXCLUDED.finalized_tick),
        finalized_tx_timestamp = COALESCE(events.finalized_tx_timestamp, EXCLUDED.finalized_tx_timestamp),
        updated_at = now()
    `, [event.eventId, event.option, tick, txTimestamp]);

    await closeEventOpenOrdersBySystem(client, { eventId: event.eventId, tick, txHash, txTimestamp });

    await client.query(`
      UPDATE positions
      SET status = CASE WHEN option = $2 THEN 'win' ELSE 'lose' END,
          amount = amount + locked_amount,
          locked_amount = 0,
          closed_tick = $3,
          updated_at = now()
      WHERE event_id = $1
    `, [event.eventId, event.option, tick]);
  } else if (type === 'event_archived') {
    await client.query(`
      INSERT INTO events(event_id, status, archived_tick, archived_tx_timestamp, updated_at)
      VALUES ($1,'archived',$2,$3,now())
      ON CONFLICT (event_id) DO UPDATE SET
        status = 'archived',
        archived_tick = COALESCE(events.archived_tick, EXCLUDED.archived_tick),
        archived_tx_timestamp = COALESCE(events.archived_tx_timestamp, EXCLUDED.archived_tx_timestamp),
        updated_at = now()
    `, [event.eventId, tick, txTimestamp]);

    await closeEventOpenOrdersBySystem(client, { eventId: event.eventId, tick, txHash, txTimestamp });

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
    `, [event.eventId, tick]);
  }
}

async function updateStats(client) {
  await client.query(`
    INSERT INTO account_stats(identity, open_bid_volume, open_ask_volume, traded_volume, realized_pnl, trade_count, transfer_count)
    SELECT
      a.identity,
      COALESCE(sum(o.open_amount * o.price) FILTER (WHERE o.side = 'bid' AND o.status IN ('open', 'partially_matched')), 0),
      COALESCE(sum(o.open_amount * o.price) FILTER (WHERE o.side = 'ask' AND o.status IN ('open', 'partially_matched')), 0),
      COALESCE((
        SELECT sum(
          CASE WHEN t.address_a = a.identity THEN t.amount * t.price0 ELSE 0 END
          + CASE WHEN t.address_b = a.identity THEN t.amount * CASE WHEN t.price1 > 0 THEN t.price1 ELSE t.price0 END ELSE 0 END
        )
        FROM trades t
        WHERE t.address_a = a.identity OR t.address_b = a.identity
      ), 0),
      COALESCE((SELECT sum(p.realized_pnl) FROM positions p WHERE p.owner = a.identity), 0),
      COALESCE((SELECT count(*) FROM trades t WHERE t.address_a = a.identity OR t.address_b = a.identity), 0),
      COALESCE((
        SELECT count(*)
        FROM transfers tr
        WHERE (tr.source = a.identity OR tr.destination = a.identity)
          AND NOT (tr.sc_end_epoch = true AND tr.token = 'GARTH' AND tr.event_id IS NOT NULL)
      ), 0)
    FROM accounts a
    LEFT JOIN orders o ON o.owner = a.identity
    GROUP BY a.identity
    ON CONFLICT (identity) DO UPDATE SET
      open_bid_volume = EXCLUDED.open_bid_volume,
      open_ask_volume = EXCLUDED.open_ask_volume,
      traded_volume = EXCLUDED.traded_volume,
      realized_pnl = EXCLUDED.realized_pnl,
      trade_count = EXCLUDED.trade_count,
      transfer_count = EXCLUDED.transfer_count,
      updated_at = now()
  `);
}

async function refreshPositionPnls(client) {
  await client.query(`
    UPDATE positions p
    SET settlement_pnl =
      CASE WHEN p.option = e.result THEN COALESCE((
          SELECT sum(py.amount)
          FROM payouts py
          WHERE py.owner = p.owner
            AND py.event_id = p.event_id
        ), p.amount * e.win_payout_per_share)
        ELSE 0
      END
      - COALESCE(p.amount * p.avg_entry_price, 0),
      realized_pnl = COALESCE(p.realized_trade_pnl, 0)
        + CASE WHEN p.option = e.result THEN COALESCE((
            SELECT sum(py.amount)
            FROM payouts py
            WHERE py.owner = p.owner
              AND py.event_id = p.event_id
          ), p.amount * e.win_payout_per_share)
          ELSE 0
        END
        - COALESCE(p.amount * p.avg_entry_price, 0),
      updated_at = now()
    FROM events e
    WHERE e.event_id = p.event_id
      AND e.result IS NOT NULL
      AND p.status IN ('win', 'lose')
  `);
}

function domainEventPriority(event) {
  return {
    event_created: 10,
    order_added: 20,
    order_removed: 30,
    order_matched: 40,
    asset_transfer: 50,
    reward_claimed: 60,
    event_result_published: 70,
    event_finalized: 80,
    event_archived: 90,
  }[event?.type] || 999;
}

async function saveDecodedTick(decoded) {
  if (!decoded.tick) return;

  await withTransaction(async (client) => {
    await saveRawTransactions(client, decoded.transactions || []);
    await saveRawLogs(client, decoded.logs || []);

    const domainEvents = (decoded.domainEvents || [])
      .map((event, index) => ({ event, index }))
      .sort((a, b) => domainEventPriority(a.event) - domainEventPriority(b.event) || a.index - b.index)
      .map((item) => item.event);

    for (const event of domainEvents) {
      if (event.type === 'event_created') await saveCreatedEvent(client, event);
      else if (event.type === 'order_added') await saveOrderAdded(client, event);
      else if (event.type === 'order_removed') await saveOrderRemoved(client, event);
      else if (event.type === 'order_matched') await saveTrade(client, event);
      else if (event.type === 'asset_transfer') await saveTransfer(client, event);
      else if (event.type === 'reward_claimed') await saveRewardClaimed(client, event);
      else if (event.type === 'event_result_published' || event.type === 'event_finalized' || event.type === 'event_archived') await saveEventState(client, event);
    }

    await client.query(`
      INSERT INTO indexer_state(key, value, updated_at)
      VALUES ('quottery:last_tick', $1, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `, [{ tick: decoded.tick.tick, epoch: decoded.tick.epoch }]);

    await refreshPositionPnls(client);
    await updateStats(client);
  });
}

module.exports = {
  refreshPositionPnls,
  saveDecodedTick,
  updateStats,
};
