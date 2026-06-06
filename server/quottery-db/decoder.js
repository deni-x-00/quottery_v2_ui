const {
  EVENT_RESULT_DEPOSIT,
  GARTH_ASSET_NAME,
  GAME_OPERATOR,
  INPUT_TYPES,
  LOG_TYPES,
  QTRYGOV_ASSET_NAME,
  QUOTTERY_IDENTITY,
  QUOTTERY_SC_INDEX,
  SC_LOG_TYPES,
} = require('./constants');
const { normalizeIdentity, pubkeyToIdentity } = require('./identity');

function stripHexPrefix(value) {
  return String(value || '').replace(/^0x/i, '');
}

function hexToBuffer(value) {
  const hex = stripHexPrefix(value);
  if (!hex || hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
    return Buffer.alloc(0);
  }
  return Buffer.from(hex, 'hex');
}

function readUInt64(buffer, offset) {
  if (offset + 8 > buffer.length) return null;
  return buffer.readBigUInt64LE(offset).toString();
}

function readInt64(buffer, offset) {
  if (offset + 8 > buffer.length) return null;
  return buffer.readBigInt64LE(offset).toString();
}

function readSmallNumber(buffer, offset) {
  const value = readUInt64(buffer, offset);
  return value === null ? null : Number(value);
}

function decodeAscii(buffer) {
  return buffer.toString('ascii').replace(/\0.*$/g, '').trim();
}

