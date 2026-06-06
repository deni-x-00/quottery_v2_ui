const path = require('path');
const XLSX = require('xlsx');
const { closePool, withTransaction } = require('./db');
const { QUOTTERY_IDENTITY } = require('./constants');

const DEFAULT_FILE = path.join(process.cwd(), 'data', 'historical', 'QTRY.xlsx');
const MATCH_TYPE_BASE = 100009;
const WHOLE_PRICE = 100000n;
const WIN_PAYOUT_PER_SHARE = 95000n;
const DEFAULT_WIN_PAYOUT_PER_SHARE = WIN_PAYOUT_PER_SHARE.toString();

const BLOCKS = {
  createEvent: { name: 'CREATE_EVENT', start: 'C', fields: ['source', 'id', 'desc_text', 'opt_0_text', 'opt_1_text', 'end_date', 'tick', 'time', 'tx'] },
  matchingOrders: { name: 'MATCHING_ORDERS', start: 'N', fields: ['source', 'id', 'address_1', 'address_2', 'matched_amount', 'price_1', 'price_2', 'scenario', 'tick', 'time', 'tx'] },
  addAsk: { name: 'ADD_TO_ASK_ORDER', start: 'AA', fields: ['source', 'id', 'option', 'shares_amount', 'price', 'tick', 'time', 'tx'] },
  removeAsk: { name: 'REMOVE_ASK_ORDER', start: 'AK', fields: ['source', 'id', 'option', 'shares_amount', 'price', 'tick', 'time', 'tx'] },
  addBid: { name: 'ADD_TO_BID_ORDER', start: 'AU', fields: ['source', 'id', 'option', 'shares_amount', 'price', 'tick', 'time', 'tx'] },
  removeBid: { name: 'REMOVE_BID_ORDER', start: 'BE', fields: ['source', 'id', 'option', 'shares_amount', 'price', 'tick', 'time', 'tx'] },
  publishResult: { name: 'PUBLISH_RESULT', start: 'BO', fields: ['source', 'id', 'winner_option', 'tick', 'time', 'tx'] },
  tryFinalize: { name: 'TRY_FINALIZE_EVENT', start: 'BW', fields: ['source', 'id', 'winner_option', 'destination', 'amount', 'tick', 'time', 'tx'] },
  dispute: { name: 'DISPUTE', start: 'CG', fields: ['source', 'id', 'tick', 'time', 'tx'] },
  resolveDispute: { name: 'RESOLVE_DISPUTE', start: 'CN', fields: ['source', 'id', 'number_of_computor', 'vote', 'tick', 'time', 'tx'] },
  claimReward: { name: 'USER_CLAIM_REWARD', start: 'CW', fields: ['source', 'id', 'amount', 'tick', 'time', 'tx'] },
  forceClaim: { name: 'GO_FORCE_CLAIM_REWARD', start: 'DE', fields: ['source', 'id', 'pubkeys', 'tick', 'time', 'tx'] },
  transfer: { name: 'TRANSFERS_QUSD_QTRYGOV', start: 'DM', fields: ['source', 'destination', 'amount', 'token', 'tick', 'time', 'tx'] },
  cleanMemory: { name: 'CLEAN_MEMORY', start: 'DV', fields: ['archive_eid', 'destination', 'amount', 'tick', 'time', 'tx'] },
  feeDiscount: { name: 'UPDATE_FEE_DISCOUNT_LIST', start: 'ED', fields: ['source', 'user', 'new_fee_rate', 'option', 'tick', 'time', 'tx'] },
  proposalVote: { name: 'PROPOSAL_VOTE', start: 'EM', fields: ['source', 'sh_fee', 'burn_fee', 'go_fee', 'fee_per_day', 'dep_for_dispute', 'go_wallet', 'tick', 'time', 'tx', 'hold_qtrygov'] },
  endEpoch: { name: 'END_EPOCH', start: 'EZ', fields: ['source', 'destination', 'amount', 'token', 'tick', 'time', 'tx'] },
  endEpochMsg: { name: 'END_EPOCH_CUSTOM_MSG', start: 'FI', fields: ['archive_eid', 'tick', 'time', 'tx'] },
};

const PRIORITY = {
  create_event: 10,
  add_order: 20,
  remove_order: 30,
  trade: 40,
  publish_result: 50,
  finalize_event: 60,
  claim_reward: 70,
  clean_memory: 80,
  transfer: 90,
  archive_event: 100,
  ignored: 200,
};

