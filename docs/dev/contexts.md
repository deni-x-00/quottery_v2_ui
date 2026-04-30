# Contexts

All context providers live in `src/contexts/`. They manage shared state that multiple components need.

---

## ConfigContext

**File:** `src/contexts/ConfigContext.jsx`

Manages Bob node configuration.

**State:**
- `bobUrl` — Frontend Bob API path from `src/config/network.js`. In production this should normally be `/api/bob`, with the real Bob node URL kept only in the server-side `BOB_TARGET_URL` environment variable.
- `isConnected` — Always `true` in the current flow because the app auto-connects to the default node.
- `devMode` — When `true`, the app skips public tick validation and shows "Dev Mode" in the tick indicator. Used for local testnets.

**Methods:**
- `connectToServer(url, isDev)` — Keeps compatibility with existing callers; updates runtime URL and saves `devMode`.
- `disconnectFromServer()` — Resets runtime URL to default and keeps app connected.
- `toggleDevMode()` — Flips devMode.

Only `devMode` persists in localStorage.

---

## QuotteryContext

**File:** `src/contexts/QuotteryContext.jsx`

The main data layer. Provides all Quottery-specific state and methods to the app.

**State:**
- `allEvents` — Array of all active events fetched from the SC.
- `loading` — Whether events are currently being fetched.
- `walletPublicIdentity` — The connected wallet's 60-character Qubic identity string.
- `walletPublicKeyBytes` — The 32-byte public key as Uint8Array (used for building transactions).
- `balance` — User's approved GARTH balance.
- `quBalance` — User's QU (native token) balance.
- `eventPositions` — Array of `{ eventId, option, amount }` for shares the user holds.
- `orderbook` — Order book data for the currently viewed event.
- `obLoading` / `obError` — Order book loading state.
- `currentFilterOption` / `currentPage` / `inputPage` — Pagination state for StartPage.

**From `useTickRate` hook (exposed through context):**
- `tickRate` — Measured ticks per second.
- `adaptiveOffset` — Current adaptive tick offset (for ~5 seconds of lead time).
- `getScheduledTick(leadSeconds?)` — Fetches a fresh tick and returns `{ currentTick, scheduledTick, tickRate, offset }`.

**Key methods:**
- `fetchEvents()` — Fetches all active event IDs from the SC, then batch-fetches their info.
- `fetchBalance(publicId)` — Fetches GARTH balance and positions. Returns a diff object with `changed`, `balanceChanged`, `positionsChanged`, and descriptive text for each change.
- `fetchQuBalance(publicId)` — Fetches QU balance via Bob's `/balance/{identity}`.
- `fetchOrderbook(eid, isCancelled)` — Fetches all 4 order book sides (bid/ask × option 0/1) for an event.
- `fetchOpenOrders(identity)` — Queries order books across all events and filters for the given identity's orders.
- `getCurrentTick()` — Returns the latest tick from Bob (raw, without offset).
- `buildOrderSideEntries(book, tabIndex, side)` — Transforms raw order book data into `[{ price, amount }]` arrays for the UI.

**Wallet initialization:** When `wallet` changes (from `QubicConnectContext`), the context derives `walletPublicIdentity` and `walletPublicKeyBytes` using `QubicHelper.getIdentityBytes()`, then fetches the user's balance.

---

## SnackbarContext

**File:** `src/contexts/SnackbarContext.jsx`

A simple toast notification queue.

**Methods:**
- `showSnackbar(message, severity)` — Adds a notification. Severity is `'success'`, `'error'`, `'warning'`, or `'info'`. Message can be a string or React element.

Renders `CustomSnackbar` components stacked vertically, each auto-dismissing after a timeout.

---

## ThemeContext

**File:** `src/contexts/ThemeContext.jsx`

Wraps MUI's `ThemeProvider` with a dark/light mode toggle.

**State:**
- `isDarkMode` — Current theme mode.

**Methods:**
- `toggleTheme()` — Switches between dark and light mode.

Theme colors and typography are defined in `src/Theme.jsx`.
