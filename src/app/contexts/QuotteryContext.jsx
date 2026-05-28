import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
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
  getNetworkTick,
  getEntityBalance,
  getQtryGovBalance,
} from '../components/qubic/util/bobApi';
import { excludedEventIds } from '../components/qubic/util/commons';
import { useTickRate } from '../hooks/useTickRate';

const QuotteryContext = createContext();
const TICK_SETTINGS_KEY = 'quottery.txTickSettings';
const DEFAULT_TICK_SETTINGS = {
  mode: 'approval',
  fixedTicks: 20,
  approvalSeconds: 15,
};
const WHOLE_SHARE_PRICE = 100000;
const OPEN_ORDERS_CONCURRENCY = 6;
const excludedEventIdSet = new Set(excludedEventIds.map(Number));

function filterVisibleEvents(events) {
  return (Array.isArray(events) ? events : []).filter((event) => {
    const eventId = Number(event?.eid ?? event?.eventId);
    return Number.isFinite(eventId) && !excludedEventIdSet.has(eventId);
  });
}

async function runWithConcurrency(items, limit, task) {
  const results = [];
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await task(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
}

function readTickSettings() {
  if (typeof window === 'undefined') return DEFAULT_TICK_SETTINGS;

  try {
    const raw = window.localStorage.getItem(TICK_SETTINGS_KEY);
    if (!raw) return DEFAULT_TICK_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      mode: parsed?.mode === 'fixed' ? 'fixed' : 'approval',
      fixedTicks: Math.min(300, Math.max(15, Number(parsed?.fixedTicks || DEFAULT_TICK_SETTINGS.fixedTicks))),
      approvalSeconds: Math.min(60, Math.max(5, Number(parsed?.approvalSeconds || DEFAULT_TICK_SETTINGS.approvalSeconds))),
    };
  } catch {
    return DEFAULT_TICK_SETTINGS;
  }
}

