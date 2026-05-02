import React, { useEffect, useMemo, useState } from "react";
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
    Slider,
    Alert,
    MenuItem,
    CircularProgress,
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
import {
    broadcastTransaction,
    getAssetBalance,
    getBasicInfo,
    getEventInfo,
    getStaticSmartContracts,
    getUserPositions,
} from "../components/qubic/util/bobApi";
import {
    buildContractTx,
    buildQuotteryTx,
    packEventIdPayload,
    packRevokeShareMgmtPayload,
    packTransferPayload,
    packTransferShareMgmtPayload,
    QTRY_USER_CLAIM_REWARD,
    QTRY_TRANSFER_QUSD,
    QTRY_TRANSFER_QTRYGOV,
} from "../components/qubic/util/quotteryTx";
import { useTxTracker } from "../hooks/useTxTracker";
import { useBalanceNotifier } from "../hooks/useBalanceNotifier";

const TRANSFER_QUBIC_FEE = 100;
const WHOLE_SHARE_PRICE = 100000;
const GARTH_ASSET_NAME = "GARTH";
const GARTH_ISSUER = "PHOENIXCLQOBHDZCHJOCKCPZVTKALQBMXYOEDBUHSDCJRMTUCUBPLSUFNBIE";
const TRANSFER_RIGHTS_IDENTIFIERS = [
    "TransferShareManagementRights",
    "TransferSharesManagementRights",
];
const REVOKE_RIGHTS_IDENTIFIERS = ["RevokeAssetManagementRights"];

const toPositiveInt = (value) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const clampToMax = (value, max) => {
    const parsed = toPositiveInt(value);
    if (!max || max <= 0) return parsed ? String(parsed) : "";
    if (!parsed) return "";
    return String(Math.min(parsed, max));
};

const availableLabel = (value, unit) => (
    value === null || value === undefined
        ? `Available: unavailable`
        : `Available: ${formatQubicAmount(value)} ${unit}`
);

const hasTransferFee = (quBalance) => quBalance === null || quBalance === undefined || quBalance >= TRANSFER_QUBIC_FEE;

const matchesIdentifier = (sourceIdentifier, identifiers) => {
    if (!sourceIdentifier) return false;
    return identifiers.some((identifier) => identifier.toLowerCase() === sourceIdentifier.toLowerCase());
};

const findManagementRightsProcedure = (contract) => {
    const transferProcedure = contract?.procedures?.find((procedure) =>
        matchesIdentifier(procedure.sourceIdentifier, TRANSFER_RIGHTS_IDENTIFIERS)
    );
    if (transferProcedure) return { procedure: transferProcedure, type: "transfer" };

    const revokeProcedure = contract?.procedures?.find((procedure) =>
        matchesIdentifier(procedure.sourceIdentifier, REVOKE_RIGHTS_IDENTIFIERS)
    );
    if (revokeProcedure) return { procedure: revokeProcedure, type: "revoke" };

    return null;
};

const contractLabel = (contract) => contract?.label || contract?.name || `Contract #${contract?.contractIndex}`;

const ActionCard = ({
    icon,
    title,
    subtitle,
    children,
    onSubmit,
    submitting,
    submitLabel,
    connected,
    disabled = false,
}) => (
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
                    disabled={!connected || submitting || disabled}
                    fullWidth
                    size="large"
                >
                    {submitting ? "Signing..." : submitLabel}
                </Button>
            </Stack>
        </CardContent>
    </Card>
);

