import React, { useEffect, useState, useCallback } from "react";
import {
    Box, Typography, Container, Paper, Grid, IconButton, Tooltip, Stack, Divider, Button, Alert,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import GavelIcon from "@mui/icons-material/Gavel";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import { useConfig } from "../contexts/ConfigContext";
import { useQuotteryContext } from "../contexts/QuotteryContext";
import { useQubicConnect } from "../components/qubic/connect/QubicConnectContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import { useTxTracker } from "../hooks/useTxTracker";
import { useBalanceNotifier } from "../hooks/useBalanceNotifier";
import { copyText } from "../utils";
import { byteArrayToHexString, formatQubicAmount } from "../components/qubic/util";
import {
    broadcastTransaction,
    getBasicInfo,
    getTopProposals,
    identityToPubkey,
} from "../components/qubic/util/bobApi";
import {
    buildQuotteryTx,
    packGovProposalPayload,
    QTRY_PROPOSAL_VOTE,
} from "../components/qubic/util/quotteryTx";

const GOV_TOTAL_VOTES = 676;
const GOV_ACCEPTANCE_THRESHOLD = 451;

function GovernancePage() {
    const theme = useTheme();
    const { bobUrl } = useConfig();
    const { connected, toggleConnectModal, getSignedTx } = useQubicConnect();
    const {
        walletPublicIdentity,
        walletPublicKeyBytes,
        qtryGovBalance,
        fetchQtryGovBalance,
        getScheduledTick,
    } = useQuotteryContext();
    const { showSnackbar } = useSnackbar();
    const { trackTx } = useTxTracker();
    const { scheduleBalanceRefresh } = useBalanceNotifier();
    const [proposals, setProposals] = useState([]);
    const [uniqueProposalCount, setUniqueProposalCount] = useState(0);
    const [basicInfo, setBasicInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [votingRank, setVotingRank] = useState(null);

    const loadData = useCallback(async () => {
        if (!bobUrl) return;
        setLoading(true);
        setError(null);
        try {
            const [bi, top] = await Promise.all([
                getBasicInfo(bobUrl),
                getTopProposals(bobUrl),
            ]);
            setBasicInfo(bi);
            setProposals(top?.proposals || []);
            setUniqueProposalCount(top?.uniqueCount || 0);
        } catch (e) {
            console.error("Failed to load governance data:", e);
            setError("Failed to load governance data");
        } finally {
            setLoading(false);
        }
    }, [bobUrl]);

    useEffect(() => { loadData(); }, [loadData]);

    const cardBorderColor = theme.palette.mode === "dark"
        ? "rgba(255,255,255,0.18)"
        : "rgba(255,255,255,0.82)";
    const cellBorderColor = alpha(theme.palette.text.primary, 0.12);
    const panelSx = {
        p: 3,
        borderRadius: 2,
        border: `1px solid ${cardBorderColor}`,
        bgcolor: theme.palette.background.paper,
        boxShadow: theme.palette.mode === "dark"
            ? "0 10px 28px rgba(0,0,0,0.55)"
            : "0 14px 34px rgba(25,118,210,0.12)",
    };
    const paramCellSx = {
        minHeight: 72,
        p: 1.5,
        borderRadius: 1,
        border: `1px solid ${cellBorderColor}`,
        bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.055 : 0.035),
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
    };

    const renderGovParam = (label, value, unit = '') => (
        <Box sx={paramCellSx}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                {label}
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ mt: 0.35 }}>
                {typeof value === 'number' ? formatQubicAmount(value) : value}{unit}
            </Typography>
        </Box>
    );

    const formatGovPercent = (value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return value ?? "-";
        const percent = numeric / 10;
        return `${Number.isInteger(percent) ? formatQubicAmount(percent) : percent.toFixed(1)}%`;
    };

    const renderGovPercentParam = (label, value) => (
        <Box sx={paramCellSx}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                {label}
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ mt: 0.35 }}>
                {formatGovPercent(value)}
            </Typography>
        </Box>
    );

    const renderProposalVoteStatus = (totalVotes) => {
        const votes = Number(totalVotes || 0);
        const remaining = Math.max(0, GOV_ACCEPTANCE_THRESHOLD - votes);

        return (
            <Box textAlign="center" sx={{
                px: 1.5,
                py: 1,
                borderRadius: 1,
                border: `1px solid ${cellBorderColor}`,
                bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.055 : 0.035),
            }}>
                <Typography variant="body2" color="text.secondary">
                    Votes: {formatQubicAmount(votes)} / {formatQubicAmount(GOV_TOTAL_VOTES)}
                </Typography>
                <Typography variant="caption" color={remaining > 0 ? "text.secondary" : "success.main"}>
                    {remaining > 0
                        ? `${formatQubicAmount(remaining)} more to pass`
                        : "Threshold reached"}
                </Typography>
            </Box>
        );
    };

    const handleVote = async (proposal) => {
        if (!connected) {
            toggleConnectModal();
            return;
        }
        if (!walletPublicKeyBytes) {
            showSnackbar("Wallet public key not found.", "error");
            return;
        }

        setVotingRank(proposal.rank);
        try {
            const govBalance = qtryGovBalance ?? await fetchQtryGovBalance(walletPublicIdentity);
            if (!govBalance || Number(govBalance) <= 0) {
                showSnackbar("Voting is available only for QTRYGOV holders.", "error");
                return;
            }

            const [tickInfo, bi] = await Promise.all([
                getScheduledTick(),
                basicInfo ? Promise.resolve(basicInfo) : getBasicInfo(bobUrl),
            ]);
            if (!tickInfo) {
                showSnackbar("Failed to get scheduled tick.", "error");
                return;
            }
            if (!bi) {
                showSnackbar("Failed to get contract info.", "error");
                return;
            }

            const operationPubkey = identityToPubkey(proposal.govParams.operationId);
            const payload = packGovProposalPayload(proposal.govParams, operationPubkey);
            const packet = buildQuotteryTx(
                walletPublicKeyBytes,
                tickInfo.scheduledTick,
                QTRY_PROPOSAL_VOTE,
                bi.antiSpamAmount || 0,
                payload
            );
            showSnackbar("Sign your transaction in wallet.", "info");
            const confirmed = await getSignedTx(packet);
            if (!confirmed) return;

            const txHex = typeof confirmed.tx === "string"
                ? confirmed.tx
                : byteArrayToHexString(confirmed.tx);
            const res = await broadcastTransaction(bobUrl, txHex);

            if (!res?.txHash) {
                throw new Error(res?.error || "Broadcast failed");
            }

            const description = `Vote for governance proposal #${proposal.rank}`;
            trackTx({
                txHash: res.txHash,
                scheduledTick: tickInfo.scheduledTick,
                description,
                inputType: QTRY_PROPOSAL_VOTE,
                type: "governance",
            });
            scheduleBalanceRefresh(3000);
            loadData();
        } catch (e) {
            showSnackbar(`Vote failed: ${e.message}`, "error");
        } finally {
            setVotingRank(null);
        }
    };

    const hasGovTokens = connected && qtryGovBalance !== null && Number(qtryGovBalance) > 0;
    const hasNoGovTokens = connected && qtryGovBalance !== null && Number(qtryGovBalance) <= 0;

    return (
        <Container maxWidth="md" sx={{ mt: 12, mb: 8 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center" gap={1}>
                    <GavelIcon color="primary" />
                    <Typography variant="h4">Governance</Typography>
                </Box>
                <Tooltip title="Refresh">
                    <IconButton onClick={loadData} disabled={loading} size="small">
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Current Gov Params */}
            {basicInfo && (
                <Paper elevation={0} sx={{ ...panelSx, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>Current Parameters</Typography>
                    <Grid container spacing={1.25}>
                        <Grid item xs={12} sm={6} md={4}>
                            {renderGovPercentParam("Shareholder Fee", basicInfo.shareholderFee)}
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            {renderGovPercentParam("Burn Fee", basicInfo.burnFee)}
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            {renderGovPercentParam("Operation Fee", basicInfo.operationFee)}
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            {renderGovParam("Fee Per Day", basicInfo.feePerDay)}
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            {renderGovParam("Dispute Deposit", basicInfo.depositAmountForDispute, " QU")}
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            {renderGovParam("Anti-Spam", basicInfo.antiSpamAmount, " QU")}
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 1.5 }}>
                        <Box sx={{ ...paramCellSx, minHeight: 92, width: "100%" }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                Game Operator
                            </Typography>
                            <Box display="flex" alignItems="center" justifyContent="center" gap={0.75} sx={{ mt: 0.5, maxWidth: "100%" }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontFamily: "monospace",
                                        fontSize: "0.9rem",
                                        fontWeight: 700,
                                        wordBreak: "break-all",
                                        textAlign: "center",
                                    }}
                                >
                                    {basicInfo.gameOperator || "-"}
                                </Typography>
                                {!!basicInfo.gameOperator && (
                                    <Tooltip title="Copy Game Operator">
                                        <IconButton
                                            size="small"
                                            onClick={() => copyText(basicInfo.gameOperator)}
                                            aria-label="Copy Game Operator"
                                            sx={{ flexShrink: 0 }}
                                        >
                                            <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            )}

            {loading && (
                <Typography color="text.secondary" textAlign="center" py={4}>Loading governance data...</Typography>
            )}

            {!loading && error && (
                <Typography color="error" textAlign="center" py={4}>{error}</Typography>
            )}

            {!loading && !error && proposals.length === 0 && (
                <Paper elevation={0} sx={{ ...panelSx, p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No active proposals found.</Typography>
                </Paper>
            )}

            {!loading && !error && proposals.length > 0 && (
                <>
                    <Box sx={{ mb: 1.5 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                            <Box>
                                <Typography variant="h5">Top Proposals</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Unique proposals in current epoch: {uniqueProposalCount}
                                </Typography>
                            </Box>
                            {connected && (
                                <Typography variant="body2" color="text.secondary" textAlign="right">
                                    QTRYGOV: {qtryGovBalance !== null ? formatQubicAmount(qtryGovBalance) : "Unavailable"}
                                </Typography>
                            )}
                        </Box>
                        {hasNoGovTokens && (
                            <Alert severity="info" sx={{ mt: 1.5 }}>
                                Voting is available only for QTRYGOV holders.
                            </Alert>
                        )}
                    </Box>
                    <Stack spacing={2}>
                        {proposals.map((proposal) => (
                            <Paper key={proposal.rank} elevation={0} sx={panelSx}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="h6">Proposal #{proposal.rank}</Typography>
                                    {renderProposalVoteStatus(proposal.totalVotes)}
                                </Box>

                                <Divider sx={{ my: 1 }} />
                                <Grid container spacing={1.25}>
                                    <Grid item xs={12} sm={6} md={4}>
                                        {renderGovPercentParam("Shareholder Fee", proposal.govParams.shareholderFee)}
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        {renderGovPercentParam("Burn Fee", proposal.govParams.burnFee)}
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        {renderGovPercentParam("Operation Fee", proposal.govParams.operationFee)}
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        {renderGovParam("Fee Per Day", proposal.govParams.feePerDay)}
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        {renderGovParam("Dispute Deposit", proposal.govParams.depositAmountForDispute, " QU")}
                                    </Grid>
                                </Grid>
                                {proposal.govParams.operationId && (
                                    <Box sx={{ mt: 1.5 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                            Proposed Operator
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={0.75}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontFamily: "monospace",
                                                    fontSize: "0.9rem",
                                                    fontWeight: 600,
                                                    wordBreak: "break-all",
                                                }}
                                            >
                                                {proposal.govParams.operationId}
                                            </Typography>
                                            <Tooltip title="Copy Proposed Operator">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => copyText(proposal.govParams.operationId)}
                                                    aria-label="Copy Proposed Operator"
                                                >
                                                    <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                )}
                                <Box display="flex" flexDirection="column" alignItems="flex-end" mt={2}>
                                    <Button
                                        variant="contained"
                                        startIcon={<HowToVoteIcon />}
                                        onClick={() => handleVote(proposal)}
                                        disabled={!hasGovTokens || votingRank !== null}
                                    >
                                        {votingRank === proposal.rank ? "Signing..." : "Vote"}
                                    </Button>
                                    {!hasGovTokens && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, textAlign: "right" }}>
                                            Only QTRYGOV holders can vote.
                                        </Typography>
                                    )}
                                </Box>
                            </Paper>
                        ))}
                    </Stack>
                </>
            )}
        </Container>
    );
}

export default GovernancePage;
