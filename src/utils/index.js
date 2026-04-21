import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';
import { QubicTransaction } from '@qubic-lib/qubic-ts-library/dist/qubic-types/QubicTransaction';
import { PublicKey } from '@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey';
import { Long } from '@qubic-lib/qubic-ts-library/dist/qubic-types/Long';
import { DynamicPayload } from '@qubic-lib/qubic-ts-library/dist/qubic-types/DynamicPayload';
import { Signature } from '@qubic-lib/qubic-ts-library/dist/qubic-types/Signature';
import {
  PUBLIC_KEY_LENGTH,
  SIGNATURE_LENGTH,
} from '@qubic-lib/qubic-ts-library/dist/crypto';

// format number input to 100,000,000 format
export const formatQubicAmount = (amount, seperator = ',') => {
  return amount
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, seperator)
    .replace('.0', '');
};

export const truncateMiddle = (str, charsToRemove) => {
  const length = str.length;
  const start = Math.floor((length - charsToRemove) / 2);
  const end = start + charsToRemove;

  return str.slice(0, start) + '...' + str.slice(end);
};

export const copyText = (text) => {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard');
};

export const uint8ArrayToBase64 = (uint8Array) => {
  const binaryString = String.fromCharCode.apply(null, Array.from(uint8Array));
  return btoa(binaryString);
};

export const base64ToUint8Array = (base64) => {
  const binaryString = atob(base64);
  return new Uint8Array(
    binaryString.split('').map((char) => char.charCodeAt(0))
  );
};

export const decodeUint8ArrayTx = (tx) => {
  const new_tx = new QubicTransaction();
  const inputSize =
    new DataView(
      tx.slice(PUBLIC_KEY_LENGTH * 2 + 14, PUBLIC_KEY_LENGTH * 2 + 16).buffer
    ).getUint16(0, true) || 0;
  const payloadStart = PUBLIC_KEY_LENGTH * 2 + 16;
  const payloadEnd = payloadStart + inputSize;
  const signatureEnd = payloadEnd + SIGNATURE_LENGTH;

  new_tx
    .setSourcePublicKey(new PublicKey(tx.slice(0, PUBLIC_KEY_LENGTH)))
    .setDestinationPublicKey(
      new PublicKey(tx.slice(PUBLIC_KEY_LENGTH, PUBLIC_KEY_LENGTH * 2))
    )
    .setAmount(
      new Long(tx.slice(PUBLIC_KEY_LENGTH * 2, PUBLIC_KEY_LENGTH * 2 + 8))
    )
    .setTick(
      new DataView(
        tx.slice(PUBLIC_KEY_LENGTH * 2 + 8, PUBLIC_KEY_LENGTH * 2 + 12).buffer
      ).getUint32(0, true)
    )
    .setInputType(
      new DataView(
        tx.slice(PUBLIC_KEY_LENGTH * 2 + 12, PUBLIC_KEY_LENGTH * 2 + 14).buffer
      ).getUint16(0, true)
    )
    .setInputSize(inputSize);

  if (inputSize > 0) {
    const payload = new DynamicPayload(inputSize);
    payload.setPayload(tx.slice(payloadStart, payloadEnd));
    new_tx.setPayload(payload);
  }
  new_tx.signature = new Signature(tx.slice(payloadEnd, signatureEnd));

  return new_tx;
};

export const sumArray = (arr) => arr.reduce((acc, curr) => acc + curr, 0);

// Convert Uint8Array to hex string
export const byteArrayToHexString = (byteArray) => {
  const hexString = Array.from(byteArray, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  return hexString;
};

// Basic validation checks
export const isAddressValid = (toAddress) =>
  toAddress.length === 60 && /^[A-Z]+$/.test(toAddress);
export const isPositiveNumber = (amount) =>
  !isNaN(Number(amount)) && Number(amount) > 0;
export const isAmountValid = (amount) =>
  isPositiveNumber(amount) && amount % 1 === 0;

export const generateQRCode = async (text) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(text);
    return qrCodeDataURL;
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
};

export const generateSeed = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const letterSize = letters.length;
  let seed = '';
  for (let i = 0; i < 55; i++) {
    seed += letters[Math.floor(Math.random() * letterSize)];
  }
  return seed;
};
