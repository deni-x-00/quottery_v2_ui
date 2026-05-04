import {
    GARTH_ASSET_NAME,
    GARTH_ISSUER,
    getTxExecutionLogsFromBob,
    QTRYGOV_ASSET_NAME,
    QTRYGOV_ISSUER,
    QUOTTERY_CONTRACT_INDEX,
} from './bobApi';
import {
    QTRY_ADD_ASK_ORDER,
    QTRY_ADD_BID_ORDER,
    QTRY_DISPUTE,
    QTRY_GO_FORCE_CLAIM,
    QTRY_PUBLISH_RESULT,
    QTRY_PROPOSAL_VOTE,
    QTRY_REMOVE_ASK_ORDER,
    QTRY_REMOVE_BID_ORDER,
    QTRY_RESOLVE_DISPUTE,
    QTRY_TRANSFER_QTRYGOV,
    QTRY_TRANSFER_QUSD,
    QTRY_TRANSFER_SHARE_MGMT,
    QTRY_TRY_FINALIZE,
    QTRY_USER_CLAIM_REWARD,
} from './quotteryTx';

const QUOTTERY_CONTRACT_IDENTITY = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACNKL';

const LOG_TYPES = {
    QU_TRANSFER: 0,
    ASSET_OWNERSHIP_CHANGE: 2,
    ASSET_POSSESSION_CHANGE: 3,
    SC_INFO: 6,
    ASSET_OWNERSHIP_MANAGING_CONTRACT_CHANGE: 11,
    ASSET_POSSESSION_MANAGING_CONTRACT_CHANGE: 12,
};

const SC_LOG_TYPES = {
    CREATED_EVENT: 100001,
    PUBLISH_RESULT: 100002,
    RESOLVE_DISPUTE: 100003,
    FINALIZE_EVENT: 100004,
    UPDATED_NEW_GOV_PARAMS: 100005,
    UPDATED_NEW_DISCOUNT_FEE: 100006,
    UPDATED_NEW_HOSTING_FEE: 100007,
    ARCHIVE_EVENT: 100008,
    MATCH_TYPE_0: 100009,
    MATCH_TYPE_1: 100010,
    MATCH_TYPE_2: 100011,
    MATCH_TYPE_3: 100012,
    ADD_BID: 100013,
    ADD_ASK: 100014,
};

const MATCH_LOG_TYPES = new Set([
    SC_LOG_TYPES.MATCH_TYPE_0,
    SC_LOG_TYPES.MATCH_TYPE_1,
    SC_LOG_TYPES.MATCH_TYPE_2,
    SC_LOG_TYPES.MATCH_TYPE_3,
]);

function normalizeIdentity(identity) {
    return String(identity || '').trim().toUpperCase();
}

function normalizeAssetName(name) {
    return String(name || '').replace(/\0/g, '').trim().toUpperCase();
}

function normalizeLogs(logs) {
    if (!Array.isArray(logs)) return [];
    return logs.filter(Boolean);
}

