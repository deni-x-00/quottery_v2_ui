/* global BigInt */
import React, { useEffect, useState, useCallback } from "react";
import {
    Box, Typography, Container, Paper, Button, Stack, Divider,
    CircularProgress, Chip, Grid, Card, CardContent, IconButton, Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import GavelIcon from "@mui/icons-material/Gavel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useQuotteryContext } from "../contexts/QuotteryContext";
import { useQubicConnect } from "../components/qubic/connect/QubicConnectContext";
import { useConfig } from "../contexts/ConfigContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import { formatQubicAmount, byteArrayToHexString } from "../components/qubic/util";
import {
    getBasicInfo, getProposalIndices, getProposal, getVotingResults,
    broadcastTransaction,
} from "../components/qubic/util/bobApi";
import { buildQuotteryTx } from "../components/qubic/util/quotteryTx";
import { useTxTracker } from "../hooks/useTxTracker";

// SetShareholderVotes procedure number
const PROC_SET_VOTES = 65535;

function GovernancePage() {
    const { connected, toggleConnectModal, getSignedTx } = useQubicConnect();
    const { walletPublicKeyBytes, getScheduledTick } = useQuotteryContext();
    const { bobUrl } = useConfig();
    const { showSnackbar } = useSnackbar();
    const { trackTx } = useTxTracker();

    const [proposals, setProposals] = useState([]);
    const [basicInfo, setBasicInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        if (!bobUrl) return;
        setLoading(true);
        setError(null);
        try {
            const [bi, indices] = await Promise.all([
                getBasicInfo(bobUrl),
                getProposalIndices(bobUrl),
            ]);
            setBasicInfo(bi);

            const proposalDetails = [];
            for (const idx of indices) {
                const [prop, votes] = await Promise.all([
                    getProposal(bobUrl, idx),
                    getVotingResults(bobUrl, idx),
                ]);
                if (prop) {
                    proposalDetails.push({ ...prop, votes });
                }
            }
            setProposals(proposalDetails);
        } catch (e) {
            console.error("Failed to load governance data:", e);
            setError("Failed to load governance data");
        } finally {
            setLoading(false);
        }
    }, [bobUrl]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleVote = async (proposalIndex, voteOption) => {
        if (!connected) { toggleConnectModal(); return; }
        if (!walletPublicKeyBytes) {
            showSnackbar("Wallet public key not found.", "error");
            return;
        }

        try {
            const [tickInfo, bi] = await Promise.all([
                getScheduledTick(),
                getBasicInfo(bobUrl),
            ]);
            if (!tickInfo) { showSnackbar("Failed to get tick.", "error"); return; }

            const { scheduledTick } = tickInfo;

            // SetShareholderVotes input: proposalIndex(u16) + padding(u16) + vote(u32) = 8 bytes
            // But QPI standard is typically: proposalIndex(u16) + numberOfVotes(u16) + votes[](u32 each)
            // For ProposalDataYesNo with 1 vote: [proposalIndex(2) + numVotes=1(2) + vote(4)] = 8 bytes
            const buf = new ArrayBuffer(8);
            const view = new DataView(buf);
            view.setUint16(0, proposalIndex, true);
            view.setUint16(2, 1, true); // numberOfVotes = 1
            view.setUint32(4, voteOption, true); // 0 = No, 1 = Yes
            const payload = new Uint8Array(buf);

            const packet = buildQuotteryTx(
                walletPublicKeyBytes,
                scheduledTick,
                PROC_SET_VOTES,
                0, // no fee for voting
                payload
            );

            const confirmed = await getSignedTx(packet);
            if (!confirmed) return;

            const txHex = typeof confirmed.tx === "string"
                ? confirmed.tx
                : byteArrayToHexString(confirmed.tx);

            const res = await broadcastTransaction(bobUrl, txHex);
            if (res && !res.error) {
                const hashInfo = res.txHash ? `\nTx: ${res.txHash}` : '';
                showSnackbar(
                    `Vote "${voteOption === 1 ? 'Yes' : 'No'}" cast for proposal #${proposalIndex} at tick ${scheduledTick}${hashInfo}`,
                    "success"
                );
                trackTx({ txHash: res.txHash, scheduledTick, description: `Vote on proposal #${proposalIndex}` });
                setTimeout(loadData, 5000);
            } else {
                showSnackbar(`Vote failed: ${res?.error || 'Unknown'}`, "error");
            }
        } catch (err) {
            showSnackbar(`Vote error: ${err.message}`, "error");
        }
    };

    const renderGovParam = (label, value, unit = '') => (
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ py: 0.25 }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="body2" fontWeight={600}>
                {typeof value === 'number' ? formatQubicAmount(value) : value}{unit}
            </Typography>
        </Box>
    );

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
                            {renderGovParam("Shareholder Fee", basicInfo.shareholderFee, ' / 1000')}
                            {renderGovParam("Burn Fee", basicInfo.burnFee, ' / 1000')}
                            {renderGovParam("Operation Fee", basicInfo.operationFee, ' / 1000')}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            {renderGovParam("Fee Per Day", basicInfo.feePerDay)}
                            {renderGovParam("Dispute Deposit", basicInfo.depositAmountForDispute)}
                            {renderGovParam("Anti-Spam", basicInfo.antiSpamAmount)}
                        </Grid>
                    </Grid>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Game Operator: {basicInfo.gameOperator?.slice(0, 30)}…
                    </Typography>
                </Paper>
            )}

            {/* Proposals */}
            <Typography variant="h5" gutterBottom>Active Proposals</Typography>

            {loading && (
                <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress />
                </Box>
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
                <Stack spacing={2}>
                    {proposals.map((prop) => (
                        <Card key={prop.index} elevation={2}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="h6">Proposal #{prop.index}</Typography>
                                    {prop.votes && (
                                        <Chip
                                            size="small"
                                            color={prop.votes.acceptedOption === 1 ? 'success' : prop.votes.acceptedOption === 0 ? 'error' : 'default'}
                                            label={prop.votes.acceptedOption === 1 ? 'Accepted' : prop.votes.acceptedOption === 0 ? 'Rejected' : 'Pending'}
                                        />
                                    )}
                                </Box>

                                {prop.proposer && (
                                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all', display: 'block', mb: 1 }}>
                                        Proposed by: {prop.proposer}
                                    </Typography>
                                )}

                                {prop.govParams && (
                                    <>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="subtitle2" color="primary" gutterBottom>
                                            Proposed Parameters
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                {renderGovParam("Shareholder Fee", prop.govParams.shareholderFee, ' / 1000')}
                                                {renderGovParam("Burn Fee", prop.govParams.burnFee, ' / 1000')}
                                                {renderGovParam("Operation Fee", prop.govParams.operationFee, ' / 1000')}
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                {renderGovParam("Fee Per Day", prop.govParams.feePerDay)}
                                                {renderGovParam("Dispute Deposit", prop.govParams.depositAmountForDispute)}
                                            </Grid>
                                        </Grid>
                                        {prop.govParams.operationId && (
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', wordBreak: 'break-all' }}>
                                                New Operator: {prop.govParams.operationId}
                                            </Typography>
                                        )}
                                    </>
                                )}

                                {prop.votes && (
                                    <>
                                        <Divider sx={{ my: 1.5 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Total votes: {prop.votes.totalVotes}
                                        </Typography>
                                    </>
                                )}

                                <Stack direction="row" spacing={2} mt={2}>
                                    <Button
                                        variant="outlined" color="success" size="small"
                                        startIcon={<CheckCircleIcon />}
                                        onClick={() => handleVote(prop.index, 1)}
                                    >
                                        Vote Yes
                                    </Button>
                                    <Button
                                        variant="outlined" color="error" size="small"
                                        startIcon={<CancelIcon />}
                                        onClick={() => handleVote(prop.index, 0)}
                                    >
                                        Vote No
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}
        </Container>
    );
}

export default GovernancePage;
