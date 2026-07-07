import { useState, useEffect, useCallback, useRef } from 'react';
import { getNetworkTick, getTxByHash } from '../components/qubic/util/bobApi';
import { useConfig } from '../contexts/ConfigContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useQuotteryContext } from '../contexts/QuotteryContext';
import { verifyTxWithBobLogs, verifyTxWithPublicRpcLogs } from '../components/qubic/util/txLogVerifier';
import { getIndexerStatus } from '../api/quotteryApi';

const txTrackingId = (tx) => (
    tx.txHash ||
    [
        tx.scheduledTick,
        tx.inputType,
        tx.type,
        tx.action,
        tx.eventId,
        tx.option,
        tx.side,
        tx.amount,
        tx.price,
    ].filter((value) => value !== undefined && value !== null).join(':') ||
    `tx-${Date.now()}`
);

const wasTxNotExecuted = (txData) => txData?.moneyFlew === false || txData?.moneyFlew === 'false';
const wasTxExecuted = (txData) => txData && !wasTxNotExecuted(txData);
const PUBLIC_TX_VERIFY_DELAY_MS = 3000;

async function getLastIndexedTick() {
    try {
        const body = await getIndexerStatus();
        const tick = Number(body?.status?.lastIndexedTick || 0);
        return Number.isFinite(tick) && tick > 0 ? tick : 0;
    } catch {
        return 0;
    }
}

