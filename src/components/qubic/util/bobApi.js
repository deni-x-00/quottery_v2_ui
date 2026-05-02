/* global BigInt */

const SC_INDEX = 2; // Quottery contract index

// View function numbers (REGISTER_USER_FUNCTION)
const FUNC_BASIC_INFO = 1;
const FUNC_GET_EVENT_INFO = 2;
const FUNC_GET_ORDERS = 3;
const FUNC_GET_ACTIVE = 4;
const FUNC_GET_EVENT_BATCH = 5;
const FUNC_GET_POSITION = 6;
const FUNC_GET_APPROVED = 7;
const FUNC_GET_TOP_PROPOSALS = 8;
const QTRYGOV_ASSET_NAME = 'QTRYGOV';
const QTRYGOV_ISSUER = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACNKL';
const QTRYGOV_MANAGE_SC_INDEX = 2;

async function bobPost(bobUrl, path, payload, maxRetries = 10) {
    const url = `${bobUrl}${path}`;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.status === 202) {
                // pending — retry
                await new Promise((r) => setTimeout(r, 300));
                continue;
            }

            const text = await res.text();
            let body;
            try {
                body = JSON.parse(text);
            } catch {
                // Non-JSON response — treat as pending if status is OK, otherwise error
                if (res.ok) {
                    await new Promise((r) => setTimeout(r, 300));
                    continue;
                }
                return { error: `Non-JSON response (${res.status}): ${text.slice(0, 200)}` };
            }

            if (body.error === 'pending') {
                await new Promise((r) => setTimeout(r, 200));
                continue;
            }

            if (body.pending === true) {
                await new Promise((r) => setTimeout(r, 200));
                continue;
            }

            if (res.ok && !body.error) {
                return body;
            }

            return body;
        } catch (e) {
            if (attempt === maxRetries - 1) {
                console.warn(`[bobPost] ${path} failed after ${maxRetries} attempts:`, e.message);
                throw e;
            }
            await new Promise((r) => setTimeout(r, 500));
            continue;
        }
    }

    throw new Error('Max retries reached for pending query');
}

async function querySc(bobUrl, funcNumber, inputHex = '') {
    const nonce = Math.floor(Math.random() * 0xffffffff) + 1;
    const payload = {
        nonce,
        scIndex: SC_INDEX,
        funcNumber,
        data: inputHex,
    };
    const resp = await bobPost(bobUrl, '/querySmartContract', payload);
    if (resp?.data) {
        return hexToBytes(resp.data);
    }
    console.warn('[querySc] Empty or error response:', resp);
    return new Uint8Array(0);
}

export async function broadcastTransaction(bobUrl, signedHex) {
    const res = await bobPost(bobUrl, '/broadcastTransaction', { data: signedHex });

    console.debug('[broadcastTransaction] Bob response:', JSON.stringify(res));

    const txHash = res?.transactionHash || res?.txHash || res?.hash || res?.id
        || res?.txId || res?.transaction_hash || null;

    return {
        ...res,
        txHash,
    };
}

export async function getLatestTick(bobUrl) {
    try {
        const res = await fetch(`${bobUrl}/status`);
        const data = await res.json();

        // Pick the highest tick from all known fields.
        const candidates = [
            data?.lastSeenNetworkTick,
            data?.latestTick,
            data?.lastProcessedTick,
            data?.currentTick,
            data?.tick,
            data?.lastTick,
            data?.currentFetchingTick,
        ].map(Number).filter(n => n > 0);

        return candidates.length > 0 ? Math.max(...candidates) : 0;
    } catch {
        return 0;
    }
}

export async function getEntityBalance(bobUrl, identity) {
    try {
        const res = await fetch(`${bobUrl}/balance/${identity}`);
        const data = await res.json();
        return Number(data?.balance ?? data?.amount ?? data?.Balance ?? 0);
    } catch (e) {
        console.warn('[getEntityBalance] Could not fetch QU balance:', e.message);
        return null;
    }
}

