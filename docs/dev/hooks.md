# Hooks

Custom hooks live in `src/hooks/`.

---

## useTickRate

**File:** `src/hooks/useTickRate.js`

Measures how fast the Qubic network is producing ticks and computes an adaptive scheduling offset.

### Why it exists

Qubic ticks aren't produced at a fixed rate — they can range from 1 to 10+ ticks per second depending on network conditions. If you schedule a transaction with a fixed offset (e.g. +10 ticks), it might already be in the past by the time it's signed and broadcast. This hook measures the actual rate and calculates an offset that gives approximately 5 real seconds of lead time.

### How it works

1. Polls `getLatestTick(bobUrl)` every 3 seconds.
2. Stores `(tick, timestamp)` samples in a sliding window of 20 entries (~60 seconds).
3. Computes `tickRate = (newestTick - oldestTick) / (newestTime - oldestTime)`.
4. Needs at least 3 samples spanning ≥2 seconds before producing a measurement. Until then, uses a conservative default of 2 ticks/second.

### Returns

```js
{
  tickRate,        // number — measured ticks per second
  latestTick,      // number — most recent tick value from Bob
  adaptiveOffset,  // number — ticks to add for ~5s lead time: max(10, ceil(tickRate × 5))
  getScheduledTick(leadSeconds?),  // async function → { currentTick, scheduledTick, tickRate, offset }
}
```

### Usage

`getScheduledTick()` is the primary method consumers use. It fetches a fresh tick at call time (not a cached one) and returns the scheduled tick with the adaptive offset. All transaction handlers (`handleTradeClick`, `handleSubmit`, etc.) call this instead of the old `getCurrentTick() + tickOffset` pattern.

### Configuration

Constants at the top of the file:

| Constant | Default | Purpose |
|----------|---------|---------|
| `POLL_INTERVAL_MS` | 3000 | How often to sample Bob's tick |
| `MAX_SAMPLES` | 20 | Sliding window size |
| `DEFAULT_RATE` | 2 | Fallback ticks/sec before enough samples |
| `TARGET_LEAD_SECONDS` | 5 | How far ahead to schedule transactions |
| `MIN_OFFSET` | 10 | Floor — never schedule less than 10 ticks ahead |

---

## useTxTracker

**File:** `src/hooks/useTxTracker.js`

Tracks pending transactions after broadcast and notifies the user when they confirm.

### How it works

1. After broadcasting, the caller invokes `trackTx({ txHash, scheduledTick, description })`.
2. The hook polls every 3 seconds:
    - Before the scheduled tick: tries `GET /tx/{txHash}` for early confirmation.
    - After the scheduled tick passes: does a final `/tx/{txHash}` check, then re-fetches the user's balance/positions to detect state changes.
3. Reports outcome via snackbar:
    - **Confirmed** — tx found by hash.
    - **Executed** — tx hash not found, but balance or positions changed (match occurred).
    - **Submitted** — tx hash not found and no state change. This is not a failure — the order is likely sitting unmatched in the book.
4. Times out after 3 minutes.

### Returns

```js
{
  trackTx,    // (tx: { txHash, scheduledTick, description }) => void
  pendingTxs, // array of pending tx objects (for display if needed)
}
```

---

## useBalanceNotifier

**File:** `src/hooks/useBalanceNotifier.js`

Wraps `fetchBalance()` with snackbar notifications when state changes.

### How it works

Calls `fetchBalance(walletPublicIdentity)` from `QuotteryContext`. The `fetchBalance` method returns a diff object describing what changed compared to the previous state. The hook inspects this diff and shows snackbars:

- **Balance change:** Shows `+500,000 GARTH` or `-600,000 GARTH`.
- **Position change:** Shows descriptive text like "New position: 100 shares for Yes of Will BTC hit 150k?" or "Added 50 shares for No of ETH flips BTC?".

### Returns

```js
{
  refreshBalanceWithNotifications, // async () => result — fetch + notify
  scheduleBalanceRefresh,          // (delayMs?) => timeoutId — delayed fetch + notify
}
```

`scheduleBalanceRefresh(2000)` is called after broadcasting a transaction to check for state changes ~2 seconds later.