function decodeQtryDate(buffer) {
  if (buffer.length < 8) return null;
  const value = buffer.readBigUInt64LE(0);
  if (value === 0n || value === 1n) return null;

  const year = Number(value >> 46n);
  const month = Number((value >> 42n) & 0xfn);
  const day = Number((value >> 37n) & 0x1fn);
  const hour = Number((value >> 32n) & 0x1fn);
  const minute = Number((value >> 26n) & 0x3fn);
  const second = Number((value >> 20n) & 0x3fn);

  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}Z`;
}

function normalizeTimestamp(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return normalizeTimestamp(Number(value));
  }
  if (typeof value === 'string' && /^\d{2}-\d{2}-\d{2}/.test(value)) {
    return null;
  }
  if (typeof value === 'number') {
    const seconds = value > 1_000_000_000_000 ? value / 1000 : value;
    return new Date(seconds * 1000).toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeTx(tx, tickContext = {}) {
  return {
    hash: tx.hash || tx.txHash || tx.transactionHash || '',
    from: normalizeIdentity(tx.from || tx.source || tx.sourcePublicKey),
    to: normalizeIdentity(tx.to || tx.destination || tx.destinationPublicKey),
    amount: String(tx.amount ?? 0),
    inputType: Number(tx.inputType ?? tx.type ?? 0),
    inputSize: Number(tx.inputSize ?? 0),
    inputData: stripHexPrefix(tx.inputData || tx.payload || ''),
    executed: tx.executed !== false,
    tick: Number(tx.tick ?? tx.tickNumber ?? tickContext.tick ?? 0),
    epoch: Number(tx.epoch ?? tickContext.epoch ?? 0) || null,
    timestamp: normalizeTimestamp(tx.timestamp || tx.timestampISO || tickContext.timestamp),
    raw: tx,
  };
}

function normalizeLog(log, tickContext = {}) {
  const body = log.body || {};
  const logType = Number(log.type ?? log.logType ?? log.log_type ?? body.logType ?? 0);
  const scLogType = Number(
    body.scLogType
    ?? body.contractLogType
    ?? log.scLogType
    ?? log.contractLogType
    ?? log.contractMessageType
    ?? 0
  ) || null;
  const scIndex = Number(
    body.scIndex
    ?? body.contractIndex
    ?? log.scIndex
    ?? log.contractIndex
    ?? QUOTTERY_SC_INDEX
  ) || null;

  const normalizedBody = { ...body };
  if (!normalizedBody.content) {
    normalizedBody.content = stripHexPrefix(
      body.rawData
      || log.rawData
      || log.data
      || log.extraData
      || log.content
      || ''
    );
  }

  return {
    logUid: String(log.logUid || log.uid || `${tickContext.tick || log.tick || 'tick'}:${log.logId ?? log.index ?? log.position ?? tickContext.logIndex ?? 0}`),
    txHash: log.txHash || log.hash || log.transactionHash || tickContext.txHash || null,
    epoch: Number(log.epoch ?? tickContext.epoch ?? 0) || null,
    tick: Number(log.tick ?? log.tickNumber ?? tickContext.tick ?? 0),
    logId: log.logId ?? log.id ?? null,
    logType,
    scIndex,
    scLogType,
    timestamp: normalizeTimestamp(log.timestamp || log.timestampISO || tickContext.timestamp),
    body: normalizedBody,
    raw: log,
  };
}

function isQuotteryTx(tx) {
  return normalizeIdentity(tx.to) === normalizeIdentity(QUOTTERY_IDENTITY);
}

function isQuotteryScLog(log) {
  return log.logType === LOG_TYPES.SC_INFO
    && Number(log.scIndex) === QUOTTERY_SC_INDEX
    && log.scLogType;
}

function isTokenTransferTx(tx) {
  return [INPUT_TYPES.TRANSFER_QUSD, INPUT_TYPES.TRANSFER_QTRYGOV].includes(Number(tx?.inputType));
}

function quTransferIdentity(body, ...keys) {
  for (const key of keys) {
    const value = normalizeIdentity(body?.[key]);
    if (value) return value;
  }
  return '';
}

function quTransferAmount(body) {
  return String(body?.amount ?? body?.value ?? body?.numberOfShares ?? 0);
}

function isResultDepositTransfer(log, txHash, mode) {
  if (!log || log.logType !== LOG_TYPES.QU_TRANSFER) return false;
  if (txHash && log.txHash && log.txHash !== txHash) return false;

  const body = { ...(log.raw?.body || {}), ...(log.body || {}) };
  if (quTransferAmount(body) !== EVENT_RESULT_DEPOSIT) return false;

  const operator = normalizeIdentity(GAME_OPERATOR);
  if (mode === 'publish') {
    const from = quTransferIdentity(body, 'from', 'source', 'sourcePublicKey');
    return from === operator;
  }

  if (mode === 'finalize') {
    const to = quTransferIdentity(body, 'to', 'destination', 'destinationPublicKey');
    return to === operator;
  }

  return false;
}

function hasResultDepositTransfer(logs, txHash, mode) {
  return logs.some((log) => isResultDepositTransfer(log, txHash, mode));
}

function decodeEventInput(tx) {
  const buffer = hexToBuffer(tx.inputData);
  if (buffer.length < 280) return null;

  return {
    eventId: readSmallNumber(buffer, 0),
    openDate: decodeQtryDate(buffer.subarray(8, 16)),
    endDate: decodeQtryDate(buffer.subarray(16, 24)),
    description: decodeAscii(buffer.subarray(24, 150)),
    option0: decodeAscii(buffer.subarray(152, 216)),
    option1: decodeAscii(buffer.subarray(216, 280)),
  };
}

function decodeOrderInput(tx) {
  const buffer = hexToBuffer(tx.inputData);
  if (buffer.length < 32) return null;

  return {
    eventId: readSmallNumber(buffer, 0),
    option: readSmallNumber(buffer, 8),
    amount: readUInt64(buffer, 16),
    price: readUInt64(buffer, 24),
  };
}

function decodeEventOptionInput(tx) {
  const buffer = hexToBuffer(tx.inputData);
  if (buffer.length < 16) return null;
  return {
    eventId: readSmallNumber(buffer, 0),
    option: readSmallNumber(buffer, 8),
  };
}

function decodeEventIdInput(tx) {
  const buffer = hexToBuffer(tx.inputData);
  if (buffer.length < 8) return null;
  return { eventId: readSmallNumber(buffer, 0) };
}

async function decodeTradeLog(log) {
  const buffer = hexToBuffer(log.body.content);
  if (buffer.length < 112) return null;

  return {
    matchType: log.scLogType,
    addressA: await pubkeyToIdentity(buffer.subarray(0, 32)),
    addressB: await pubkeyToIdentity(buffer.subarray(32, 64)),
    eventId: readSmallNumber(buffer, 64),
    option: log.scLogType === SC_LOG_TYPES.MATCH_TYPE_0 ? 0
      : log.scLogType === SC_LOG_TYPES.MATCH_TYPE_1 ? 1
        : 2,
    amount: readInt64(buffer, 96),
    price0: readInt64(buffer, 104),
    price1: buffer.length >= 120 ? readInt64(buffer, 112) : '0',
  };
}

async function decodeAddOrderLog(log, tx, side) {
  const buffer = hexToBuffer(log.body.content);
  if (buffer.length < 112) return null;

  return {
    owner: await pubkeyToIdentity(buffer.subarray(0, 32)) || tx.from,
    eventId: readSmallNumber(buffer, 64),
    option: readSmallNumber(buffer, 72),
    amount: readInt64(buffer, 96),
    price: readInt64(buffer, 104),
    side,
  };
}

function decodeLoggerWithDataEvent(log) {
  const buffer = hexToBuffer(log.body.content);
  if (buffer.length < 32) return null;
  return {
    eventId: readSmallNumber(buffer, 16),
    option: readSmallNumber(buffer, 24),
  };
}

function decodeArchiveLog(log) {
  const buffer = hexToBuffer(log.body.content);
  if (buffer.length < 32) return null;
  return { eventId: readSmallNumber(buffer, 24) };
}

function normalizeAssetTransfer(log) {
  const body = log.body || {};
  const assetName = String(body.assetName || '').replace(/\0/g, '').trim().toUpperCase();
  if (![GARTH_ASSET_NAME, QTRYGOV_ASSET_NAME].includes(assetName)) return null;

  return {
    token: assetName,
    source: normalizeIdentity(body.sourcePublicKey || body.source || body.from),
    destination: normalizeIdentity(body.destinationPublicKey || body.destination || body.to),
    amount: String(body.numberOfShares ?? body.amount ?? 0),
  };
}

function rewardClaimTransfer(logs, tx) {
  for (const log of logs) {
    if (log.logType !== LOG_TYPES.ASSET_OWNERSHIP_CHANGE) continue;
    if (log.txHash && tx.hash && log.txHash !== tx.hash) continue;

    const transfer = normalizeAssetTransfer(log);
    if (!transfer || transfer.token !== GARTH_ASSET_NAME) continue;
    if (transfer.source !== normalizeIdentity(QUOTTERY_IDENTITY)) continue;
    if (tx.from && transfer.destination !== tx.from) continue;
    return { ...transfer, log };
  }
  return null;
}

async function decodeTickMessage(message) {
  const result = message?.params?.result || message?.result || message;
  if (!result || result.catchUpProgress || result.catchUpComplete) {
    return { control: result || null };
  }

  const tickContext = {
    epoch: Number(result.epoch || 0) || null,
    tick: Number(result.tick || result.tickNumber || 0),
    timestamp: normalizeTimestamp(result.timestamp || result.timestampISO),
    isCatchUp: Boolean(result.isCatchUp),
  };

  const transactions = (result.transactions || [])
    .map((tx) => normalizeTx(tx, tickContext))
    .filter((tx) => tx.hash)
    .filter(isQuotteryTx);

  const txByHash = new Map(transactions.map((tx) => [tx.hash, tx]));
  const txHashes = new Set(transactions.map((tx) => tx.hash));
  const logs = (result.logs || [])
    .filter((rawLog) => txHashes.has(rawLog.txHash || rawLog.transactionHash || rawLog.hash || null))
    .map((rawLog, index) => {
      const txHash = rawLog.txHash || rawLog.transactionHash || rawLog.hash || null;
      return normalizeLog(rawLog, {
        ...tickContext,
        txHash,
        tick: tickContext.tick,
        logIndex: index,
      });
    });

  for (const tx of transactions) {
    const nestedLogs = tx.raw?.logs || tx.raw?.events || tx.raw?.executionLogs || [];
    if (!Array.isArray(nestedLogs)) continue;

    for (const rawLog of nestedLogs) {
      logs.push(normalizeLog(rawLog, {
        ...tickContext,
        txHash: tx.hash,
        tick: tx.tick || tickContext.tick,
        epoch: tx.epoch || tickContext.epoch,
        logIndex: logs.length,
      }));
    }
  }

  for (const log of logs) {
    if (log.txHash && txByHash.has(log.txHash)) {
      log.tx = txByHash.get(log.txHash);
    }
  }

  const domainEvents = [];

  for (const tx of transactions) {
    if (tx.inputType === INPUT_TYPES.CREATE_EVENT) {
      // Created event id is assigned by the contract. The tx input can contain 0,
      // so the final id must be taken from the CREATED_EVENT smart-contract log.
    } else if ([INPUT_TYPES.REMOVE_ASK_ORDER, INPUT_TYPES.REMOVE_BID_ORDER].includes(tx.inputType)) {
      const order = decodeOrderInput(tx);
      if (order) {
        domainEvents.push({
          type: 'order_removed',
          tx,
          order: { ...order, owner: tx.from, side: tx.inputType === INPUT_TYPES.REMOVE_BID_ORDER ? 'bid' : 'ask' },
          status: 'removed_by_user',
        });
      }
    } else if (tx.inputType === INPUT_TYPES.PUBLISH_RESULT) {
      const event = decodeEventOptionInput(tx);
      if (event && hasResultDepositTransfer(logs, tx.hash, 'publish')) {
        domainEvents.push({ type: 'event_result_published', tx, event });
      }
    } else if (tx.inputType === INPUT_TYPES.DISPUTE) {
      const event = decodeEventIdInput(tx);
      if (event) domainEvents.push({ type: 'event_disputed', tx, event });
    } else if (tx.inputType === INPUT_TYPES.USER_CLAIM_REWARD) {
      const event = decodeEventIdInput(tx);
      const payout = rewardClaimTransfer(logs, tx);
      if (event && payout) {
        domainEvents.push({ type: 'reward_claimed', tx, log: payout.log, event: { ...event, amount: payout.amount } });
      }
    }
  }

  for (const log of logs) {
    if (isQuotteryScLog(log)) {
      if (log.scLogType === SC_LOG_TYPES.CREATED_EVENT) {
        const tx = log.tx || txByHash.get(log.txHash) || {};
        const inputEvent = tx?.hash ? decodeEventInput(tx) : null;
        if (inputEvent) {
          domainEvents.push({
            type: 'event_created',
            tx,
            log,
            event: inputEvent,
          });
        }
      } else if (log.scLogType === SC_LOG_TYPES.ADD_BID || log.scLogType === SC_LOG_TYPES.ADD_ASK) {
        const tx = log.tx || txByHash.get(log.txHash) || {};
        const order = await decodeAddOrderLog(log, tx, log.scLogType === SC_LOG_TYPES.ADD_BID ? 'bid' : 'ask');
        if (order) domainEvents.push({ type: 'order_added', tx, log, order });
      } else if (
        log.scLogType === SC_LOG_TYPES.MATCH_TYPE_0
        || log.scLogType === SC_LOG_TYPES.MATCH_TYPE_1
        || log.scLogType === SC_LOG_TYPES.MATCH_TYPE_2
        || log.scLogType === SC_LOG_TYPES.MATCH_TYPE_3
      ) {
        const trade = await decodeTradeLog(log);
        if (trade) domainEvents.push({ type: 'order_matched', tx: log.tx || {}, log, trade });
      } else if (log.scLogType === SC_LOG_TYPES.PUBLISH_RESULT) {
        const event = decodeLoggerWithDataEvent(log);
        const tx = log.tx || txByHash.get(log.txHash) || {};
        if (event && hasResultDepositTransfer(logs, log.txHash, 'publish')) {
          domainEvents.push({ type: 'event_result_published', tx, log, event });
        }
      } else if (log.scLogType === SC_LOG_TYPES.FINALIZE_EVENT) {
        const event = decodeLoggerWithDataEvent(log);
        const tx = log.tx || txByHash.get(log.txHash) || {};
        if (event && hasResultDepositTransfer(logs, log.txHash, 'finalize')) {
          domainEvents.push({ type: 'event_finalized', tx, log, event });
        }
      } else if (log.scLogType === SC_LOG_TYPES.ARCHIVE_EVENT) {
        const event = decodeArchiveLog(log);
        if (event) domainEvents.push({ type: 'event_archived', tx: log.tx || {}, log, event });
      }
    } else if (log.logType === LOG_TYPES.ASSET_OWNERSHIP_CHANGE && isTokenTransferTx(log.tx)) {
      const transfer = normalizeAssetTransfer(log);
      if (transfer) domainEvents.push({ type: 'asset_transfer', tx: log.tx || {}, log, transfer });
    }
  }

  return {
    tick: tickContext,
    transactions,
    logs,
    domainEvents,
    raw: result,
  };
}

module.exports = {
  decodeTickMessage,
  normalizeIdentity,
  normalizeLog,
  normalizeTx,
};
