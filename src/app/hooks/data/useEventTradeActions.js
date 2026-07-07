import { useCallback, useState } from "react";
import { broadcastTransaction, getBasicInfo } from "../../components/qubic/util/bobApi";
import { byteArrayToHexString, formatQubicAmount } from "../../components/qubic/util";
import {
  buildQuotteryTx,
  packEventIdPayload,
  packOrderPayload,
  QTRY_ADD_ASK_ORDER,
  QTRY_ADD_BID_ORDER,
  QTRY_DISPUTE,
} from "../../components/qubic/util/quotteryTx";
import { validateOrderPreflight } from "../../components/qubic/util/tradeValidation";

const formatBroadcastError = (error) => {
  const message = String(error?.message || error || "");
  if (/Tick value is Expired/i.test(message)) {
    return "Tick value is Expired. Try again.";
  }
  return `Failed to broadcast transaction: ${message || "Transaction broadcast failed"}`;
};

function confirmedTxToHex(confirmed) {
  return typeof confirmed.tx === "string"
    ? confirmed.tx
    : byteArrayToHexString(confirmed.tx);
}

export default function useEventTradeActions({
  connected,
  toggleConnectModal,
  walletPublicIdentity,
  walletPublicKeyBytes,
  balance,
  quBalance,
  fetchQuBalance,
  eventPositions,
  getScheduledTick,
  getSignedTx,
  bobUrl,
  showSnackbar,
  trackTx,
  scheduleBalanceRefresh,
}) {
  const [submitting, setSubmitting] = useState(false);

  const placeOrder = useCallback(async ({
    event,
    selectedOption,
    tradeSide,
    tradeAmount,
    tradePrice,
  }) => {
    if (submitting) return null;
    if (!connected) {
      toggleConnectModal();
      return null;
    }

    if (tradeAmount <= 0) {
      showSnackbar("Please enter a valid amount.", "error");
      return null;
    }

    if (tradePrice <= 0 || tradePrice >= 100000) {
      showSnackbar("Price must be between 1 and 99,999.", "error");
      return null;
    }

    if (!walletPublicIdentity) {
      showSnackbar("No wallet identity available.", "error");
      return null;
    }

    if (!walletPublicKeyBytes) {
      showSnackbar("Wallet public key not found.", "error");
      return null;
    }

    if (!event || event.eid === undefined) {
      showSnackbar("Invalid event. Cannot place order.", "error");
      return null;
    }

    const preflightError = validateOrderPreflight({
      event,
      eventPositions,
      option: selectedOption,
      side: tradeSide,
      amount: tradeAmount,
      price: tradePrice,
      balance,
    });
    if (preflightError) {
      showSnackbar(preflightError, "error");
      return null;
    }

    setSubmitting(true);
    try {
      const [tickInfo, basicInfo] = await Promise.all([
        getScheduledTick(),
        getBasicInfo(bobUrl),
      ]);

      if (!tickInfo) {
        showSnackbar("Failed to get current tick from network.", "error");
        return null;
      }
      if (!basicInfo) {
        showSnackbar("Failed to get contract info.", "error");
        return null;
      }

      const { scheduledTick, tickRate: rate, offset } = tickInfo;
      if (Number.isFinite(rate) && offset !== undefined) {
        console.log(`[placeOrder] adaptive scheduling: rate=${rate.toFixed(2)} t/s, offset=${offset}, scheduledTick=${scheduledTick}`);
      }
      const antiSpamAmount = basicInfo.antiSpamAmount || 0;
      const latestQuBalance = walletPublicIdentity
        ? await fetchQuBalance(walletPublicIdentity)
        : quBalance;

      const fundedPreflightError = validateOrderPreflight({
        event,
        eventPositions,
        option: selectedOption,
        side: tradeSide,
        amount: tradeAmount,
        price: tradePrice,
        balance,
        quBalance: latestQuBalance,
        antiSpamAmount,
      });
      if (fundedPreflightError) {
        showSnackbar(fundedPreflightError, "error");
        return null;
      }

      const isBid = tradeSide === "buy";
      const inputType = isBid ? QTRY_ADD_BID_ORDER : QTRY_ADD_ASK_ORDER;
      const payload = packOrderPayload(event.eid, selectedOption, tradeAmount, tradePrice);
      const packet = buildQuotteryTx(
        walletPublicKeyBytes,
        scheduledTick,
        inputType,
        antiSpamAmount,
        payload
      );

      showSnackbar("Sign your transaction in wallet.", "info");
      const confirmed = await getSignedTx(packet);
      if (!confirmed) return null;

      const res = await broadcastTransaction(bobUrl, confirmedTxToHex(confirmed));
      if (!res || res.error) {
        throw new Error(res?.error || "Transaction broadcast failed");
      }

      const optDesc = selectedOption === 0 ? event.option0Desc : event.option1Desc;
      trackTx({
        txHash: res.txHash,
        scheduledTick,
        description: `${tradeSide === "buy" ? "Buy" : "Sell"} ${formatQubicAmount(tradeAmount)} "${optDesc}" @ ${formatQubicAmount(tradePrice)}`,
        inputType,
        type: "order",
        eventId: event.eid,
        option: selectedOption,
        side: tradeSide === "buy" ? "buy" : "sell",
        amount: tradeAmount,
        price: tradePrice,
      });
      scheduleBalanceRefresh(2000);
      return confirmed;
    } catch (error) {
      showSnackbar(formatBroadcastError(error), "error");
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [
    balance,
    bobUrl,
    connected,
    eventPositions,
    fetchQuBalance,
    getScheduledTick,
    getSignedTx,
    quBalance,
    scheduleBalanceRefresh,
    showSnackbar,
    submitting,
    toggleConnectModal,
    trackTx,
    walletPublicIdentity,
    walletPublicKeyBytes,
  ]);

  const dispute = useCallback(async (event) => {
    if (!connected) {
      toggleConnectModal();
      return null;
    }
    if (!walletPublicKeyBytes) {
      showSnackbar("Wallet public key not found.", "error");
      return null;
    }
    if (!event || event.eid === undefined) {
      showSnackbar("Invalid event.", "error");
      return null;
    }
    if (event.resultByGO === -1) {
      showSnackbar("No result published yet вЂ” nothing to dispute.", "error");
      return null;
    }

    try {
      const [tickInfo, basicInfo] = await Promise.all([
        getScheduledTick(),
        getBasicInfo(bobUrl),
      ]);
      if (!tickInfo || !basicInfo) {
        showSnackbar("Failed to get network info.", "error");
        return null;
      }

      const { scheduledTick } = tickInfo;
      const depositAmount = basicInfo.depositAmountForDispute || 0;
      const payload = packEventIdPayload(event.eid);
      const packet = buildQuotteryTx(
        walletPublicKeyBytes,
        scheduledTick,
        QTRY_DISPUTE,
        depositAmount,
        payload
      );

      showSnackbar("Sign your transaction in wallet.", "info");
      const confirmed = await getSignedTx(packet);
      if (!confirmed) return null;

      const res = await broadcastTransaction(bobUrl, confirmedTxToHex(confirmed));
      if (res && !res.error) {
        trackTx({
          txHash: res.txHash,
          scheduledTick,
          description: `Dispute event ${event.eid}`,
          inputType: QTRY_DISPUTE,
          eventId: event.eid,
          depositAmount,
          txAmount: depositAmount,
        });
        return confirmed;
      }

      showSnackbar(`Dispute failed: ${res?.error || "Unknown error"}`, "error");
      return null;
    } catch (err) {
      showSnackbar(`Dispute error: ${err.message}`, "error");
      return null;
    }
  }, [
    bobUrl,
    connected,
    getScheduledTick,
    getSignedTx,
    showSnackbar,
    toggleConnectModal,
    trackTx,
    walletPublicKeyBytes,
  ]);

  return { placeOrder, dispute, submitting };
}
