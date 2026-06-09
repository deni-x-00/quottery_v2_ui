import { getTagGroupId, getTagInfo } from "./tagMap";

const BINANCE_MARKETS_URL = "https://www.binance.com/en/markets";
const GATE_MARKETS_URL = "https://www.gate.com/";

const CRYPTO_SYMBOLS = new Set(["QUBIC", "BTC", "ETH", "SOL"]);

function getCryptoPair(event) {
    const label = getTagInfo(event?.tag)?.label;
    const symbol = String(label || "").toUpperCase();
    return CRYPTO_SYMBOLS.has(symbol) ? `${symbol}/USDT` : "CRYPTO/USDT";
}

function getTagLabel(event) {
    return String(getTagInfo(event?.tag)?.label || "").toLowerCase();
}

function isQubicCrypto(event) {
    return getTagLabel(event) === "qubic";
}

const financeMarketRules = () => ({
    summary: 'This market resolves to "YES" if the specified asset or stock meets the condition based on official exchange closing data. Otherwise, it resolves to "NO".',
    sections: [
        {
            title: "Resolution Source (primary)",
            lines: ["Pyth Network market data."],
            urls: ["https://app.pyth.com/"],
        },
        {
            title: "Data Specification",
            lines: [
                "Official closing price only.",
                "Trading pair: asset/USD or stock/USD as listed.",
                "Market session: regular trading hours only.",
            ],
        },
        {
            title: "Resolution Time",
            lines: [
                "Official market close of the specified trading day (UTC-adjusted exchange close).",
                "The exact 1-minute candle containing the market expiration timestamp (UTC).",
            ],
        },
        {
            title: "Rules",
            lines: [
                "Only official close price is valid.",
                "Excludes pre-market, after-hours, OTC, and alternative venues.",
                "Exchange published data is final.",
            ],
        },
        {
            title: "Finality",
            lines: ["Final once exchange publishes closing data."],
        },
    ],
});

const economyRules = () => ({
    summary: 'This market resolves to "YES" if the officially published economic indicator meets the condition stated. Otherwise, it resolves to "NO".',
    sections: [
        {
            title: "Resolution Source (primary)",
            lines: ["Official government statistical agency."],
            urls: [
                "https://www.federalreserve.gov/",
                "https://www.bls.gov/",
                "https://www.bea.gov/",
                "https://ec.europa.eu/eurostat",
            ],
        },
        {
            title: "Data Specification",
            lines: [
                "First official release of the data.",
                "No revisions are considered.",
            ],
        },
        {
            title: "Resolution Time",
            lines: ["Upon publication of the official data release."],
        },
        {
            title: "Rules",
            lines: [
                "Forecasts, estimates, and private data are ignored.",
                "Only first release counts, not revisions.",
            ],
        },
        {
            title: "Finality",
            lines: ["First official publication is final."],
        },
    ],
});

function getSportsSource(event) {
    const label = getTagLabel(event);

    if (label === "football") {
        return {
            description: "Official competition organizer website for football.",
            examples: "Examples: FIFA or UEFA.",
            urls: ["https://www.fifa.com/", "https://www.uefa.com/"],
        };
    }

    if (label === "basketball") {
        return {
            description: "Official competition organizer website for basketball.",
            examples: "Example: NBA.",
            urls: ["https://www.nba.com/"],
        };
    }

    if (label === "tennis") {
        return {
            description: "Official competition organizer website for tennis.",
            examples: "Examples: ATP or WTA.",
            urls: ["https://www.atptour.com/", "https://www.wtatennis.com/"],
        };
    }

    if (label === "hockey") {
        return {
            description: "Official competition organizer website for hockey.",
            examples: "Example: NHL.",
            urls: ["https://www.nhl.com/"],
        };
    }

    if (label === "mma") {
        return {
            description: "Official competition organizer website for MMA.",
            examples: "Example: UFC.",
            urls: ["https://www.ufc.com/"],
        };
    }

    if (label === "chess") {
        return {
            description: "Official competition organizer website for chess.",
            examples: "Example: FIDE.",
            urls: ["https://www.fide.com/"],
        };
    }

    return {
        description: "Official competition organizer website (league/federation).",
        examples: "Use the official governing body for the sport named in the market.",
        urls: [],
    };
}

