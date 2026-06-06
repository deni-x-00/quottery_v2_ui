export function isEndEpochTxRef(value) {
  return String(value || "").startsWith("SC_END_EPOCH_TX");
}

export function explorerTickOrTxUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (isEndEpochTxRef(text)) {
    return `https://explorer.qubic.org/network/tx/${text}`;
  }
  return `https://explorer.qubic.org/network/tick/${text}`;
}

export function explorerTickOrTxLabel(value, formatter = null) {
  if (value === null || value === undefined || value === "") return "-";
  if (isEndEpochTxRef(value)) return String(value);
  return formatter ? formatter(value) : String(value);
}

export function shortExplorerTickOrTxLabel(value, formatter = null) {
  const label = explorerTickOrTxLabel(value, formatter);
  if (!isEndEpochTxRef(value) || label.length <= 13) return label;
  return `${label.slice(0, 5)}...${label.slice(-5)}`;
}
