const { QubicHelper } = require('@qubic-lib/qubic-ts-library/dist/qubicHelper');

const helper = new QubicHelper();

function normalizeIdentity(value) {
  const identity = String(value || '').trim().toUpperCase();
  return /^[A-Z]{56,60}$/.test(identity) ? identity : '';
}

async function pubkeyToIdentity(pubkey) {
  if (!pubkey || pubkey.length !== 32 || pubkey.every((byte) => byte === 0)) {
    return '';
  }

  try {
    return await helper.getIdentity(Uint8Array.from(pubkey));
  } catch {
    return pubkeyToIdentityWithoutChecksum(pubkey);
  }
}

function pubkeyToIdentityWithoutChecksum(pubkey) {
  const view = new DataView(pubkey.buffer, pubkey.byteOffset, pubkey.byteLength);
  const chars = [];

  for (let group = 0; group < 4; group += 1) {
    let value = view.getBigUint64(group * 8, true);
    for (let i = 0; i < 14; i += 1) {
      chars.push(String.fromCharCode(65 + Number(value % 26n)));
      value /= 26n;
    }
  }

  return chars.join('');
}

module.exports = {
  normalizeIdentity,
  pubkeyToIdentity,
};
