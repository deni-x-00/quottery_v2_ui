import React, { useState } from "react";
import {
    Box,
    Typography,
    Container,
    Button,
    Stack,
    Divider,
    TextField,
    Card,
    CardContent,
    Tooltip,
} from "@mui/material";
import RedeemIcon from "@mui/icons-material/Redeem";
import SendIcon from "@mui/icons-material/Send";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { QubicHelper } from "@qubic-lib/qubic-ts-library/dist/qubicHelper";
import { useQuotteryContext } from "../contexts/QuotteryContext";
import { useQubicConnect } from "../components/qubic/connect/QubicConnectContext";
import { useConfig } from "../contexts/ConfigContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import { formatQubicAmount, byteArrayToHexString } from "../components/qubic/util";
import { broadcastTransaction, getBasicInfo } from "../components/qubic/util/bobApi";
import {
    buildQuotteryTx,
    packEventIdPayload,
    packTransferPayload,
    packTransferShareMgmtPayload,
    QTRY_USER_CLAIM_REWARD,
    QTRY_TRANSFER_QUSD,
    QTRY_TRANSFER_QTRYGOV,
    QTRY_TRANSFER_SHARE_MGMT,
} from "../components/qubic/util/quotteryTx";
import { useTxTracker } from "../hooks/useTxTracker";
import { useBalanceNotifier } from "../hooks/useBalanceNotifier";