async function hasReliableTickPastTx(tx, tickInfo) {
    const scheduledTick = Number(tx?.scheduledTick || 0);
    if (!Number.isFinite(scheduledTick) || scheduledTick <= 0) return false;

    const publicTick = Number(tickInfo?.publicTick || 0);
    if (Number.isFinite(publicTick) && publicTick > scheduledTick) return true;

    if (tickInfo?.source === 'public') {
        const tick = Number(tickInfo?.tick || 0);
        if (Number.isFinite(tick) && tick > scheduledTick) return true;
    }

    const lastIndexedTick = await getLastIndexedTick();
    return lastIndexedTick > scheduledTick;
}

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
    const trackedTxIdsRef = useRef(new Set());

    const trackTx = useCallback((tx) => {
        const id = txTrackingId(tx);
        if (trackedTxIdsRef.current.has(id)) {
            return id;
        }

        trackedTxIdsRef.current.add(id);
        const waitingSnackbarId = showSnackbar(
            `Checking transaction execution for tick ${tx.scheduledTick}: ${tx.description || ''}\n${tx.txHash ? 'Tx: ' + tx.txHash : ''}`,
            'info',
            { loading: true, autoHideDuration: null }
        );

        setPendingTxs((prev) => {
            if (prev.some((pendingTx) => pendingTx.id === id)) {
                closeSnackbar(waitingSnackbarId);
                return prev;
            }

            return [
                ...prev,
                {
                    ...tx,
                    id,
                    addedAt: Date.now(),
                    status: 'pending',
                    checked: false,
                    waitingSnackbarId,
                },
            ];
        });

        return id;
    }, [closeSnackbar, showSnackbar]);

    const removeTx = useCallback((txId) => {
        setPendingTxs((prev) => {
            const tx = prev.find((t) => t.id === txId);
            if (tx?.waitingSnackbarId) {
                closeSnackbar(tx.waitingSnackbarId);
            }
            trackedTxIdsRef.current.delete(txId);
            return prev.filter((t) => t.id !== txId);
        });
    }, [closeSnackbar]);

    const notifyTxSuccess = useCallback((tx, result = {}) => {
        try {
            tx.onSuccess?.(result);
        } catch (e) {
            console.warn('[useTxTracker] onSuccess callback failed:', e);
        }
    }, []);

    const notifyTxFailure = useCallback((tx, result = {}) => {
        try {
            tx.onFailure?.(result);
        } catch (e) {
            console.warn('[useTxTracker] onFailure callback failed:', e);
        }
    }, []);

    const notifyTxTimeout = useCallback((tx, result = {}) => {
        try {
            tx.onTimeout?.(result);
        } catch (e) {
            console.warn('[useTxTracker] onTimeout callback failed:', e);
        }
    }, []);

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
                        notifyTxTimeout(tx, { reason: 'timeout' });
                        removeTx(tx.id);
                        continue;
                    }

                    // Before tick passes: try GET /tx/{hash} for early confirmation
                    if (tx.txHash && tx.scheduledTick) {
                        const txData = await getTxByHash(bobUrl, tx.txHash);
                        if (wasTxExecuted(txData) && tx.type !== 'order') {
                            showSnackbar(
                                `Tx confirmed on tick ${tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`,
                                'success'
                            );
                            notifyTxSuccess(tx, { reason: 'tx_found', tick: tx.scheduledTick });
                            removeTx(tx.id);
                            refreshWalletBalances();
                            continue;
                        }
                    }

                    // After tick passes: final check
                    const networkTickPassed = currentTick > tx.scheduledTick;

                    if (networkTickPassed && !tx.checked) {
                        if (tickInfo.source === 'public') {
                            const verifyAfter = tx.publicVerifyAfter || (Date.now() + PUBLIC_TX_VERIFY_DELAY_MS);
                            if (!tx.publicVerifyAfter || Date.now() < verifyAfter) {
                                setPendingTxs((prev) =>
                                    prev.map((t) => t.id === tx.id ? { ...t, publicVerifyAfter: verifyAfter } : t)
                                );
                                continue;
                            }
                        }

                        setPendingTxs((prev) =>
                            prev.map((t) => t.id === tx.id ? { ...t, checked: true } : t)
                        );

                        if (tx.txHash && tickInfo.source === 'public') {
                            try {
                                const logVerification = await verifyTxWithPublicRpcLogs(tx, walletPublicIdentity);

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
                                    notifyTxSuccess(tx, { reason: 'logs_verified', tick: logVerification.tick || tx.scheduledTick });
                                    removeTx(tx.id);
                                    continue;
                                }

                                if (logVerification.inconclusive === false) {
                                    showSnackbar(
                                        `Tx was included but not executed at tick ${tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`,
                                        'warning'
                                    );
                                    refreshWalletBalances();
                                    notifyTxFailure(tx, { reason: 'not_executed', tick: tx.scheduledTick });
                                    removeTx(tx.id);
                                    continue;
                                }
                            } catch (e) {
                                console.warn('[useTxTracker] Public RPC log verification unavailable:', e);
                            }
                        }

                        if (tx.txHash && tickInfo.source !== 'public') {
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
                                    notifyTxSuccess(tx, { reason: 'logs_verified', tick: logVerification.tick || tx.scheduledTick });
                                    removeTx(tx.id);
                                    continue;
                                }

                                if (logVerification.inconclusive === false) {
                                    showSnackbar(
                                        `Tx was included but not executed at tick ${tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`,
                                        'warning'
                                    );
                                    refreshWalletBalances();
                                    notifyTxFailure(tx, { reason: 'not_executed', tick: tx.scheduledTick });
                                    removeTx(tx.id);
                                    continue;
                                }
                            } catch (e) {
                                console.warn('[useTxTracker] Bob log verification unavailable:', e);
                            }
                        }

                        // Try /tx/{hash} one final time
                        let txFound = false;
                        let txNotExecuted = false;
                        if (tx.txHash) {
                            const txData = await getTxByHash(
                                bobUrl,
                                tx.txHash,
                                tx.scheduledTick,
                                walletPublicIdentity
                            );
                            txFound = wasTxExecuted(txData);
                            txNotExecuted = wasTxNotExecuted(txData);
                        }

                        if (txNotExecuted) {
                            showSnackbar(
                                `Tx was included but not executed at tick ${tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`,
                                'warning'
                            );
                            refreshWalletBalances();
                            notifyTxFailure(tx, { reason: 'not_executed', tick: tx.scheduledTick });
                            removeTx(tx.id);
                            continue;
                        }

                        const reliableTickPastTx = tx.txHash
                            ? await hasReliableTickPastTx(tx, tickInfo)
                            : false;

                        if (!txFound && reliableTickPastTx && tx.txHash) {
                            showSnackbar(
                                `Tx failed or was not found at tick ${tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`,
                                'error'
                            );
                            refreshWalletBalances();
                            notifyTxFailure(tx, { reason: 'not_found', tick: tx.scheduledTick });
                            removeTx(tx.id);
                            continue;
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
                                if (success) {
                                    notifyTxSuccess(tx, { reason: 'tx_found', tick: tx.scheduledTick });
                                } else {
                                    notifyTxFailure(tx, { reason: 'state_mismatch', tick: tx.scheduledTick });
                                }
                            } else {
                                showSnackbar(
                                    `Tx confirmed at tick ${tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`,
                                    'success'
                                );
                                notifyTxSuccess(tx, { reason: 'tx_found', tick: tx.scheduledTick });
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
                            notifyTxSuccess(tx, { reason: 'balance_changed', tick: tx.scheduledTick });
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
                            if (success) {
                                notifyTxSuccess(tx, { reason: 'order_state_verified', tick: tx.scheduledTick });
                            } else {
                                notifyTxFailure(tx, { reason: 'state_mismatch', tick: tx.scheduledTick });
                            }
                        } else {
                            showSnackbar(
                                `Could not verify tx execution at tick ${tx.scheduledTick}. Check manually.\n${tx.txHash ? 'Tx: ' + tx.txHash : ''}`,
                                'info'
                            );
                            notifyTxTimeout(tx, { reason: 'inconclusive', tick: tx.scheduledTick });
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
    }, [pendingTxs, bobUrl, walletPublicIdentity, fetchBalance, showSnackbar, removeTx, hasMatchingOpenOrder, refreshWalletBalances, notifyTxFailure, notifyTxSuccess, notifyTxTimeout]);

    return { trackTx, pendingTxs };
}
