# Pages

Page components live in `src/pages/`. Each corresponds to a route defined in `App.js`.

---

## StartPage

**Route:** `/`
**File:** `src/pages/StartPage.jsx`

The landing page. Displays all active prediction events as cards.

### Features

- **Tag filter bar** — Horizontal scrollable bar of category tags (Crypto, Sport, Politics, etc.). Selecting a tag filters events. Tag definitions come from `tagMap.js`.
- **Keyword search** — Text input filters events by description.
- **Event cards** — Each event renders as an `EventOverviewCard` with the question, end date, tag label, thumbnail, and a Quick Buy button.
- **Quick Buy** — Opens `QuickBuyModal` for fast bid placement without leaving the page.
- **Pagination** — Events are paginated if there are many.

### Data flow

On mount, calls `fetchEvents()` from QuotteryContext, which batch-fetches all active events from the SC via Bob.

---

## EventDetailsPage

**Route:** `/event/:id`
**File:** `src/pages/EventDetailsPage.jsx`

Full detail view for a single event. This is where most trading happens.

### Sections

- **Event info header** — Question, dates, tag, thumbnail, result status.
- **Trading box** — Side (Buy/Sell), option (No/Yes), amount, price, probability display, cost estimation, and submit button.
- **Order book** — Tabbed (No/Yes) display of all open bids and asks. Shows depth bars, amount, and price per row.
- **More Details** — Expandable section with event metadata, and a Dispute button (visible after a result is published).

### Transaction handlers

- `handleTradeClick()` — Places a bid or ask order. Uses adaptive tick scheduling via `getScheduledTick()`. Builds the payload with `packOrderPayload()`, builds the full Qubic packet with `buildQuotteryTx()`, signs via MetaMask Snap, and broadcasts via Bob. Has a `submitting` guard to prevent double-clicks.
- `handleDispute()` — Submits a dispute transaction against the published result. Requires a deposit.

### State

- `event` — The event object fetched from Bob on mount.
- `tradeSide` / `tradeAmount` / `tradePrice` / `selectedOption` — Trading box form state.
- `submitting` — Prevents concurrent submissions.
- Order book data comes from `QuotteryContext.orderbook`, refreshed every 60 seconds.

---

## EventPublishPage

**Route:** `/publish/:id`
**File:** `src/pages/EventPublishPage.jsx`

Operator-facing page for managing event lifecycle. Similar layout to EventDetailsPage but with operator actions.

### Operator actions

- **Publish Result** — The Game Operator selects the winning option (No/Yes) and broadcasts a `PublishResult` transaction.
- **Finalize Event** — After the dispute window passes, the operator can finalize the event, triggering payout calculations.
- **Claim Reward** — The operator or users can claim their rewards after finalization.

Also includes the same trading box and order book as EventDetailsPage.

---

## UserOrdersPage

**Route:** `/orders`
**File:** `src/pages/UserOrdersPage.jsx`

Shows the connected user's positions and open orders.

### Sections

- **My Positions** — Lists all shares held across all events, grouped by event. Shows event name, option (Yes/No), and share count.
- **My Open Orders** — Lists unmatched orders in the book. For each order, shows event, side (buy/sell), option, amount, price, and a Cancel button.

### Cancel order flow

Cancellation sends a `RemoveBidOrder` or `RemoveAskOrder` transaction to the SC with the same event ID, option, amount, and price as the order to cancel.

---

## GovernancePage

**Route:** `/governance`
**File:** `src/pages/GovernancePage.jsx`

Displays Quottery contract governance information.

### Sections

- **Current Parameters** — Shows the active fee structure (operation fee, shareholder fee, burn fee), fee per day, anti-spam amount, dispute deposit, and the Game Operator address.
- **Top Proposals** — Displays the top governance proposals returned by SC function `8` (`GetTopProposals`) with weighted votes and proposed parameter values.