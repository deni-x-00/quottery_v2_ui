# Quottery User Guide

## What is Quottery?

Quottery is a prediction market where you bet on binary outcomes — for example, "Will BTC hit 150k?" You buy shares that pay out if you're right. Shares are priced between 1 and 99,999 (out of 100,000), representing your confidence in the outcome.

The currency used for trading is **GARTH** (the Quottery SC asset). You also need a small amount of **QU** (native Qubic token) for network fees.

---

## Getting Started

### 1. Connect to a Server

When you first open the app, you'll see a prompt to connect to a Bob server. This is the backend node that relays your transactions to the Qubic network.

- Click the **plug icon** in the header (or the connect prompt on the Start page).
- Enter the server **IP** and **Port** (default: 40420).
- If you're on a local testnet, check **Dev Mode** — this skips public tick validation.
- Click **Connect**. The app pings `/status` to verify the server is reachable.

### 2. Connect Your Wallet

After connecting to a server, click the **wallet icon** in the header.

- Select **MetaMask Snap**. This installs the Qubic signing snap into MetaMask.
- Approve the snap permissions when prompted.
- Once connected, your **GARTH balance** appears in the header. Click it to see your **QU balance** in a bubble popup.

### 3. Check the Tick Indicator

The header shows a small tick indicator with a colored dot:

- **Green** — Bob's tick is in sync with the public Qubic network.
- **Blue** — Dev mode (only Bob's tick is tracked).
- **Red** — Bob is out of sync or unreachable.

Hover over the indicator to see the exact tick, measured tick rate (ticks/second), and the adaptive offset the app will use when scheduling transactions.

---

## Browsing Events

The **Start page** shows all active prediction events as cards. Each card displays the event question, end date, category tag, and a thumbnail.

You can filter events by **category** (Crypto, Sport, Politics, etc.) using the tag bar at the top, or search by keyword.

Click any event card to go to its **Event Details** page.

### Quick Buy

Each event card has a **Quick Buy** button. This opens a modal where you can immediately place a bid on the event without navigating away from the Start page. Choose your option (Yes/No), set the number of shares and your price, then click **Place Bid**.

---

## Event Details Page

This page shows the full details for an event.

### Trading Box

On the right side of the page, you'll find the trading box:

1. **Side** — Toggle between **Buy** (bid) and **Sell** (ask).
2. **Option** — Select **No** (Option 0) or **Yes** (Option 1).
3. **Amount** — How many shares you want to buy or sell.
4. **Price** — Your price per share (1–99,999 out of 100,000). This represents your implied probability. A price of 60,000 means you believe the outcome has a 60% chance.
5. **Cost** — Calculated automatically: `shares × price` in GARTH.

Click **Place Bid** or **Place Ask** to submit. MetaMask will prompt you to sign the transaction.

### How Matching Works

Orders match through three mechanisms:

- **Mint**: A bid on Option 0 at price P₀ matches a bid on Option 1 at price P₁ if P₀ + P₁ ≥ 100,000. Both bidders receive shares in their respective options.
- **Trade**: An ask at price Pₐ on an option matches a bid at price P_b on the same option if Pₐ ≤ P_b. The seller gives up shares, the buyer receives them.
- **Merge**: An ask on Option 0 at price P₀ matches an ask on Option 1 at price P₁ if P₀ + P₁ ≤ 100,000. Both sellers return their shares.

### Order Book

Below the trading box, the **Order Book** section shows all open bids and asks for each option. Toggle between **No** and **Yes** tabs. Each row shows depth (cumulative fill bar), amount, and price.

### Dispute

After the event's end date passes and the Game Operator publishes a result, a **Dispute Result** button may appear in the More Details section. If you believe the published result is incorrect, you can dispute it. Disputing requires a deposit (shown in the contract's basic info).

---

## Orders & Positions Page

Navigate here from the header menu. This page shows:

### My Positions

All shares you currently hold across all events. Each row shows the event name, which option you hold (Yes/No), and the number of shares.

### My Open Orders

Any unmatched orders sitting in the order book. You can **cancel** open orders from this page — this sends a remove order transaction.

---

## Governance Page

The Governance page shows the current Quottery contract parameters (fees, deposit amounts, operator address) and any active governance proposals.

If you hold QTRYGOV shares, you can vote on proposals to change contract parameters such as fee structure, burn rate, or the operator address.

---

## Transaction Flow

When you place an order, the app:

1. Fetches the current tick from the server.
2. Computes a scheduled tick using the adaptive tick rate (approximately 5 seconds ahead in real time).
3. Builds a Qubic transaction packet targeting the Quottery smart contract.
4. Sends the packet to MetaMask Snap for signing.
5. Broadcasts the signed transaction to Bob.
6. Shows a snackbar with the tx hash.
7. Tracks the transaction in the background — once the scheduled tick passes, the app checks whether the tx was confirmed and notifies you.

---

## Glossary

| Term | Meaning |
|------|---------|
| GARTH | The Quottery smart contract asset used for trading. |
| QU | The native Qubic network token. |
| Bob | The REST server that acts as a gateway to the Qubic network. |
| Tick | A Qubic network processing unit (like a block). |
| Scheduled Tick | The future tick at which your transaction will be executed. |
| Anti-spam Amount | A small QU fee included with every SC transaction to prevent spam. |
| Game Operator | The address authorized to create events, publish results, and resolve disputes. |
| Mint | Two opposing bids combine to create new shares for both sides. |
| Trade | A bid and ask on the same option exchange existing shares. |
| Merge | Two opposing asks combine to destroy shares from both sides. |