const scienceRules = () => ({
    summary: 'This market resolves to "YES" if the event is officially confirmed as having occurred. Otherwise, it resolves to "NO".',
    sections: [
        {
            title: "Resolution Source (primary)",
            lines: ["Official organization responsible for the event."],
            urls: [
                "https://www.nasa.gov/",
                "https://www.spacex.com/",
            ],
        },
        {
            title: "Data Specification",
            lines: [
                "Only official confirmation counts.",
                "Must be verifiable via public statement or official record.",
            ],
        },
        {
            title: "Resolution Time",
            lines: ["At official confirmation of event completion."],
        },
        {
            title: "Rules",
            lines: [
                "Rumors, telemetry, or third-party tracking are invalid.",
                "Only official announcements are valid.",
            ],
        },
        {
            title: "Finality",
            lines: ["Official confirmation is final."],
        },
    ],
});

const politicsRules = () => ({
    summary: 'This market resolves to "YES" if the candidate or option is officially certified as the winner of the election. Otherwise, it resolves to "NO".',
    sections: [
        {
            title: "Resolution Source (primary)",
            lines: [
                "Official election authority.",
                "Or relevant national/state electoral commission.",
            ],
            urls: ["https://www.fec.gov/"],
        },
        {
            title: "Data Specification",
            lines: [
                "Only certified final results count.",
                "Includes official recounts if part of certification process.",
            ],
        },
        {
            title: "Resolution Time",
            lines: ["Upon official certification of election results."],
        },
        {
            title: "Rules",
            lines: [
                "Exit polls, projections, and media calls are invalid.",
                "Only certified results are valid.",
            ],
        },
        {
            title: "Finality",
            lines: ["Certification is final and binding for resolution purposes."],
        },
    ],
});

const cinemaRules = () => ({
    summary: 'This market resolves to "YES" if the specified revenue or outcome is officially reported as achieved. Otherwise, it resolves to "NO".',
    sections: [
        {
            title: "Resolution Source (primary)",
            lines: ["Official box office tracking authority."],
            urls: ["https://www.boxofficemojo.com/"],
        },
        {
            title: "Data Specification",
            lines: [
                "Worldwide gross if specified.",
                "Only official reported figures.",
            ],
        },
        {
            title: "Resolution Time",
            lines: ["Upon publication of official revenue data."],
        },
        {
            title: "Rules",
            lines: [
                "Estimates and projections are invalid.",
                "Only verified reporting counts.",
            ],
        },
        {
            title: "Finality",
            lines: ["Official reported data is final."],
        },
    ],
});

