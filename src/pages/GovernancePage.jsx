import React, { useEffect, useState, useCallback } from "react";
import {
    Box, Typography, Container, Paper, Grid, IconButton, Tooltip, Stack, Card, CardContent, Divider,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import GavelIcon from "@mui/icons-material/Gavel";
import { useConfig } from "../contexts/ConfigContext";
import { formatQubicAmount } from "../components/qubic/util";
import {
    getBasicInfo,
    getTopProposals,
} from "../components/qubic/util/bobApi";

function GovernancePage() {
    const { bobUrl } = useConfig();
    const [proposals, setProposals] = useState([]);
    const [uniqueProposalCount, setUniqueProposalCount] = useState(0);
    const [basicInfo, setBasicInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                        <Typography variant="h5">Top Proposals</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Unique proposals in current epoch: {uniqueProposalCount}
                        </Typography>
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
