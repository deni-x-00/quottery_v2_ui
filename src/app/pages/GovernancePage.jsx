import React, { useEffect, useState, useCallback } from "react";
import {
    Box, Typography, Paper, Grid, IconButton, Tooltip, Stack, Divider, Button, Alert,
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
import usePageTitle from "../hooks/usePageTitle";
import { ActionIconButton, LoadingSkeleton, MetricGrid, PageHeader, PageShell } from "../components/ui";
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
    usePageTitle("Governance");
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

    const panelSx = {
        p: { xs: 1.75, sm: 2 },
        borderRadius: 1.5,
        border: `1px solid ${theme.palette.border.soft}`,
        bgcolor: theme.palette.surface[1],
        boxShadow: "none",
    };
    const paramCellSx = {
        minHeight: 72,
        p: 1.5,
        borderRadius: 1.25,
        border: `1px solid ${theme.palette.border.soft}`,
        bgcolor: theme.palette.surface[2],
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
    };

    const renderGovParam = (label, value, unit = '') => (
        <Box sx={paramCellSx}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {label}
            </Typography>
            <Typography className="stat" variant="body2" fontWeight={900} sx={{ mt: 0.45 }}>
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
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {label}
            </Typography>
            <Typography className="stat" variant="body2" fontWeight={900} sx={{ mt: 0.45 }}>
                {formatGovPercent(value)}
            </Typography>
        </Box>
    );

    const renderProposalVoteStatus = (totalVotes) => {
        const votes = Number(totalVotes || 0);
        const remaining = Math.max(0, GOV_ACCEPTANCE_THRESHOLD - votes);
        const progress = Math.min(100, (votes / GOV_ACCEPTANCE_THRESHOLD) * 100);

        return (
            <Box textAlign="center" sx={{
                minWidth: 190,
                px: 1.5,
                py: 1,
                borderRadius: 1.25,
                border: `1px solid ${theme.palette.border.soft}`,
                bgcolor: theme.palette.surface[2],
            }}>
                <Typography className="stat" variant="body2" sx={{ fontWeight: 900 }}>
                    Votes: {formatQubicAmount(votes)} / {formatQubicAmount(GOV_TOTAL_VOTES)}
                </Typography>
                <Box sx={{ mt: 0.85, height: 4, borderRadius: 999, bgcolor: theme.palette.surface[3], overflow: "hidden" }}>
                    <Box sx={{ width: `${progress}%`, height: "100%", bgcolor: remaining > 0 ? theme.palette.primary.main : theme.palette.market.yes }} />
                </Box>
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
    const govStats = [
        { label: "QTRYGOV Supply", value: formatQubicAmount(GOV_TOTAL_VOTES) },
        { label: "Passing Threshold", value: formatQubicAmount(GOV_ACCEPTANCE_THRESHOLD) },
        { label: "Unique Proposals", value: loading ? "Loading" : formatQubicAmount(uniqueProposalCount) },
        { label: "Your QTRYGOV", value: connected ? (qtryGovBalance !== null ? formatQubicAmount(qtryGovBalance) : "Unavailable") : "-" },
    ];

    return (
        <PageShell top={{ xs: 10, md: 12 }}>
            <PageHeader
                eyebrow="Protocol voting"
                title="Governance"
                description="QTRYGOV holders vote on fees, dispute deposits, event costs, and the Game Operator address."
                icon={<GavelIcon />}
                actions={(
                    <ActionIconButton label="Refresh governance data" onClick={loadData} disabled={loading}>
                        <RefreshIcon fontSize="small" />
                    </ActionIconButton>
                )}
            />

            <MetricGrid metrics={govStats} sx={{ mb: 2.5 }} compact />

            {/* Current Gov Params */}
            {basicInfo && (
                <Paper elevation={0} sx={{ ...panelSx, mb: 3 }}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        sx={{ mb: 1.5 }}
                    >
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                Current Parameters
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Active protocol values currently returned by the contract.
                            </Typography>
                        </Box>
                    </Stack>
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
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}
                            >
                                Game Operator
                            </Typography>
                            <Box display="flex" alignItems="center" justifyContent="center" gap={0.75} sx={{ mt: 0.5, maxWidth: "100%" }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontFamily: "monospace",
                                        fontSize: "0.9rem",
                                        fontWeight: 800,
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
                                            sx={{ flexShrink: 0, color: "text.secondary" }}
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
                <LoadingSkeleton variant="panel" rows={4} columns={3} />
            )}

            {!loading && error && (
                <Alert severity="error" sx={{ borderRadius: 1.5, mb: 2 }}>
                    {error}
                </Alert>
            )}

            {!loading && !error && proposals.length === 0 && (
                <Paper elevation={0} sx={{ ...panelSx, p: 4, textAlign: "center" }}>
                    <Typography sx={{ fontWeight: 900 }}>No active proposals</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        Governance proposals will appear here when enough QTRYGOV holders align on parameters.
                    </Typography>
                </Paper>
            )}

            {!loading && !error && proposals.length > 0 && (
                <>
                    <Box sx={{ mb: 1.5 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 900 }}>Top Proposals</Typography>
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
                            <Alert
                                severity="info"
                                sx={{
                                    mt: 1.5,
                                    borderRadius: 1.5,
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
                                    bgcolor: alpha(theme.palette.primary.main, 0.07),
                                }}
                            >
                                Voting is available only for QTRYGOV holders.
                            </Alert>
                        )}
                    </Box>
                    <Stack spacing={2}>
                        {proposals.map((proposal) => (
                            <Paper
                                key={proposal.rank}
                                elevation={0}
                                sx={{
                                    ...panelSx,
                                    position: "relative",
                                    overflow: "hidden",
                                    "&::before": {
                                        content: '""',
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: 3,
                                        height: "100%",
                                        bgcolor: "secondary.main",
                                    },
                                }}
                            >
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1.5}
                                    justifyContent="space-between"
                                    alignItems={{ xs: "stretch", sm: "center" }}
                                    mb={1}
                                >
                                    <Box sx={{ pl: 0.75 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                            Proposal #{proposal.rank}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Full parameter set proposed for the next epoch.
                                        </Typography>
                                    </Box>
                                    {renderProposalVoteStatus(proposal.totalVotes)}
                                </Stack>

                                <Divider sx={{ my: 1.25, borderColor: theme.palette.border.soft }} />
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
                                    <Box sx={{ ...paramCellSx, mt: 1.5, alignItems: "flex-start", textAlign: "left" }}>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ display: "block", mb: 0.5, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}
                                        >
                                            Proposed Operator
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={0.75}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontFamily: "monospace",
                                                    fontSize: "0.9rem",
                                                    fontWeight: 800,
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
                                                    sx={{ color: "text.secondary" }}
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
                                        sx={{ minWidth: 120 }}
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
        </PageShell>
    );
}

export default GovernancePage;