const RULES_BY_GROUP = {
    crypto: (event) => {
        const usesGate = isQubicCrypto(event);
        const sourceName = usesGate ? "Gate Spot Market Data" : "Binance Spot Market Data";
        const sourceUrl = usesGate ? GATE_MARKETS_URL : BINANCE_MARKETS_URL;
        const venueName = usesGate ? "Gate" : "Binance";
        const pair = getCryptoPair(event);

        return {
        summary: `This market resolves to "YES" if the specified condition is met on the ${venueName} Spot trading data for the relevant ${pair} pair. Otherwise, it resolves to "NO".`,
        sections: [
            {
                title: "Resolution Source (primary)",
                lines: [sourceName],
                url: sourceUrl,
            },
            {
                title: "Data Specification",
                lines: [
                    `Trading pair: ${pair}`,
                    "Market: Spot only",
                    "Timeframe: 1-minute candles (1m)",
                    'Price field: OHLC "High" or the metric specified in the market title',
                ],
            },
            {
                title: "Resolution Time",
                lines: ["The exact 1-minute candle containing the market expiration timestamp (UTC)."],
            },
            {
                title: "Rules",
                lines: [
                    `Only ${venueName} Spot data is valid.`,
                    "No futures, derivatives, index prices, or external exchanges.",
                    `Candle data is taken as published by ${venueName} at resolution time.`,
                ],
            },
            {
                title: "Finality",
                lines: ["Once resolved, results are final and will not be changed due to later data corrections or disputes."],
            },
        ],
        };
    },
    "qubic-ecosystem": () => ({
        summary: 'This market resolves to "YES" if the specified Qubic ecosystem condition is met by the resolution time. Otherwise, it resolves to "NO".',
        sections: [
            {
                title: "Resolution Source (primary)",
                lines: ["Qubic network data, official Qubic ecosystem sources, or the source explicitly specified in the market title/context."],
            },
            {
                title: "Data Specification",
                lines: [
                    "Metric and asset/project scope are determined by the market title and context.",
                    "On-chain values must be read from the Qubic network or accepted Qubic public data endpoints.",
                    "Off-chain ecosystem announcements must come from the relevant official project source.",
                ],
            },
            {
                title: "Resolution Time",
                lines: ["The exact expiration timestamp or Qubic tick specified by the market, using UTC when a timestamp is used."],
            },
            {
                title: "Rules",
                lines: [
                    "Unofficial mirrors, screenshots, and third-party summaries are not valid unless no primary source exists.",
                    "If the market title names a specific metric, only that metric is used.",
                ],
            },
            {
                title: "Finality",
                lines: ["Once resolved, results are final and will not be changed due to later data corrections or disputes."],
            },
        ],
    }),
    sports: (event) => {
        const source = getSportsSource(event);
        return {
            summary: 'This market resolves to "YES" if the official governing body declares the specified outcome as the final result of the event. Otherwise, it resolves to "NO".',
            sections: [
                {
                    title: "Resolution Source (primary)",
                    lines: [
                        source.description,
                        source.examples,
                    ],
                    urls: source.urls,
                },
                {
                    title: "Data Specification",
                    lines: [
                        "Only official match result is considered.",
                        "Includes overtime, extra time, and shootouts if officially part of the competition rules.",
                    ],
                },
                {
                    title: "Resolution Time",
                    lines: ["At publication of official final result by the governing body."],
                },
                {
                    title: "Rules",
                    lines: [
                        "Only official published results count.",
                        "Statistics, media reports, or live trackers are not valid.",
                        "Disciplinary changes after match completion are ignored.",
                    ],
                },
                {
                    title: "Finality",
                    lines: ["Results are final once published officially by the governing body."],
                },
            ],
        };
    },
    finance: (event) => (
        getTagLabel(event) === "economy" ? economyRules() : financeMarketRules()
    ),
    other: (event) => {
        const label = getTagLabel(event);
        if (label === "science") return scienceRules();
        if (label === "politics") return politicsRules();
        if (label === "cinema") return cinemaRules();
        return {
        summary: 'This market resolves to "YES" if the specified condition is met according to the primary source for the topic. Otherwise, it resolves to "NO".',
        sections: [
            {
                title: "Resolution Source (primary)",
                lines: ["The official source, publication, organizer, or authoritative data provider specified by the market title/context."],
            },
            {
                title: "Data Specification",
                lines: [
                    "Topic, metric, threshold, and scope are determined by the market title and context.",
                    "If a source is explicitly named, only that source is valid.",
                ],
            },
            {
                title: "Resolution Time",
                lines: ["The market expiration timestamp or the official publication/finalization time for the relevant outcome."],
            },
            {
                title: "Rules",
                lines: [
                    "Rumors, unofficial posts, and secondary summaries are not valid primary sources.",
                    "Ambiguous outcomes are resolved according to the clearest literal reading of the market title/context.",
                ],
            },
            {
                title: "Finality",
                lines: ["Once resolved, results are final and will not be changed due to later corrections or disputes."],
            },
        ],
        };
    },
};

export function getEventRules(event) {
    const groupId = getTagGroupId(event?.tag);
    const factory = RULES_BY_GROUP[groupId] || RULES_BY_GROUP.other;
    return factory(event);
}
