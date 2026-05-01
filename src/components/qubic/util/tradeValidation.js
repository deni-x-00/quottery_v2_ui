const EVENT_DATE_RE = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

export function parseQubicUtcDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return null;
  const match = EVENT_DATE_RE.exec(dateString.trim());
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match.map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

export function isEventClosed(event, now = new Date()) {
  if (!event) return true;
  if (event.resultByGO !== undefined && event.resultByGO !== -1) return true;

  const endDate = parseQubicUtcDate(event.endDate);
  if (!endDate || Number.isNaN(endDate.getTime())) return false;

  return now >= endDate;
}

export function getPositionAmount(eventPositions, eventId, option) {
  if (!Array.isArray(eventPositions)) return 0;

  const position = eventPositions.find(
      (item) =>
          String(item.eventId) === String(eventId) &&
          Number(item.option) === Number(option)
  );

  return Number(position?.amount || 0);
}

export function validateOrderPreflight({
  event,
  eventPositions,
  option,
  side,
  amount,
  price,
  balance,
  quBalance,
  antiSpamAmount = 0,
}) {
  const eventId = event?.eid ?? event?.eventId;
  if (eventId === undefined || eventId === null) {
    return 'Invalid event. Cannot place order.';
  }

  if (isEventClosed(event)) {
    return 'This event is closed. New orders cannot be placed.';
  }

  if (amount <= 0) {
    return 'Please enter a valid amount.';
  }

  if (price <= 0 || price >= 100000) {
    return 'Price must be between 1 and 99,999.';
  }

  const availableBalance = Number(balance || 0);
  const requiredBalance = Number(amount || 0) * Number(price || 0);
  if (side === 'buy' && availableBalance < requiredBalance) {
    return `Insufficient GARTH balance. Required ${requiredBalance}, available ${availableBalance}.`;
  }

  if (
      antiSpamAmount > 0 &&
      quBalance !== null &&
      quBalance !== undefined &&
      Number(quBalance || 0) < Number(antiSpamAmount || 0)
  ) {
    return `Insufficient QU balance for the anti-spam fee. Required ${antiSpamAmount}, available ${quBalance}.`;
  }

  if (side === 'sell') {
    const availableShares = getPositionAmount(eventPositions, eventId, option);
    if (availableShares < Number(amount || 0)) {
      return `Insufficient shares. You have ${availableShares} shares for this option.`;
    }
  }

  return '';
}
