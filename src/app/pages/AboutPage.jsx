import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    Link as MuiLink,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BalanceIcon from "@mui/icons-material/Balance";
import BoltIcon from "@mui/icons-material/Bolt";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import GavelIcon from "@mui/icons-material/Gavel";
import GroupsIcon from "@mui/icons-material/Groups";
import HubIcon from "@mui/icons-material/Hub";
import PaymentsIcon from "@mui/icons-material/Payments";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SecurityIcon from "@mui/icons-material/Security";
import TimelineIcon from "@mui/icons-material/Timeline";
import TokenIcon from "@mui/icons-material/Token";
import usePageTitle from "../hooks/usePageTitle";
import { PAGE_GUTTER_X, PAGE_MAX_WIDTH } from "../components/ui";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const getAccentTextColor = (theme) => (
    theme.palette.primary.main
);

const overviewCards = [
    {
        icon: <HubIcon />,
        title: "Peer-to-peer prediction markets",
        body: "Quottery lets people trade outcome shares directly with one another through a transparent on-chain order book.",
    },
    {
        icon: <AutoGraphIcon />,
        title: "Prices as forecasts",
        body: "When traders put value behind their views, market prices become a live signal of what the crowd believes is most likely.",
    },
    {
        icon: <BoltIcon />,
        title: "Built for Qubic speed",
        body: "Orders are matched by the on-chain contract after every placement, so short-lived markets can run from creation to payout quickly.",
    },
];

const predictionExamples = [
    "Crypto prices",
    "Short-term trading",
    "Sports",
    "Elections",
    "Tech milestones",
    "DeFi events",
    "Governance decisions",
];

const startTradingSteps = [
    {
        icon: <AccountBalanceWalletIcon />,
        title: "Connect a wallet",
        body: "Use a Qubic-compatible wallet and connect it to the app. This identity will hold your Qubic, GARTH, orders, and positions.",
    },
    {
        icon: <TokenIcon />,
        title: "Get Qubic",
        body: "Buy QUBIC on an exchange such as Gate, MEXC, Bitget, or another venue you already trust. Keep some QUBIC for network fees and wallet activity.",
    },
    {
        icon: <CurrencyExchangeIcon />,
        title: "Buy GARTH",
        body: "Swap into GARTH through one of the Qubic ecosystem tools listed below. GARTH is the trading currency currently used by Quottery.",
    },
    {
        icon: <SwapHorizIcon />,
        title: "Deposit GARTH to Quottery",
        body: "Transfer GARTH from your wallet balance into the Quottery smart contract so it can be used for bids, asks, escrow, and settlement.",
    },
    {
        icon: <TrendingUpIcon />,
        title: "Pick an event and trade",
        body: "Open a market, choose the Yes or No side, set the price and amount you are comfortable with, then place the order from the trading screen.",
    },
];

const orderBookRows = [
    {
        title: "Traditional trade",
        body: "A sell order meets a buy order on the same option.",
    },
    {
        title: "Mint",
        body: "Two buyers on opposite sides create new shares when their prices sum to the whole share price.",
    },
    {
        title: "Merge",
        body: "Two sellers on opposite sides exit positions and split the pot when their asks sum to the whole share price.",
    },
    {
        title: "Cross-side",
        body: "A buyer on one side matches with a seller on the other side.",
    },
];

const lifecycleSteps = [
    {
        title: "Creation",
        body: "The Game Operator creates an event with a clear description, two outcomes, and an end date.",
    },
    {
        title: "Trading",
        body: "Anyone can place buy or sell orders. Tokens and shares are locked while orders are open and can be released by cancelling.",
    },
    {
        title: "Result publication",
        body: "After the deadline, the Game Operator publishes the result and locks a dispute deposit as a guarantee of honesty.",
    },
    {
        title: "Dispute window",
        body: "If someone challenges the result, Qubic computors vote on the correct outcome and the dispute deposit is distributed by the rules.",
    },
    {
        title: "Finalization",
        body: "Once the event is undisputed or a dispute is resolved, the contract refunds unmatched orders and prepares rewards.",
    },
    {
        title: "Reward claiming",
        body: "Winning shares can be claimed for the full whole share price. Losing positions are removed.",
    },
    {
        title: "Cleanup",
        body: "Finalized events are cleared to free contract memory for new markets.",
    },
];