export async function getTxByHash(bobUrl, txHash) {
    try {
        const res = await fetch(`${bobUrl}/tx/${txHash}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (data?.found === false) return null;
        if (data?.error) return null;
        if (data?.ok === false) return null;
        return data;
    } catch {
        return null;
    }
}

function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}

function bytesToHex(bytes) {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

function packUint64LE(val) {
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setBigUint64(0, BigInt(val), true);
    return new Uint8Array(buf);
}

function pack4xUint64LE(a, b, c, d) {
    const buf = new ArrayBuffer(32);
    const view = new DataView(buf);
    view.setBigUint64(0, BigInt(a), true);
    view.setBigUint64(8, BigInt(b), true);
    view.setBigUint64(16, BigInt(c), true);
    view.setBigUint64(24, BigInt(d), true);
    return new Uint8Array(buf);
}

function readUint64LE(bytes, offset) {
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    return Number(view.getBigUint64(offset, true));
}

export async function getQtryGovBalance(bobUrl, identity) {
    if (!identity) return null;

    try {
        const res = await fetch(
            `${bobUrl}/asset/${identity}/${QTRYGOV_ISSUER}/${QTRYGOV_ASSET_NAME}/${QTRYGOV_MANAGE_SC_INDEX}`
        );
        if (!res.ok) return null;

        const data = await res.json();
        const balance = Number(data?.ownershipBalance ?? 0);
        if (!Number.isFinite(balance) || balance < 0) {
            return 0;
        }
        return balance;
    } catch (e) {
        console.warn('[getQtryGovBalance] Could not fetch QTRYGOV balance:', e.message);
        return null;
    }
}

function readBigUint64LE(bytes, offset) {
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    return view.getBigUint64(offset, true);
}

function readInt64LE(bytes, offset) {
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    return Number(view.getBigInt64(offset, true));
}

function readInt32LE(bytes, offset) {
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    return view.getInt32(offset, true);
}

function readUint32LE(bytes, offset) {
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    return view.getUint32(offset, true);
}

function readUint16LE(bytes, offset) {
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    return view.getUint16(offset, true);
}

export function identityToPubkey(identity) {
    const id = identity.toUpperCase().trim();
    if (id.length < 56) {
        throw new Error(`Identity too short: ${id.length} chars (need >= 56)`);
    }
    const chars = id.slice(0, 56);
    const u64s = [];

    for (let g = 0; g < 4; g++) {
        let val = BigInt(0);
        for (let i = 13; i >= 0; i--) {
            const c = chars.charCodeAt(g * 14 + i) - 65; // 'A' = 65
            if (c < 0 || c > 25) {
                throw new Error(`Invalid identity char: ${chars[g * 14 + i]}`);
            }
            val = val * 26n + BigInt(c);
        }
        u64s.push(val);
    }

    const buf = new ArrayBuffer(32);
    const view = new DataView(buf);
    for (let i = 0; i < 4; i++) {
        view.setBigUint64(i * 8, u64s[i], true);
    }
    return new Uint8Array(buf);
}

export function pubkeyToIdentity(pubkey) {
    const view = new DataView(pubkey.buffer, pubkey.byteOffset);
    const chars = [];

    for (let g = 0; g < 4; g++) {
        let val = view.getBigUint64(g * 8, true);
        for (let i = 0; i < 14; i++) {
            chars.push(String.fromCharCode(65 + Number(val % 26n)));
            val = val / 26n;
        }
    }

    return chars.join('');
}

function decodeDatetime(val) {
    if (val === 0 || val === 0n) return '0000-00-00 00:00:00';
    const bigVal = BigInt(val);
    const yearN = Number((bigVal >> 46n) & 0xFFFFn);
    const month = Number((bigVal >> 42n) & 0xFn);
    const day = Number((bigVal >> 37n) & 0x1Fn);
    const hour = Number((bigVal >> 32n) & 0x1Fn);
    const minute = Number((bigVal >> 26n) & 0x3Fn);
    const second = Number((bigVal >> 20n) & 0x3Fn);
    return `${String(yearN).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

function readDatetime(bytes, offset) {
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    const val = view.getBigUint64(offset, true);
    return decodeDatetime(val);
}

function decodeText(raw) {
    let end = raw.length;
    while (end > 0 && raw[end - 1] === 0) end--;
    return new TextDecoder('ascii').decode(raw.slice(0, end)).trim();
}

export async function getBasicInfo(bobUrl) {
    const raw = await querySc(bobUrl, FUNC_BASIC_INFO, '');
    if (raw.length < 112) {
        console.warn(`BasicInfo response too short: ${raw.length} bytes`);
        return null;
    }

    return {
        operationFee: readUint64LE(raw, 0),
        shareholderFee: readUint64LE(raw, 8),
        burnFee: readUint64LE(raw, 16),
        nIssuedEvent: readUint64LE(raw, 24),
        shareholdersRevenue: readUint64LE(raw, 32),
        operationRevenue: readUint64LE(raw, 40),
        burnedAmount: readUint64LE(raw, 48),
        feePerDay: readUint64LE(raw, 56),
        antiSpamAmount: readUint64LE(raw, 64),
        depositAmountForDispute: readUint64LE(raw, 72),
        gameOperator: pubkeyToIdentity(raw.slice(80, 112)),
    };
}

export async function getEventInfo(bobUrl, eventId) {
    const inputHex = bytesToHex(packUint64LE(eventId));
    const raw = await querySc(bobUrl, FUNC_GET_EVENT_INFO, inputHex);
    if (raw.length < 336) {
        console.warn(`GetEventInfo response too short: ${raw.length} bytes`);
        return null;
    }

    const eid = readUint64LE(raw, 0);
    const openDate = readDatetime(raw, 8);
    const endDate = readDatetime(raw, 16);

    // QtryEventInfo layout (280 bytes):
    // [0:8] eid, [8:16] openDate, [16:24] endDate
    // [24:152] description + tag, [152:216] option0, [216:280] option1
    const descBytes = raw.slice(24, 150);       // 126 bytes (text only, excluding tag)
    const tag = readUint16LE(raw, 150);         // tag at desc[126:128] = offset 24+126
    const opt0Bytes = raw.slice(152, 216);      // 64 bytes
    const opt1Bytes = raw.slice(216, 280);      // 64 bytes

    // After QtryEventInfo (offset 280)
    const resultByGO = readInt32LE(raw, 280);
    const publishTickTime = readUint32LE(raw, 284);

    // DepositInfo at offset 288
    const disputerPubkey = raw.slice(288, 320);
    const disputeAmount = readInt64LE(raw, 320);

    const computorsVote0 = readUint32LE(raw, 328);
    const computorsVote1 = readUint32LE(raw, 332);

    const isZeroPubkey = disputerPubkey.every((b) => b === 0);
    const disputerId = isZeroPubkey ? '' : pubkeyToIdentity(disputerPubkey);

    return {
        eid,
        eventId: eid,
        openDate,
        endDate,
        desc: decodeText(descBytes),
        tag,
        option0Desc: decodeText(opt0Bytes),
        option1Desc: decodeText(opt1Bytes),
        resultByGO,
        publishTickTime,
        disputerId,
        disputeAmount,
        computorsVote0,
        computorsVote1,
    };
}

export async function getActiveEvents(bobUrl) {
    const raw = await querySc(bobUrl, FUNC_GET_ACTIVE, '');
    if (raw.length < 8) {
        console.warn(`GetActiveEvent response too short: ${raw.length} bytes`);
        return { count: 0, activeIds: [] };
    }

    const SENTINEL = BigInt('0xFFFFFFFFFFFFFFFF');
    const maxSlots = Math.min(4096, Math.floor(raw.length / 8));
    const view = new DataView(raw.buffer, raw.byteOffset);
    const ids = [];

    for (let i = 0; i < maxSlots; i++) {
        const val = view.getBigUint64(i * 8, true);
        if (val === SENTINEL) continue; // unused slot
        ids.push(Number(val));
    }

    return { count: ids.length, activeIds: ids };
}


export async function getEventInfoBatch(bobUrl, eventIds) {
    // Pad to 64 entries
    const padded = new Array(64).fill(0);
    for (let i = 0; i < Math.min(eventIds.length, 64); i++) {
        padded[i] = eventIds[i];
    }

    const buf = new ArrayBuffer(512);
    const view = new DataView(buf);
    for (let i = 0; i < 64; i++) {
        view.setBigUint64(i * 8, BigInt(padded[i]), true);
    }
    const inputHex = bytesToHex(new Uint8Array(buf));
    const raw = await querySc(bobUrl, FUNC_GET_EVENT_BATCH, inputHex);

    const events = [];
    const ENTRY_SIZE = 280;

    for (let i = 0; i < Math.min(eventIds.length, 64); i++) {
        const base = i * ENTRY_SIZE;
        if (base + ENTRY_SIZE > raw.length) break;

        const eid = readUint64LE(raw, base);
        // Check if this slot has data by looking at openDate (non-zero means populated)
        const view = new DataView(raw.buffer, raw.byteOffset);
        const openDateRaw = view.getBigUint64(base + 8, true);
        if (openDateRaw === 0n && eid !== eventIds[i]) continue; // truly empty slot

        const openDate = decodeDatetime(openDateRaw);
        const endDate = readDatetime(raw, base + 16);
        // Within desc[32]: first 30 bytes = text, last 2 bytes = tag (uint16 LE)
        const descBytes = raw.slice(base + 24, base + 150);      // 126 bytes (text, excluding tag)
        const tag = readUint16LE(raw, base + 150);                // tag at desc[126:128]
        const opt0Bytes = raw.slice(base + 152, base + 216);     // 64 bytes
        const opt1Bytes = raw.slice(base + 216, base + 280);     // 64 bytes

        events.push({
            eid,
            eventId: eid,
            openDate,
            endDate,
            desc: decodeText(descBytes),
            tag,
            option0Desc: decodeText(opt0Bytes),
            option1Desc: decodeText(opt1Bytes),
        });
    }

    return events;
}

export async function getOrders(bobUrl, eventId, option, isBid, offset = 0) {
    const inputHex = bytesToHex(
        pack4xUint64LE(eventId, option, isBid ? 1 : 0, offset)
    );
    const raw = await querySc(bobUrl, FUNC_GET_ORDERS, inputHex);

    const orders = [];
    for (let i = 0; i < 256; i++) {
        const base = i * 48;
        if (base + 48 > raw.length) break;

        const entity = raw.slice(base, base + 32);
        if (entity.every((b) => b === 0)) break; // null entity = end

        const amount = readInt64LE(raw, base + 32);
        const price = readInt64LE(raw, base + 40);

        orders.push({
            entity: pubkeyToIdentity(entity),
            amount,
            price,
        });
    }

    return orders;
}

export async function getUserPositions(bobUrl, identity) {
    const pubkey = identityToPubkey(identity);
    const inputHex = bytesToHex(pubkey);
    const raw = await querySc(bobUrl, FUNC_GET_POSITION, inputHex);

    if (raw.length < 8) {
        return { count: 0, positions: [] };
    }

    const count = readInt64LE(raw, 0);
    const positions = [];

    for (let i = 0; i < Math.min(count, 1024); i++) {
        const base = 8 + i * 16;
        if (base + 16 > raw.length) break;

        const eo = readBigUint64LE(raw, base);
        const amount = readInt64LE(raw, base + 8);

        const option = Number((eo >> 63n) & 1n);
        const eventId = Number(eo & 0x7FFFFFFFFFFFFFFFn);

        positions.push({ eventId, option, amount });
    }

    return { count, positions };
}


export async function getApprovedAmount(bobUrl, identity) {
    const pubkey = identityToPubkey(identity);
    const inputHex = bytesToHex(pubkey);
    const raw = await querySc(bobUrl, FUNC_GET_APPROVED, inputHex);

    if (raw.length < 8) return 0;
    return readUint64LE(raw, 0);
}

export async function fetchAllActiveEvents(bobUrl) {
    const { activeIds } = await getActiveEvents(bobUrl);
    if (!activeIds || activeIds.length === 0) return [];

    const allEvents = [];

    // Batch in groups of 64
    for (let i = 0; i < activeIds.length; i += 64) {
        const batch = activeIds.slice(i, i + 64);
        const events = await getEventInfoBatch(bobUrl, batch);
        allEvents.push(...events);
    }

    return allEvents;
}

export async function fetchFullOrderbook(bobUrl, eventId) {
    const [bids0, asks0, bids1, asks1] = await Promise.all([
        getOrders(bobUrl, eventId, 0, true),
        getOrders(bobUrl, eventId, 0, false),
        getOrders(bobUrl, eventId, 1, true),
        getOrders(bobUrl, eventId, 1, false),
    ]);

    return {
        option0: { bids: bids0, asks: asks0 },
        option1: { bids: bids1, asks: asks1 },
    };
}

export async function fetchUserBalanceAndPositions(bobUrl, identity) {
    const [approved, posResult] = await Promise.all([
        getApprovedAmount(bobUrl, identity),
        getUserPositions(bobUrl, identity),
    ]);

    return {
        balance: approved,
        positions: posResult.positions,
    };
}

export async function getUserOrdersFromBob(bobUrl, identity, tickRange = 20) {
    try {
        const currentTick = await getLatestTick(bobUrl);
        if (!currentTick) return null;

        const fromTick = Math.max(0, currentTick - tickRange);
        const toTick = currentTick;

        // Search for bid and ask logs for this user
        const logTypes = [
            { type: 100013, side: 'buy', label: 'Bid' },   // QUOTTERY_ADD_BID
            { type: 100014, side: 'sell', label: 'Ask' },   // QUOTTERY_ADD_ASK
        ];

        const orders = [];

        for (const { type: logType, side, label } of logTypes) {
            try {
                const res = await fetch(`${bobUrl}/findLog`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fromTick,
                        toTick,
                        scIndex: SC_INDEX,
                        logType,
                        topic1: identity,
                        topic2: '',
                        topic3: '',
                    }),
                });

                if (!res.ok) continue;
                const data = await res.json();
                if (!data || data.error) continue;

                // data may be an array of log entries
                const logs = Array.isArray(data) ? data : (data.logs || data.results || []);

                for (const log of logs) {
                    const tick = log.tick || log.tickNumber || 0;
                    const eventId = log.eid ?? log.eventId ?? log.data?.eid;
                    const option = log.option ?? log.data?.option;
                    const amount = log.amount ?? log.data?.amount;
                    const price = log.price0 ?? log.price ?? log.data?.price0 ?? log.data?.price;

                    orders.push({
                        order_id: `${tick}-${logType}-${orders.length}`,
                        tick,
                        market_id: eventId,
                        event_desc: `Event #${eventId}`,
                        option,
                        side,
                        price,
                        qty: Math.abs(amount || 0),
                        isBid: side === 'buy',
                        action: label,
                        status: 'placed',
                    });
                }
            } catch (e) {
                console.warn(`[getUserOrdersFromBob] findLog failed for logType ${logType}:`, e.message);
            }
        }

        if (orders.length > 0) {
            orders.sort((a, b) => (b.tick || 0) - (a.tick || 0));
            return orders;
        }

        return null; // signal to fall back to order book scan
    } catch (e) {
        console.warn('[getUserOrdersFromBob] unavailable:', e.message);
        return null;
    }
}

function decodeGovParams(bytes, offset = 0) {
    const opIdBytes = bytes.slice(offset + 40, offset + 72);
    const hasOperator = opIdBytes.length === 32 && !opIdBytes.every((b) => b === 0);

    return {
        shareholderFee: readUint64LE(bytes, offset),
        burnFee: readUint64LE(bytes, offset + 8),
        operationFee: readUint64LE(bytes, offset + 16),
        feePerDay: readInt64LE(bytes, offset + 24),
        depositAmountForDispute: readInt64LE(bytes, offset + 32),
        operationId: hasOperator ? pubkeyToIdentity(opIdBytes) : '',
    };
}

export async function getTopProposals(bobUrl) {
    try {
        const raw = await querySc(bobUrl, FUNC_GET_TOP_PROPOSALS, '');
        if (!raw || raw.length < 80) return { proposals: [], uniqueCount: 0 };

        const ENTRY_SIZE = 80; // QtryGOV(72) + totalVotes(sint64)
        const MAX_TOP = 4;
        const proposals = [];

        for (let i = 0; i < MAX_TOP; i++) {
            const base = i * ENTRY_SIZE;
            if (base + ENTRY_SIZE > raw.length) break;

            const totalVotes = readInt64LE(raw, base + 72);
            const govParams = decodeGovParams(raw, base);
            const isEmpty = totalVotes <= 0 && !govParams.operationId;
            if (isEmpty) continue;

            proposals.push({
                rank: proposals.length + 1,
                totalVotes,
                govParams,
            });
        }

        const uniqueCountOffset = MAX_TOP * ENTRY_SIZE;
        const uniqueCount = raw.length >= uniqueCountOffset + 4
            ? readInt32LE(raw, uniqueCountOffset)
            : proposals.length;

        return { proposals, uniqueCount };
    } catch (e) {
        console.warn('[getTopProposals] error:', e);
        return { proposals: [], uniqueCount: 0 };
    }
}
