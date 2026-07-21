import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Box,
    Typography,
    Button,
    Stack,
    TextField,
    Card,
    CardContent,
    Slider,
    Alert,
    IconButton,
    MenuItem,
    CircularProgress,
    Chip,
    InputAdornment,
} from "@mui/material";
import RedeemIcon from "@mui/icons-material/Redeem";
import SendIcon from "@mui/icons-material/Send";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import RefreshIcon from "@mui/icons-material/Refresh";
import { QubicHelper } from "@qubic-lib/qubic-ts-library/dist/qubicHelper";
import { useQuotteryContext } from "../contexts/QuotteryContext";
import { useQubicConnect } from "../components/qubic/connect/QubicConnectContext";
import { useConfig } from "../contexts/ConfigContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import { formatQubicAmount, byteArrayToHexString } from "../components/qubic/util";
import {
    broadcastTransaction,
    GARTH_ASSET_NAME,
    GARTH_ISSUER,
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
    QTRY_TRANSFER_SHARE_MGMT,
    QTRY_TRANSFER_QTRYGOV,
} from "../components/qubic/util/quotteryTx";
import { useTxTracker } from "../hooks/useTxTracker";
import { useBalanceNotifier } from "../hooks/useBalanceNotifier";
import usePageTitle from "../hooks/usePageTitle";
import { MetricGrid, PageHeader, PageShell } from "../components/ui";
import { useTranslation } from "react-i18next";

const TRANSFER_QUBIC_FEE = 100;
const CLAIM_REWARD_QUBIC_FEE = 1000000;
const PENDING_CLAIM_TTL_MS = 24 * 60 * 60 * 1000;
const WHOLE_SHARE_PRICE = 100000;
const TRANSFER_RIGHTS_IDENTIFIERS = [
    "TransferShareManagementRights",
    "TransferSharesManagementRights",
];
const REVOKE_RIGHTS_IDENTIFIERS = ["RevokeAssetManagementRights"];
const AMOUNT_PRESETS = [25, 50, 75, 100];
const QX_CONTRACT_INDEX = 1;
const QUOTTERY_CONTRACT_INDEX = 2;
const RECEIVER_IDENTITY_REGEX = /^[A-Z]{60}$/;

const normalizeNumericInput = (value) => String(value || "").replace(/\D/g, "");

const normalizeIdentityInput = (value) => (
    String(value || "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 60)
);

const normalizeIdentity = (value) => String(value || "").trim().toUpperCase();

const pendingClaimsStorageKey = (identity) => `quottery:pending-claims:${normalizeIdentity(identity)}`;

const readPendingClaimIds = (identity) => {
    if (!identity || typeof window === "undefined") return [];
    try {
        const now = Date.now();
        const parsed = JSON.parse(window.localStorage.getItem(pendingClaimsStorageKey(identity)) || "[]");
        return (Array.isArray(parsed) ? parsed : [])
            .filter((item) => item?.eventId && now - Number(item.at || 0) < PENDING_CLAIM_TTL_MS)
            .map((item) => String(item.eventId));
    } catch {
        return [];
    }
};

const writePendingClaimIds = (identity, eventIds) => {
    if (!identity || typeof window === "undefined") return;
    const uniqueIds = [...new Set((eventIds || []).map((eventId) => String(eventId)).filter(Boolean))];
    const now = Date.now();
    try {
        window.localStorage.setItem(
            pendingClaimsStorageKey(identity),
            JSON.stringify(uniqueIds.map((eventId) => ({ eventId, at: now })))
        );
    } catch {
        // localStorage is best-effort only.
    }
};

const isValidReceiverIdentity = (identity) => RECEIVER_IDENTITY_REGEX.test(identity);

const toPositiveInt = (value) => {
    const parsed = parseInt(normalizeNumericInput(value), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const clampToMax = (value, max) => {
    const parsed = toPositiveInt(value);
    if (!max || max <= 0) return parsed ? String(parsed) : "";
    if (!parsed) return "";
    return String(Math.min(parsed, max));
};

const formatAmountInput = (value) => {
    const digits = normalizeNumericInput(value);
    if (!digits) return "";
    return formatQubicAmount(digits);
};

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

const managementRightsFee = (sourceContract) => {
    const sourceFee = Number(sourceContract?.procedureFee || 0);
    return sourceFee;
};

const utilityInputSx = (theme) => ({
    "& .MuiOutlinedInput-root": {
        borderRadius: 1.25,
        bgcolor: theme.palette.surface[2],
        "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.border.soft,
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.border.default,
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
        },
    },
    "& .MuiInputLabel-root": {
        color: theme.palette.text.secondary,
        fontWeight: 700,
    },
    "& .MuiFormHelperText-root": {
        mx: 0,
    },
});

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
    tone = "primary",
}) => (
    <Card
        variant="outlined"
        sx={(theme) => {
            const toneColor = tone === "success"
                ? theme.palette.market.yes
                : tone === "warning"
                    ? theme.palette.warning.main
                    : theme.palette.primary.main;
            return {
                height: "100%",
                borderRadius: 1.5,
                borderColor: theme.palette.border.soft,
                bgcolor: theme.palette.surface[1],
                boxShadow: "none",
                overflow: "hidden",
                position: "relative",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: "0 auto 0 0",
                    width: 2,
                    bgcolor: toneColor,
                    opacity: 0.8,
                },
            };
        }}
    >
        <CardContent sx={{ p: { xs: 1.75, sm: 2 }, "&:last-child": { pb: { xs: 1.75, sm: 2 } } }}>
            <Stack spacing={2}>
                <Box display="flex" alignItems="flex-start" gap={1.5}>
                    <Box
                        sx={(theme) => ({
                            width: 38,
                            height: 38,
                            borderRadius: 1.25,
                            border: `1px solid ${theme.palette.border.soft}`,
                            bgcolor: theme.palette.surface[2],
                            color: tone === "success" ? theme.palette.market.yes : tone === "warning" ? theme.palette.warning.main : theme.palette.primary.main,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            "& svg": { fontSize: 21 },
                        })}
                    >
                        {icon}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 900, lineHeight: 1.2 }}>
                            {title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.45 }}>
                            {subtitle}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={(theme) => ({ borderTop: `1px solid ${theme.palette.border.soft}` })} />
                {children}
                <Button
                    variant="contained"
                    onClick={onSubmit}
                    disabled={!connected || submitting || disabled}
                    fullWidth
                    size="medium"
                    sx={{ minHeight: 44, borderRadius: 1, textTransform: "none", fontWeight: 900 }}
                >
                    {submitting ? <ActionCardSigningLabel /> : submitLabel}
                </Button>
            </Stack>
        </CardContent>
    </Card>
);

