/* global BigInt */
/**
 * quotteryTx.js — Build properly formatted Qubic transactions for the
 * Quottery smart contract so they can be signed by MetaMask Snap and
 * broadcast via Bob.
 *
 * Qubic Transaction layout (matches core structs.h):
 *   [0:32]     sourcePublicKey
 *   [32:64]    destinationPublicKey
 *   [64:72]    amount        (int64 LE)
 *   [72:76]    tick          (uint32 LE)
 *   [76:78]    inputType     (uint16 LE — SC procedure number)
 *   [78:80]    inputSize     (uint16 LE — payload byte length)
 *   [80:80+N]  payload
 *   [80+N:]    signature     (64 bytes, filled by wallet)
 */

const QUOTTERY_CONTRACT_ID = 2;
const TX_HEADER_SIZE = 80; // 32+32+8+4+2+2
const SIGNATURE_SIZE = 64;

// Procedure numbers (from Quottery.h REGISTER_USER_PROCEDURE)
export const QTRY_CREATE_EVENT    = 1;
export const QTRY_ADD_ASK_ORDER   = 2;
export const QTRY_REMOVE_ASK_ORDER = 3;
export const QTRY_ADD_BID_ORDER   = 4;
export const QTRY_REMOVE_BID_ORDER = 5;
export const QTRY_PUBLISH_RESULT  = 6;
export const QTRY_TRY_FINALIZE   = 7;
export const QTRY_DISPUTE         = 8;
export const QTRY_RESOLVE_DISPUTE = 9;
export const QTRY_USER_CLAIM_REWARD = 10;
export const QTRY_GO_FORCE_CLAIM  = 11;
export const QTRY_TRANSFER_QUSD  = 12;

function contractDestination() {
    const dest = new Uint8Array(32);
    const view = new DataView(dest.buffer);
    view.setBigUint64(0, BigInt(QUOTTERY_CONTRACT_ID), true);
    return dest;
}


export function buildQuotteryTx(sourcePubkey, tick, inputType, amount, payload) {
    const payloadSize = payload ? payload.length : 0;
    const totalSize = TX_HEADER_SIZE + payloadSize + SIGNATURE_SIZE;
    const packet = new Uint8Array(totalSize);
    const view = new DataView(packet.buffer);

    // Source public key [0:32]
    packet.set(sourcePubkey, 0);

    // Destination public key [32:64]
    packet.set(contractDestination(), 32);

    // Amount [64:72]  (int64 LE)
    view.setBigInt64(64, BigInt(amount), true);

    // Tick [72:76]  (uint32 LE)
    view.setUint32(72, tick, true);

    // InputType [76:78]  (uint16 LE)
    view.setUint16(76, inputType, true);

    // InputSize [78:80]  (uint16 LE)
    view.setUint16(78, payloadSize, true);

    // Payload [80:80+N]
    if (payloadSize > 0) {
        packet.set(payload, TX_HEADER_SIZE);
    }

    // Signature area [80+N:] left as zeros — wallet will fill it
    return packet;
}

export function packOrderPayload(eventId, option, amount, price) {
    const buf = new ArrayBuffer(32);
    const v = new DataView(buf);
    v.setBigUint64(0, BigInt(eventId), true);
    v.setBigUint64(8, BigInt(option), true);
    v.setBigUint64(16, BigInt(amount), true);
    v.setBigUint64(24, BigInt(price), true);
    return new Uint8Array(buf);
}

export function packPublishPayload(eventId, option) {
    const buf = new ArrayBuffer(16);
    const v = new DataView(buf);
    v.setBigUint64(0, BigInt(eventId), true);
    v.setBigUint64(8, BigInt(option), true);
    return new Uint8Array(buf);
}

export function packEventIdPayload(eventId) {
    const buf = new ArrayBuffer(8);
    const v = new DataView(buf);
    v.setBigUint64(0, BigInt(eventId), true);
    return new Uint8Array(buf);
}

export function packResolveDisputePayload(eventId, vote) {
    const buf = new ArrayBuffer(16);
    const v = new DataView(buf);
    v.setBigUint64(0, BigInt(eventId), true);
    v.setBigInt64(8, BigInt(vote), true);
    return new Uint8Array(buf);
}