export const QuotteryProvider = ({ children }) => {
  const [allEvents, setAllEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const { wallet } = useQubicConnect();
  const [balance, setBalance] = useState(null);
  const [quBalance, setQuBalance] = useState(null);
  const [qtryGovBalance, setQtryGovBalance] = useState(null);
  const [eventPositions, setEventPositions] = useState(null);
  const [walletPublicIdentity, setWalletPublicIdentity] = useState('');
  const [walletPublicKeyBytes, setWalletPublicKeyBytes] = useState(null);
  const [currentFilterOption, setCurrentFilterOption] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [inputPage, setInputPage] = useState('');
  const [txTickSettings, setTxTickSettingsState] = useState(readTickSettings);
  const { bobUrl } = useConfig();
  const allEventsRef = useRef(allEvents);

  useEffect(() => {
    allEventsRef.current = allEvents;
  }, [allEvents]);

  // Shared order book state
  const [orderbook, setOrderbook] = useState(null);
  const [obLoading, setObLoading] = useState(false);
  const [obError, setObError] = useState(null);

  // Adaptive tick rate measurement
  const { tickRate, tickSource, bobLag, adaptiveOffset, getScheduledTick } = useTickRate(bobUrl, txTickSettings);

  const setTxTickSettings = useCallback((patch) => {
    setTxTickSettingsState((prev) => {
      const next = {
        ...prev,
        ...patch,
      };

      const normalized = {
        mode: next.mode === 'fixed' ? 'fixed' : 'approval',
        fixedTicks: Math.min(300, Math.max(15, Number(next.fixedTicks || DEFAULT_TICK_SETTINGS.fixedTicks))),
        approvalSeconds: Math.min(60, Math.max(5, Number(next.approvalSeconds || DEFAULT_TICK_SETTINGS.approvalSeconds))),
      };

      try {
        window.localStorage.setItem(TICK_SETTINGS_KEY, JSON.stringify(normalized));
      } catch {
        // Ignore storage failures; the in-memory setting still applies.
      }

      return normalized;
    });
  }, []);

  const getCurrentTick = async () => {
    const tickInfo = await getNetworkTick(bobUrl);
    return tickInfo.tick;
  };

  // Fetch all active events from the SC via Bob
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const events = await fetchAllActiveEvents(bobUrl);
      setAllEvents(filterVisibleEvents(events));
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

  const fetchQtryGovBalance = async (publicId) => {
    const identity = publicId || walletPublicIdentity;
    if (!identity) return null;
    try {
      const gov = await getQtryGovBalance(bobUrl, identity);
      setQtryGovBalance(gov);
      return gov;
    } catch (e) {
      console.warn('Error fetching QTRYGOV balance:', e);
      setQtryGovBalance(null);
      return null;
    }
  };

  // Fetch user's open orders — query all 4 sides for all active events
  // This is more expensive via Bob since there's no "orders by user" function.
  // We query the order book for each active event and filter by the user's identity.
  const fetchOpenOrders = useCallback(async (walletIdentity = walletPublicIdentity) => {
    if (!walletIdentity) {
      return { identity: null, orders: [] };
    }

    try {
      let events = allEventsRef.current || [];
      if (events.length === 0) {
        events = filterVisibleEvents(await fetchAllActiveEvents(bobUrl));
        allEventsRef.current = events;
        setAllEvents(events);
      }

      const identityPrefix = walletIdentity.slice(0, 56);
      const queries = [];

      for (const evt of events || []) {
        const eid = evt.eid ?? evt.eventId;
        if (eid === undefined || eid === null) continue;

        queries.push(
            { evt, eid, option: 0, isBid: true, side: 'buy' },
            { evt, eid, option: 0, isBid: false, side: 'sell' },
            { evt, eid, option: 1, isBid: true, side: 'buy' },
            { evt, eid, option: 1, isBid: false, side: 'sell' },
        );
      }

      const results = await runWithConcurrency(
          queries,
          OPEN_ORDERS_CONCURRENCY,
          async ({ evt, eid, option, isBid, side }) => {
          try {
            const orders = await getOrders(bobUrl, eid, option, isBid);
            return orders
                .filter((order) => order.entity === identityPrefix)
                .map((order) => ({
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
                }));
          } catch (e) {
            // Skip failed queries for individual sides
            console.warn(`Failed to fetch orders for event ${eid}, option ${option}, ${side}:`, e);
            return [];
          }
          }
      );

      const userOrders = results.flat();

      return {
        identity: walletIdentity,
        orders: userOrders,
      };
    } catch (error) {
      console.error('Error fetching open orders:', error);
      return { identity: walletIdentity, orders: [], error };
    }
  }, [bobUrl, walletPublicIdentity]);

  useEffect(() => {
    let cancelled = false;

    const getIdentityAndBalance = async () => {
      const qHelper = new QubicHelper();
      if (!wallet) {
        setWalletPublicIdentity('');
        setWalletPublicKeyBytes(null);
        setBalance(null);
        setQuBalance(null);
        setQtryGovBalance(null);
        setEventPositions(null);
        return;
      }

      const publicKeyBytes = await qHelper.getIdentityBytes(wallet.publicKey);
      if (cancelled) return;

      setWalletPublicIdentity(wallet.publicKey);
      setWalletPublicKeyBytes(publicKeyBytes);
      fetchBalance(wallet.publicKey);
      fetchQtryGovBalance(wallet.publicKey);
    };

    getIdentityAndBalance();
    return () => {
      cancelled = true;
    };
    // fetchBalance intentionally reads current balance/position state for diffing.
    // Re-running this effect on every balance update would trigger extra network calls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  // Build unified order book side entries for display.
  // Opposite-option orders are flipped so BUY YES @ 75k also appears as SELL NO @ 25k.
  const buildOrderSideEntries = (book, tabIndex, side) => {
    if (!book) return [];

    const optionKey = tabIndex === 0 ? 'option0' : 'option1';
    const oppositeOptionKey = tabIndex === 0 ? 'option1' : 'option0';
    const optionData = book[optionKey];
    const oppositeOptionData = book[oppositeOptionKey];
    if (!optionData) return [];

    const isBidSide = side === 'bids';
    const directSource = isBidSide ? optionData.bids : optionData.asks;
    const flippedSource = isBidSide ? oppositeOptionData?.asks : oppositeOptionData?.bids;

    const aggregatedByPrice = new Map();

    const addEntry = (entry, flipPrice = false) => {
      const rawPrice = Number(entry?.price ?? 0);
      const amount = Number(entry?.amount ?? 0);
      if (!Number.isFinite(rawPrice) || !Number.isFinite(amount) || amount <= 0) return;

      const price = flipPrice ? WHOLE_SHARE_PRICE - rawPrice : rawPrice;
      if (!Number.isFinite(price) || price < 0) return;
      aggregatedByPrice.set(price, (aggregatedByPrice.get(price) || 0) + amount);
    };

    if (Array.isArray(directSource)) {
      for (const entry of directSource) addEntry(entry);
    }

    if (Array.isArray(flippedSource)) {
      for (const entry of flippedSource) addEntry(entry, true);
    }

    return Array.from(aggregatedByPrice, ([price, amount]) => ({ price, amount }))
        .sort((a, b) => isBidSide ? b.price - a.price : a.price - b.price);
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
    qtryGovBalance,
    fetchBalance,
    fetchQuBalance,
    fetchQtryGovBalance,
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
    tickSource,
    bobLag,
    adaptiveOffset,
    txTickSettings,
    setTxTickSettings,
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