const ActionCardSigningLabel = () => {
    const { t } = useTranslation();
    return t("utilities.signing");
};

const AmountSlider = ({ label, value, max, unit, onChange, disabled }) => {
    const { t } = useTranslation();
    const numericValue = toPositiveInt(value);
    const sliderMax = Math.max(1, Number(max || 0));
    const cappedValue = Math.min(numericValue, sliderMax);
    const isDisabled = disabled || !max || max <= 0;
    const presetMarks = AMOUNT_PRESETS.map((percent) => Math.floor((sliderMax * percent) / 100));

    const setPreset = (percent) => {
        if (isDisabled) return;
        const nextValue = percent === 100
            ? Number(max)
            : Math.max(1, Math.floor((Number(max) * percent) / 100));
        onChange(String(nextValue));
    };

    return (
        <Stack spacing={1.25}>
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {max === null || max === undefined
                        ? t("utilities.availableUnavailable")
                        : t("utilities.available", { value: formatQubicAmount(max), unit })}
                </Typography>
            </Box>
            <Slider
                value={cappedValue}
                min={0}
                max={sliderMax}
                step={1}
                disabled={isDisabled}
                onChange={(_, nextValue) => onChange(String(nextValue))}
                valueLabelDisplay="auto"
                valueLabelFormat={(nextValue) => formatQubicAmount(nextValue)}
                marks={presetMarks.map((mark) => ({ value: mark }))}
                sx={{
                    mx: 1,
                    mb: 0.25,
                    color: "primary.main",
                    "& .MuiSlider-rail": { opacity: 0.28 },
                    "& .MuiSlider-track": { border: 0 },
                    "& .MuiSlider-thumb": {
                        width: 16,
                        height: 16,
                        border: "2px solid currentColor",
                        bgcolor: "background.default",
                    },
                }}
            />
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {AMOUNT_PRESETS.map((percent) => (
                    <Chip
                        key={percent}
                        label={percent === 100 ? t("utilities.max") : `${percent}%`}
                        size="small"
                        variant={percent === 100 ? "filled" : "outlined"}
                        color={percent === 100 ? "primary" : "default"}
                        onClick={() => setPreset(percent)}
                        disabled={isDisabled}
                        sx={(theme) => ({
                            minWidth: 56,
                            borderRadius: 1,
                            fontWeight: 800,
                            borderColor: theme.palette.border.soft,
                        })}
                    />
                ))}
            </Stack>
            <TextField
                label={label}
                value={formatAmountInput(value)}
                onChange={(e) => onChange(clampToMax(e.target.value, max))}
                fullWidth
                size="small"
                placeholder={max
                    ? t("utilities.maxAmount", { value: formatQubicAmount(max), unit })
                    : t("utilities.unavailable")}
                inputProps={{ inputMode: "numeric", pattern: "[0-9,]*" }}
                disabled={isDisabled}
                sx={utilityInputSx}
            />
        </Stack>
    );
};

