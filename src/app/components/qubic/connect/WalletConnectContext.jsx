import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import SignClient from '@walletconnect/sign-client';
import toast from 'react-hot-toast';

const WalletConnectContext = createContext(undefined);

const clearStoredWalletConnectWallet = () => {
  try {
    const storedWallet = localStorage.getItem('wallet');
    if (!storedWallet) return;

    const wallet = JSON.parse(storedWallet);
    if (wallet?.connectType === 'walletconnect') {
      localStorage.removeItem('wallet');
    }
  } catch {
    localStorage.removeItem('wallet');
  }
};

const getSessionEventName = (event) =>
  event?.params?.event?.name || event?.event?.name || event?.name || '';

const getSessionEventData = (event) =>
  event?.params?.event?.data ?? event?.event?.data ?? event?.data;

const getSessionAccounts = (session) => {
  const namespaces = session?.namespaces || session?.params?.namespaces || {};
  return Object.values(namespaces).flatMap((namespace) =>
    Array.isArray(namespace?.accounts) ? namespace.accounts : []
  );
};

const hasQubicAccounts = (session) =>
  getSessionAccounts(session).some((account) => String(account).startsWith('qubic:'));

const isEmptyAccountsChangedEvent = (event) => {
  if (getSessionEventName(event) !== 'accountsChanged') return false;

  const data = getSessionEventData(event);
  if (Array.isArray(data)) return data.length === 0;
  if (Array.isArray(data?.accounts)) return data.accounts.length === 0;

  return false;
};