function MiscPage() {
    const { connected, toggleConnectModal, getSignedTx } = useQubicConnect();
    const { walletPublicKeyBytes, getScheduledTick } = useQuotteryContext();
    const { bobUrl } = useConfig();
    const { showSnackbar } = useSnackbar();
    const { trackTx } = useTxTracker();
    const { scheduleBalanceRefresh } = useBalanceNotifier();

    const [claimEventId, setClaimEventId] = useState("");
    const [claimSubmitting, setClaimSubmitting] = useState(false);

    const [garthReceiver, setGarthReceiver] = useState("");
    const [garthAmount, setGarthAmount] = useState("");
    const [garthSubmitting, setGarthSubmitting] = useState(false);

    const [govReceiver, setGovReceiver] = useState("");
    const [govAmount, setGovAmount] = useState("");
    const [govSubmitting, setGovSubmitting] = useState(false);

    const [smrIssuer, setSmrIssuer] = useState("");
    const [smrAssetName, setSmrAssetName] = useState("");
    const [smrShares, setSmrShares] = useState("");
    const [smrContractIndex, setSmrContractIndex] = useState("");
    const [smrSubmitting, setSmrSubmitting] = useState(false);

    const identityToBytes = async (identity) => {
        const qHelper = new QubicHelper();
        const idBytes = await qHelper.getIdentityBytes(identity);
        return new Uint8Array(idBytes);
    };

    const signAndBroadcast = async (inputType, amount, payload, description) => {
        const [tickInfo, basicInfo] = await Promise.all([
            getScheduledTick(),
            getBasicInfo(bobUrl),
        ]);

        if (!tickInfo) {
            showSnackbar("Failed to get scheduled tick.", "error");
            return null;
        }
        if (!basicInfo) {
            showSnackbar("Failed to get contract info.", "error");
            return null;
        }

        const { scheduledTick, tickRate, offset } = tickInfo;
        console.debug(
            `[Misc] ${description}: rate=${tickRate.toFixed(2)} t/s, offset=${offset}, scheduledTick=${scheduledTick}`
        );

        const txAmount = amount ?? (basicInfo.antiSpamAmount || 0);
        const packet = buildQuotteryTx(walletPublicKeyBytes, scheduledTick, inputType, txAmount, payload);
        const confirmed = await getSignedTx(packet);
        if (!confirmed) return null;

        const txHex = typeof confirmed.tx === "string"
            ? confirmed.tx
            : byteArrayToHexString(confirmed.tx);
        const res = await broadcastTransaction(bobUrl, txHex);

        if (res?.txHash) {
            showSnackbar(`${description} broadcast at tick ${scheduledTick}. Tx: ${res.txHash}`, "success");
            trackTx({ txHash: res.txHash, scheduledTick, description });
            scheduleBalanceRefresh(3000);
            return res;
        }

        throw new Error(res?.error || "Broadcast failed");
    };

    const requireWallet = () => {
        if (!connected) {
            toggleConnectModal();
            return false;
        }
        if (!walletPublicKeyBytes) {
            showSnackbar("Wallet public key not found.", "error");
            return false;
        }
        return true;
    };

    const handleClaimReward = async () => {
        if (!requireWallet()) return;

        const eid = parseInt(claimEventId, 10);
        if (Number.isNaN(eid) || eid < 0) {
            showSnackbar("Enter a valid event ID.", "error");
            return;
        }

        setClaimSubmitting(true);
        try {
            const payload = packEventIdPayload(eid);
            await signAndBroadcast(QTRY_USER_CLAIM_REWARD, null, payload, `Claim reward for event ${eid}`);
        } catch (e) {
            showSnackbar(`Claim failed: ${e.message}`, "error");
        } finally {
            setClaimSubmitting(false);
        }
    };

    const handleTransferGarth = async () => {
        if (!requireWallet()) return;

        const amt = parseInt(garthAmount, 10);
        if (!garthReceiver || garthReceiver.length !== 60) {
            showSnackbar("Enter a valid 60-character receiver identity.", "error");
            return;
        }
        if (Number.isNaN(amt) || amt <= 0) {
            showSnackbar("Enter a valid amount.", "error");
            return;
        }

        setGarthSubmitting(true);
        try {
            const receiverBytes = await identityToBytes(garthReceiver);
            const payload = packTransferPayload(receiverBytes, amt);
            await signAndBroadcast(QTRY_TRANSFER_QUSD, 0, payload, `Transfer ${formatQubicAmount(amt)} GARTH`);
        } catch (e) {
            showSnackbar(`Transfer failed: ${e.message}`, "error");
        } finally {
            setGarthSubmitting(false);
        }
    };

    const handleTransferGov = async () => {
        if (!requireWallet()) return;

        const amt = parseInt(govAmount, 10);
        if (!govReceiver || govReceiver.length !== 60) {
            showSnackbar("Enter a valid 60-character receiver identity.", "error");
            return;
        }
        if (Number.isNaN(amt) || amt <= 0) {
            showSnackbar("Enter a valid amount.", "error");
            return;
        }

        setGovSubmitting(true);
        try {
            const receiverBytes = await identityToBytes(govReceiver);
            const payload = packTransferPayload(receiverBytes, amt);
            await signAndBroadcast(QTRY_TRANSFER_QTRYGOV, 0, payload, `Transfer ${amt} QTRYGOV`);
        } catch (e) {
            showSnackbar(`Transfer failed: ${e.message}`, "error");
        } finally {
            setGovSubmitting(false);
        }
    };

    const handleTransferShareMgmt = async () => {
        if (!requireWallet()) return;

        if (!smrIssuer || smrIssuer.length !== 60) {
            showSnackbar("Enter a valid 60-character issuer identity.", "error");
            return;
        }
        if (!smrAssetName || smrAssetName.length > 7) {
            showSnackbar("Asset name must be 1-7 letters.", "error");
            return;
        }
        if (!/^[a-zA-Z]+$/.test(smrAssetName)) {
            showSnackbar("Asset name must contain only A-Z letters.", "error");
            return;
        }

        const shares = parseInt(smrShares, 10);
        if (Number.isNaN(shares) || shares <= 0) {
            showSnackbar("Enter a valid number of shares.", "error");
            return;
        }

        const contractIdx = parseInt(smrContractIndex, 10);
        if (Number.isNaN(contractIdx) || contractIdx < 0) {
            showSnackbar("Enter a valid contract index.", "error");
            return;
        }

        setSmrSubmitting(true);
        try {
            const issuerBytes = await identityToBytes(smrIssuer);
            const payload = packTransferShareMgmtPayload(issuerBytes, smrAssetName, shares, contractIdx);
            await signAndBroadcast(
                QTRY_TRANSFER_SHARE_MGMT,
                0,
                payload,
                `Transfer ${shares} ${smrAssetName.toUpperCase()} management rights to contract ${contractIdx}`
            );
        } catch (e) {
            showSnackbar(`Transfer failed: ${e.message}`, "error");
        } finally {
            setSmrSubmitting(false);
        }
    };

    const ActionCard = ({ icon, title, subtitle, children, onSubmit, submitting, submitLabel }) => (
        <Card variant="outlined" sx={{ borderColor: "divider" }}>
            <CardContent>
                <Stack spacing={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                        {icon}
                        <Box>
                            <Typography variant="h6">{title}</Typography>
                            <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
                        </Box>
                    </Box>
                    <Divider />
                    {children}
                    <Button
                        variant="contained"
                        onClick={onSubmit}
                        disabled={submitting}
                        fullWidth
                        size="large"
                    >
                        {submitting ? "Signing..." : submitLabel}
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );

    return (
        <Container maxWidth="md" sx={{ pt: 12, pb: 6 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Utilities
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Claim rewards, transfer GARTH or QTRYGOV tokens, and manage share rights.
            </Typography>

            <Stack spacing={3}>
                <ActionCard
                    icon={<RedeemIcon color="primary" />}
                    title="Claim Reward"
                    subtitle="Claim your payout from a finalized event."
                    onSubmit={handleClaimReward}
                    submitting={claimSubmitting}
                    submitLabel="Claim Reward"
                >
                    <TextField
                        label="Event ID"
                        type="number"
                        value={claimEventId}
                        onChange={(e) => setClaimEventId(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="e.g. 0"
                    />
                </ActionCard>

                <ActionCard
                    icon={<SendIcon color="primary" />}
                    title="Transfer GARTH"
                    subtitle="Send GARTH (QUSD) tokens to another identity via the Quottery contract."
                    onSubmit={handleTransferGarth}
                    submitting={garthSubmitting}
                    submitLabel="Transfer GARTH"
                >
                    <TextField
                        label="Receiver Identity"
                        value={garthReceiver}
                        onChange={(e) => setGarthReceiver(e.target.value.trim())}
                        fullWidth
                        size="small"
                        placeholder="60-character Qubic identity"
                        inputProps={{ maxLength: 60 }}
                    />
                    <TextField
                        label="Amount"
                        type="number"
                        value={garthAmount}
                        onChange={(e) => setGarthAmount(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="e.g. 1000000"
                    />
                </ActionCard>

                <ActionCard
                    icon={<AccountBalanceIcon color="primary" />}
                    title="Transfer QTRYGOV"
                    subtitle="Send QTRYGOV governance shares to another identity."
                    onSubmit={handleTransferGov}
                    submitting={govSubmitting}
                    submitLabel="Transfer QTRYGOV"
                >
                    <TextField
                        label="Receiver Identity"
                        value={govReceiver}
                        onChange={(e) => setGovReceiver(e.target.value.trim())}
                        fullWidth
                        size="small"
                        placeholder="60-character Qubic identity"
                        inputProps={{ maxLength: 60 }}
                    />
                    <TextField
                        label="Amount"
                        type="number"
                        value={govAmount}
                        onChange={(e) => setGovAmount(e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="e.g. 1"
                    />
                </ActionCard>

                <ActionCard
                    icon={<SwapHorizIcon color="primary" />}
                    title="Transfer Share Management Rights"
                    subtitle="Move management rights of an asset to a different contract index."
                    onSubmit={handleTransferShareMgmt}
                    submitting={smrSubmitting}
                    submitLabel="Transfer Management Rights"
                >
                    <TextField
                        label="Issuer Identity"
                        value={smrIssuer}
                        onChange={(e) => setSmrIssuer(e.target.value.trim())}
                        fullWidth
                        size="small"
                        placeholder="60-character Qubic identity of the asset issuer"
                        inputProps={{ maxLength: 60 }}
                    />
                    <TextField
                        label="Asset Name"
                        value={smrAssetName}
                        onChange={(e) => setSmrAssetName(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 7))}
                        fullWidth
                        size="small"
                        placeholder="e.g. GARTH"
                        inputProps={{ maxLength: 7 }}
                    />
                    <Tooltip title="Number of shares whose management rights will be transferred.">
                        <TextField
                            label="Number of Shares"
                            type="number"
                            value={smrShares}
                            onChange={(e) => setSmrShares(e.target.value)}
                            fullWidth
                            size="small"
                            placeholder="e.g. 100"
                        />
                    </Tooltip>
                    <Tooltip title="The SC index that will become the new manager. Use 0 to release management back to the owner.">
                        <TextField
                            label="New Managing Contract Index"
                            type="number"
                            value={smrContractIndex}
                            onChange={(e) => setSmrContractIndex(e.target.value)}
                            fullWidth
                            size="small"
                            placeholder="e.g. 0"
                        />
                    </Tooltip>
                </ActionCard>
            </Stack>
        </Container>
    );
}

export default MiscPage;
