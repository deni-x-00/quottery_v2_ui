import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
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
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const overviewCards = [
    {
        icon: <HubIcon />,
        title: "Peer-to-peer prediction markets",
        body: "Quottery lets people trade outcome shares directly with one another. There is no house, hidden edge, or counterparty sitting in the middle.",
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
        body: "A seller's ask meets a buyer's bid on the same option.",
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
        body: "Anyone can place bid or ask orders. Tokens and shares are locked while orders are open and can be released by cancelling.",
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

const SectionHeader = ({ eyebrow, title, body }) => (
    <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
        <Typography
            variant="overline"
            color="primary"
            sx={{ fontWeight: 800, letterSpacing: 0 }}
        >
            {eyebrow}
        </Typography>
        <Typography variant="h4" component="h2" fontWeight={800} sx={{ mb: 1 }}>
            {title}
        </Typography>
        {body && (
            <Typography color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.7 }}>
                {body}
            </Typography>
        )}
    </Box>
);

function AboutPage() {
    const theme = useTheme();
    const softBackground = theme.palette.mode === "dark"
        ? "rgba(97, 240, 254, 0.08)"
        : "rgba(44, 62, 80, 0.06)";

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pt: { xs: 10, md: 12 }, pb: { xs: 6, md: 9 } }}>
            <Box
                component="section"
                sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: softBackground,
                    mb: { xs: 5, md: 7 },
                }}
            >
                <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
                    <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
                        <Grid item xs={12} md={7}>
                            <Stack spacing={2.5}>
                                <Chip
                                    icon={<TokenIcon />}
                                    label="Powered by Qubic"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ alignSelf: "flex-start", fontWeight: 700 }}
                                />
                                <Typography
                                    variant="h1"
                                    sx={{
                                        fontSize: { xs: "2.4rem", sm: "3.1rem", md: "4rem" },
                                        lineHeight: 1.05,
                                        fontWeight: 900,
                                    }}
                                >
                                    Quottery is a decentralized prediction market.
                                </Typography>
                                <Typography
                                    color="text.secondary"
                                    sx={{
                                        fontSize: { xs: "1rem", md: "1.15rem" },
                                        lineHeight: 1.8,
                                        maxWidth: 720,
                                    }}
                                >
                                    Trade Yes or No outcome shares on real-world events through an on-chain order book.
                                    The smart contract handles matching, settlement, and payouts transparently.
                                </Typography>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 2.5, md: 3 },
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 2,
                                    bgcolor: "background.paper",
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
                                    <Divider />
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        <Chip label="No house" size="small" />
                                        <Chip label="No counterparty risk" size="small" />
                                        <Chip label="Verifiable settlement" size="small" />
                                    </Stack>
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Container maxWidth="lg">
                <Stack spacing={{ xs: 6, md: 8 }}>
                    <Grid container spacing={2.5}>
                        {overviewCards.map((card) => (
                            <Grid item xs={12} md={4} key={card.title} sx={{ display: "flex" }}>
                                <Card variant="outlined" sx={{ width: "100%", borderRadius: 2 }}>
                                    <CardContent>
                                        <Stack spacing={1.5}>
                                            <Box sx={{ color: "primary.main" }}>{card.icon}</Box>
                                            <Typography variant="h6" fontWeight={800}>
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
                                    <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
                                        <CardContent>
                                            <Stack spacing={1.5}>
                                                <Box display="flex" alignItems="center" gap={1.25}>
                                                    <Box sx={{ color: "primary.main", display: "flex" }}>
                                                        {step.icon}
                                                    </Box>
                                                    <Typography variant="caption" color="primary" fontWeight={900}>
                                                        {String(index + 1).padStart(2, "0")}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="h6" fontWeight={800}>
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
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 2,
                                bgcolor: "background.paper",
                            }}
                        >
                            <Grid container spacing={2.5} alignItems="center">
                                <Grid item xs={12} md={7}>
                                    <Stack spacing={1}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <RocketLaunchIcon color="primary" />
                                            <Typography variant="h6" fontWeight={800}>
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
                                            <MuiLink component={RouterLink} to="/misc" underline="hover">
                                                Utilities
                                            </MuiLink>
                                            , the markets on the{" "}
                                            <MuiLink component={RouterLink} to="/" underline="hover">
                                                main trading page
                                            </MuiLink>{" "}
                                            are ready to use.
                                        </Typography>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} md={5}>
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        <Button
                                            component={RouterLink}
                                            to="/"
                                            variant="outlined"
                                            size="small"
                                            startIcon={<AccountBalanceWalletIcon fontSize="small" />}
                                            sx={{ borderRadius: 999, px: 1.5 }}
                                        >
                                            Connect wallet
                                        </Button>
                                        <Button
                                            component="span"
                                            variant="outlined"
                                            size="small"
                                            startIcon={<TokenIcon fontSize="small" />}
                                            title="Gate, MEXC, Bitget, etc."
                                            sx={{ borderRadius: 999, px: 1.5, cursor: "default" }}
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
                                            sx={{ borderRadius: 999, px: 1.5 }}
                                        >
                                            Buy GARTH
                                        </Button>
                                        <Button
                                            component={RouterLink}
                                            to="/misc"
                                            variant="outlined"
                                            size="small"
                                            startIcon={<SwapHorizIcon fontSize="small" />}
                                            sx={{ borderRadius: 999, px: 1.5 }}
                                        >
                                            Deposit to contract
                                        </Button>
                                        <Button
                                            component={RouterLink}
                                            to="/"
                                            variant="contained"
                                            size="small"
                                            startIcon={<TrendingUpIcon fontSize="small" />}
                                            sx={{ borderRadius: 999, px: 1.5 }}
                                        >
                                            Trade events
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
                                <Chip key={item} label={item} variant="outlined" />
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
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 2,
                                        bgcolor: "background.paper",
                                    }}
                                >
                                    <Stack spacing={2}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <PaymentsIcon color="primary" />
                                            <Typography variant="h6" fontWeight={800}>
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
                                            <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
                                                <CardContent>
                                                    <Typography fontWeight={800} sx={{ mb: 0.75 }}>
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
                                    <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
                                        <CardContent>
                                            <Stack spacing={1}>
                                                <Typography variant="caption" color="primary" fontWeight={900}>
                                                    STEP {index + 1}
                                                </Typography>
                                                <Typography fontWeight={800}>{step.title}</Typography>
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
                                            <ListItemIcon sx={{ minWidth: 36, color: "primary.main", pt: 0.5 }}>
                                                <CheckCircleOutlineIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={<Typography fontWeight={800}>{row.label}</Typography>}
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
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 2,
                                        bgcolor: "background.paper",
                                    }}
                                >
                                    <Stack spacing={1.5}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <BalanceIcon color="primary" />
                                            <Typography variant="h6" fontWeight={800}>
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
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 2,
                                bgcolor: "background.paper",
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
                                    <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
                                        <CardContent>
                                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                                <Box sx={{ color: "primary.main", pt: 0.25 }}>
                                                    {role.icon}
                                                </Box>
                                                <Box>
                                                    <Typography fontWeight={800} sx={{ mb: 0.75 }}>
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
            </Container>
        </Box>
    );
}

export default AboutPage;