export function WalletConnectProvider({ children }) {
  const [signClient, setSignClient] = useState(null);
  const [sessionTopic, setSessionTopic] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const connect = useCallback(async (onDisplayUri) => {
    if (!signClient) return { uri: '', approve: async () => {} };
    setIsConnecting(true);
    const handleDisplayUri = (uri) => {
      if (uri && typeof onDisplayUri === 'function') {
        onDisplayUri(uri);
      }
    };

    signClient.on('display_uri', handleDisplayUri);

    try {
      const { uri, approval } = await signClient.connect({
        requiredNamespaces: {
          qubic: {
            chains: ['qubic:mainnet'],
            methods: [
              'qubic_requestAccounts',
              'qubic_sendQubic',
              'qubic_sendAsset',
              'qubic_signTransaction',
              'qubic_sign',
            ],
            events: ['amountChanged', 'assetAmountChanged', 'accountsChanged'],
          },
        },
      });

      handleDisplayUri(uri);

      const approve = async () => {
        try {
          const session = await approval();
          setSessionTopic(session.topic);
          setIsConnected(true);
          localStorage.setItem('sessionTopic', session.topic);
        } catch (e) {
          console.error('Connection rejected:', e);
        }
      };

      return { uri: uri || '', approve };
    } catch (error) {
      console.error('Failed to connect:', error);
      return { uri: '', approve: async () => {} };
    } finally {
      signClient.off('display_uri', handleDisplayUri);
      setIsConnecting(false);
    }
  }, [signClient]);

  const disconnect = useCallback(async () => {
    if (!signClient || !sessionTopic) {
      setSessionTopic('');
      setIsConnected(false);
      localStorage.removeItem('sessionTopic');
      return;
    }

    try {
      await signClient.disconnect({
        topic: sessionTopic,
        reason: { code: 6000, message: 'User disconnected' },
      });

      setSessionTopic('');
      setIsConnected(false);
      localStorage.removeItem('sessionTopic');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      setSessionTopic('');
      setIsConnected(false);
      localStorage.removeItem('sessionTopic');
    }
  }, [signClient, sessionTopic]);

  const requestAccounts = useCallback(async () => {
    if (!signClient || !sessionTopic) throw new Error('Not connected');

    try {
      const result = await signClient.request({
        topic: sessionTopic,
        chainId: 'qubic:mainnet',
        request: {
          method: 'qubic_requestAccounts',
          params: {
            nonce: Date.now().toString(),
          },
        },
      });
      return result;
    } catch (error) {
      console.error('Failed to request accounts:', error);
      throw error;
    }
  }, [signClient, sessionTopic]);

  const sendQubic = useCallback(async (params) => {
    if (!signClient || !sessionTopic) throw new Error('Not connected');

    return await signClient.request({
      topic: sessionTopic,
      chainId: 'qubic:mainnet',
      request: {
        method: 'qubic_sendQubic',
        params: {
          ...params,
          nonce: Date.now().toString(),
        },
      },
    });
  }, [signClient, sessionTopic]);

  const signTransaction = useCallback(async (params) => {
    if (!signClient || !sessionTopic) throw new Error('Not connected');

    try {
      return await signClient.request({
        topic: sessionTopic,
        chainId: 'qubic:mainnet',
        request: {
          method: 'qubic_signTransaction',
          params: {
            ...params,
            nonce: Date.now().toString(),
          },
        },
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to sign transaction');
      throw error;
    }
  }, [signClient, sessionTopic]);

  const signMessage = useCallback(async (params) => {
    if (!signClient || !sessionTopic) throw new Error('Not connected');

    return await signClient.request({
      topic: sessionTopic,
      chainId: 'qubic:mainnet',
      request: {
        method: 'qubic_sign',
        params,
      },
    });
  }, [signClient, sessionTopic]);

  useEffect(() => {
    let mounted = true;
    let activeClient = null;
    const appUrl = window.location.origin;
    const clearSession = () => {
      if (!mounted) return;
      setSessionTopic('');
      setIsConnected(false);
      localStorage.removeItem('sessionTopic');
      clearStoredWalletConnectWallet();
    };
    const handleSessionEvent = (event) => {
      if (isEmptyAccountsChangedEvent(event)) {
        clearSession();
      }
    };
    const handleSessionUpdate = (event) => {
      if (!hasQubicAccounts(event)) {
        clearSession();
      }
    };

    SignClient.init({
      projectId: '6b20c30bdf9886424e0c563ba165af9b',
      metadata: {
        name: 'Quottery',
        description: 'Quottery',
        url: appUrl,
        icons: ['https://walletconnect.com/walletconnect-logo.png'],
      },
    }).then((client) => {
      if (!mounted) return;
      activeClient = client;
      setSignClient(client);

      const storedTopic = localStorage.getItem('sessionTopic');
      if (storedTopic) {
        try {
          const session = client.session.get(storedTopic);
          if (session && hasQubicAccounts(session)) {
            setSessionTopic(storedTopic);
            setIsConnected(true);
          } else {
            localStorage.removeItem('sessionTopic');
            clearStoredWalletConnectWallet();
          }
        } catch (error) {
          console.warn('Failed to restore WalletConnect session:', error);
          localStorage.removeItem('sessionTopic');
          clearStoredWalletConnectWallet();
        }
      }

      client.on('session_delete', clearSession);
      client.on('session_expire', clearSession);
      client.on('session_event', handleSessionEvent);
      client.on('session_update', handleSessionUpdate);

      setIsInitialized(true);
    }).catch((error) => {
      console.error('Failed to initialize WalletConnect:', error);
      if (mounted) {
        setIsInitialized(true);
      }
    });

    return () => {
      mounted = false;
      if (activeClient) {
        activeClient.off('session_delete', clearSession);
        activeClient.off('session_expire', clearSession);
        activeClient.off('session_event', handleSessionEvent);
        activeClient.off('session_update', handleSessionUpdate);
      }
    };
  }, []);

  const contextValue = {
    signClient,
    sessionTopic,
    isConnecting,
    isConnected,
    isInitialized,
    connect,
    disconnect,
    requestAccounts,
    sendQubic,
    signTransaction,
    signMessage,
  };

  return (
    <WalletConnectContext.Provider value={contextValue}>
      {children}
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnect() {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error(
      'useWalletConnect must be used within a WalletConnectProvider'
    );
  }
  return context;
}
