import { getTagGroupId, getTagInfo } from "./tagMap";

const BINANCE_MARKETS_URL = "https://www.binance.com/en/markets";
const GATE_MARKETS_URL = "https://www.gate.com/";
const CRYPTO_SYMBOLS = new Set(["QUBIC", "BTC", "ETH", "SOL"]);

const SECTION_KEYS = ["source", "data", "time", "rules", "finality"];

function getCryptoPair(event) {
  const label = getTagInfo(event?.tag)?.label;
  const symbol = String(label || "").toUpperCase();
  return CRYPTO_SYMBOLS.has(symbol) ? `${symbol}/USDT` : "CRYPTO/USDT";
}

function getTagLabel(event) {
  return String(getTagInfo(event?.tag)?.label || "").toLowerCase();
}

function createRuleSet(id, { values = {}, urls = {}, lineKeys = {} } = {}) {
  return {
    summaryKey: `eventRules.${id}.summary`,
    values,
    sections: SECTION_KEYS.map((sectionId) => ({
      id: sectionId,
      titleKey: `eventRules.sections.${sectionId}`,
      linesKey: lineKeys[sectionId] || `eventRules.${id}.${sectionId}`,
      urls: urls[sectionId] || [],
    })),
  };
}

function getSportsSource(event) {
  const label = getTagLabel(event);
  const sources = {
    football: { key: "football", urls: ["https://www.fifa.com/", "https://www.uefa.com/"] },
    basketball: { key: "basketball", urls: ["https://www.nba.com/"] },
    tennis: { key: "tennis", urls: ["https://www.atptour.com/", "https://www.wtatennis.com/"] },
    hockey: { key: "hockey", urls: ["https://www.nhl.com/"] },
    mma: { key: "mma", urls: ["https://www.ufc.com/"] },
    chess: { key: "chess", urls: ["https://www.fide.com/"] },
  };
  return sources[label] || { key: "default", urls: [] };
}

const RULES_BY_GROUP = {
  crypto: (event) => {
    const usesGate = getTagLabel(event) === "qubic";
    return createRuleSet("crypto", {
      values: {
        venue: usesGate ? "Gate" : "Binance",
        pair: getCryptoPair(event),
      },
      urls: { source: [usesGate ? GATE_MARKETS_URL : BINANCE_MARKETS_URL] },
    });
  },
  "qubic-ecosystem": () => createRuleSet("qubicEcosystem"),
  sports: (event) => {
    const source = getSportsSource(event);
    return createRuleSet("sports", {
      urls: { source: source.urls },
      lineKeys: { source: `eventRules.sports.sources.${source.key}` },
    });
  },
  finance: (event) => (
    getTagLabel(event) === "economy"
      ? createRuleSet("economy", {
          urls: {
            source: [
              "https://www.federalreserve.gov/",
              "https://www.bls.gov/",
              "https://www.bea.gov/",
              "https://ec.europa.eu/eurostat",
            ],
          },
        })
      : createRuleSet("finance", { urls: { source: ["https://app.pyth.com/"] } })
  ),
  other: (event) => {
    const label = getTagLabel(event);
    if (label === "science") {
      return createRuleSet("science", {
        urls: { source: ["https://www.nasa.gov/", "https://www.spacex.com/"] },
      });
    }
    if (label === "politics") {
      return createRuleSet("politics", { urls: { source: ["https://www.fec.gov/"] } });
    }
    if (label === "cinema") {
      return createRuleSet("cinema", { urls: { source: ["https://www.boxofficemojo.com/"] } });
    }
    return createRuleSet("other");
  },
};

export function getEventRules(event) {
  const groupId = getTagGroupId(event?.tag);
  const factory = RULES_BY_GROUP[groupId] || RULES_BY_GROUP.other;
  return factory(event);
}
