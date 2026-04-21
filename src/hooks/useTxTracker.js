import { useState, useEffect, useCallback, useRef } from 'react';
import { getLatestTick, getTxByHash } from '../components/qubic/util/bobApi';
import { useConfig } from '../contexts/ConfigContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useQuotteryContext } from '../contexts/QuotteryContext';


export function useTxTracker() {
    const [pendingTxs, setPendingTxs] = useState([]);
    const { bobUrl } = useConfig();
    const { showSnackbar } = useSnackbar();
    const { walletPublicIdentity, fetchBalance } = useQuotteryContext();
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
                        if (txData) {
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
                            showSnackbar(
                                `Tx confirmed at tick ${tx.scheduledTick}: ${tx.description || ''}\nTx: ${tx.txHash}`,
                                'success'
                            );
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

                        if (balanceChanged) {
                            showSnackbar(
                                `Tx executed at tick ${tx.scheduledTick}: ${tx.description || ''}\n${tx.txHash ? 'Tx: ' + tx.txHash : ''}`,
                                'success'
                            );
                        } else {
                            // Order placements (bid/ask) don't change balance until matched.
                            // This is NOT a failure — the order is likely sitting in the book.
                            showSnackbar(
                                `Order submitted at tick ${tx.scheduledTick}: ${tx.description || ''}\nCheck the order book to verify.\n${tx.txHash ? 'Tx: ' + tx.txHash : ''}`,
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
    }, [pendingTxs, bobUrl, walletPublicIdentity, fetchBalance, showSnackbar, removeTx]);

    return { trackTx, pendingTxs };
}