const ReceiverIdentityField = ({ value, onChange }) => {
    const { t } = useTranslation();
    const hasValue = value.length > 0;
    const isValid = isValidReceiverIdentity(value);

    return (
        <TextField
            label={t("utilities.receiverIdentity")}
            value={value}
            onChange={(e) => onChange(normalizeIdentityInput(e.target.value))}
            fullWidth
            size="small"
            placeholder={t("utilities.receiverPlaceholder")}
            inputProps={{ maxLength: 60 }}
            error={hasValue && !isValid}
            helperText={hasValue && !isValid ? t("utilities.receiverInvalid") : " "}
            sx={utilityInputSx}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <Typography
                            variant="caption"
                            color={isValid ? "success.main" : "text.secondary"}
                            sx={{ fontFamily: "monospace" }}
                        >
                            {value.length}/60
                        </Typography>
                    </InputAdornment>
                ),
            }}
        />
    );
};

function UtilitiesPage() {
    const { t } = useTranslation();
    usePageTitle(t("utilities.pageTitle"));
    const { connected, toggleConnectModal, getSignedTx } = useQubicConnect();
    const {
        allEvents,
        walletPublicIdentity,
        walletPublicKeyBytes,
        balance,
        quBalance,
        qtryGovBalance,
        fetchQuBalance,
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
    const [pendingClaimEventIds, setPendingClaimEventIds] = useState([]);

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
    const [quBalanceRefreshing, setQuBalanceRefreshing] = useState(false);
    const autoQuRefreshKeyRef = useRef("");

    const feeWarning = useMemo(() => (
        hasTransferFee(quBalance)
            ? ""
            : t("utilities.transfersFeeWarning", {
                fee: TRANSFER_QUBIC_FEE,
                balance: formatQubicAmount(quBalance ?? 0),
            })
    ), [quBalance, t]);

    const selectedSmrSource = useMemo(
        () => smrSourceContracts.find((contract) => String(contract.contractIndex) === String(smrSourceContractIndex)) || null,
        [smrSourceContractIndex, smrSourceContracts]
    );

    const selectedSmrDestination = useMemo(
        () => smrDestinationContracts.find((contract) => String(contract.contractIndex) === String(smrDestinationContractIndex)) || null,
        [smrDestinationContractIndex, smrDestinationContracts]
    );
    const selectedSmrFee = useMemo(
        () => managementRightsFee(selectedSmrSource),
        [selectedSmrSource]
    );
    const effectiveSmrAvailable = selectedSmrSource?.availableBalance ?? smrAvailable;

    const filteredSmrDestinationContracts = useMemo(() => {
        if (!selectedSmrSource) return smrDestinationContracts;
        if (selectedSmrSource.procedureType === "revoke") {
            return smrDestinationContracts.filter((contract) => Number(contract.contractIndex) === QX_CONTRACT_INDEX);
        }
        return smrDestinationContracts.filter((contract) => Number(contract.contractIndex) !== Number(selectedSmrSource.contractIndex));
    }, [selectedSmrSource, smrDestinationContracts]);

    const smrFeeState = useMemo(() => {
        if (!selectedSmrSource || !selectedSmrDestination) {
            return { blocked: false, severity: "info", message: "" };
        }

        const requiredFee = formatQubicAmount(selectedSmrFee);
        if (quBalance === null || quBalance === undefined) {
            return {
                blocked: true,
                severity: "info",
                message: t("utilities.requiredFeeLoading", { fee: requiredFee }),
            };
        }

        const currentBalance = formatQubicAmount(quBalance);
        if (quBalance < selectedSmrFee) {
            return {
                blocked: true,
                severity: "warning",
                message: t("utilities.rightsFeeLow", { fee: requiredFee, balance: currentBalance }),
            };
        }

        return {
            blocked: false,
            severity: "info",
            message: t("utilities.requiredFee", { fee: requiredFee, balance: currentBalance }),
        };
    }, [quBalance, selectedSmrDestination, selectedSmrFee, selectedSmrSource, t]);

    useEffect(() => {
        setPendingClaimEventIds(readPendingClaimIds(walletPublicIdentity));
    }, [walletPublicIdentity]);

    const clearPendingClaimEventId = useCallback((eventId) => {
        if (!walletPublicIdentity || eventId === null || eventId === undefined) return;
        setPendingClaimEventIds((currentIds) => {
            const nextIds = currentIds.filter((currentId) => String(currentId) !== String(eventId));
            if (nextIds.length !== currentIds.length) writePendingClaimIds(walletPublicIdentity, nextIds);
            return nextIds;
        });
    }, [walletPublicIdentity]);

    const refreshQuBalance = useCallback(async () => {
        if (!walletPublicIdentity || typeof fetchQuBalance !== "function") return;
        setQuBalanceRefreshing(true);
        try {
            await fetchQuBalance(walletPublicIdentity);
        } catch (error) {
            showSnackbar(t("utilities.refreshQuFailed", { error: error.message || error }), "error");
        } finally {
            setQuBalanceRefreshing(false);
        }
    }, [fetchQuBalance, showSnackbar, t, walletPublicIdentity]);

    useEffect(() => {
        const identity = connected ? walletPublicIdentity : "";
        if (!identity) {
            autoQuRefreshKeyRef.current = "";
            return;
        }
        if (quBalance !== null && quBalance !== undefined) return;
        if (autoQuRefreshKeyRef.current === identity) return;

        autoQuRefreshKeyRef.current = identity;
        refreshQuBalance();
    }, [connected, quBalance, refreshQuBalance, walletPublicIdentity]);

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
                const fetchedEvents = await Promise.all(
                    uniqueEventIds.map(async (eventId) => {
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

                const rawOptions = positions
                    .map((position) => {
                        const event = eventsById.get(String(position.eventId));
                        const resultByGO = Number(event?.resultByGO);
                        const option = Number(position.option);
                        const isFinalized = event?.isFinalized === true || Number(event?.publishTickTime) === 0xffffffff;

                        if (!event || !isFinalized || !Number.isInteger(resultByGO) || resultByGO < 0 || resultByGO !== option) {
                            return null;
                        }

                        const optionName = option === 0
                            ? event.option0Desc || t("eventDetails.option0")
                            : event.option1Desc || t("eventDetails.option1");
                        const shares = Number(position.amount || 0);

                        return {
                            eventId: position.eventId,
                            label: event.desc || t("eventDetails.eventFallback", { id: position.eventId }),
                            optionName,
                            shares,
                            estimatedReward: shares * WHOLE_SHARE_PRICE,
                        };
                    })
                    .filter(Boolean)
                    .sort((a, b) => Number(b.eventId) - Number(a.eventId));

                if (cancelled) return;

                const rawOptionIds = new Set(rawOptions.map((option) => String(option.eventId)));
                const activePendingIds = pendingClaimEventIds.filter((eventId) => rawOptionIds.has(String(eventId)));
                if (activePendingIds.length !== pendingClaimEventIds.length) {
                    setPendingClaimEventIds(activePendingIds);
                    writePendingClaimIds(walletPublicIdentity, activePendingIds);
                }

                const pendingSet = new Set(activePendingIds.map(String));
                const nextOptions = rawOptions.filter((option) => !pendingSet.has(String(option.eventId)));

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
                    setClaimOptionsError(t("utilities.rewardsLoadFailed"));
                }
            } finally {
                if (!cancelled) setClaimOptionsLoading(false);
            }
        };

        loadClaimOptions();

        return () => {
            cancelled = true;
        };
    }, [allEvents, bobUrl, connected, pendingClaimEventIds, t, walletPublicIdentity]);

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
                    setSmartContractsError(t("utilities.contractsLoadFailed"));
                }
            } catch (error) {
                console.error("Failed to load smart contracts metadata:", error);
                if (!cancelled) {
                    setSmartContracts([]);
                    setSmartContractsError(t("utilities.contractsLoadFailed"));
                }
            } finally {
                if (!cancelled) setSmartContractsLoading(false);
            }
        };

        loadSmartContracts();

        return () => {
            cancelled = true;
        };
    }, [t]);

    const loadSourceContracts = useCallback(async (isCancelled = null) => {
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
                    .map((contract) => {
                        const mgmtProcedure = findManagementRightsProcedure(contract);
                        if (!contract.allowTransferShares || !mgmtProcedure) return null;
                        return {
                            ...contract,
                            procedureId: mgmtProcedure.procedure.id,
                            procedureFee: mgmtProcedure.procedure.fee ?? 0,
                            procedureType: mgmtProcedure.type,
                        };
                    })
                    .filter(Boolean)
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

                if (isCancelled && isCancelled()) return;

                setSmrSourceContracts(availableSources);
                setSmrDestinationContracts(destinationContracts);
                setSmrSourceContractIndex((currentIndex) => (
                    availableSources.some((contract) => String(contract.contractIndex) === String(currentIndex))
                        ? currentIndex
                        : (availableSources[0] ? String(availableSources[0].contractIndex) : "")
                ));
            } catch (error) {
                console.error("Failed to load GARTH management contracts:", error);
                if (!isCancelled || !isCancelled()) {
                    setSmrSourceContracts([]);
                    setSmrDestinationContracts([]);
                    setSmartContractsError(t("utilities.managementLoadFailed"));
                }
            } finally {
                if (!isCancelled || !isCancelled()) setSmrAvailableLoading(false);
            }
        },
        [bobUrl, connected, smartContracts, t, walletPublicIdentity]
    );

    useEffect(() => {
        let cancelled = false;

        loadSourceContracts(() => cancelled);

        return () => {
            cancelled = true;
        };
    }, [loadSourceContracts]);

    useEffect(() => {
        if (!selectedSmrSource) {
            setSmrAvailable(null);
            setSmrDestinationContractIndex("");
            return;
        }

        setSmrAvailable(selectedSmrSource.availableBalance);
        setSmrShares((currentShares) => clampToMax(currentShares, selectedSmrSource.availableBalance));

        const filteredDestinations = selectedSmrSource.procedureType === "revoke"
            ? smrDestinationContracts.filter((contract) => Number(contract.contractIndex) === QX_CONTRACT_INDEX)
            : smrDestinationContracts.filter((contract) => Number(contract.contractIndex) !== Number(selectedSmrSource.contractIndex));

        const preferredDestination = filteredDestinations.find((contract) =>
            Number(contract.contractIndex) === (
                Number(selectedSmrSource.contractIndex) === QX_CONTRACT_INDEX
                    ? QUOTTERY_CONTRACT_INDEX
                    : QX_CONTRACT_INDEX
            )
        ) || filteredDestinations[0];

        setSmrDestinationContractIndex((currentIndex) => (
            filteredDestinations.some((contract) => String(contract.contractIndex) === String(currentIndex))
                ? currentIndex
                : (preferredDestination ? String(preferredDestination.contractIndex) : "")
        ));
    }, [selectedSmrSource, smrDestinationContracts]);

    const identityToBytes = async (identity) => {
        const qHelper = new QubicHelper();
        const idBytes = await qHelper.getIdentityBytes(identity);
        return new Uint8Array(idBytes);
    };

    const signAndBroadcast = async (inputType, amount, payload, description, destinationPubkey = null, trackMeta = {}) => {
        const [tickInfo, basicInfo] = await Promise.all([
            getScheduledTick(),
            getBasicInfo(bobUrl),
        ]);

        if (!tickInfo) {
            showSnackbar(t("utilities.scheduledTickFailed"), "error");
            return null;
        }
        if (!basicInfo) {
            showSnackbar(t("utilities.contractInfoFailed"), "error");
            return null;
        }

        const { currentTick, scheduledTick, tickRate, offset } = tickInfo;
        console.debug(
            `[Utilities] ${description}: rate=${tickRate.toFixed(2)} t/s, offset=${offset}, scheduledTick=${scheduledTick}`
        );

        const txAmount = amount ?? (basicInfo.antiSpamAmount || 0);
        const packet = destinationPubkey
            ? buildContractTx(walletPublicKeyBytes, destinationPubkey, scheduledTick, inputType, txAmount, payload)
            : buildQuotteryTx(walletPublicKeyBytes, scheduledTick, inputType, txAmount, payload);
        showSnackbar(t("utilities.signTransaction"), "info");
        const confirmed = await getSignedTx(packet);
        if (!confirmed) return null;

        const txHex = typeof confirmed.tx === "string"
            ? confirmed.tx
            : byteArrayToHexString(confirmed.tx);
        const res = await broadcastTransaction(bobUrl, txHex);

        if (res?.txHash) {
            trackTx({
                txHash: res.txHash,
                scheduledTick,
                description,
                inputType,
                txAmount,
                ...trackMeta,
            });
            const postTickDelay = Math.max(
                3000,
                Math.ceil(((scheduledTick - (currentTick || scheduledTick)) / Math.max(tickRate || 1, 1)) * 1000) + 5000
            );
            scheduleBalanceRefresh(postTickDelay);
            setTimeout(() => {
                loadSourceContracts();
            }, postTickDelay);
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
            showSnackbar(t("utilities.walletKeyMissing"), "error");
            return false;
        }
        return true;
    };

    const handleClaimReward = async () => {
        if (!requireWallet()) return;

        const eid = parseInt(claimEventId, 10);
        if (Number.isNaN(eid) || eid < 0) {
            showSnackbar(t("utilities.validEvent"), "error");
            return;
        }

        setClaimSubmitting(true);
        try {
            const payload = packEventIdPayload(eid);
            const res = await signAndBroadcast(
                QTRY_USER_CLAIM_REWARD,
                CLAIM_REWARD_QUBIC_FEE,
                payload,
                t("utilities.claimTrack", { id: eid }),
                null,
                {
                    eventId: eid,
                    onFailure: () => clearPendingClaimEventId(eid),
                }
            );
            if (res?.txHash) {
                const eventId = String(eid);
                setPendingClaimEventIds((currentIds) => {
                    const nextIds = [...new Set([...currentIds.map(String), eventId])];
                    writePendingClaimIds(walletPublicIdentity, nextIds);
                    return nextIds;
                });
                setClaimOptions((currentOptions) => {
                    const nextOptions = currentOptions.filter((option) => String(option.eventId) !== eventId);
                    setClaimEventId(nextOptions[0] ? String(nextOptions[0].eventId) : "");
                    return nextOptions;
                });
                showSnackbar(t("utilities.claimSent"), "success");
            }
        } catch (e) {
            showSnackbar(t("utilities.claimFailed", { error: e.message }), "error");
        } finally {
            setClaimSubmitting(false);
        }
    };

    const handleTransferGarth = async () => {
        if (!requireWallet()) return;

        const amt = parseInt(garthAmount, 10);
        if (!isValidReceiverIdentity(garthReceiver)) {
            showSnackbar(t("utilities.validReceiver"), "error");
            return;
        }
        if (Number.isNaN(amt) || amt <= 0) {
            showSnackbar(t("utilities.validAmount"), "error");
            return;
        }
        if (balance !== null && balance !== undefined && amt > balance) {
            showSnackbar(t("utilities.garthExceeded"), "error");
            return;
        }
        if (!hasTransferFee(quBalance)) {
            showSnackbar(t("utilities.transferFeeRequired", { fee: TRANSFER_QUBIC_FEE }), "error");
            return;
        }

        setGarthSubmitting(true);
        try {
            const receiverBytes = await identityToBytes(garthReceiver);
            const payload = packTransferPayload(receiverBytes, amt);
            await signAndBroadcast(
                QTRY_TRANSFER_QUSD,
                0,
                payload,
                `Transfer ${formatQubicAmount(amt)} GARTH`,
                null,
                { receiver: garthReceiver, amount: amt }
            );
        } catch (e) {
            showSnackbar(t("utilities.transferFailed", { error: e.message }), "error");
        } finally {
            setGarthSubmitting(false);
        }
    };

    const handleTransferGov = async () => {
        if (!requireWallet()) return;

        const amt = parseInt(govAmount, 10);
        if (!isValidReceiverIdentity(govReceiver)) {
            showSnackbar(t("utilities.validReceiver"), "error");
            return;
        }
        if (Number.isNaN(amt) || amt <= 0) {
            showSnackbar(t("utilities.validAmount"), "error");
            return;
        }
        if (qtryGovBalance !== null && qtryGovBalance !== undefined && amt > qtryGovBalance) {
            showSnackbar(t("utilities.govExceeded"), "error");
            return;
        }
        if (!hasTransferFee(quBalance)) {
            showSnackbar(t("utilities.transferFeeRequired", { fee: TRANSFER_QUBIC_FEE }), "error");
            return;
        }

        setGovSubmitting(true);
        try {
            const receiverBytes = await identityToBytes(govReceiver);
            const payload = packTransferPayload(receiverBytes, amt);
            await signAndBroadcast(
                QTRY_TRANSFER_QTRYGOV,
                0,
                payload,
                `Transfer ${amt} QTRYGOV`,
                null,
                { receiver: govReceiver, amount: amt }
            );
        } catch (e) {
            showSnackbar(t("utilities.transferFailed", { error: e.message }), "error");
        } finally {
            setGovSubmitting(false);
        }
    };

    const handleTransferShareMgmt = async () => {
        if (!requireWallet()) return;

        if (!selectedSmrSource) {
            showSnackbar(t("utilities.selectSource"), "error");
            return;
        }
        if (!selectedSmrDestination) {
            showSnackbar(t("utilities.selectDestination"), "error");
            return;
        }

        const shares = parseInt(smrShares, 10);
        if (Number.isNaN(shares) || shares <= 0) {
            showSnackbar(t("utilities.validShares"), "error");
            return;
        }
        if (effectiveSmrAvailable !== null && effectiveSmrAvailable !== undefined && shares > effectiveSmrAvailable) {
            showSnackbar(t("utilities.sharesExceeded"), "error");
            return;
        }

        const procedureFee = selectedSmrFee;
        if (quBalance === null || quBalance === undefined) {
            showSnackbar(t("utilities.quLoading"), "warning");
            return;
        }
        if (quBalance < procedureFee) {
            showSnackbar(t("utilities.rightsFeeRequired", { fee: formatQubicAmount(procedureFee) }), "error");
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
                sourceContractBytes,
                {
                    inputType: QTRY_TRANSFER_SHARE_MGMT,
                    amount: shares,
                    shares,
                    owner: walletPublicIdentity,
                    possessor: walletPublicIdentity,
                    sourceContractIndex: selectedSmrSource.contractIndex,
                    destinationContractIndex: selectedSmrDestination.contractIndex,
                }
            );
        } catch (e) {
            showSnackbar(t("utilities.transferFailed", { error: e.message }), "error");
        } finally {
            setSmrSubmitting(false);
        }
    };

    const utilityStats = [
        { key: "wallet", label: t("utilities.wallet"), value: connected ? t("utilities.connected") : t("utilities.disconnected") },
        { label: "GARTH", value: balance === null || balance === undefined ? "-" : formatQubicAmount(balance) },
        { label: "QTRYGOV", value: qtryGovBalance === null || qtryGovBalance === undefined ? "-" : formatQubicAmount(qtryGovBalance) },
        { key: "claimable", label: t("utilities.claimable"), value: claimOptionsLoading ? t("utilities.loading") : String(claimOptions.length) },
    ];

    return (
        <PageShell top={{ xs: 10, md: 12 }} bottom={7}>
            <PageHeader
                eyebrow={t("utilities.eyebrow")}
                title={t("utilities.title")}
                description={t("utilities.description")}
                icon={<AccountBalanceIcon />}
                actions={!connected && (
                    <Button
                        variant="contained"
                        onClick={toggleConnectModal}
                        sx={{ minHeight: 44, borderRadius: 1, textTransform: "none", fontWeight: 900, alignSelf: { md: "center" } }}
                    >
                        {t("utilities.connectWallet")}
                    </Button>
                )}
            />

            <MetricGrid
                metrics={utilityStats.map((stat) => ({
                    ...stat,
                    tone: stat.key === "wallet" && connected ? "cyan" : "default",
                }))}
                sx={{ mb: 2.5 }}
                compact
            />

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                    gap: 2,
                    alignItems: "start",
                }}
            >
                <ActionCard
                    icon={<RedeemIcon />}
                    title={t("utilities.claimTitle")}
                    subtitle={t("utilities.claimSubtitle")}
                    onSubmit={handleClaimReward}
                    submitting={claimSubmitting}
                    submitLabel={t("utilities.claimButton")}
                    connected={connected}
                    disabled={!claimEventId || claimOptionsLoading}
                    tone="success"
                >
                    <TextField
                        select
                        label={t("utilities.rewardEvent")}
                        value={claimEventId}
                        onChange={(e) => setClaimEventId(e.target.value)}
                        fullWidth
                        size="small"
                        disabled={!connected || claimOptionsLoading || claimOptions.length === 0}
                        helperText={
                            claimOptionsLoading
                                ? t("utilities.loadingRewards")
                                : claimOptions.length === 0
                                    ? t("utilities.noRewards")
                                    : " "
                        }
                        InputProps={{
                            endAdornment: claimOptionsLoading ? <CircularProgress size={18} /> : null,
                        }}
                        sx={utilityInputSx}
                    >
                        {claimOptions.map((option) => (
                            <MenuItem key={option.eventId} value={String(option.eventId)} sx={{ whiteSpace: "normal" }}>
                                <Stack spacing={0.25}>
                                    <Typography variant="body2">{option.label}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {option.optionName} | {formatQubicAmount(option.shares)} {t("utilities.shares")} | {t("utilities.estimated")} {formatQubicAmount(option.estimatedReward)} GARTH
                                    </Typography>
                                </Stack>
                            </MenuItem>
                        ))}
                    </TextField>
                    <Typography variant="caption" color="text.secondary">
                        {t("utilities.claimDepositHint")}
                    </Typography>
                    {claimOptionsError && <Alert severity="warning">{claimOptionsError}</Alert>}
                </ActionCard>

                <ActionCard
                    icon={<SendIcon />}
                    title={t("utilities.garthTitle")}
                    subtitle={t("utilities.garthSubtitle")}
                    onSubmit={handleTransferGarth}
                    submitting={garthSubmitting}
                    submitLabel={t("utilities.transferGarth")}
                    connected={connected}
                    disabled={!hasTransferFee(quBalance) || !isValidReceiverIdentity(garthReceiver) || !toPositiveInt(garthAmount) || !balance || balance <= 0}
                    tone="primary"
                >
                    {feeWarning && <Alert severity="warning">{feeWarning}</Alert>}
                    <ReceiverIdentityField
                        value={garthReceiver}
                        onChange={setGarthReceiver}
                    />
                    <AmountSlider
                        label={t("utilities.amount")}
                        value={garthAmount}
                        max={balance}
                        unit="GARTH"
                        onChange={setGarthAmount}
                        disabled={!connected}
                    />
                </ActionCard>

                <ActionCard
                    icon={<AccountBalanceIcon />}
                    title={t("utilities.govTitle")}
                    subtitle={t("utilities.govSubtitle")}
                    onSubmit={handleTransferGov}
                    submitting={govSubmitting}
                    submitLabel={t("utilities.transferGov")}
                    connected={connected}
                    disabled={!hasTransferFee(quBalance) || !isValidReceiverIdentity(govReceiver) || !toPositiveInt(govAmount) || !qtryGovBalance || qtryGovBalance <= 0}
                    tone="warning"
                >
                    {feeWarning && <Alert severity="warning">{feeWarning}</Alert>}
                    <ReceiverIdentityField
                        value={govReceiver}
                        onChange={setGovReceiver}
                    />
                    <AmountSlider
                        label={t("utilities.amount")}
                        value={govAmount}
                        max={qtryGovBalance}
                        unit="QTRYGOV"
                        onChange={setGovAmount}
                        disabled={!connected}
                    />
                </ActionCard>

                <ActionCard
                    icon={<SwapHorizIcon />}
                    title={t("utilities.rightsTitle")}
                    subtitle={t("utilities.rightsSubtitle")}
                    onSubmit={handleTransferShareMgmt}
                    submitting={smrSubmitting}
                    submitLabel={t("utilities.transferRights")}
                    connected={connected}
                    disabled={
                        smartContractsLoading ||
                        smrAvailableLoading ||
                        !selectedSmrSource ||
                        !selectedSmrDestination ||
                        !toPositiveInt(smrShares) ||
                        !effectiveSmrAvailable ||
                        effectiveSmrAvailable <= 0 ||
                        smrFeeState.blocked
                    }
                    tone="primary"
                >
                    {smartContractsError && <Alert severity="warning">{smartContractsError}</Alert>}
                    {smrFeeState.message && (
                        <Alert
                            severity={smrFeeState.severity}
                            action={
                                <IconButton
                                    aria-label={t("utilities.refreshQuBalance")}
                                    size="small"
                                    onClick={refreshQuBalance}
                                    disabled={!walletPublicIdentity || quBalanceRefreshing}
                                    sx={{ color: "inherit", mt: -0.25 }}
                                >
                                    {quBalanceRefreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon fontSize="small" />}
                                </IconButton>
                            }
                            sx={{
                                alignItems: "center",
                                "& .MuiAlert-message": { py: 0.25 },
                                "& .MuiAlert-action": { py: 0, pl: 1, alignItems: "center" },
                            }}
                        >
                            {smrFeeState.message}
                        </Alert>
                    )}
                    <TextField
                        select
                        label={t("utilities.currentContract")}
                        value={smrSourceContractIndex}
                        onChange={(e) => setSmrSourceContractIndex(e.target.value)}
                        fullWidth
                        size="small"
                        disabled={!connected || smartContractsLoading || smrAvailableLoading || smrSourceContracts.length === 0}
                        helperText={
                            smartContractsLoading || smrAvailableLoading
                                ? t("utilities.loadingGarthBalances")
                                : smrSourceContracts.length === 0
                                    ? t("utilities.noManagedGarth")
                                    : " "
                        }
                        sx={utilityInputSx}
                    >
                        {smrSourceContracts.map((contract) => (
                            <MenuItem key={contract.contractIndex} value={String(contract.contractIndex)}>
                                <Stack spacing={0.25}>
                                    <Typography variant="body2">{contractLabel(contract)}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {t("utilities.contractAvailable", { amount: formatQubicAmount(contract.availableBalance), fee: formatQubicAmount(contract.procedureFee) })}
                                    </Typography>
                                </Stack>
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        label={t("utilities.destinationContract")}
                        value={smrDestinationContractIndex}
                        onChange={(e) => setSmrDestinationContractIndex(e.target.value)}
                        fullWidth
                        size="small"
                        disabled={!connected || !selectedSmrSource || filteredSmrDestinationContracts.length === 0}
                        helperText={
                            filteredSmrDestinationContracts.length === 0
                                ? t("utilities.noDestination")
                                : " "
                        }
                        sx={utilityInputSx}
                    >
                        {filteredSmrDestinationContracts.map((contract) => (
                            <MenuItem key={contract.contractIndex} value={String(contract.contractIndex)}>
                                {contractLabel(contract)}
                            </MenuItem>
                        ))}
                    </TextField>
                    <AmountSlider
                        label={t("utilities.numberOfShares")}
                        value={smrShares}
                        max={effectiveSmrAvailable}
                        unit="GARTH"
                        onChange={setSmrShares}
                        disabled={!connected || smrAvailableLoading}
                    />
                </ActionCard>
            </Box>
        </PageShell>
    );
}

export default UtilitiesPage;
