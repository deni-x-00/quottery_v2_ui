import { useCallback } from 'react';
import { useQuotteryContext } from '../contexts/QuotteryContext';
import { useSnackbar } from '../contexts/SnackbarContext';

export const useBalanceNotifier = () => {
    const { walletPublicIdentity, fetchBalance } = useQuotteryContext();
    const { showSnackbar } = useSnackbar();

    const refreshBalanceWithNotifications = useCallback(async () => {
        if (!walletPublicIdentity || typeof fetchBalance !== 'function') {
            return null;
        }

        const result = await fetchBalance(walletPublicIdentity);
        if (!result || !result.changed) return result;

        const {
            balanceChanged,
            positionsChanged,
            positionsChangedText,
            prevBalance,
            newBalance,
        } = result;

        if (balanceChanged) {
            const diff = newBalance - prevBalance;
            const msg = (
                <span>
                    {diff > 0 ? `+${diff}` : diff} GARTH
                </span>
            );
            showSnackbar(msg, 'info');
        }

        if (positionsChanged) {
            console.log('positionsChangedText: ', positionsChangedText);
            if (positionsChangedText && positionsChangedText.length > 0) {
                positionsChangedText.forEach(text => {
                    showSnackbar(
                        <span>
                            {text}
                        </span>,
                        'info'
                    );
                });
            } else {
                showSnackbar(
                    <span>
                        Positions updated.
                    </span>,
                    'info'
                );
            }
        }

        return result;
    }, [walletPublicIdentity, fetchBalance, showSnackbar]);

    const scheduleBalanceRefresh = useCallback(
        (delayMs = 2000) => {
            return setTimeout(() => {
                // fire and forget – errors are already logged in fetchBalance
                refreshBalanceWithNotifications();
            }, delayMs);
        },
        [refreshBalanceWithNotifications]
    );

    return {
        refreshBalanceWithNotifications,
        scheduleBalanceRefresh,
    };
};