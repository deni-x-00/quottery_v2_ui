export const WHOLE_SHARE_PRICE = 100000;

const normalizeOrderPrice = (entry, flipPrice = false) => {
  const rawPrice = Number(entry?.price ?? 0);
  const amount = Number(entry?.amount ?? 0);
  if (!Number.isFinite(rawPrice) || !Number.isFinite(amount) || amount <= 0) return null;

  const price = flipPrice ? WHOLE_SHARE_PRICE - rawPrice : rawPrice;
  if (!Number.isFinite(price) || price <= 0 || price >= WHOLE_SHARE_PRICE) return null;
  return price;
};

const getUnifiedPrices = (book, option, side) => {
  const optionKey = option === 0 ? "option0" : "option1";
  const oppositeOptionKey = option === 0 ? "option1" : "option0";
  const isBidSide = side === "bids";
  const directSource = isBidSide ? book?.[optionKey]?.bids : book?.[optionKey]?.asks;
  const flippedSource = isBidSide ? book?.[oppositeOptionKey]?.asks : book?.[oppositeOptionKey]?.bids;
  const prices = [];

  if (Array.isArray(directSource)) {
    for (const entry of directSource) {
      const price = normalizeOrderPrice(entry);
      if (price !== null) prices.push(price);
    }
  }

  if (Array.isArray(flippedSource)) {
    for (const entry of flippedSource) {
      const price = normalizeOrderPrice(entry, true);
      if (price !== null) prices.push(price);
    }
  }

  return prices;
};

export const calculateOptionProbability = (book, option = 0) => {
  const bids = getUnifiedPrices(book, option, "bids");
  const asks = getUnifiedPrices(book, option, "asks");
  const bestBid = bids.length > 0 ? Math.max(...bids) : null;
  const bestAsk = asks.length > 0 ? Math.min(...asks) : null;

  let price = null;
  if (bestBid !== null && bestAsk !== null) {
    price = Math.round((bestBid + bestAsk) / 2);
  } else {
    price = bestBid ?? bestAsk;
  }

  if (price === null) return null;

  return {
    option,
    price,
    percent: (price / WHOLE_SHARE_PRICE) * 100,
  };
};

export const formatChancePercent = (probability) => {
  const percent = Number(probability?.percent);
  if (!Number.isFinite(percent)) return null;
  const clamped = Math.max(0, Math.min(100, percent));
  const rounded = Math.round(clamped);
  return `${rounded}%`;
};