function parseArgs(argv) {
  const args = {
    file: DEFAULT_FILE,
    dryRun: false,
    clear: false,
    epochs: null,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--file') args.file = path.resolve(argv[++i]);
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--clear') args.clear = true;
    else if (arg === '--include-open-epoch') args.includeOpenEpoch = true;
    else if (arg === '--epochs') args.epochs = new Set(String(argv[++i] || '').split(',').map((item) => item.trim()).filter(Boolean));
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function colToIndex(col) {
  let index = 0;
  for (const char of col) index = index * 26 + char.charCodeAt(0) - 64;
  return index - 1;
}

function cellAddress(colIndex, rowNumber) {
  return XLSX.utils.encode_cell({ c: colIndex, r: rowNumber - 1 });
}

function getCell(ws, colIndex, rowNumber) {
  return ws[cellAddress(colIndex, rowNumber)];
}

function cellText(ws, colIndex, rowNumber) {
  const cell = getCell(ws, colIndex, rowNumber);
  if (!cell) return '';
  if (cell.v === null || cell.v === undefined) return '';
  if (typeof cell.v === 'string') return cell.v.trim();
  if (cell.w) return String(cell.w).trim();
  return String(cell.v).trim();
}

function readBlockRow(ws, block, rowNumber) {
  const start = colToIndex(block.start);
  const out = {};
  for (let i = 0; i < block.fields.length; i += 1) {
    const key = block.fields[i];
    out[key] = cellText(ws, start + i, rowNumber);
  }
  return out;
}

function hasAny(row, keys) {
  return keys.some((key) => row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '');
}

function required(row, keys) {
  return keys.every((key) => row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '');
}

function normalizeIdentity(value) {
  const identity = String(value || '').trim().toUpperCase();
  return /^[A-Z]{56,60}$/.test(identity) ? identity : '';
}

function token(value) {
  const next = String(value || '').trim().toUpperCase();
  if (next === 'QUSD') return 'GARTH';
  if (next === 'QUS' || next === 'QTRY') return 'GARTH';
  return next;
}

function intString(value, fallback = '0') {
  if (value === null || value === undefined || value === '') return fallback;
  const text = String(value).replace(/[,\s]/g, '').trim();
  if (!text) return fallback;
  if (/^-?\d+(\.\d+)?$/.test(text)) return text.split('.')[0];
  return fallback;
}

function intNumber(value, fallback = null) {
  const text = intString(value, '');
  if (!text) return fallback;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function timestamp(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (match) return `${match[1]}T${match[2]}Z`;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function txHash(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const match = text.match(/\/tx\/([^/?#\s]+)/i);
  const hash = (match ? match[1] : text).trim();
  if (/^SC_END_EPOCH_TX_\d+$/i.test(hash)) return hash.toUpperCase();
  return hash.toLowerCase();
}

function epochNumber(sheetName) {
  return intNumber(String(sheetName).replace(/^epoch_/i, ''), null);
}

function rowMeta(sourceFile, sheetName, rowNumber, blockName, row) {
  return {
    sourceFile: path.basename(sourceFile),
    sheetName,
    rowNumber,
    blockName,
    txHash: txHash(row.tx),
    tick: intNumber(row.tick, null),
    raw: row,
  };
}

function action(kind, sourceFile, sheetName, rowNumber, blockName, row, data = {}) {
  const meta = rowMeta(sourceFile, sheetName, rowNumber, blockName, row);
  return {
    kind,
    priority: PRIORITY[kind] || 999,
    epoch: epochNumber(sheetName),
    tick: meta.tick || 0,
    txHash: meta.txHash,
    txTimestamp: timestamp(row.time),
    txFrom: normalizeIdentity(row.source),
    meta,
    ...data,
  };
}

function tradePerspective(row) {
  const scenario = intNumber(row.scenario, 0);
  const address1 = normalizeIdentity(row.address_1);
  const address2 = normalizeIdentity(row.address_2);
  const source = normalizeIdentity(row.source);
  const matchType = MATCH_TYPE_BASE + scenario;
  const price1 = intString(row.price_1);
  const price2 = intString(row.price_2);
  const first = {
    address: address1,
    side: scenario === 2 ? 'sell' : scenario === 3 ? 'buy' : 'sell',
    option: scenario === 1 ? 1 : 0,
    price: price1,
  };
  const second = {
    address: address2,
    side: scenario === 2 ? 'sell' : scenario === 3 ? 'buy' : 'buy',
    option: scenario === 0 ? 0 : 1,
    price: scenario === 0 || scenario === 1 ? price1 : price2,
  };
  const takerLeg = source === address1 ? first : source === address2 ? second : null;
  const makerLeg = takerLeg === first ? second : takerLeg === second ? first : null;

  return {
    matchType,
    option: scenario <= 1 ? scenario : null,
    price0: price1,
    price1: scenario <= 1 ? '0' : price2,
    legs: [first, second],
    taker: source,
    maker: makerLeg?.address || '',
    takerSide: takerLeg?.side || null,
    makerSide: makerLeg?.side || null,
    takerOption: takerLeg?.option ?? null,
    makerOption: makerLeg?.option ?? null,
    takerPrice: takerLeg?.price || null,
    makerPrice: makerLeg?.price || null,
  };
}

function parseWorkbook(filePath, options) {
  const wb = XLSX.readFile(filePath, {
    cellDates: false,
    cellFormula: false,
    cellHTML: false,
    cellStyles: false,
  });
  const actions = [];

  for (const sheetName of wb.SheetNames) {
    if (!/^epoch_\d+$/i.test(sheetName)) continue;
    if (options.epochs && !options.epochs.has(sheetName)) continue;

    const ws = wb.Sheets[sheetName];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    const carry = {
      finalize: null,
      cleanMemory: null,
    };
    for (let rowNumber = 6; rowNumber <= range.e.r + 1; rowNumber += 1) {
      parseSimpleBlocks(filePath, sheetName, ws, rowNumber, actions);
      parseCarryBlocks(filePath, sheetName, ws, rowNumber, actions, carry);
    }
  }

  actions.sort((a, b) =>
    (a.tick || 0) - (b.tick || 0)
    || (a.priority || 0) - (b.priority || 0)
    || (a.epoch || 0) - (b.epoch || 0)
    || a.meta.rowNumber - b.meta.rowNumber
    || String(a.kind).localeCompare(String(b.kind))
  );

  return actions;
}

function parseSimpleBlocks(filePath, sheetName, ws, rowNumber, actions) {
  let row = readBlockRow(ws, BLOCKS.createEvent, rowNumber);
  if (required(row, ['source', 'id', 'tick', 'tx'])) {
    actions.push(action('create_event', filePath, sheetName, rowNumber, BLOCKS.createEvent.name, row, {
      eventId: intNumber(row.id),
      creator: normalizeIdentity(row.source),
      description: row.desc_text,
      option0: row.opt_0_text,
      option1: row.opt_1_text,
      endDate: timestamp(row.end_date),
    }));
  }

  row = readBlockRow(ws, BLOCKS.matchingOrders, rowNumber);
  if (required(row, ['source', 'id', 'address_1', 'address_2', 'matched_amount', 'scenario', 'tick', 'tx'])) {
    const trade = tradePerspective(row);
    actions.push(action('trade', filePath, sheetName, rowNumber, BLOCKS.matchingOrders.name, row, {
      eventId: intNumber(row.id),
      address1: normalizeIdentity(row.address_1),
      address2: normalizeIdentity(row.address_2),
      amount: intString(row.matched_amount),
      scenario: intNumber(row.scenario, 0),
      trade,
    }));
  }

  for (const [blockKey, side, orderAction] of [
    ['addAsk', 'ask', 'add_order'],
    ['addBid', 'bid', 'add_order'],
    ['removeAsk', 'ask', 'remove_order'],
    ['removeBid', 'bid', 'remove_order'],
  ]) {
    row = readBlockRow(ws, BLOCKS[blockKey], rowNumber);
    if (required(row, ['source', 'id', 'option', 'shares_amount', 'price', 'tick', 'tx'])) {
      actions.push(action(orderAction, filePath, sheetName, rowNumber, BLOCKS[blockKey].name, row, {
        side,
        status: orderAction === 'remove_order' ? 'removed_by_user' : 'open',
        owner: normalizeIdentity(row.source),
        eventId: intNumber(row.id),
        option: intNumber(row.option),
        amount: intString(row.shares_amount),
        price: intString(row.price),
      }));
    }
  }

  row = readBlockRow(ws, BLOCKS.publishResult, rowNumber);
  if (required(row, ['source', 'id', 'winner_option', 'tick', 'tx'])) {
    actions.push(action('publish_result', filePath, sheetName, rowNumber, BLOCKS.publishResult.name, row, {
      eventId: intNumber(row.id),
      winnerOption: intNumber(row.winner_option),
    }));
  }

  row = readBlockRow(ws, BLOCKS.claimReward, rowNumber);
  if (required(row, ['source', 'id', 'amount', 'tick', 'tx'])) {
    actions.push(action('claim_reward', filePath, sheetName, rowNumber, BLOCKS.claimReward.name, row, {
      eventId: intNumber(row.id),
      destination: normalizeIdentity(row.source),
      amount: intString(row.amount),
    }));
  }

  row = readBlockRow(ws, BLOCKS.transfer, rowNumber);
  if (required(row, ['source', 'destination', 'amount', 'token', 'tick', 'tx'])) {
    actions.push(action('transfer', filePath, sheetName, rowNumber, BLOCKS.transfer.name, row, {
      source: normalizeIdentity(row.source),
      destination: normalizeIdentity(row.destination),
      amount: intString(row.amount),
      token: token(row.token),
      reason: 'user_transfer',
    }));
  }

  row = readBlockRow(ws, BLOCKS.endEpoch, rowNumber);
  if (required(row, ['source', 'destination', 'amount', 'token', 'tick'])) {
    actions.push(action('transfer', filePath, sheetName, rowNumber, BLOCKS.endEpoch.name, row, {
      source: normalizeIdentity(row.source),
      destination: normalizeIdentity(row.destination),
      amount: intString(row.amount),
      token: token(row.token),
      reason: 'sc_end_epoch',
      scEndEpoch: true,
    }));
  }

  row = readBlockRow(ws, BLOCKS.endEpochMsg, rowNumber);
  if (required(row, ['archive_eid', 'tick'])) {
    actions.push(action('archive_event', filePath, sheetName, rowNumber, BLOCKS.endEpochMsg.name, row, {
      eventId: intNumber(row.archive_eid),
      reason: 'sc_end_epoch',
      scEndEpoch: true,
    }));
  }
}

function parseCarryBlocks(filePath, sheetName, ws, rowNumber, actions, carry) {
  const finalize = readBlockRow(ws, BLOCKS.tryFinalize, rowNumber);
  if (hasAny(finalize, ['source', 'id', 'winner_option', 'destination', 'amount', 'tick', 'tx'])) {
    if (required(finalize, ['source', 'id', 'winner_option', 'tick', 'tx'])) {
      carry.finalize = { ...finalize };
      actions.push(action('finalize_event', filePath, sheetName, rowNumber, BLOCKS.tryFinalize.name, finalize, {
        eventId: intNumber(finalize.id),
        winnerOption: intNumber(finalize.winner_option),
      }));
    }

    const inheritedFinalize = { ...(carry.finalize || {}), ...Object.fromEntries(Object.entries(finalize).filter(([, value]) => value !== '')) };
    if (finalize.id) {
      carry.finalize = { ...(carry.finalize || {}), id: finalize.id, winner_option: finalize.winner_option || carry.finalize?.winner_option };
    }

    if (carry.finalize && finalize.destination && finalize.amount && required(inheritedFinalize, ['id'])) {
      const payoutRow = {
        ...(carry.finalize || {}),
        ...inheritedFinalize,
        destination: finalize.destination,
        amount: finalize.amount,
      };
      actions.push(action('transfer', filePath, sheetName, rowNumber, BLOCKS.tryFinalize.name, payoutRow, {
        source: QUOTTERY_IDENTITY,
        destination: normalizeIdentity(payoutRow.destination),
        amount: intString(payoutRow.amount),
        token: 'GARTH',
        eventId: intNumber(payoutRow.id),
        reason: 'finalize_return',
      }));
      actions.push(action('ignored', filePath, sheetName, rowNumber, `${BLOCKS.tryFinalize.name}_SYSTEM_ORDER_CLOSE`, payoutRow, {
        eventId: intNumber(payoutRow.id),
        destination: normalizeIdentity(payoutRow.destination),
        amount: intString(payoutRow.amount),
        closeSystemOrders: true,
      }));
    }
  }

  const clean = readBlockRow(ws, BLOCKS.cleanMemory, rowNumber);
  if (hasAny(clean, ['archive_eid', 'destination', 'amount', 'tick', 'tx'])) {
    if (clean.tick || clean.tx || clean.time) {
      carry.cleanMemory = {
        ...(carry.cleanMemory || {}),
        source: clean.source || carry.cleanMemory?.source || '',
        tick: clean.tick || carry.cleanMemory?.tick || '',
        time: clean.time || carry.cleanMemory?.time || '',
        tx: clean.tx || carry.cleanMemory?.tx || '',
      };
    }

    if (clean.archive_eid) {
      carry.cleanMemory = { ...(carry.cleanMemory || {}), archive_eid: clean.archive_eid };
    }

    const archiveRow = { ...(carry.cleanMemory || {}), archive_eid: clean.archive_eid || carry.cleanMemory?.archive_eid || '' };
    if (clean.archive_eid && archiveRow.tick) {
      actions.push(action('archive_event', filePath, sheetName, rowNumber, BLOCKS.cleanMemory.name, archiveRow, {
        eventId: intNumber(archiveRow.archive_eid),
        reason: 'clean_memory',
      }));
    }

    if (carry.cleanMemory && clean.destination && clean.amount && archiveRow.archive_eid) {
      const payoutRow = {
        ...(carry.cleanMemory || {}),
        archive_eid: archiveRow.archive_eid,
        destination: clean.destination,
        amount: clean.amount,
      };
      actions.push(action('transfer', filePath, sheetName, rowNumber, BLOCKS.cleanMemory.name, payoutRow, {
        source: QUOTTERY_IDENTITY,
        destination: normalizeIdentity(payoutRow.destination),
        amount: intString(payoutRow.amount),
        token: 'GARTH',
        eventId: intNumber(payoutRow.archive_eid),
        reason: 'clean_memory_payout',
      }));
    }
  }
}

function orderUid(owner, eventId, option, side, price, txHash) {
  return [owner, eventId, option, side, price, txHash || 'historical'].join(':');
}

function importUid(actionItem) {
  return [
    actionItem.meta.sourceFile,
    actionItem.meta.sheetName,
    actionItem.meta.rowNumber,
    actionItem.meta.blockName,
    actionItem.txHash || 'no_tx',
    actionItem.kind,
  ].join(':');
}

async function upsertAccount(client, identity, tick = null) {
  if (!identity) return;
  await client.query(`
    INSERT INTO accounts(identity, first_seen_tick, last_seen_tick)
    VALUES ($1,$2,$2)
    ON CONFLICT (identity) DO UPDATE SET
      first_seen_tick = LEAST(COALESCE(accounts.first_seen_tick, EXCLUDED.first_seen_tick), COALESCE(EXCLUDED.first_seen_tick, accounts.first_seen_tick)),
      last_seen_tick = GREATEST(COALESCE(accounts.last_seen_tick, 0), COALESCE(EXCLUDED.last_seen_tick, 0)),
      updated_at = now()
  `, [identity, tick]);
}

async function saveAuditRow(client, actionItem) {
  await client.query(`
    INSERT INTO historical_import_rows(import_uid, source_file, sheet_name, row_number, block_name, tx_hash, tick, parsed)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (import_uid) DO UPDATE SET
      tx_hash = EXCLUDED.tx_hash,
      tick = EXCLUDED.tick,
      parsed = EXCLUDED.parsed,
      imported_at = now()
  `, [
    importUid(actionItem),
    actionItem.meta.sourceFile,
    actionItem.meta.sheetName,
    actionItem.meta.rowNumber,
    actionItem.meta.blockName,
    actionItem.txHash || null,
    actionItem.tick || null,
    actionItem,
  ]);
}

async function saveRawTx(client, item, inputType = null) {
  if (!item.txHash) return;
  await upsertAccount(client, item.txFrom, item.tick);
  await client.query(`
    INSERT INTO raw_transactions(tx_hash, epoch, tick, tx_timestamp, tx_from, tx_to, amount, input_type, input_size, input_data, executed, raw)
    VALUES ($1,$2,$3,$4,$5,$6,0,$7,0,'',true,$8)
    ON CONFLICT (tx_hash) DO UPDATE SET
      epoch = COALESCE(raw_transactions.epoch, EXCLUDED.epoch),
      tick = COALESCE(raw_transactions.tick, EXCLUDED.tick),
      tx_timestamp = COALESCE(raw_transactions.tx_timestamp, EXCLUDED.tx_timestamp),
      tx_from = COALESCE(raw_transactions.tx_from, EXCLUDED.tx_from),
      tx_to = COALESCE(raw_transactions.tx_to, EXCLUDED.tx_to),
      input_type = COALESCE(raw_transactions.input_type, EXCLUDED.input_type),
      raw = raw_transactions.raw || EXCLUDED.raw
  `, [
    item.txHash,
    item.epoch,
    item.tick,
    item.txTimestamp,
    item.txFrom || null,
    QUOTTERY_IDENTITY,
    inputType,
    { historical: item },
  ]);
}

async function saveEvent(client, item) {
  await saveRawTx(client, item, 1);
  await upsertAccount(client, item.creator, item.tick);
  await client.query(`
    INSERT INTO events(event_id, creator, description, option0, option1, open_date, end_date, created_tick, created_tx_hash, created_tx_timestamp, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending')
    ON CONFLICT (event_id) DO UPDATE SET
      creator = COALESCE(events.creator, EXCLUDED.creator),
      description = COALESCE(EXCLUDED.description, events.description),
      option0 = COALESCE(EXCLUDED.option0, events.option0),
      option1 = COALESCE(EXCLUDED.option1, events.option1),
      open_date = COALESCE(events.open_date, EXCLUDED.open_date),
      end_date = COALESCE(EXCLUDED.end_date, events.end_date),
      created_tick = COALESCE(events.created_tick, EXCLUDED.created_tick),
      created_tx_hash = COALESCE(events.created_tx_hash, EXCLUDED.created_tx_hash),
      created_tx_timestamp = COALESCE(events.created_tx_timestamp, EXCLUDED.created_tx_timestamp),
      updated_at = now()
  `, [
    item.eventId,
    item.creator || null,
    item.description,
    item.option0,
    item.option1,
    item.txTimestamp,
    item.endDate,
    item.tick,
    item.txHash || null,
    item.txTimestamp,
  ]);
}

async function saveOrder(client, item) {
  await saveRawTx(client, item, item.side === 'ask' ? 2 : 4);
  await upsertAccount(client, item.owner, item.tick);
  const uid = orderUid(item.owner, item.eventId, item.option, item.side, item.price, item.txHash);
  await client.query(`
    INSERT INTO orders(order_uid, owner, event_id, option, side, original_amount, open_amount, price, status, created_tick, created_tx_hash, created_tx_timestamp)
    VALUES ($1,$2,$3,$4,$5,$6,$6,$7,'open',$8,$9,$10)
    ON CONFLICT (order_uid) DO NOTHING
  `, [uid, item.owner, item.eventId, item.option, item.side, item.amount, item.price, item.tick, item.txHash || null, item.txTimestamp]);

  await client.query(`
    INSERT INTO order_events(order_event_uid, order_uid, owner, event_id, option, side, action, amount, price, tick, tx_timestamp, tx_hash, details)
    VALUES ($1,$2,$3,$4,$5,$6,'created',$7,$8,$9,$10,$11,$12)
    ON CONFLICT (order_event_uid) DO NOTHING
  `, [`historical:order_added:${uid}`, uid, item.owner, item.eventId, item.option, item.side, item.amount, item.price, item.tick, item.txTimestamp, item.txHash || null, item]);

  if (item.side === 'ask') {
    await applyPositionDelta(client, item.owner, item.eventId, item.option, `-${item.amount}`, item.amount, '0', item.price, 'ask_locked', item);
  }
}

async function reduceOrder(client, item, status = 'matched', priceMode = 'exact') {
  const mode = priceMode === true ? 'exact' : priceMode === false ? 'any' : priceMode;
  const params = [item.owner, item.eventId, item.option, item.side];
  let priceSql = '';
  if (mode === 'exact' && item.price !== null && item.price !== undefined) {
    params.push(item.price);
    priceSql = ` AND price = $${params.length}::numeric`;
  } else if (mode === 'compatible' && item.price !== null && item.price !== undefined) {
    params.push(item.price);
    priceSql = ` AND (($4 = 'bid' AND price >= $${params.length}::numeric) OR ($4 = 'ask' AND price <= $${params.length}::numeric))`;
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
  `, [...params, mode, item.txHash || null]);

  const row = result.rows[0];
  if (!row) {
    const syntheticOrderUid = status === 'matched'
      ? `historical:synthetic_order_matched:${item.txHash || 'no_tx'}:${item.owner}:${item.eventId}:${item.option}:${item.side}:${item.amount}:${item.price || 'no_price'}:${item.meta.rowNumber}`
      : null;

    if (syntheticOrderUid) {
      await client.query(`
        INSERT INTO orders(
          order_uid, owner, event_id, option, side, original_amount, open_amount, price,
          status, created_tick, closed_tick, created_tx_hash, closed_tx_hash, created_tx_timestamp, closed_tx_timestamp
        )
        VALUES ($1,$2,$3,$4,$5,$6,0,$7,'matched',$8,$8,$9,$9,$10,$10)
        ON CONFLICT (order_uid) DO NOTHING
      `, [
        syntheticOrderUid,
        item.owner,
        item.eventId,
        item.option,
        item.side,
        item.amount,
        item.price || '0',
        item.tick,
        item.txHash || null,
        item.txTimestamp,
      ]);
    }

    await client.query(`
      INSERT INTO order_events(order_event_uid, order_uid, owner, event_id, option, side, action, amount, price, tick, tx_timestamp, tx_hash, details)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (order_event_uid) DO NOTHING
    `, [
      `historical:missing_order:${item.txHash || 'no_tx'}:${item.owner}:${item.eventId}:${item.option}:${item.side}:${item.amount}:${status}`,
      syntheticOrderUid,
      item.owner,
      item.eventId,
      item.option,
      item.side,
      `missing_${status}`,
      item.amount,
      item.price || null,
      item.tick,
      item.txTimestamp,
      item.txHash || null,
      { ...item, syntheticOrderUid },
    ]);
    return null;
  }

  let remaining = BigInt(String(item.amount || '0').split('.')[0]);
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
          status = CASE WHEN $2::numeric = 0 THEN $6::text ELSE 'partially_matched' END,
          closed_tick = CASE WHEN $2::numeric = 0 THEN $3::bigint ELSE closed_tick END,
          closed_tx_hash = CASE WHEN $2::numeric = 0 THEN $4::text ELSE closed_tx_hash END,
          closed_tx_timestamp = CASE WHEN $2::numeric = 0 THEN $5::timestamptz ELSE closed_tx_timestamp END,
          updated_at = now()
      WHERE order_uid = $1
    `, [openOrder.order_uid, nextOpen.toString(), item.tick, item.txHash || null, item.txTimestamp, status]);

    await client.query(`
      INSERT INTO order_events(order_event_uid, order_uid, owner, event_id, option, side, action, amount, price, tick, tx_timestamp, tx_hash, details)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (order_event_uid) DO NOTHING
    `, [
      `historical:order_${status}:${item.txHash || 'no_tx'}:${openOrder.order_uid}:${usedAmount.toString()}`,
      openOrder.order_uid,
      item.owner,
      item.eventId,
      item.option,
      item.side,
      status,
      usedAmount.toString(),
      item.price || null,
      item.tick,
      item.txTimestamp,
      item.txHash || null,
      { ...item, requestedAmount: item.amount },
    ]);
  }

  return lastOrderUid || row.order_uid;
}

async function saveOrderRemoval(client, item) {
  await saveRawTx(client, item, item.side === 'ask' ? 3 : 5);
  await upsertAccount(client, item.owner, item.tick);
  await reduceOrder(client, item, item.status || 'removed_by_user', true);
  if (item.side === 'ask') {
    await applyPositionDelta(client, item.owner, item.eventId, item.option, item.amount, `-${item.amount}`, '0', item.price, 'ask_unlocked', item);
  }
}

function tradeReduceItems(item) {
  const { trade } = item;
  return trade.legs.map((leg) => ({
    ...item,
    owner: leg.address,
    option: leg.option,
    side: leg.side === 'buy' ? 'bid' : 'ask',
    price: leg.price,
    amount: item.amount,
  }));
}

async function saveTrade(client, item) {
  await saveRawTx(client, item, null);
  await upsertAccount(client, item.address1, item.tick);
  await upsertAccount(client, item.address2, item.tick);
  await upsertAccount(client, item.trade.taker, item.tick);
  await upsertAccount(client, item.trade.maker, item.tick);

  const uid = `historical:trade:${item.txHash || 'no_tx'}:${item.meta.sheetName}:${item.meta.rowNumber}:${item.scenario}`;
  await client.query(`
    INSERT INTO trades(
      trade_uid, event_id, match_type, option, address_a, address_b,
      taker, maker, taker_side, maker_side, taker_option, maker_option, taker_price, maker_price,
      amount, price0, price1, tick, tx_timestamp, tx_hash, raw
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
    ON CONFLICT (trade_uid) DO UPDATE SET
      taker = EXCLUDED.taker,
      maker = EXCLUDED.maker,
      taker_side = EXCLUDED.taker_side,
      maker_side = EXCLUDED.maker_side,
      taker_option = EXCLUDED.taker_option,
      maker_option = EXCLUDED.maker_option,
      taker_price = EXCLUDED.taker_price,
      maker_price = EXCLUDED.maker_price,
      raw = EXCLUDED.raw
  `, [
    uid,
    item.eventId,
    item.trade.matchType,
    item.trade.option,
    item.address1,
    item.address2,
    item.trade.taker || null,
    item.trade.maker || null,
    item.trade.takerSide,
    item.trade.makerSide,
    item.trade.takerOption,
    item.trade.makerOption,
    item.trade.takerPrice,
    item.trade.makerPrice,
    item.amount,
    item.trade.price0,
    item.trade.price1,
    item.tick,
    item.txTimestamp,
    item.txHash || null,
    item,
  ]);

  for (const reduceItem of tradeReduceItems(item)) {
    const priceMode = reduceItem.owner === item.trade.taker ? 'compatible' : 'exact';
    await reduceOrder(client, reduceItem, 'matched', priceMode);
  }

  for (const leg of item.trade.legs) {
    if (!leg.address) continue;
    if (leg.side === 'buy') {
      await applyPositionDelta(client, leg.address, item.eventId, leg.option, item.amount, '0', '0', leg.price, 'bid_matched', item);
    } else {
      await applyPositionDelta(client, leg.address, item.eventId, leg.option, '0', `-${item.amount}`, '0', leg.price, 'ask_matched', item);
    }
  }
}

async function applyPositionDelta(client, owner, eventId, option, amountDelta, lockedDelta, realizedPnlDelta, price, actionName, item) {
  await upsertAccount(client, owner, item.tick);
  const saleAccounting = await positionSaleAccounting(client, { owner, eventId, option, lockedDelta, price, actionName });
  await client.query(`
    INSERT INTO positions(
      owner, event_id, option, amount, locked_amount, avg_entry_price,
      realized_trade_cost, realized_trade_pnl, settlement_pnl, realized_pnl, opened_tick
    )
    VALUES ($1,$2,$3,GREATEST($4::numeric,0),GREATEST($5::numeric,0),
      CASE WHEN $10::text = 'bid_matched' AND $4::numeric > 0 AND $7::numeric > 0 THEN $7::numeric ELSE NULL END,
      $8::numeric,$9::numeric,0,$9::numeric,$6)
    ON CONFLICT (owner, event_id, option) DO UPDATE SET
      avg_entry_price = CASE
        WHEN $10::text = 'bid_matched'
          AND $4::numeric > 0
          AND $7::numeric > 0
          AND positions.amount + positions.locked_amount + $4::numeric > 0
          THEN ((COALESCE(positions.avg_entry_price, 0) * (positions.amount + positions.locked_amount)) + ($7::numeric * $4::numeric))
            / (positions.amount + positions.locked_amount + $4::numeric)
        ELSE positions.avg_entry_price
      END,
      amount = GREATEST(positions.amount + $4::numeric, 0),
      locked_amount = GREATEST(positions.locked_amount + $5::numeric, 0),
      realized_trade_cost = positions.realized_trade_cost + $8::numeric,
      realized_trade_pnl = positions.realized_trade_pnl + $9::numeric,
      realized_pnl = positions.realized_trade_pnl + $9::numeric + positions.settlement_pnl,
      opened_tick = COALESCE(positions.opened_tick, $6),
      updated_at = now()
  `, [owner, eventId, option, amountDelta, lockedDelta, item.tick, price || '0', saleAccounting.cost, saleAccounting.pnl, actionName]);

  await client.query(`
    INSERT INTO position_events(position_event_uid, owner, event_id, option, action, amount_delta, price, tick, tx_timestamp, tx_hash, details)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (position_event_uid) DO NOTHING
  `, [
    `historical:position:${item.txHash || 'no_tx'}:${owner}:${eventId}:${option}:${actionName}:${amountDelta}:${item.meta.rowNumber}`,
    owner,
    eventId,
    option,
    actionName,
    amountDelta,
    price || null,
    item.tick,
    item.txTimestamp,
    item.txHash || null,
    { lockedDelta, realizedTradeCostDelta: saleAccounting.cost, realizedTradePnlDelta: saleAccounting.pnl, source: item.meta },
  ]);
}

async function positionSaleAccounting(client, delta) {
  if (delta.actionName !== 'ask_matched') return { cost: '0', pnl: '0' };
  const lockedText = String(delta.lockedDelta || '0');
  const soldAmount = intString(lockedText.startsWith('-') ? lockedText.slice(1) : lockedText);
  if (soldAmount === '0') return { cost: '0', pnl: '0' };

  const result = await client.query(`
    SELECT
      ($4::numeric * COALESCE(avg_entry_price, $5::numeric))::text AS cost,
      ($4::numeric * ($5::numeric - COALESCE(avg_entry_price, $5::numeric)))::text AS pnl
    FROM positions
    WHERE owner = $1 AND event_id = $2 AND option = $3
  `, [delta.owner, delta.eventId, delta.option, soldAmount, intString(delta.price)]);

  return {
    cost: result.rows[0]?.cost || multiply(soldAmount, intString(delta.price)),
    pnl: result.rows[0]?.pnl || '0',
  };
}

async function saveEventState(client, item, state) {
  const result = state === 'published' ? item.winnerOption : item.winnerOption;
  const columns = state === 'published'
    ? ['result_tick', 'result_tx_hash', 'result_tx_timestamp']
    : ['finalized_tick', 'closed_tx_hash', 'finalized_tx_timestamp'];
  await saveRawTx(client, item, state === 'published' ? 6 : 7);
  await client.query(`
    INSERT INTO events(event_id, result, status, ${columns[0]}, ${columns[2]}, win_payout_per_share, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,now())
    ON CONFLICT (event_id) DO UPDATE SET
      result = COALESCE(EXCLUDED.result, events.result),
      status = $3,
      ${columns[0]} = COALESCE(events.${columns[0]}, EXCLUDED.${columns[0]}),
      ${columns[2]} = COALESCE(events.${columns[2]}, EXCLUDED.${columns[2]}),
      win_payout_per_share = COALESCE(events.win_payout_per_share, EXCLUDED.win_payout_per_share),
      updated_at = now()
  `, [item.eventId, result, state, item.tick, item.txTimestamp, DEFAULT_WIN_PAYOUT_PER_SHARE]);

  if (state === 'finalized') {
    await client.query(`
      UPDATE positions
      SET status = CASE WHEN option = $2 THEN 'win' ELSE 'lose' END,
          amount = amount + locked_amount,
          locked_amount = 0,
          closed_tick = COALESCE(closed_tick, $3),
          updated_at = now()
      WHERE event_id = $1
    `, [item.eventId, item.winnerOption, item.tick]);
  }
}

async function archiveEvent(client, item) {
  const scEndEpoch = Boolean(item.scEndEpoch || item.reason === 'sc_end_epoch');
  await client.query(`
    INSERT INTO events(event_id, status, archived_tick, archived_tx_timestamp, archived_sc_end_epoch, updated_at)
    VALUES ($1,'archived',$2,$3,$4,now())
    ON CONFLICT (event_id) DO UPDATE SET
      status = 'archived',
      archived_tick = COALESCE(events.archived_tick, EXCLUDED.archived_tick),
      archived_tx_timestamp = COALESCE(events.archived_tx_timestamp, EXCLUDED.archived_tx_timestamp),
      archived_sc_end_epoch = events.archived_sc_end_epoch OR EXCLUDED.archived_sc_end_epoch,
      updated_at = now()
  `, [item.eventId, item.tick, item.txTimestamp, scEndEpoch]);

  await client.query(`
    UPDATE orders
    SET status = 'removed_by_system',
        closed_tick = COALESCE(closed_tick, $2),
        closed_tx_hash = COALESCE(closed_tx_hash, $3),
        closed_tx_timestamp = COALESCE(closed_tx_timestamp, $4),
        open_amount = 0,
        updated_at = now()
    WHERE event_id = $1 AND status IN ('open', 'partially_matched')
  `, [item.eventId, item.tick, item.txHash || null, item.txTimestamp]);

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
  `, [item.eventId, item.tick]);
}

async function saveTransfer(client, item) {
  if (!['GARTH', 'QTRYGOV'].includes(item.token)) return;
  const scEndEpoch = Boolean(item.scEndEpoch || item.reason === 'sc_end_epoch');
  await saveRawTx(client, item, item.reason === 'user_transfer' ? null : null);
  await upsertAccount(client, item.source, item.tick);
  await upsertAccount(client, item.destination, item.tick);
  const uid = `historical:transfer:${item.reason}:${item.txHash || 'no_tx'}:${item.source}:${item.destination}:${item.amount}:${item.token}:${item.meta.rowNumber}`;
  await client.query(`
    INSERT INTO transfers(transfer_uid, token, source, destination, amount, direction, reason, event_id, tick, tx_timestamp, tx_hash, sc_end_epoch, raw)
    VALUES ($1,$2,$3,$4,$5,NULL,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (transfer_uid) DO UPDATE SET
      reason = EXCLUDED.reason,
      event_id = EXCLUDED.event_id,
      sc_end_epoch = transfers.sc_end_epoch OR EXCLUDED.sc_end_epoch,
      raw = EXCLUDED.raw
  `, [uid, item.token, item.source || null, item.destination || null, item.amount, item.reason, item.eventId || null, item.tick, item.txTimestamp, item.txHash || null, scEndEpoch, item]);
}

async function savePayout(client, item) {
  if (item.token !== 'GARTH') return;
  const owner = item.destination || item.owner;
  const scEndEpoch = Boolean(item.scEndEpoch || item.reason === 'sc_end_epoch');
  await saveRawTx(client, item, null);
  await upsertAccount(client, owner, item.tick);
  const uid = `historical:payout:${item.reason}:${item.txHash || 'no_tx'}:${owner}:${item.eventId || 'no_event'}:${item.amount}:${item.meta.rowNumber}`;
  await client.query(`
    INSERT INTO payouts(payout_uid, owner, event_id, token, amount, reason, tick, tx_timestamp, tx_hash, sc_end_epoch, raw)
    VALUES ($1,$2,$3,'GARTH',$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (payout_uid) DO UPDATE SET
      amount = EXCLUDED.amount,
      reason = EXCLUDED.reason,
      sc_end_epoch = payouts.sc_end_epoch OR EXCLUDED.sc_end_epoch,
      raw = EXCLUDED.raw
  `, [uid, owner || null, item.eventId || null, item.amount, item.reason, item.tick, item.txTimestamp, item.txHash || null, scEndEpoch, item]);
}

async function candidateHistoricalScEndEpochEventIds(client, transfer) {
  const result = await client.query(`
    SELECT DISTINCT e.event_id
    FROM events e
    WHERE e.archived_sc_end_epoch = true
      AND e.archived_tick = $1
    ORDER BY e.event_id
  `, [transfer.tick]);

  return result.rows.map((row) => Number(row.event_id)).filter(Number.isFinite);
}

async function resolveHistoricalScEndEpochPayouts(client) {
  const transfers = await client.query(`
    SELECT *
    FROM transfers
    WHERE sc_end_epoch = true
      AND reason = 'sc_end_epoch'
      AND token = 'GARTH'
      AND source = $1
      AND destination IS NOT NULL
      AND event_id IS NULL
    ORDER BY tick ASC, transfer_uid ASC
  `, [QUOTTERY_IDENTITY]);

  let matched = 0;
  for (const transfer of transfers.rows) {
    const eventIds = await candidateHistoricalScEndEpochEventIds(client, transfer);
    if (!eventIds.length) continue;

    const candidates = await client.query(`
      SELECT
        p.event_id,
        (p.amount * e.win_payout_per_share) - COALESCE((
          SELECT sum(py.amount)
          FROM payouts py
          WHERE py.owner = p.owner
            AND py.event_id = p.event_id
            AND py.sc_end_epoch = true
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
    if (!match) continue;

    await client.query(`
      UPDATE transfers
      SET event_id = $2,
          raw = raw || $3::jsonb
      WHERE transfer_uid = $1
    `, [transfer.transfer_uid, match.event_id, { matchedEventId: Number(match.event_id), matchedBy: 'historical_sc_end_epoch' }]);

    await client.query(`
      INSERT INTO payouts(payout_uid, owner, event_id, token, amount, reason, tick, tx_timestamp, tx_hash, sc_end_epoch, raw)
      VALUES ($1,$2,$3,'GARTH',$4,'sc_end_epoch',$5,$6,$7,true,$8)
      ON CONFLICT (payout_uid) DO UPDATE SET
        amount = EXCLUDED.amount,
        event_id = EXCLUDED.event_id,
        sc_end_epoch = true,
        tx_timestamp = COALESCE(payouts.tx_timestamp, EXCLUDED.tx_timestamp),
        tx_hash = COALESCE(payouts.tx_hash, EXCLUDED.tx_hash),
        raw = EXCLUDED.raw
    `, [
      `historical:sc_end_epoch:payout:${transfer.transfer_uid}`,
      transfer.destination,
      match.event_id,
      transfer.amount,
      transfer.tick,
      transfer.tx_timestamp || null,
      transfer.tx_hash || null,
      transfer.raw,
    ]);
    matched += 1;
  }

  if (matched) console.log(`Matched ${matched} historical sc_end_epoch payouts`);
  return matched;
}

async function closeSystemOrdersForReturn(client, item) {
  if (!item.closeSystemOrders || !item.destination || !item.eventId) return;
  let remaining = BigInt(intString(item.amount, '0'));
  const result = await client.query(`
    SELECT order_uid, owner, event_id, option, side, open_amount, price
    FROM orders
    WHERE owner = $1 AND event_id = $2 AND status IN ('open', 'partially_matched')
    ORDER BY CASE WHEN side = 'bid' THEN 0 ELSE 1 END, created_tick ASC
  `, [item.destination, item.eventId]);

  for (const order of result.rows) {
    if (remaining <= 0n) break;
    const orderValue = order.side === 'bid'
      ? BigInt(intString(order.open_amount)) * BigInt(intString(order.price))
      : BigInt(intString(order.open_amount)) * WIN_PAYOUT_PER_SHARE;
    const closeAmount = intString(order.open_amount);
    await reduceOrder(client, {
      ...item,
      owner: order.owner,
      eventId: order.event_id,
      option: order.option,
      side: order.side,
      price: order.price,
      amount: closeAmount,
    }, 'removed_by_system', false);
    remaining -= orderValue || WHOLE_PRICE;
  }
}

function multiply(a, b) {
  return (BigInt(intString(a)) * BigInt(intString(b))).toString();
}

async function refreshStats(client) {
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

async function refreshPositionStatuses(client) {
  await client.query(`
    UPDATE positions p
    SET status = CASE WHEN p.option = e.result THEN 'win' ELSE 'lose' END,
        amount = p.amount + p.locked_amount,
        locked_amount = 0,
        closed_tick = COALESCE(p.closed_tick, COALESCE(e.finalized_tick, e.archived_tick, e.result_tick)),
        updated_at = now()
    FROM events e
    WHERE e.event_id = p.event_id
      AND e.result IS NOT NULL
      AND (e.status IN ('published', 'finalized', 'archived') OR e.finalized_tick IS NOT NULL OR e.archived_tick IS NOT NULL)
  `);

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

async function clearTables(client) {
  await client.query(`
    TRUNCATE TABLE
      historical_import_rows,
      account_stats,
      position_events,
      positions,
      payouts,
      transfers,
      trades,
      order_events,
      orders,
      events,
      raw_logs,
      raw_transactions,
      accounts,
      indexer_state
    RESTART IDENTITY CASCADE
  `);
}

async function saveHistoricalIndexerState(client, actions) {
  const latest = actions.reduce((acc, item) => {
    const tick = Number(item.tick || 0);
    if (!Number.isFinite(tick) || tick <= 0 || tick < acc.tick) return acc;
    return {
      tick,
      epoch: Number(item.epoch || 0) || acc.epoch || null,
    };
  }, { tick: 0, epoch: null });

  if (!latest.tick) return;

  await client.query(`
    INSERT INTO indexer_state(key, value, updated_at)
    VALUES ('quottery:last_tick', $1, now())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = now()
  `, [{ tick: latest.tick, epoch: latest.epoch, source: 'historical_import' }]);
}

async function applyAction(client, item) {
  await saveAuditRow(client, item);
  if (item.kind === 'create_event') await saveEvent(client, item);
  else if (item.kind === 'add_order') await saveOrder(client, item);
  else if (item.kind === 'remove_order') await saveOrderRemoval(client, item);
  else if (item.kind === 'trade') await saveTrade(client, item);
  else if (item.kind === 'publish_result') await saveEventState(client, item, 'published');
  else if (item.kind === 'finalize_event') await saveEventState(client, item, 'finalized');
  else if (item.kind === 'archive_event') await archiveEvent(client, item);
  else if (item.kind === 'claim_reward') await savePayout(client, { ...item, source: QUOTTERY_IDENTITY, token: 'GARTH', reason: 'user_claim_reward' });
  else if (item.kind === 'transfer' && item.reason === 'clean_memory_payout') await savePayout(client, item);
  else if (item.kind === 'transfer' && item.reason === 'finalize_return') return;
  else if (item.kind === 'transfer') await saveTransfer(client, item);
  else if (item.closeSystemOrders) await closeSystemOrdersForReturn(client, item);
}

function summarize(actions) {
  return actions.reduce((acc, item) => {
    acc[item.kind] = (acc[item.kind] || 0) + 1;
    return acc;
  }, {});
}

async function main() {
  const args = parseArgs(process.argv);
  const actions = parseWorkbook(args.file, args);
  const summary = summarize(actions);
  console.log(`Loaded ${actions.length} historical actions from ${args.file}`);
  console.log(summary);

  if (args.dryRun) return;

  await withTransaction(async (client) => {
    if (args.clear) await clearTables(client);
    for (const item of actions) await applyAction(client, item);
    await refreshPositionStatuses(client);
    await resolveHistoricalScEndEpochPayouts(client);
    await refreshPositionStatuses(client);
    await refreshStats(client);
    await saveHistoricalIndexerState(client, actions);
  });

  console.log('Historical import complete');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closePool);