function numberOrNull(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function readUint64LE(bytes, offset) {
    if (offset + 8 > bytes.length) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return Number(view.getBigUint64(offset, true));
}

function hexToBytes(hex) {
    if (!hex || typeof hex !== 'string' || hex.length % 2 !== 0) return null;
    if (!/^[0-9a-fA-F]+$/.test(hex)) return null;

    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

function decodeScContentQwords(contentHex) {
    const bytes = hexToBytes(contentHex);
    if (!bytes) return [];

    const qwords = [];
    for (let offset = 0; offset + 8 <= bytes.length; offset += 8) {
        qwords.push(readUint64LE(bytes, offset));
    }
    return qwords;
}

function scLogType(log) {
    const body = log?.body || {};
    return Number(body.scLogType ?? log.scLogType);
}

function scLogQwords(log) {
    return decodeScContentQwords(log?.body?.content);
}

function isQuotteryScLog(log, expectedType) {
    const body = log?.body || {};
    const scIndex = Number(body.scIndex ?? log.scIndex ?? QUOTTERY_CONTRACT_INDEX);
    return (
        log?.type === LOG_TYPES.SC_INFO &&
        scIndex === QUOTTERY_CONTRACT_INDEX &&
        scLogType(log) === expectedType
    );
}

function findScLog(logs, expectedType, predicate = null) {
    return logs.find((log) => isQuotteryScLog(log, expectedType) && (!predicate || predicate(log)));
}

function hasScLog(logs, expectedType, predicate = null) {
    return Boolean(findScLog(logs, expectedType, predicate));
}

function tradeLogMatchesOrder(log, tx) {
    const expected = {
        eventId: numberOrNull(tx.eventId),
        option: numberOrNull(tx.option),
        amount: numberOrNull(tx.amount),
        price: numberOrNull(tx.price),
    };

    if (Object.values(expected).some((value) => value === null)) {
        return true;
    }

    const qwords = scLogQwords(log);
    if (qwords.length === 0) return false;

    return (
        qwords[8] === expected.eventId &&
        qwords[9] === expected.option &&
        qwords[12] === expected.amount &&
        qwords[13] === expected.price
    );
}

function loggerWithDataMatches(log, matcher) {
    const qwords = scLogQwords(log);
    if (qwords.length === 0) return false;
    return matcher(qwords);
}

function logBodyIdentity(body, key) {
    return normalizeIdentity(body?.[key]);
}

function hasQuTransfer(logs, { from, to, amount = null }) {
    const source = normalizeIdentity(from);
    const destination = normalizeIdentity(to);
    const expectedAmount = amount === null || amount === undefined ? null : Number(amount);

    return logs.some((log) => {
        const body = log?.body || {};
        if (log?.type !== LOG_TYPES.QU_TRANSFER) return false;
        if (source && logBodyIdentity(body, 'from') !== source) return false;
        if (destination && logBodyIdentity(body, 'to') !== destination) return false;
        if (expectedAmount !== null && Number(body.amount) !== expectedAmount) return false;
        return true;
    });
}

function hasAssetTransfer(logs, type, { assetName, issuer, from, to, amount = null }) {
    const source = normalizeIdentity(from);
    const destination = normalizeIdentity(to);
    const expectedAmount = amount === null || amount === undefined ? null : Number(amount);

    return logs.some((log) => {
        const body = log?.body || {};
        if (log?.type !== type) return false;
        if (normalizeAssetName(body.assetName) !== normalizeAssetName(assetName)) return false;
        if (issuer && logBodyIdentity(body, 'issuerPublicKey') !== normalizeIdentity(issuer)) return false;
        if (source && logBodyIdentity(body, 'sourcePublicKey') !== source) return false;
        if (destination && logBodyIdentity(body, 'destinationPublicKey') !== destination) return false;
        if (expectedAmount !== null && Number(body.numberOfShares) !== expectedAmount) return false;
        return true;
    });
}

function hasOwnershipAndPossessionTransfer(logs, transfer) {
    return (
        hasAssetTransfer(logs, LOG_TYPES.ASSET_OWNERSHIP_CHANGE, transfer) &&
        hasAssetTransfer(logs, LOG_TYPES.ASSET_POSSESSION_CHANGE, transfer)
    );
}

function hasGarthTransfer(logs, transfer) {
    return hasOwnershipAndPossessionTransfer(logs, {
        assetName: GARTH_ASSET_NAME,
        issuer: GARTH_ISSUER,
        ...transfer,
    });
}

function hasQtryGovTransfer(logs, transfer) {
    return hasOwnershipAndPossessionTransfer(logs, {
        assetName: QTRYGOV_ASSET_NAME,
        issuer: QTRYGOV_ISSUER,
        ...transfer,
    });
}

function hasManagementRightsChange(logs, type, {
    assetName,
    issuer,
    owner,
    possessor = null,
    amount,
    sourceContractIndex,
    destinationContractIndex,
}) {
    return logs.some((log) => {
        const body = log?.body || {};
        if (log?.type !== type) return false;
        if (normalizeAssetName(body.assetName) !== normalizeAssetName(assetName)) return false;
        if (issuer && logBodyIdentity(body, 'issuerPublicKey') !== normalizeIdentity(issuer)) return false;
        if (owner && logBodyIdentity(body, 'ownershipPublicKey') !== normalizeIdentity(owner)) return false;
        if (possessor && logBodyIdentity(body, 'possessionPublicKey') !== normalizeIdentity(possessor)) return false;
        if (amount !== null && amount !== undefined && Number(body.numberOfShares) !== Number(amount)) return false;
        if (
            sourceContractIndex !== null &&
            sourceContractIndex !== undefined &&
            Number(body.sourceContractIndex) !== Number(sourceContractIndex)
        ) {
            return false;
        }
        if (
            destinationContractIndex !== null &&
            destinationContractIndex !== undefined &&
            Number(body.destinationContractIndex) !== Number(destinationContractIndex)
        ) {
            return false;
        }
        return true;
    });
}

function hasGarthManagementRightsChange(logs, tx, walletIdentity) {
    const owner = tx.owner || walletIdentity;
    const amount = tx.shares ?? tx.amount;

    const common = {
        assetName: GARTH_ASSET_NAME,
        issuer: GARTH_ISSUER,
        owner,
        amount,
        sourceContractIndex: tx.sourceContractIndex,
        destinationContractIndex: tx.destinationContractIndex,
    };

    return (
        hasManagementRightsChange(logs, LOG_TYPES.ASSET_OWNERSHIP_MANAGING_CONTRACT_CHANGE, common) &&
        hasManagementRightsChange(logs, LOG_TYPES.ASSET_POSSESSION_MANAGING_CONTRACT_CHANGE, {
            ...common,
            possessor: tx.possessor || owner,
        })
    );
}

function ok(reason, extra = {}) {
    return { verified: true, reason, ...extra };
}

function inconclusive(reason, extra = {}) {
    return { verified: false, inconclusive: true, reason, ...extra };
}

function failed(reason, extra = {}) {
    return { verified: false, inconclusive: false, reason, ...extra };
}

function verifyAddBid(logs, tx, walletIdentity) {
    if (!hasScLog(logs, SC_LOG_TYPES.ADD_BID, (log) => tradeLogMatchesOrder(log, tx))) {
        return inconclusive('missing-add-bid-sc-log');
    }

    const totalCost = Number(tx.amount) * Number(tx.price);
    if (!Number.isFinite(totalCost) || totalCost <= 0) {
        return ok('add-bid-sc-log-verified');
    }

    if (!hasGarthTransfer(logs, {
        from: walletIdentity,
        to: QUOTTERY_CONTRACT_IDENTITY,
        amount: totalCost,
    })) {
        return inconclusive('missing-add-bid-garth-lock-logs');
    }

    return ok('add-bid-logs-verified');
}

function verifyAddAsk(logs, tx) {
    if (!hasScLog(logs, SC_LOG_TYPES.ADD_ASK, (log) => tradeLogMatchesOrder(log, tx))) {
        return inconclusive('missing-add-ask-sc-log');
    }

    return ok(
        logs.some((log) => MATCH_LOG_TYPES.has(scLogType(log)))
            ? 'add-ask-and-match-logs-verified'
            : 'add-ask-log-verified'
    );
}

function verifyRemoveBid(logs, tx, walletIdentity) {
    const refundAmount = Number(tx.amount) * Number(tx.price);
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
        return inconclusive('missing-remove-bid-expected-refund');
    }

    if (!hasGarthTransfer(logs, {
        from: QUOTTERY_CONTRACT_IDENTITY,
        to: walletIdentity,
        amount: refundAmount,
    })) {
        return inconclusive('missing-remove-bid-refund-logs');
    }

    return ok('remove-bid-refund-logs-verified');
}

function verifyPublishResult(logs, tx) {
    const eventId = numberOrNull(tx.eventId);
    const option = numberOrNull(tx.option);
    return hasScLog(logs, SC_LOG_TYPES.PUBLISH_RESULT, (log) =>
        loggerWithDataMatches(log, (qwords) =>
            (eventId === null || qwords[2] === eventId) &&
            (option === null || qwords[3] === option)
        )
    )
        ? ok('publish-result-log-verified')
        : inconclusive('missing-publish-result-log');
}

function verifyTryFinalize(logs, tx) {
    const eventId = numberOrNull(tx.eventId);
    return hasScLog(logs, SC_LOG_TYPES.FINALIZE_EVENT, (log) =>
        loggerWithDataMatches(log, (qwords) => eventId === null || qwords[2] === eventId)
    )
        ? ok('finalize-event-log-verified')
        : inconclusive('missing-finalize-event-log');
}

function verifyResolveDispute(logs, tx) {
    const eventId = numberOrNull(tx.eventId);
    const vote = numberOrNull(tx.vote);
    return hasScLog(logs, SC_LOG_TYPES.RESOLVE_DISPUTE, (log) =>
        loggerWithDataMatches(log, (qwords) =>
            (eventId === null || qwords[1] === eventId) &&
            (vote === null || qwords[3] === vote)
        )
    )
        ? ok('resolve-dispute-log-verified')
        : inconclusive('missing-resolve-dispute-log');
}

function verifyDispute(logs, tx, walletIdentity) {
    const deposit = tx.depositAmount ?? tx.txAmount;
    if (!deposit) {
        return ok('dispute-executed');
    }

    const depositLocked = hasQuTransfer(logs, {
        from: walletIdentity,
        to: QUOTTERY_CONTRACT_IDENTITY,
        amount: deposit,
    });
    const refunded = hasQuTransfer(logs, {
        from: QUOTTERY_CONTRACT_IDENTITY,
        to: walletIdentity,
        amount: deposit,
    });

    if (!depositLocked) return inconclusive('missing-dispute-deposit-transfer');
    if (refunded) return inconclusive('dispute-deposit-was-refunded');
    return ok('dispute-deposit-transfer-verified');
}

function verifyGarthTransfer(logs, tx, walletIdentity) {
    if (!tx.receiver || !tx.amount) return inconclusive('missing-garth-transfer-metadata');

    return hasGarthTransfer(logs, {
        from: walletIdentity,
        to: tx.receiver,
        amount: tx.amount,
    })
        ? ok('garth-transfer-logs-verified')
        : inconclusive('missing-garth-transfer-logs');
}

function verifyQtryGovTransfer(logs, tx, walletIdentity) {
    if (!tx.receiver || !tx.amount) return inconclusive('missing-qtrygov-transfer-metadata');

    return hasQtryGovTransfer(logs, {
        from: walletIdentity,
        to: tx.receiver,
        amount: tx.amount,
    })
        ? ok('qtrygov-transfer-logs-verified')
        : inconclusive('missing-qtrygov-transfer-logs');
}

function verifyClaimReward(logs, walletIdentity) {
    return hasGarthTransfer(logs, {
        from: QUOTTERY_CONTRACT_IDENTITY,
        to: walletIdentity,
    })
        ? ok('claim-reward-transfer-logs-verified')
        : inconclusive('missing-claim-reward-transfer-logs');
}

function verifyManagementRights(logs, tx, walletIdentity) {
    return hasGarthManagementRightsChange(logs, tx, walletIdentity)
        ? ok('management-rights-change-logs-verified')
        : inconclusive('missing-management-rights-change-logs');
}

function verifyKnownTransactionLogs(logs, tx, walletIdentity) {
    switch (Number(tx.inputType)) {
        case QTRY_ADD_ASK_ORDER:
            return verifyAddAsk(logs, tx, walletIdentity);
        case QTRY_REMOVE_ASK_ORDER:
            return inconclusive('remove-ask-has-no-specific-log');
        case QTRY_ADD_BID_ORDER:
            return verifyAddBid(logs, tx, walletIdentity);
        case QTRY_REMOVE_BID_ORDER:
            return verifyRemoveBid(logs, tx, walletIdentity);
        case QTRY_PUBLISH_RESULT:
            return verifyPublishResult(logs, tx);
        case QTRY_TRY_FINALIZE:
            return verifyTryFinalize(logs, tx);
        case QTRY_DISPUTE:
            return verifyDispute(logs, tx, walletIdentity);
        case QTRY_RESOLVE_DISPUTE:
            return verifyResolveDispute(logs, tx);
        case QTRY_USER_CLAIM_REWARD:
        case QTRY_GO_FORCE_CLAIM:
            return verifyClaimReward(logs, walletIdentity);
        case QTRY_TRANSFER_QUSD:
            return verifyGarthTransfer(logs, tx, walletIdentity);
        case QTRY_TRANSFER_SHARE_MGMT:
            return verifyManagementRights(logs, tx, walletIdentity);
        case QTRY_TRANSFER_QTRYGOV:
            return verifyQtryGovTransfer(logs, tx, walletIdentity);
        case QTRY_PROPOSAL_VOTE:
            return inconclusive('proposal-vote-has-no-specific-log');
        default:
            if (tx.type === 'order' && tx.action !== 'remove' && tx.side === 'buy') {
                return verifyAddBid(logs, tx, walletIdentity);
            }
            if (tx.type === 'order' && tx.action !== 'remove' && tx.side === 'sell') {
                return verifyAddAsk(logs, tx, walletIdentity);
            }
            if (tx.type === 'order' && tx.action === 'remove' && tx.side === 'buy') {
                return verifyRemoveBid(logs, tx, walletIdentity);
            }
            return ok('tx-executed-no-specific-log-rule');
    }
}

export async function verifyTxWithBobLogs(bobUrl, tx, walletIdentity) {
    if (!tx?.txHash) {
        return inconclusive('missing-tx-hash');
    }

    const result = await getTxExecutionLogsFromBob(bobUrl, tx.txHash);
    if (!result?.tx) {
        return inconclusive('tx-not-found-on-bob');
    }

    if (result.tx.executed !== true) {
        return failed('tx-not-executed', { txData: result.tx });
    }

    const logs = normalizeLogs(result.logs);
    if (logs.length === 0) {
        return inconclusive('logs-unavailable', { txData: result.tx });
    }

    const logCheck = verifyKnownTransactionLogs(logs, tx, walletIdentity);

    return {
        ...logCheck,
        inconclusive: logCheck.inconclusive ?? !logCheck.verified,
        txData: result.tx,
        logs,
        tick: result.tick,
        epoch: result.epoch,
        logFrom: result.logFrom,
        logTo: result.logTo,
    };
}