const feeRows = [
    {
        label: "Operation fee",
        body: "Covers event management costs for the Game Operator.",
    },
    {
        label: "Shareholder fee",
        body: "Distributed as revenue for QTRY token holders.",
    },
    {
        label: "Burn fee",
        body: "Removed permanently to add deflationary pressure.",
    },
];

const roleRows = [
    {
        icon: <TimelineIcon />,
        title: "Traders",
        body: "Browse events, study prices, buy or sell outcome shares, claim rewards, transfer tokens, and dispute incorrect results.",
    },
    {
        icon: <SecurityIcon />,
        title: "Game Operator",
        body: "Creates events, publishes verified results, finalizes markets, grants market-maker discounts, and keeps the contract healthy.",
    },
    {
        icon: <GroupsIcon />,
        title: "Computors",
        body: "Qubic's 676 validators act as a dispute resolution jury when a result is challenged.",
    },
    {
        icon: <GavelIcon />,
        title: "QTRYGOV holders",
        body: "Vote on fees, costs, dispute deposits, and the operator address through broad-consensus governance.",
    },
];

const SectionHeader = ({ eyebrow, title, body }) => {
    const theme = useTheme();
    const accentTextColor = getAccentTextColor(theme);

    return (
        <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
            <Typography
                variant="overline"
                sx={{ color: accentTextColor, fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.14em", lineHeight: 1.4 }}
            >
                {eyebrow}
            </Typography>
            <Typography variant="h3" component="h2" sx={{ mb: 1, mt: 0.5 }}>
                {title}
            </Typography>
            {body && (
                <Typography color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.7 }}>
                    {body}
                </Typography>
            )}
        </Box>
    );
};