const AmountSlider = ({ label, value, max, unit, onChange, disabled }) => {
    const numericValue = toPositiveInt(value);
    const sliderMax = Math.max(1, Number(max || 0));
    const cappedValue = Math.min(numericValue, sliderMax);

    return (
        <Stack spacing={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {availableLabel(max, unit)}
                </Typography>
            </Box>
            <Slider
                value={cappedValue}
                min={0}
                max={sliderMax}
                step={1}
                disabled={disabled || !max || max <= 0}
                onChange={(_, nextValue) => onChange(String(nextValue))}
                valueLabelDisplay="auto"
                valueLabelFormat={(nextValue) => formatQubicAmount(nextValue)}
            />
            <TextField
                label={label}
                value={value}
                onChange={(e) => onChange(clampToMax(e.target.value, max))}
                fullWidth
                size="small"
                placeholder={max ? `Max ${formatQubicAmount(max)} ${unit}` : "Unavailable"}
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                disabled={disabled || !max || max <= 0}
            />
        </Stack>
    );
};

function MiscPage() {
    const { connected, toggleConnectModal, getSignedTx } = useQubicConnect();
    const {
        allEvents,
        walletPublicIdentity,
        walletPublicKeyBytes,
        balance,
        quBalance,
        qtryGovBalance,
        getScheduledTick,
    } = useQuotteryContext();
    const { bobUrl } = useConfig();
    const { showSnackbar } = useSnackbar();
    const { trackTx } = useTxTracker();
    const { scheduleBalanceRefresh } = useBalanceNotifier();

    const [claimEventId, setClaimEventId] = useState("");
    const [claimOptions, setClaimOptions] = useState([]);
    const [claimOptionsLoading, setClaimOptionsLoading] = useState(false);
    const [claimOptionsError, setClaimOptionsError] = useState("");
    const [claimSubmitting, setClaimSubmitting] = useState(false);

    const [garthReceiver, setGarthReceiver] = useState("");
    const [garthAmount, setGarthAmount] = useState("");
    const [garthSubmitting, setGarthSubmitting] = useState(false);

    const [govReceiver, setGovReceiver] = useState("");
    const [govAmount, setGovAmount] = useState("");
    const [govSubmitting, setGovSubmitting] = useState(false);

    const [smartContracts, setSmartContracts] = useState([]);
    const [smartContractsLoading, setSmartContractsLoading] = useState(false);
    const [smartContractsError, setSmartContractsError] = useState("");
    const [smrSourceContractIndex, setSmrSourceContractIndex] = useState("");
    const [smrDestinationContractIndex, setSmrDestinationContractIndex] = useState("");
    const [smrShares, setSmrShares] = useState("");
    const [smrSourceContracts, setSmrSourceContracts] = useState([]);
    const [smrDestinationContracts, setSmrDestinationContracts] = useState([]);
    const [smrAvailable, setSmrAvailable] = useState(null);
    const [smrAvailableLoading, setSmrAvailableLoading] = useState(false);
    const [smrSubmitting, setSmrSubmitting] = useState(false);

    const feeWarning = useMemo(() => (
        hasTransferFee(quBalance)
            ? ""
            : `Transfers require ${TRANSFER_QUBIC_FEE} QU for the Qubic fee. Current QU balance: ${formatQubicAmount(quBalance ?? 0)}.`
    ), [quBalance]);

    const selectedSmrSource = useMemo(
        () => smrSourceContracts.find((contract) => String(contract.contractIndex) === String(smrSourceContractIndex)) || null,
        [smrSourceContractIndex, smrSourceContracts]
    );

    const selectedSmrDestination = useMemo(
        () => smrDestinationContracts.find((contract) => String(contract.contractIndex) === String(smrDestinationContractIndex)) || null,
        [smrDestinationContractIndex, smrDestinationContracts]
    );

    const filteredSmrDestinationContracts = useMemo(() => {
        if (!selectedSmrSource) return smrDestinationContracts;
        if (selectedSmrSource.procedureType === "revoke") {
            return smrDestinationContracts.filter((contract) => Number(contract.contractIndex) === 1);
        }
        return smrDestinationContracts.filter((contract) => Number(contract.contractIndex) !== Number(selectedSmrSource.contractIndex));
    }, [selectedSmrSource, smrDestinationContracts]);

    const smrFeeWarning = useMemo(() => {
        const fee = Number(selectedSmrSource?.procedureFee || 0);
        if (!selectedSmrSource || quBalance === null || quBalance === undefined || quBalance >= fee) return "";
        return `Transfer rights requires ${formatQubicAmount(fee)} QU for the selected contract fee. Current QU balance: ${formatQubicAmount(quBalance ?? 0)}.`;
    }, [quBalance, selectedSmrSource]);

    useEffect(() => {
        let cancelled = false;

        const loadClaimOptions = async () => {
            if (!connected || !walletPublicIdentity) {
                setClaimOptions([]);
                setClaimEventId("");
                setClaimOptionsLoading(false);
                setClaimOptionsError("");
                return;
            }

            setClaimOptionsLoading(true);
            setClaimOptionsError("");

            try {
                const result = await getUserPositions(bobUrl, walletPublicIdentity);
                const positions = (result?.positions || []).filter((position) => Number(position?.amount || 0) > 0);
                const uniqueEventIds = [...new Set(positions.map((position) => position.eventId))];
                const knownEventsById = new Map(
                    (allEvents || [])
                        .filter((event) => event?.eid !== undefined && event?.eid !== null)
                        .map((event) => [String(event.eid), event])
                );

                const fetchedEvents = await Promise.all(
                    uniqueEventIds.map(async (eventId) => {
                        const knownEvent = knownEventsById.get(String(eventId));
                        if (knownEvent && knownEvent.resultByGO !== undefined) return knownEvent;

                        try {
                            return await getEventInfo(bobUrl, eventId);
                        } catch (eventError) {
                            console.warn(`Failed to load claim event ${eventId}:`, eventError);
                            return null;
                        }
                    })
                );

                const eventsById = new Map(
                    fetchedEvents
                        .filter(Boolean)
                        .map((event) => [String(event.eid ?? event.eventId), event])
                );

                const nextOptions = positions
                    .map((position) => {
                        const event = eventsById.get(String(position.eventId));
                        const resultByGO = Number(event?.resultByGO);
                        const option = Number(position.option);

                        if (!event || !Number.isInteger(resultByGO) || resultByGO < 0 || resultByGO !== option) {
                            return null;
                        }

                        const optionName = option === 0
                            ? event.option0Desc || "Option 0"
                            : event.option1Desc || "Option 1";
                        const shares = Number(position.amount || 0);

                        return {
                            eventId: position.eventId,
                            label: event.desc || `Event #${position.eventId}`,
                            optionName,
                            shares,
                            estimatedReward: shares * WHOLE_SHARE_PRICE,
                        };
                    })
                    .filter(Boolean)
                    .sort((a, b) => Number(b.eventId) - Number(a.eventId));

                if (cancelled) return;

                setClaimOptions(nextOptions);
                setClaimEventId((currentEventId) => (
                    nextOptions.some((option) => String(option.eventId) === String(currentEventId))
                        ? currentEventId
                        : (nextOptions[0] ? String(nextOptions[0].eventId) : "")
                ));
            } catch (error) {
                console.error("Failed to load claimable rewards:", error);
                if (!cancelled) {
                    setClaimOptions([]);
                    setClaimEventId("");
                    setClaimOptionsError("Failed to load rewards.");
                }
            } finally {
                if (!cancelled) setClaimOptionsLoading(false);
            }
        };

        loadClaimOptions();

        return () => {
            cancelled = true;
        };
    }, [allEvents, bobUrl, connected, walletPublicIdentity]);

    useEffect(() => {
        let cancelled = false;

        const loadSmartContracts = async () => {
            setSmartContractsLoading(true);
            setSmartContractsError("");

            try {
                const contracts = await getStaticSmartContracts();
                if (cancelled) return;

                setSmartContracts(contracts);
                if (contracts.length === 0) {
                    setSmartContractsError("Failed to load smart contracts metadata.");
                }
            } catch (error) {
                console.error("Failed to load smart contracts metadata:", error);
                if (!cancelled) {
                    setSmartContracts([]);
                    setSmartContractsError("Failed to load smart contracts metadata.");
                }
            } finally {
                if (!cancelled) setSmartContractsLoading(false);
            }
        };

        loadSmartContracts();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadSourceContracts = async () => {
            if (!connected || !walletPublicIdentity || smartContracts.length === 0) {
                setSmrSourceContracts([]);
                setSmrDestinationContracts([]);
                setSmrSourceContractIndex("");
                setSmrDestinationContractIndex("");
                setSmrAvailable(null);
                setSmrAvailableLoading(false);
                return;
            }

            setSmrAvailableLoading(true);

            try {
                const destinationContracts = smartContracts
                    .filter((contract) => contract.allowTransferShares && findManagementRightsProcedure(contract))
                    .sort((a, b) => contractLabel(a).localeCompare(contractLabel(b)));

                const sourceCandidates = smartContracts
                    .map((contract) => {
                        const mgmtProcedure = findManagementRightsProcedure(contract);
                        if (!mgmtProcedure) return null;
                        return {
                            ...contract,
                            procedureId: mgmtProcedure.procedure.id,
                            procedureFee: mgmtProcedure.procedure.fee ?? 0,
                            procedureType: mgmtProcedure.type,
                        };
                    })
                    .filter(Boolean);

                const sourceContracts = await Promise.all(
                    sourceCandidates.map(async (contract) => {
                        const availableBalance = await getAssetBalance(
                            bobUrl,
                            walletPublicIdentity,
                            GARTH_ISSUER,
                            GARTH_ASSET_NAME,
                            contract.contractIndex
                        );

                        return {
                            ...contract,
                            availableBalance: availableBalance ?? 0,
                        };
                    })
                );

                const availableSources = sourceContracts
                    .filter((contract) => contract.availableBalance > 0)
                    .sort((a, b) => b.availableBalance - a.availableBalance);

                if (cancelled) return;

                setSmrSourceContracts(availableSources);
                setSmrDestinationContracts(destinationContracts);
                setSmrSourceContractIndex((currentIndex) => (
                    availableSources.some((contract) => String(contract.contractIndex) === String(currentIndex))
                        ? currentIndex
                        : (availableSources[0] ? String(availableSources[0].contractIndex) : "")
                ));
            } catch (error) {
                console.error("Failed to load GARTH management contracts:", error);
                if (!cancelled) {
                    setSmrSourceContracts([]);
                    setSmrDestinationContracts([]);
                    setSmartContractsError("Failed to load GARTH management contracts.");
                }
            } finally {
                if (!cancelled) setSmrAvailableLoading(false);
            }
        };

        loadSourceContracts();

        return () => {
            cancelled = true;
        };
    }, [bobUrl, connected, smartContracts, walletPublicIdentity]);

    useEffect(() => {
        if (!selectedSmrSource) {
            setSmrAvailable(null);
            setSmrDestinationContractIndex("");
            return;
        }

        setSmrAvailable(selectedSmrSource.availableBalance);
        setSmrShares((currentShares) => clampToMax(currentShares, selectedSmrSource.availableBalance));

        const filteredDestinations = selectedSmrSource.procedureType === "revoke"
            ? smrDestinationContracts.filter((contract) => Number(contract.contractIndex) === 1)
            : smrDestinationContracts.filter((contract) => Number(contract.contractIndex) !== Number(selectedSmrSource.contractIndex));

        setSmrDestinationContractIndex((currentIndex) => (
            filteredDestinations.some((contract) => String(contract.contractIndex) === String(currentIndex))
                ? currentIndex
                : (filteredDestinations[0] ? String(filteredDestinations[0].contractIndex) : "")
        ));
    }, [selectedSmrSource, smrDestinationContracts]);

    const identityToBytes = async (identity) => {
        const qHelper = new QubicHelper();
        const idBytes = await qHelper.getIdentityBytes(identity);
        return new Uint8Array(idBytes);
    };

    const signAndBroadcast = async (inputType, amount, payload, description, destinationPubkey = null) => {
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
        const packet = destinationPubkey
            ? buildContractTx(walletPublicKeyBytes, destinationPubkey, scheduledTick, inputType, txAmount, payload)
            : buildQuotteryTx(walletPublicKeyBytes, scheduledTick, inputType, txAmount, payload);
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
        if (balance !== null && balance !== undefined && amt > balance) {
            showSnackbar("Amount exceeds available GARTH balance.", "error");
            return;
        }
        if (!hasTransferFee(quBalance)) {
            showSnackbar(`Transfer requires ${TRANSFER_QUBIC_FEE} QU for the Qubic fee.`, "error");
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
        if (qtryGovBalance !== null && qtryGovBalance !== undefined && amt > qtryGovBalance) {
            showSnackbar("Amount exceeds available QTRYGOV balance.", "error");
            return;
        }
        if (!hasTransferFee(quBalance)) {
            showSnackbar(`Transfer requires ${TRANSFER_QUBIC_FEE} QU for the Qubic fee.`, "error");
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

        if (!selectedSmrSource) {
            showSnackbar("Select the current managing contract.", "error");
            return;
        }
        if (!selectedSmrDestination) {
            showSnackbar("Select the destination contract.", "error");
            return;
        }

        const shares = parseInt(smrShares, 10);
        if (Number.isNaN(shares) || shares <= 0) {
            showSnackbar("Enter a valid number of shares.", "error");
            return;
        }
        if (smrAvailable !== null && smrAvailable !== undefined && shares > smrAvailable) {
            showSnackbar("Number of shares exceeds the available balance.", "error");
            return;
        }

        const procedureFee = Number(selectedSmrSource.procedureFee || 0);
        if (quBalance !== null && quBalance !== undefined && quBalance < procedureFee) {
            showSnackbar(`Transfer rights requires ${formatQubicAmount(procedureFee)} QU for the selected contract fee.`, "error");
            return;
        }

        setSmrSubmitting(true);
        try {
            const [issuerBytes, sourceContractBytes] = await Promise.all([
                identityToBytes(GARTH_ISSUER),
                identityToBytes(selectedSmrSource.address),
            ]);
            const isRevoke = selectedSmrSource.procedureType === "revoke";
            const payload = isRevoke
                ? packRevokeShareMgmtPayload(issuerBytes, GARTH_ASSET_NAME, shares)
                : packTransferShareMgmtPayload(
                    issuerBytes,
                    GARTH_ASSET_NAME,
                    shares,
                    selectedSmrDestination.contractIndex
                );
            await signAndBroadcast(
                selectedSmrSource.procedureId,
                procedureFee,
                payload,
                `${isRevoke ? "Revoke" : "Transfer"} ${formatQubicAmount(shares)} GARTH management rights from ${contractLabel(selectedSmrSource)} to ${contractLabel(selectedSmrDestination)}`,
                sourceContractBytes
            );
        } catch (e) {
            showSnackbar(`Transfer failed: ${e.message}`, "error");
        } finally {
            setSmrSubmitting(false);
        }
    };

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
                    connected={connected}
                    disabled={!claimEventId || claimOptionsLoading}
                >
                    <TextField
                        select
                        label="Reward Event"
                        value={claimEventId}
                        onChange={(e) => setClaimEventId(e.target.value)}
                        fullWidth
                        size="small"
                        disabled={!connected || claimOptionsLoading || claimOptions.length === 0}
                        helperText={
                            claimOptionsLoading
                                ? "Loading rewards..."
                                : claimOptions.length === 0
                                    ? "No rewards found for your current winning positions."
                                    : " "
                        }
                        InputProps={{
                            endAdornment: claimOptionsLoading ? <CircularProgress size={18} /> : null,
                        }}
                    >
                        {claimOptions.map((option) => (
                            <MenuItem key={option.eventId} value={String(option.eventId)} sx={{ whiteSpace: "normal" }}>
                                <Stack spacing={0.25}>
                                    <Typography variant="body2">{option.label}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {option.optionName} | {formatQubicAmount(option.shares)} shares | est. {formatQubicAmount(option.estimatedReward)} GARTH
                                    </Typography>
                                </Stack>
                            </MenuItem>
                        ))}
                    </TextField>
                    {claimOptionsError && <Alert severity="warning">{claimOptionsError}</Alert>}
                </ActionCard>

                <ActionCard
                    icon={<SendIcon color="primary" />}
                    title="Transfer GARTH"
                    subtitle="Send GARTH (QUSD) tokens to another identity via the Quottery contract."
                    onSubmit={handleTransferGarth}
                    submitting={garthSubmitting}
                    submitLabel="Transfer GARTH"
                    connected={connected}
                    disabled={!hasTransferFee(quBalance)}
                >
                    {feeWarning && <Alert severity="warning">{feeWarning}</Alert>}
                    <TextField
                        label="Receiver Identity"
                        value={garthReceiver}
                        onChange={(e) => setGarthReceiver(e.target.value.toUpperCase().replace(/\s/g, ""))}
                        fullWidth
                        size="small"
                        placeholder="60-character Qubic identity"
                        inputProps={{ maxLength: 60 }}
                    />
                    <AmountSlider
                        label="Amount"
                        value={garthAmount}
                        max={balance}
                        unit="GARTH"
                        onChange={setGarthAmount}
                        disabled={!connected}
                    />
                </ActionCard>

                <ActionCard
                    icon={<AccountBalanceIcon color="primary" />}
                    title="Transfer QTRYGOV"
                    subtitle="Send QTRYGOV governance shares to another identity."
                    onSubmit={handleTransferGov}
                    submitting={govSubmitting}
                    submitLabel="Transfer QTRYGOV"
                    connected={connected}
                    disabled={!hasTransferFee(quBalance)}
                >
                    {feeWarning && <Alert severity="warning">{feeWarning}</Alert>}
                    <TextField
                        label="Receiver Identity"
                        value={govReceiver}
                        onChange={(e) => setGovReceiver(e.target.value.toUpperCase().replace(/\s/g, ""))}
                        fullWidth
                        size="small"
                        placeholder="60-character Qubic identity"
                        inputProps={{ maxLength: 60 }}
                    />
                    <AmountSlider
                        label="Amount"
                        value={govAmount}
                        max={qtryGovBalance}
                        unit="QTRYGOV"
                        onChange={setGovAmount}
                        disabled={!connected}
                    />
                </ActionCard>

                <ActionCard
                    icon={<SwapHorizIcon color="primary" />}
                    title="Transfer Share Management Rights"
                    subtitle="Move GARTH management rights from the current managing contract to another contract."
                    onSubmit={handleTransferShareMgmt}
                    submitting={smrSubmitting}
                    submitLabel="Transfer Management Rights"
                    connected={connected}
                    disabled={
                        smartContractsLoading ||
                        smrAvailableLoading ||
                        !selectedSmrSource ||
                        !selectedSmrDestination ||
                        !!smrFeeWarning
                    }
                >
                    {smartContractsError && <Alert severity="warning">{smartContractsError}</Alert>}
                    {smrFeeWarning && <Alert severity="warning">{smrFeeWarning}</Alert>}
                    <TextField
                        select
                        label="Current Managing Contract"
                        value={smrSourceContractIndex}
                        onChange={(e) => setSmrSourceContractIndex(e.target.value)}
                        fullWidth
                        size="small"
                        disabled={!connected || smartContractsLoading || smrAvailableLoading || smrSourceContracts.length === 0}
                        helperText={
                            smartContractsLoading || smrAvailableLoading
                                ? "Loading GARTH balances..."
                                : smrSourceContracts.length === 0
                                    ? "No GARTH managed by a supported contract was found for this wallet."
                                    : " "
                        }
                    >
                        {smrSourceContracts.map((contract) => (
                            <MenuItem key={contract.contractIndex} value={String(contract.contractIndex)}>
                                <Stack spacing={0.25}>
                                    <Typography variant="body2">{contractLabel(contract)}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Available: {formatQubicAmount(contract.availableBalance)} GARTH | Procedure #{contract.procedureId} | Fee {formatQubicAmount(contract.procedureFee)} QU
                                    </Typography>
                                </Stack>
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        label="Destination Contract"
                        value={smrDestinationContractIndex}
                        onChange={(e) => setSmrDestinationContractIndex(e.target.value)}
                        fullWidth
                        size="small"
                        disabled={!connected || !selectedSmrSource || filteredSmrDestinationContracts.length === 0}
                        helperText={
                            filteredSmrDestinationContracts.length === 0
                                ? "No compatible destination contract found."
                                : " "
                        }
                    >
                        {filteredSmrDestinationContracts.map((contract) => (
                            <MenuItem key={contract.contractIndex} value={String(contract.contractIndex)}>
                                {contractLabel(contract)}
                            </MenuItem>
                        ))}
                    </TextField>
                    <AmountSlider
                        label="Number of Shares"
                        value={smrShares}
                        max={smrAvailable}
                        unit="GARTH"
                        onChange={setSmrShares}
                        disabled={!connected || smrAvailableLoading}
                    />
                </ActionCard>
            </Stack>
        </Container>
    );
}

export default MiscPage;
