# Components

Shared UI components live in `src/components/`.

---

## Layout

### Header

**File:** `src/components/layout/Header.jsx`

The app bar. Contains:

- **Logo** — Links to `/`. Switches between light and dark variants based on theme.
- **Navigation** — Links to Orders and Governance pages.
- **Wallet button** — `ConnectLink` component showing wallet state, GARTH balance, and balance bubble.
- **Tick indicator** — `TickIndicator` component.
- **Refresh button** — Manual balance refresh.

Polls user balance every 15 seconds via `useBalanceNotifier`.

### Footer

**File:** `src/components/layout/Footer.jsx`

Simple footer with links and branding.

---

## Event Components

### EventOverviewCard

**File:** `src/components/EventOverviewCard.jsx`

Card displayed on the StartPage for each event. Shows:

- Category thumbnail (resolved from `tagMap.js`).
- Event question (truncated if too long).
- End date.
- Tag label.
- Quick Buy button that opens `QuickBuyModal`.

Clicking the card navigates to `/event/:id`.

### EventOverviewTable

**File:** `src/components/EventOverviewTable.jsx`

Alternative table-based listing of events. Not used as the default view but available as an option.

### QuickBuyModal

**File:** `src/components/QuickBuyModal.jsx`

A dialog for fast bid placement directly from the StartPage. Simplified version of the EventDetailsPage trading box — always places a Bid (buy) order.

Fields: option selector (No/Yes), shares input, price slider/input, probability display, cost estimation.

Uses `getScheduledTick()` for adaptive tick scheduling. On success, fires `onTxBroadcast` callback so the parent can track the transaction.

---

## Search & Filter

### SearchFilter

**File:** `src/components/SearchFilter.jsx`

Horizontal tag filter bar with a keyword search input. Tags come from `getAllTags()` in `tagMap.js`. Selecting a tag or typing a keyword triggers filtering callbacks in the parent (StartPage).

---

## Tick Indicator

### TickIndicator

**File:** `src/components/TickIndicator.jsx`

Small indicator in the header showing:

- A colored dot: green (synced), blue (dev mode), red (out of sync), orange (unknown).
- The current Bob tick number.
- Status label.

In non-dev mode, it also fetches the public Qubic tick from multiple API endpoints and compares it to Bob's tick. A difference greater than 50 ticks is considered "out of sync".

The tooltip shows the measured tick rate and adaptive offset from `useTickRate`.

---

## Qubic UI Components

### CustomSnackbar

**File:** `src/components/qubic/ui/CustomSnackbar.jsx`

MUI Snackbar wrapper used by `SnackbarContext`. Supports stacking multiple notifications with vertical offset.

### AnimateBars

**File:** `src/components/qubic/ui/AnimateBars.jsx`

Animated loading indicator (three bouncing bars). Used as a loading spinner across the app.

### LabelWithPopover

**File:** `src/components/qubic/ui/LabelWithPopover.jsx`

A text label with an info icon that shows a popover on click with additional explanation.