function AboutPage() {
    usePageTitle("About");
    const theme = useTheme();
    const heroBackground = `radial-gradient(circle at 82% 12%, ${alpha(theme.palette.primary.main, 0.09)}, transparent 36%), ${theme.palette.background.default}`;
    const heroPanelBackground = theme.palette.surface[1];
    const accentTextColor = getAccentTextColor(theme);
    const surfaceCardSx = {
        bgcolor: theme.palette.surface[1],
        borderColor: theme.palette.border.soft,
        borderRadius: 1.5,
        boxShadow: "none",
        transition: "border-color 150ms ease, background-color 150ms ease, transform 150ms ease",
        "&:hover": {
            borderColor: theme.palette.border.default,
            bgcolor: theme.palette.surface[2],
            transform: "translateY(-1px)",
        },
    };
    const panelSx = {
        border: `1px solid ${theme.palette.border.soft}`,
        borderRadius: 1.5,
        bgcolor: theme.palette.surface[1],
        boxShadow: "none",
    };
    const iconTileSx = {
        width: 38,
        height: 38,
        borderRadius: 1.25,
        border: `1px solid ${theme.palette.border.soft}`,
        bgcolor: theme.palette.surface[2],
        color: "primary.main",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        "& svg": { fontSize: 21 },
    };

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pt: { xs: 10, md: 12 }, pb: { xs: 6, md: 9 } }}>
            <Box
                component="section"
                sx={{
                    borderBottom: `1px solid ${theme.palette.border.soft}`,
                    bgcolor: heroBackground,
                    mb: { xs: 5, md: 7 },
                }}
            >
                <Box sx={{ width: "100%", maxWidth: PAGE_MAX_WIDTH, mx: "auto", px: PAGE_GUTTER_X, py: { xs: 6, md: 8 } }}>
                    <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
                        <Grid item xs={12} md={7}>
                            <Stack spacing={2.5}>
                                <Chip
                                    icon={<TokenIcon />}
                                    label="Powered by Qubic"
                                    color="primary"
                                    variant="outlined"
                                    sx={{
                                        alignSelf: "flex-start",
                                        borderColor: alpha(theme.palette.primary.main, 0.32),
                                        color: accentTextColor,
                                        bgcolor: alpha(theme.palette.primary.main, 0.07),
                                        fontWeight: 800,
                                        "& .MuiChip-icon": { color: accentTextColor },
                                    }}
                                />
                                <Typography
                                    variant="h1"
                                    sx={{
                                        fontSize: { xs: "2.4rem", sm: "3.1rem", md: "4rem" },
                                        lineHeight: 1.05,
                                        fontWeight: 900,
                                    }}
                                >
                                    Trade the outcome on Qubic.
                                </Typography>
                                <Typography
                                    color="text.secondary"
                                    sx={{
                                        fontSize: { xs: "1rem", md: "1.15rem" },
                                        lineHeight: 1.8,
                                        maxWidth: 720,
                                    }}
                                >
                                    Trade YES or NO outcome shares on real-world events through an on-chain order book.
                                    The smart contract handles matching, settlement, and payouts transparently.
                                </Typography>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 2.5, md: 3 },
                                    border: `1px solid ${theme.palette.border.soft}`,
                                    borderRadius: 1.5,
                                    bgcolor: heroPanelBackground,
                                    boxShadow: "none",
                                }}
                            >
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Whole share price
                                        </Typography>
                                        <Typography variant="h3" fontWeight={900}>
                                            100,000
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            tokens per complete Yes + No share pair
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ borderColor: theme.palette.border.soft }} />
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        {["Peer-to-peer", "On-chain escrow", "Verifiable settlement"].map((item) => (
                                            <Chip
                                                key={item}
                                                label={item}
                                                size="small"
                                                sx={{
                                                    border: `1px solid ${theme.palette.border.soft}`,
                                                    bgcolor: theme.palette.surface[2],
                                                    fontWeight: 800,
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            <Box sx={{ width: "100%", maxWidth: PAGE_MAX_WIDTH, mx: "auto", px: PAGE_GUTTER_X }}>
                <Stack spacing={{ xs: 6, md: 8 }}>
                    <Grid container spacing={2.5}>
                        {overviewCards.map((card) => (
                            <Grid item xs={12} md={4} key={card.title} sx={{ display: "flex" }}>
                                <Card variant="outlined" sx={{ ...surfaceCardSx, width: "100%" }}>
                                    <CardContent>
                                        <Stack spacing={1.5}>
                                            <Box sx={iconTileSx}>{card.icon}</Box>
                                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                                {card.title}
                                            </Typography>
                                            <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
                                                {card.body}
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    <Box component="section">
                        <SectionHeader
                            eyebrow="How to start"
                            title="From wallet to your first trade"
                            body="You only need a connected wallet, QUBIC for basic network activity, and GARTH deposited into the Quottery contract. After that, trading is just choosing a market and placing an order."
                        />
                        <Grid container spacing={2}>
                            {startTradingSteps.map((step, index) => (
                                <Grid item xs={12} md={index === 4 ? 12 : 6} key={step.title}>
                                    <Card variant="outlined" sx={{ ...surfaceCardSx, height: "100%" }}>
                                        <CardContent>
                                            <Stack spacing={1.5}>
                                                <Box display="flex" alignItems="center" gap={1.25}>
                                                    <Box sx={iconTileSx}>
                                                        {step.icon}
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: accentTextColor }} fontWeight={900}>
                                                        {String(index + 1).padStart(2, "0")}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                                    {step.title}
                                                </Typography>
                                                <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
                                                    {step.body}
                                                </Typography>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                        <Paper
                            elevation={0}
                            sx={{
                                mt: 2,
                                p: { xs: 2.5, md: 3 },
                                ...panelSx,
                            }}
                        >
                            <Grid container spacing={2.5} alignItems="center">
                                <Grid item xs={12} md={7}>
                                    <Stack spacing={1}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <RocketLaunchIcon color="primary" />
                                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                                GARTH entry points
                                            </Typography>
                                        </Box>
                                        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                            To get GARTH, try{" "}
                                            <MuiLink href="https://quhub.app/" target="_blank" rel="noreferrer" underline="hover">
                                                QuHub
                                            </MuiLink>
                                            ,{" "}
                                            <MuiLink href="https://app.qubicportal.org/" target="_blank" rel="noreferrer" underline="hover">
                                                Qubic Portal
                                            </MuiLink>
                                            , or{" "}
                                            <MuiLink href="https://qubicswap.com/" target="_blank" rel="noreferrer" underline="hover">
                                                Qubic Swap
                                            </MuiLink>
                                            . Once GARTH is deposited into the contract through{" "}
                                            <MuiLink component={RouterLink} to="/utilities" underline="hover">
                                                Utilities
                                            </MuiLink>
                                            , the{" "}
                                            <MuiLink component={RouterLink} to="/markets" underline="hover">
                                                markets page
                                            </MuiLink>{" "}
                                            are ready to use.
                                        </Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} md={5}>
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        <Button
                                            component={RouterLink}
                                            to="/markets"
                                            variant="outlined"
                                            size="small"
                                            startIcon={<AccountBalanceWalletIcon fontSize="small" />}
                                            sx={{ px: 1.5 }}
                                        >
                                            Connect wallet
                                        </Button>
                                        <Button
                                            component="span"
                                            variant="outlined"
                                            size="small"
                                            startIcon={<TokenIcon fontSize="small" />}
                                            title="Gate, MEXC, Bitget, etc."
                                            sx={{ px: 1.5, cursor: "default" }}
                                        >
                                            Buy QUBIC
                                        </Button>
                                        <Button
                                            href="https://quhub.app/"
                                            target="_blank"
                                            rel="noreferrer"
                                            variant="outlined"
                                            size="small"
                                            startIcon={<CurrencyExchangeIcon fontSize="small" />}
                                            sx={{ px: 1.5 }}
                                        >
                                            Buy GARTH
                                        </Button>
                                        <Button
                                            component={RouterLink}
                                            to="/utilities"
                                            variant="outlined"
                                            size="small"
                                            startIcon={<SwapHorizIcon fontSize="small" />}
                                            sx={{ px: 1.5 }}
                                        >
                                            Deposit to contract
                                        </Button>
                                        <Button
                                            component={RouterLink}
                                            to="/"
                                            variant="contained"
                                            size="small"
                                            startIcon={<TrendingUpIcon fontSize="small" />}
                                            sx={{ px: 1.5 }}
                                        >
                                            Trade markets
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Box>

                    <Box component="section">
                        <SectionHeader
                            eyebrow="What can you predict?"
                            title="Anything with a clear Yes/No outcome"
                            body="Markets can be as short as minutes or as long as months, making Quottery useful for both real-time sentiment and longer-running forecasts."
                        />
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            {predictionExamples.map((item) => (
                                <Chip
                                    key={item}
                                    label={item}
                                    variant="outlined"
                                    sx={{
                                        borderColor: theme.palette.border.default,
                                        bgcolor: theme.palette.surface[1],
                                        fontWeight: 800,
                                    }}
                                />
                            ))}
                        </Stack>
                    </Box>

                    <Box component="section">
                        <SectionHeader
                            eyebrow="How it works"
                            title="Two sides, one fixed payout"
                            body="Every market has Yes and No shares. When the event resolves, the winning side receives the full 100,000 tokens per share while the losing side receives nothing."
                        />
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={5}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        ...panelSx,
                                    }}
                                >
                                    <Stack spacing={2}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <PaymentsIcon color="primary" />
                                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                                Trading currency
                                            </Typography>
                                        </Box>
                                        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                            Trading currently uses GARTH as a temporary stablecoin managed by the smart contract.
                                            When native QUSD becomes available on Qubic, Quottery is designed to migrate to it.
                                        </Typography>
                                    </Stack>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={7}>
                                <Grid container spacing={2}>
                                    {orderBookRows.map((row) => (
                                        <Grid item xs={12} sm={6} key={row.title}>
                                            <Card variant="outlined" sx={{ ...surfaceCardSx, height: "100%" }}>
                                                <CardContent>
                                                    <Typography sx={{ mb: 0.75, fontWeight: 900 }}>
                                                        {row.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                                        {row.body}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>

                    <Box component="section">
                        <SectionHeader
                            eyebrow="Lifecycle"
                            title="From event creation to reward claiming"
                            body="The contract manages open orders, escrowed tokens, disputes, finalization, rewards, and cleanup across the full market lifecycle."
                        />
                        <Grid container spacing={2}>
                            {lifecycleSteps.map((step, index) => (
                                <Grid item xs={12} sm={6} md={4} key={step.title}>
                                    <Card variant="outlined" sx={{ ...surfaceCardSx, height: "100%" }}>
                                        <CardContent>
                                            <Stack spacing={1}>
                                                <Typography variant="caption" sx={{ color: accentTextColor }} fontWeight={900}>
                                                    STEP {index + 1}
                                                </Typography>
                                                <Typography sx={{ fontWeight: 900 }}>{step.title}</Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                                    {step.body}
                                                </Typography>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    <Box component="section">
                        <SectionHeader
                            eyebrow="Fees and market making"
                            title="Fees happen on winning payouts"
                            body="Quottery does not charge for placing, cancelling, or replacing orders. Fees are charged only when value is realized through winning rewards."
                        />
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <List disablePadding>
                                    {feeRows.map((row) => (
                                        <ListItem key={row.label} disableGutters alignItems="flex-start">
                                            <ListItemIcon sx={{ minWidth: 36, color: accentTextColor, pt: 0.5 }}>
                                                <CheckCircleOutlineIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={<Typography sx={{ fontWeight: 900 }}>{row.label}</Typography>}
                                                secondary={row.body}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        ...panelSx,
                                    }}
                                >
                                    <Stack spacing={1.5}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <BalanceIcon color="primary" />
                                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                                Market maker discounts
                                            </Typography>
                                        </Box>
                                        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                            The Game Operator can grant fee discounts to specific addresses, up to 100%.
                                            This helps active liquidity providers quote tighter spreads and run automated strategies with less fee drag.
                                        </Typography>
                                    </Stack>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>

                    <Box component="section">
                        <SectionHeader
                            eyebrow="Governance"
                            title="QTRYGOV holders shape the protocol"
                            body="There are 676 QTRYGOV tokens. Holders can submit complete parameter proposals covering fees, deposit amounts, event costs, and the Game Operator address."
                        />
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2.5, md: 3 },
                                ...panelSx,
                            }}
                        >
                            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                Proposals are weighted by QTRYGOV holdings. If identical proposals reach a quorum of
                                451 weighted votes within an epoch, the new parameters take effect at the start of the
                                next epoch. Inactive holders can be redistributed after long inactivity so governance
                                does not get blocked by abandoned accounts.
                            </Typography>
                        </Paper>
                    </Box>

                    <Box component="section">
                        <SectionHeader
                            eyebrow="Roles"
                            title="The people and systems behind Quottery"
                        />
                        <Grid container spacing={2}>
                            {roleRows.map((role) => (
                                <Grid item xs={12} md={6} key={role.title}>
                                    <Card variant="outlined" sx={{ ...surfaceCardSx, height: "100%" }}>
                                        <CardContent>
                                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                                <Box sx={iconTileSx}>
                                                    {role.icon}
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ mb: 0.75, fontWeight: 900 }}>
                                                        {role.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                                                        {role.body}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
}

export default AboutPage;
