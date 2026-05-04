import { useState, useEffect, useCallback, useRef } from 'react';
import { getNetworkTick, getTxByHash } from '../components/qubic/util/bobApi';
import { useConfig } from '../contexts/ConfigContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useQuotteryContext } from '../contexts/QuotteryContext';
import { verifyTxWithBobLogs } from '../components/qubic/util/txLogVerifier';


export function useTxTracker() {
    const [pendingTxs, setPendingTxs] = useState([]);
    const { bobUrl } = useConfig();
    const { showSnackbar, closeSnackbar } = useSnackbar();
    const {
        walletPublicIdentity,
        fetchBalance,
        fetchQuBalance,
        fetchQtryGovBalance,
        fetchOpenOrders,
    } = useQuotteryContext();
    const intervalRef = useRef(null);

    const trackTx = useCallback((tx) => {
        const waitingSnackbarId = showSnackbar(
            `Checking transaction execution for tick ${tx.scheduledTick}: ${tx.description || ''}\n${tx.txHash ? 'Tx: ' + tx.txHash : ''}`,
            'info',
            { loading: true, autoHideDuration: null }
        );

        setPendingTxs((prev) => [
            ...prev,
            {
                ...tx,
                id: tx.txHash || `tx-${Date.now()}`,
                addedAt: Date.now(),
                status: 'pending',
                checked: false,
                waitingSnackbarId,
            },
        ]);
    }, [showSnackbar]);

    const removeTx = useCallback((txId) => {
        setPendingTxs((prev) => {
            const tx = prev.find((t) => t.id === txId);
            if (tx?.waitingSnackbarId) {
                closeSnackbar(tx.waitingSnackbarId);
            }
            return prev.filter((t) => t.id !== txId);
        });
    }, [closeSnackbar]);

    const refreshWalletBalances = useCallback(async () => {
        if (!walletPublicIdentity) return null;

        const [balanceResult] = await Promise.all([
            fetchBalance ? fetchBalance(walletPublicIdentity) : Promise.resolve(null),
            fetchQuBalance ? fetchQuBalance(walletPublicIdentity) : Promise.resolve(null),
            fetchQtryGovBalance ? fetchQtryGovBalance(walletPublicIdentity) : Promise.resolve(null),
        ]);

        return balanceResult;
    }, [walletPublicIdentity, fetchBalance, fetchQuBalance, fetchQtryGovBalance]);

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
                const tickInfo = await getNetworkTick(bobUrl);
                const currentTick = tickInfo.tick;
                if (!currentTick) return;

                for (const tx of pendingTxs) {
                    if (tx.status !== 'pending') continue;

                    // Timeout after 3 minutes
                    if (Date.now() - tx.addedAt > 180000) {
                        showSnackbar(
                            `Tx tracking timed out for tick ${tx.scheduledTick}. Check manually.\n${tx.txHash ? 'Tx: ' + tx.txHash : ''}`,
                            'warning'
                        );
                        removeTx(tx.id);
                        continue;
                    }

                    // Before tick passes: try GET /tx/{hash} for early confirmation
                    if (tx.txHash && tx.scheduledTick) {
                        const txData = await getTxByHash(bobUrl, tx.txHash);
                        if (txData && tx.type !== 'order') {
                            showSnackbar(
                                `Tx confirmed on tick ${tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`,
                                'success'
                            );
                            removeTx(tx.id);
                            refreshWalletBalances();
                            continue;
                        }
                    }

                    // After tick passes: final check
                    const networkTickPassed = currentTick > tx.scheduledTick;

                    if (networkTickPassed && !tx.checked) {
                        setPendingTxs((prev) =>
                            prev.map((t) => t.id === tx.id ? { ...t, checked: true } : t)
                        );

                        if (tx.txHash) {
                            try {
                                const logVerification = await verifyTxWithBobLogs(bobUrl, tx, walletPublicIdentity);

                                if (logVerification.verified) {
                                    if (tx.type === 'order') {
                                        const isRemove = tx.action === 'remove';
                                        showSnackbar(
                                            `${isRemove ? 'Order cancelled' : 'Order added'} at tick ${logVerification.tick || tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`,
                                            'success'
                                        );
                                    } else {
                                        showSnackbar(
                                            `Tx executed at tick ${logVerification.tick || tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`,
                                            'success'
                                        );
                                    }
                                    refreshWalletBalances();
                                    removeTx(tx.id);
                                    continue;
                                }

                                if (logVerification.inconclusive === false) {
                                    showSnackbar(
                                        `Tx was included but not executed at tick ${tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`,
                                        'warning'
                                    );
                                    refreshWalletBalances();
                                    removeTx(tx.id);
                                    continue;
                                }
                            } catch (e) {
                                console.warn('[useTxTracker] Bob log verification unavailable:', e);
                            }
                        }

                        // Try /tx/{hash} one final time
                        let txFound = false;
                        if (tx.txHash) {
                            const txData = await getTxByHash(bobUrl, tx.txHash);
                            txFound = !!txData;
                        }

                        if (txFound) {
                            if (tx.type === 'order') {
                                const orderFound = await hasMatchingOpenOrder(tx);
                                const isRemove = tx.action === 'remove';
                                const success = isRemove ? !orderFound : orderFound;
                                showSnackbar(
                                    success
                                        ? `${isRemove ? 'Order cancelled' : 'Order added'} at tick ${tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`
                                        : isRemove
                                            ? `Transaction was included, but the order still appears open. Please refresh before trying again.\nTx: ${tx.txHash}`
                                            : `Transaction was included, but the order was not added. The event may be closed or the balance/position was insufficient.\nTx: ${tx.txHash}`,
                                    success ? 'success' : 'warning'
                                );
                            } else {
                                showSnackbar(
                                    `Tx confirmed at tick ${tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`,
                                    'success'
                                );
                            }
                            refreshWalletBalances();
                            removeTx(tx.id);
                            continue;
                        }

                        // Check balance for state change (matches cause balance/position changes)
                        let balanceChanged = false;
                        if (walletPublicIdentity && fetchBalance) {
                            const result = await refreshWalletBalances();
                            balanceChanged = result?.changed || result?.balanceChanged || result?.positionsChanged;
                        }

                        if (balanceChanged && tx.type !== 'order') {
                            showSnackbar(
                                `Tx executed at tick ${tx.scheduledTick}: ${tx.description || ''}\n${tx.txHash ? 'Tx: ' + tx.txHash : ''}`,
                                'success'
                            );
                        } else if (tx.type === 'order') {
                            const orderFound = await hasMatchingOpenOrder(tx);
                            const isRemove = tx.action === 'remove';
                            const success = isRemove ? !orderFound : orderFound;
                            showSnackbar(
                                success
                                    ? `${isRemove ? 'Order cancelled' : 'Order added'} at tick ${tx.scheduledTick}: ${tx.description || ''}`
                                    : isRemove
                                        ? `Could not verify that the order was cancelled. Please refresh before trying again.`
                                        : `Could not verify that the order was added. Please refresh the order book before trying again.`,
                                success ? 'success' : 'warning'
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
    }, [pendingTxs, bobUrl, walletPublicIdentity, fetchBalance, showSnackbar, removeTx, hasMatchingOpenOrder, refreshWalletBalances]);

    return { trackTx, pendingTxs };
}
