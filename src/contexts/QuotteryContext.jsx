import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper';
import { useQubicConnect } from '../components/qubic/connect/QubicConnectContext';
import { useConfig } from './ConfigContext';
import {
  fetchAllActiveEvents,
  fetchFullOrderbook,
  fetchUserBalanceAndPositions,
  getOrders,
  getLatestTick,
  getEntityBalance,
} from '../components/qubic/util/bobApi';
import { useTickRate } from '../hooks/useTickRate';

const QuotteryContext = createContext();

export const QuotteryProvider = ({ children }) => {
  const [allEvents, setAllEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const { wallet } = useQubicConnect();
  const [balance, setBalance] = useState(null);
  const [quBalance, setQuBalance] = useState(null);
  const [eventPositions, setEventPositions] = useState(null);
  const [walletPublicIdentity, setWalletPublicIdentity] = useState('');
  const [walletPublicKeyBytes, setWalletPublicKeyBytes] = useState(null);
  const [currentFilterOption, setCurrentFilterOption] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [inputPage, setInputPage] = useState('');
  const { bobUrl } = useConfig();

  // Shared order book state
  const [orderbook, setOrderbook] = useState(null);
  const [obLoading, setObLoading] = useState(false);
  const [obError, setObError] = useState(null);

  // Adaptive tick rate measurement
  const { tickRate, adaptiveOffset, getScheduledTick } = useTickRate(bobUrl);

  const getCurrentTick = async () => {
    return await getLatestTick(bobUrl);
  };

  // Fetch all active events from the SC via Bob
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const events = await fetchAllActiveEvents(bobUrl);
      setAllEvents(events || []);
    } catch (error) {
      console.error('Error fetching events via Bob:', error);
      setAllEvents([]);
    }
    setLoading(false);
  };

  // Fetch user balance (approved GARTH) and positions
  const fetchBalance = async (publicId) => {
    try {
      const prevBalance = balance;
      const prevPositions = eventPositions;

      const result = await fetchUserBalanceAndPositions(bobUrl, publicId);

      const newBalance = result.balance;
      const newPositions = result.positions || [];

      setBalance(newBalance);
      setEventPositions(newPositions);

      const balanceChanged =
          prevBalance !== null && newBalance !== prevBalance;

      let positionsChanged = false;
      const positionsChangedText = [];

      if (prevPositions !== null) {
        try {
          const getKey = (p) => `${p.eventId}-${p.option}`;

          const prevMap = new Map(prevPositions.map((p) => [getKey(p), p]));
          const newMap = new Map(newPositions.map((p) => [getKey(p), p]));

          // Check for New or Changed
          for (const p of newPositions) {
            const key = getKey(p);
            const evt = allEvents?.find(
                (e) => String(e.eid) === String(p.eventId)
            );
            const eventName = evt ? evt.desc : `Event #${p.eventId}`;
            const optionDesc = p.option === 0
                ? (evt?.option0Desc || 'Option 0')
                : (evt?.option1Desc || 'Option 1');

            if (!prevMap.has(key)) {
              positionsChangedText.push(
                  `New position: ${p.amount} shares for ${optionDesc} of ${eventName}`
              );
            } else {
              const prevP = prevMap.get(key);
              if (p.amount !== prevP.amount) {
                const diff = p.amount - prevP.amount;
                const action = diff > 0 ? 'Added' : 'Removed';
                positionsChangedText.push(
                    `${action} ${Math.abs(diff)} shares for ${optionDesc} of ${eventName}`
                );
              }
            }
          }

          // Check for Removed
          for (const p of prevPositions) {
            if (!newMap.has(getKey(p))) {
              const evt = allEvents?.find(
                  (e) => String(e.eid) === String(p.eventId)
              );
              const eventName = evt ? evt.desc : `Event #${p.eventId}`;
              const optionDesc = p.option === 0
                  ? (evt?.option0Desc || 'Option 0')
                  : (evt?.option1Desc || 'Option 1');
              positionsChangedText.push(
                  `Sold position: ${p.amount} shares for ${optionDesc} of ${eventName}`
              );
            }
          }

          positionsChanged = positionsChangedText.length > 0;

          if (!positionsChanged) {
            const prevStr = JSON.stringify(prevPositions ?? []);
            const nextStr = JSON.stringify(newPositions ?? []);
            positionsChanged = prevStr !== nextStr;
          }
        } catch (e) {
          positionsChanged =
              !!prevPositions &&
              !!newPositions &&
              prevPositions !== newPositions;
        }
      }

      const changed = balanceChanged || positionsChanged;
      return {
        changed,
        balanceChanged,
        positionsChanged,
        positionsChangedText,
        prevBalance,
        newBalance,
        prevPositions,
        newPositions,
      };
    } catch (error) {
      console.error('Error fetching balance:', error);
      return {
        changed: false,
        balanceChanged: false,
        positionsChanged: false,
        prevBalance: balance,
        newBalance: balance,
        prevPositions: eventPositions,
        newPositions: eventPositions,
        error,
      };
    }
  };

  // Fetch QU balance
  const fetchQuBalance = async (publicId) => {
    const identity = publicId || walletPublicIdentity;
    if (!identity) return null;
    try {
      const qu = await getEntityBalance(bobUrl, identity);
      setQuBalance(qu);
      return qu;
    } catch (e) {
      console.warn('Error fetching QU balance:', e);
      return null;
    }
  };

  // Fetch user's open orders — query all 4 sides for all active events
  // This is more expensive via Bob since there's no "orders by user" function.
  // We query the order book for each active event and filter by the user's identity.
  const fetchOpenOrders = async (walletIdentity = walletPublicIdentity) => {
    if (!walletIdentity) {
      return { identity: null, orders: [] };
    }

    try {
      const events = allEvents || [];
      const userOrders = [];

      for (const evt of events) {
        const eid = evt.eid ?? evt.eventId;
        if (eid === undefined || eid === null) continue;

        // Query all 4 order book sides
        const sides = [
          { option: 0, isBid: true, side: 'buy' },
          { option: 0, isBid: false, side: 'sell' },
          { option: 1, isBid: true, side: 'buy' },
          { option: 1, isBid: false, side: 'sell' },
        ];

        for (const { option, isBid, side } of sides) {
          try {
            const orders = await getOrders(bobUrl, eid, option, isBid);
            for (const order of orders) {
              if (order.entity === walletIdentity.slice(0, 56)) {
                userOrders.push({
                  order_id: `${eid}-${option}-${isBid ? 'bid' : 'ask'}-${order.price}`,
                  market_id: eid,
                  event_desc: evt.desc || `Event #${eid}`,
                  option,
                  side,
                  price: order.price,
                  qty: order.amount,
                  filled: 0,
                  status: 'open',
                  isBid,
                });
              }
            }
          } catch (e) {
            // Skip failed queries for individual sides
            console.warn(`Failed to fetch orders for event ${eid}, option ${option}, ${side}:`, e);
          }
        }
      }

      return {
        identity: walletIdentity,
        orders: userOrders,
      };
    } catch (error) {
      console.error('Error fetching open orders:', error);
      return { identity: walletIdentity, orders: [], error };
    }
  };

  useEffect(() => {
    const getIdentityAndBalance = async () => {
      const qHelper = new QubicHelper();
      if (wallet) {
        setWalletPublicIdentity(wallet.publicKey);
        setWalletPublicKeyBytes(
            await qHelper.getIdentityBytes(wallet.publicKey)
        );
        fetchBalance(wallet.publicKey);
      }
    };

    getIdentityAndBalance();
    return () => {};
    // fetchBalance intentionally reads current balance/position state for diffing.
    // Re-running this effect on every balance update would trigger extra network calls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  // Build order book side entries for display
  const buildOrderSideEntries = (book, tabIndex, side) => {
    if (!book) return [];

    const optionKey = tabIndex === 0 ? 'option0' : 'option1';
    const optionData = book[optionKey];
    if (!optionData) return [];

    const isBidSide = side === 'bids';
    const source = isBidSide ? optionData.bids : optionData.asks;

    if (!Array.isArray(source)) return [];

    return source.map((entry) => ({
      price: Number(entry?.price ?? 0),
      amount: Number(entry?.amount ?? 0),
    }));
  };

  // Fetch orderbook for a specific event via Bob
  const fetchOrderbook = useCallback(
      async (eid, isCancelled) => {
        if (eid === undefined || eid < 0 || eid === null) return;
        setObLoading(true);
        setObError(null);

        try {
          const data = await fetchFullOrderbook(bobUrl, eid);
          if (!isCancelled || !isCancelled()) {
            setOrderbook(data);
          }
        } catch (err) {
          console.error('Error fetching orderbook:', err);
          if (!isCancelled || !isCancelled()) {
            setObError(err.message || 'Failed to load order book');
          }
        } finally {
          if (!isCancelled || !isCancelled()) {
            setObLoading(false);
          }
        }
      },
      [bobUrl]
  );

  const value = {
    allEvents,
    setAllEvents,
    loading,
    fetchEvents,
    walletPublicIdentity,
    walletPublicKeyBytes,
    balance,
    quBalance,
    fetchBalance,
    fetchQuBalance,
    eventPositions,
    setEventPositions,
    currentFilterOption,
    setCurrentFilterOption,
    currentPage,
    setCurrentPage,
    inputPage,
    setInputPage,
    getCurrentTick,
    getScheduledTick,
    tickRate,
    adaptiveOffset,
    buildOrderSideEntries,
    orderbook,
    obLoading,
    obError,
    fetchOrderbook,
    fetchOpenOrders,
  };

  return (
      <QuotteryContext.Provider value={value}>
        {children}
      </QuotteryContext.Provider>
  );
};

export const useQuotteryContext = () => useContext(QuotteryContext);
