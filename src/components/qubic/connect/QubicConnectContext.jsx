import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  SIGNATURE_LENGTH,
} from '@qubic-lib/qubic-ts-library/dist/crypto';
import {
  MetamaskActions,
  MetaMaskContext,
  MetaMaskProvider,
} from './MetamaskContext';
import { connectTypes, defaultSnapOrigin } from './config';
import {
  uint8ArrayToBase64,
} from '../../../utils';
import { toast } from 'react-hot-toast';
import { getSnap } from './utils';
import { connectSnap } from './utils';
import { useWalletConnect } from './WalletConnectContext';
// @ts-ignore
import { atom, useAtom } from 'jotai';

const balancesAtom = atom([]);

const QubicConnectContext = createContext(undefined);
const walletTypes = [...connectTypes, 'walletconnect'];

const normalizeWalletConnectAccounts = (accounts) => {
  const accountList = Array.isArray(accounts)
      ? accounts
      : accounts?.accounts || accounts?.result || [];

  return accountList
      .map((account) => {
        if (typeof account === 'string') {
          return { publicId: account, alias: '' };
        }

        return {
          publicId: account?.address || account?.publicId || account?.id || '',
          alias: account?.name || account?.alias || '',
        };
      })
      .filter((account) => account.publicId);
};

const readStoredWallet = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedWallet = window.localStorage.getItem('wallet');
    if (!storedWallet) {
      return null;
    }

    const parsedWallet = JSON.parse(storedWallet);
    if (
      parsedWallet &&
      walletTypes.includes(parsedWallet.connectType) &&
      typeof parsedWallet.publicKey === 'string' &&
      parsedWallet.publicKey.length > 0
    ) {
      return parsedWallet;
    }
  } catch (error) {
    console.warn('Failed to restore wallet from localStorage:', error);
  }

  window.localStorage.removeItem('wallet');
  return null;
};

