# Architecture

## Tech Stack

- **React 18** with React Router v6
- **Material UI (MUI)** for components and theming
- **Framer Motion** for animations
- **MetaMask Snap** (`@qubic-lib/qubic-mm-snap`) for Qubic key management and signing
- **@qubic-lib/qubic-ts-library** for identity/public key helpers

## Directory Structure

```
src/
├── App.js                  # Router and provider tree
├── Theme.jsx               # MUI theme configuration (dark/light)
├── index.js                # ReactDOM entry point
├── config/
│   └── network.js          # Default Bob node URL
│
├── contexts/               # React context providers
│   ├── ConfigContext.jsx    # Default Bob URL and devMode flag
│   ├── QuotteryContext.jsx  # Events, balances, positions, order book, tick rate
│   ├── SnackbarContext.jsx  # Toast notification queue
│   └── ThemeContext.jsx     # Dark/light mode toggle
│
├── hooks/                  # Custom hooks
│   ├── useTickRate.js      # Background tick-rate measurement + adaptive scheduling
│   ├── useTxTracker.js     # Pending transaction polling and confirmation
│   └── useBalanceNotifier.js # Balance/position change notifications
│
├── pages/                  # Route-level components
│   ├── StartPage.jsx       # Event listing with search/filter
│   ├── EventDetailsPage.jsx # Single event: trading box, order book, dispute
│   ├── EventPublishPage.jsx # Operator: publish result, finalize, claim
│   ├── UserOrdersPage.jsx  # User's open orders and positions
│   └── GovernancePage.jsx  # Contract params, proposals, voting
│
├── components/
│   ├── layout/
│   │   ├── Header.jsx      # AppBar: logo, navigation, wallet, tick indicator
│   │   └── Footer.jsx      # Footer
│   ├── EventOverviewCard.jsx # Event card on StartPage
│   ├── EventOverviewTable.jsx # Alternative table view for events
│   ├── QuickBuyModal.jsx   # Quick bid dialog from StartPage
│   ├── SearchFilter.jsx    # Tag + keyword filter bar
│   ├── TickIndicator.jsx   # Header tick display with sync status
│   ├── EventCreationTutorial.jsx
│   ├── UserEvents.jsx
│   └── qubic/
│       ├── connect/        # Wallet connection layer
│       │   ├── QubicConnectContext.jsx  # Signing, wallet state
│       │   ├── ConnectModal.jsx         # Wallet selection dialog
│       │   ├── ConnectLink.jsx          # Header wallet button + balance bubble
│       │   ├── ConfirmTxModal.jsx       # Tx confirmation dialog (unused currently)
│       │   ├── MetamaskContext.jsx      # MetaMask provider state
│       │   ├── WalletConnectContext.jsx # WalletConnect placeholder
│       │   ├── AccountSelector.jsx
│       │   ├── Buttons.jsx
│       │   ├── config/
│       │   │   ├── index.js   # Re-exports
│       │   │   ├── snap.js    # Snap origin (npm:@qubic-lib/qubic-mm-snap)
│       │   │   └── qubic.js   # connectTypes
│       │   └── utils/
│       │       ├── snap.js    # connectSnap, getSnap helpers
│       │       ├── metamask.js
│       │       └── index.js
│       ├── util/
│       │   ├── bobApi.js       # All Bob server communication
│       │   ├── quotteryTx.js   # Transaction packet + payload builders
│       │   ├── eventApi.js     # Event detail fetcher with retry
│       │   ├── tagMap.js       # Event category tags
│       │   ├── commons.js      # Constants, excluded event IDs
│       │   └── index.js        # Re-exports (formatQubicAmount, etc.)
│       └── ui/
│           ├── CustomSnackbar.jsx
│           ├── AnimateBars.jsx
│           └── LabelWithPopover.jsx
│
├── utils/
│   └── index.js            # Encoding helpers, byte array utils, QR code
│
└── assets/                 # Images, logos, SVGs
```

## Provider Tree

Providers wrap the entire app in `App.js` in this order (outermost first):

```
ThemeContextProvider        ← Dark/light mode
  ConfigProvider            ← Bob URL, devMode
    WalletConnectProvider   ← WalletConnect (placeholder)
      QubicConnectProvider  ← MetaMask Snap signing
        QuotteryProvider    ← Events, balances, tick rate
          SnackbarProvider  ← Toast notifications
            BrowserRouter   ← Routing
```

This order matters because inner providers depend on outer ones. For example, `QuotteryProvider` uses `useQubicConnect()` (from `QubicConnectProvider`) and `useConfig()` (from `ConfigProvider`).

## Data Flow

### Reading data (view functions)

```
User opens page
  → Page component calls QuotteryContext method (fetchEvents, fetchOrderbook, etc.)
    → QuotteryContext calls bobApi.js function
      → bobApi.js POSTs to Bob /querySmartContract with SC view function number
        → Bob queries Qubic node, returns hex-encoded SC output
      → bobApi.js decodes binary response into JS objects
    → QuotteryContext stores result in React state
  → Page re-renders with data
```

### Writing data (procedures)

```
User clicks "Place Bid"
  → Page handler calls getScheduledTick() for adaptive tick
  → Page builds payload with packOrderPayload()
  → Page builds full packet with buildQuotteryTx()
  → Page calls getSignedTx(packet) from QubicConnectContext
    → QubicConnectContext sends unsigned packet to MetaMask Snap
    → Snap returns signed bytes
    → QubicConnectContext writes signature into packet
  → Page converts to hex, calls broadcastTransaction()
    → bobApi.js POSTs to Bob /broadcastTransaction
    → Bob relays to Qubic node
  → Page calls trackTx() to start polling for confirmation
```
