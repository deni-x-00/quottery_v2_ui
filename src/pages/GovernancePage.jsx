import React, { useEffect, useState, useCallback } from "react";
import {
    Box, Typography, Container, Paper, Grid, IconButton, Tooltip, Stack, Card, CardContent, Divider, Button, Alert,
} from "@mui/material";
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

function GovernancePage() {
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

    const renderGovParam = (label, value, unit = '') => (
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ py: 0.25 }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="body2" fontWeight={600}>
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
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ py: 0.25 }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="body2" fontWeight={600}>
                {formatGovPercent(value)}
            </Typography>
        </Box>
    );

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
            showSnackbar(`${description} broadcast at tick ${tickInfo.scheduledTick}. Tx: ${res.txHash}`, "success");
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
                <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>Current Parameters</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            {renderGovPercentParam("Shareholder Fee", basicInfo.shareholderFee)}
                            {renderGovPercentParam("Burn Fee", basicInfo.burnFee)}
                            {renderGovPercentParam("Operation Fee", basicInfo.operationFee)}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            {renderGovParam("Fee Per Day", basicInfo.feePerDay)}
                            {renderGovParam("Dispute Deposit", basicInfo.depositAmountForDispute, " QU")}
                            {renderGovParam("Anti-Spam", basicInfo.antiSpamAmount, " QU")}
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Game Operator
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
                                {basicInfo.gameOperator || "-"}
                            </Typography>
                            {!!basicInfo.gameOperator && (
                                <Tooltip title="Copy Game Operator">
                                    <IconButton
                                        size="small"
                                        onClick={() => copyText(basicInfo.gameOperator)}
                                        aria-label="Copy Game Operator"
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
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
                <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
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
                            <Card key={proposal.rank} elevation={2}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="h6">Proposal #{proposal.rank}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Votes: {formatQubicAmount(proposal.totalVotes)}
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ my: 1 }} />
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            {renderGovParam("Shareholder Fee", proposal.govParams.shareholderFee, ' / 1000')}
                                            {renderGovParam("Burn Fee", proposal.govParams.burnFee, ' / 1000')}
                                            {renderGovParam("Operation Fee", proposal.govParams.operationFee, ' / 1000')}
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            {renderGovParam("Fee Per Day", proposal.govParams.feePerDay)}
                                            {renderGovParam("Dispute Deposit", proposal.govParams.depositAmountForDispute)}
                                        </Grid>
                                    </Grid>
                                    {proposal.govParams.operationId && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', wordBreak: 'break-all' }}>
                                            Proposed Operator: {proposal.govParams.operationId}
                                        </Typography>
                                    )}
                                    <Box display="flex" justifyContent="flex-end" mt={2}>
                                        <Button
                                            variant="contained"
                                            startIcon={<HowToVoteIcon />}
                                            onClick={() => handleVote(proposal)}
                                            disabled={votingRank !== null || hasNoGovTokens}
                                        >
                                            {votingRank === proposal.rank ? "Signing..." : "Vote"}
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                </>
            )}
        </Container>
    );
}

export default GovernancePage;