function QubicConnectProviderInner({ children }) {
  const [wallet, setWallet] = useState(readStoredWallet);
  const [connected, setConnected] = useState(() => Boolean(wallet));
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [, dispatch] = useContext(MetaMaskContext);
  const [, setBalances] = useAtom(balancesAtom);
  const {
    isConnected: walletConnectConnected,
    isInitialized: walletConnectInitialized,
    requestAccounts: requestWalletConnectAccounts,
    signTransaction: signWalletConnectTransaction,
    disconnect: disconnectWalletConnect,
  } = useWalletConnect();

  const connect = (wallet) => {
    localStorage.setItem('wallet', JSON.stringify(wallet));
    setWallet(wallet);
    setConnected(true);
  };

  const disconnect = async () => {
    const shouldDisconnectWalletConnect = wallet?.connectType === 'walletconnect';
    localStorage.removeItem('wallet');
    setWallet(null);
    setConnected(false);
    setBalances([]);

    if (shouldDisconnectWalletConnect) {
      await disconnectWalletConnect();
    }
  };

  useEffect(() => {
    if (wallet || !walletConnectConnected) {
      return;
    }

    let cancelled = false;

    const restoreWalletConnectWallet = async () => {
      try {
        const accounts = normalizeWalletConnectAccounts(await requestWalletConnectAccounts());
        if (cancelled || accounts.length === 0) {
          return;
        }

        const account = accounts[0];
        connect({
          connectType: 'walletconnect',
          publicKey: account.publicId,
          alias: account.alias,
        });
      } catch (error) {
        console.warn('Failed to restore WalletConnect wallet:', error);
      }
    };

    restoreWalletConnectWallet();

    return () => {
      cancelled = true;
    };
  }, [wallet, walletConnectConnected, requestWalletConnectAccounts]);

  useEffect(() => {
    if (
      !walletConnectInitialized ||
      wallet?.connectType !== 'walletconnect' ||
      walletConnectConnected
    ) {
      return;
    }

    localStorage.removeItem('wallet');
    setWallet(null);
    setConnected(false);
    setBalances([]);
  }, [wallet, walletConnectConnected, walletConnectInitialized, setBalances]);

  const toggleConnectModal = () => {
    setShowConnectModal(!showConnectModal);
  };

  const normalizeAndLogError = (err, context) => {
    // MetaMask often nests details in non-enumerable props
    const full = JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    console.error(`[MetaMask Snap] ${context} failed:`, full);
    // Surface common nested messages if present
    const nestedMsg =
        full?.data?.message ||
        full?.data?.originalError?.message ||
        full?.data?.cause?.message ||
        full?.message;
    return nestedMsg || 'Unknown MetaMask error';
  };

  const ensureNumberInteger = (val, name) => {
    if (typeof val !== 'number' || !Number.isInteger(val)) {
      throw new Error(`${name} must be an integer number. Received: ${val}`);
    }
  };

  const ensureBoolean = (val, name) => {
    if (typeof val !== 'boolean') {
      throw new Error(`${name} must be a boolean. Received: ${val}`);
    }
  };

  const ensureUint8Array = (val, name) => {
    if (!(val instanceof Uint8Array)) {
      throw new Error(`${name} must be a Uint8Array. Received: ${Object.prototype.toString.call(val)}`);
    }
  };

  const getMetaMaskPublicId = async (accountIdx = 0, confirm = false) => {
    try {
      ensureNumberInteger(accountIdx, 'accountIdx');
      ensureBoolean(confirm, 'confirm');

      const request = {
        method: 'getPublicId',
        params: { accountIdx, confirm },
      };
      console.debug('[MetaMask Snap] invoking getPublicId with:', { snapId: defaultSnapOrigin, request });

      return await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: { snapId: defaultSnapOrigin, request },
      });
    } catch (err) {
      const msg = normalizeAndLogError(err, 'getPublicId');
      throw new Error(msg);
    }
  };

  const getMetaMaskSignedTx = async (tx, offset, accountIdx = 0) => {
    try {
      ensureUint8Array(tx, 'tx');
      ensureNumberInteger(offset, 'offset');
      ensureNumberInteger(accountIdx, 'accountIdx');

      if (offset < 0 || offset > tx.length - SIGNATURE_LENGTH) {
        throw new Error(
            `offset out of bounds. Must be within [0, tx.length - SIGNATURE_LENGTH]. ` +
            `Received offset=${offset}, tx.length=${tx.length}, SIGNATURE_LENGTH=${SIGNATURE_LENGTH}`
        );
      }

      // Use a safe Uint8Array -> base64 routine
      const base64Tx = uint8ArrayToBase64(tx);

      const request = {
        method: 'signTransaction',
        params: { base64Tx, accountIdx, offset },
      };
      console.debug('[MetaMask Snap] invoking signTransaction with:', {
        snapId: defaultSnapOrigin,
        requestMeta: { accountIdx, offset, base64Length: base64Tx.length },
      });

      return await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: { snapId: defaultSnapOrigin, request },
      });
    } catch (err) {
      const msg = normalizeAndLogError(err, 'signTransaction');
      console.error(msg);
      return null;
    }
  };

  const decodeSignedTx = (signedTx) => {
    if (signedTx instanceof Uint8Array) {
      return signedTx;
    }

    if (typeof signedTx !== 'string' || signedTx.length === 0) {
      return null;
    }

    if (/^[0-9a-fA-F]+$/.test(signedTx) && signedTx.length % 2 === 0) {
      return new Uint8Array(
          signedTx.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
      );
    }

    return new Uint8Array(atob(signedTx).split('').map((char) => char.charCodeAt(0)));
  };

  const applySignedTxResult = (tx, result) => {
    const signedTx =
        result?.signedTx ||
        result?.signature ||
        result?.transaction ||
        result?.tx ||
        result;

    if (!signedTx) {
      return null;
    }

    const decoded = decodeSignedTx(signedTx);
    if (!decoded) {
      throw new Error('Unsupported signed transaction format');
    }

    const sigOffset = tx.length - SIGNATURE_LENGTH;
    if (decoded.length === tx.length) {
      for (let i = 0; i < tx.length; i++) {
        tx[i] = decoded[i];
      }
    } else if (decoded.length === SIGNATURE_LENGTH) {
      tx.set(decoded, sigOffset);
    } else {
      throw new Error(
          `Unexpected signedTx length: ${decoded.length} (expected ${tx.length} or ${SIGNATURE_LENGTH})`
      );
    }

    return { tx };
  };

  const getWalletConnectSignedTx = async (tx) => {
    if (!walletConnectConnected) {
      throw new Error('WalletConnect session is not connected');
    }

    const sigOffset = tx.length - SIGNATURE_LENGTH;
    const result = await signWalletConnectTransaction({
      base64Tx: uint8ArrayToBase64(tx),
      offset: sigOffset,
    });

    return applySignedTxResult(tx, result);
  };

  const getSignedTx = async (tx) => {
    if (!wallet || !walletTypes.includes(wallet.connectType)) {
      throw new Error(`Unsupported connectType: ${wallet?.connectType}`);
    }
    if (wallet.connectType === 'walletconnect') {
      return getWalletConnectSignedTx(tx);
    }
    const sigOffset = tx.length - SIGNATURE_LENGTH;
    const mmResult = await getMetaMaskSignedTx(tx, sigOffset);
    if (!mmResult) {
      return null;
    }
    const binaryTx = atob(mmResult.signedTx);
    const decoded = new Uint8Array(binaryTx.length);
    for (let i = 0; i < binaryTx.length; i++) {
      decoded[i] = binaryTx.charCodeAt(i);
    }

    if (decoded.length === tx.length) {
      // Snap returned the full signed transaction — use it as-is
      for (let i = 0; i < tx.length; i++) {
        tx[i] = decoded[i];
      }
    } else if (decoded.length === SIGNATURE_LENGTH) {
      // Snap returned just the 64-byte signature
      tx.set(decoded, sigOffset);
    } else {
      throw new Error(
          `Unexpected signedTx length: ${decoded.length} (expected ${tx.length} or ${SIGNATURE_LENGTH})`
      );
    }
    return { tx: tx };
  };

  const mmSnapConnect = async () => {
    try {
      await connectSnap(
          defaultSnapOrigin,
          {} // ensure we do not pass undefined
      );
      const installedSnap = await getSnap();
      // get publicId from snap
      const publicKey = await getMetaMaskPublicId(0);
      const wallet = {
        connectType: 'mmSnap',
        publicKey,
      };
      connect(wallet);
      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    } catch (error) {
      console.error(error);
      toast.error('MetaMask Snap (mmsnap) is not installed. Please install it and try again.');
      dispatch({
        type: MetamaskActions.SetError,
        payload: error,
      });
    }
  };

  const contextValue = {
    connected,
    wallet,
    showConnectModal,
    connect,
    disconnect,
    toggleConnectModal,
    getMetaMaskPublicId,
    getSignedTx,
    mmSnapConnect,
  };

  return (
      <QubicConnectContext.Provider value={contextValue}>
        {children}
      </QubicConnectContext.Provider>
  );
}

export function QubicConnectProvider({ children }) {
  return (
      <MetaMaskProvider>
        <QubicConnectProviderInner>{children}</QubicConnectProviderInner>
      </MetaMaskProvider>
  );
}

export function useQubicConnect() {
  const context = useContext(QubicConnectContext);
  if (context === undefined) {
    throw new Error(
        'useQubicConnect() hook must be used within a <QubicConnectProvider>'
    );
  }
  return context;
}
