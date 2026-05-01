import { useState, useEffect, useCallback, useRef } from 'react';
import { getLatestTick, getTxByHash } from '../components/qubic/util/bobApi';
import { useConfig } from '../contexts/ConfigContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useQuotteryContext } from '../contexts/QuotteryContext';


export function useTxTracker() {
    const [pendingTxs, setPendingTxs] = useState([]);
    const { bobUrl } = useConfig();
    const { showSnackbar } = useSnackbar();
    const { walletPublicIdentity, fetchBalance, fetchOpenOrders } = useQuotteryContext();
    const intervalRef = useRef(null);

    const trackTx = useCallback((tx) => {
        setPendingTxs((prev) => [
            ...prev,
            {
                ...tx,
                id: tx.txHash || `tx-${Date.now()}`,
                addedAt: Date.now(),
                status: 'pending',
                checked: false,
            },
        ]);
    }, []);

    const removeTx = useCallback((txId) => {
        setPendingTxs((prev) => prev.filter((t) => t.id !== txId));
    }, []);

    const hasMatchingOpenOrder = useCallback(async (tx) => {
        if (tx.type !== 'order' || !walletPublicIdentity || !fetchOpenOrders) return false;

        const result = await fetchOpenOrders(walletPublicIdentity);
        const orders = result?.orders || [];
        return orders.some((order) =>
            String(order.market_id) === String(tx.eventId) &&
            Number(order.option) === Number(tx.option) &&
            String(order.side) === String(tx.side) &&
            Number(order.price) === Number(tx.price) &&
            Number(order.qty) >= Number(tx.amount)
        );
    }, [walletPublicIdentity, fetchOpenOrders]);

    useEffect(() => {
        if (pendingTxs.length === 0) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        if (intervalRef.current) return;

        intervalRef.current = setInterval(async () => {
            if (!bobUrl) return;

            try {
                const currentTick = await getLatestTick(bobUrl);
                if (!currentTick) return;

                for (const tx of pendingTxs) {
                    if (tx.status !== 'pending') continue;

                    // Before tick passes: try GET /tx/{hash} for early confirmation
                    if (tx.txHash && tx.scheduledTick) {
                        const txData = await getTxByHash(bobUrl, tx.txHash);
                        if (txData && tx.type !== 'order') {
                            showSnackbar(
                                `Tx confirmed on tick ${tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`,
                                'success'
                            );
                            removeTx(tx.id);
                            if (walletPublicIdentity && fetchBalance) {
                                fetchBalance(walletPublicIdentity);
                            }
                            continue;
                        }
                    }

                    // After tick passes: final check
                    if (currentTick > tx.scheduledTick && !tx.checked) {
                        setPendingTxs((prev) =>
                            prev.map((t) => t.id === tx.id ? { ...t, checked: true } : t)
                        );

                        // Try /tx/{hash} one final time
                        let txFound = false;
                        if (tx.txHash) {
                            const txData = await getTxByHash(bobUrl, tx.txHash);
                            txFound = !!txData;
                        }

                        if (txFound) {
                            if (tx.type === 'order') {
                                const orderFound = await hasMatchingOpenOrder(tx);
                                showSnackbar(
                                    orderFound
                                        ? `Order added at tick ${tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`
                                        : `Transaction was included, but the order was not added. The event may be closed or the balance/position was insufficient.\nTx: ${tx.txHash}`,
                                    orderFound ? 'success' : 'warning'
                                );
                            } else {
                                showSnackbar(
                                    `Tx confirmed at tick ${tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`,
                                    'success'
                                );
                            }
                            if (walletPublicIdentity && fetchBalance) {
                                fetchBalance(walletPublicIdentity);
                            }
                            removeTx(tx.id);
                            continue;
                        }

                        // Check balance for state change (matches cause balance/position changes)
                        let balanceChanged = false;
                        if (walletPublicIdentity && fetchBalance) {
                            const result = await fetchBalance(walletPublicIdentity);
                            balanceChanged = result?.changed || result?.balanceChanged || result?.positionsChanged;
                        }

                        if (balanceChanged && tx.type !== 'order') {
                            showSnackbar(
                                `Tx executed at tick ${tx.scheduledTick}: ${tx.description || ''}\n${tx.txHash ? 'Tx: ' + tx.txHash : ''}`,
                                'success'
                            );
                        } else if (tx.type === 'order') {
                            const orderFound = await hasMatchingOpenOrder(tx);
                            showSnackbar(
                                orderFound
                                    ? `Order added at tick ${tx.scheduledTick}: ${tx.description || ''}`
                                    : `Could not verify that the order was added. Please refresh the order book before trying again.`,
                                orderFound ? 'success' : 'warning'
                            );
                        } else {
                            showSnackbar(
                                `Could not verify tx execution at tick ${tx.scheduledTick}. Check manually.\n${tx.txHash ? 'Tx: ' + tx.txHash : ''}`,
                                'info'
                            );
                        }

                        removeTx(tx.id);
                        continue;
                    }

                    // Timeout after 3 minutes
                    if (Date.now() - tx.addedAt > 180000) {
                        showSnackbar(
                            `Tx tracking timed out for tick ${tx.scheduledTick}. Check manually.\n${tx.txHash ? 'Tx: ' + tx.txHash : ''}`,
                            'warning'
                        );
                        removeTx(tx.id);
                    }
                }
            } catch (e) {
                console.warn('[useTxTracker] poll error:', e);
            }
        }, 3000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [pendingTxs, bobUrl, walletPublicIdentity, fetchBalance, showSnackbar, removeTx, hasMatchingOpenOrder]);

    return { trackTx, pendingTxs };
}
