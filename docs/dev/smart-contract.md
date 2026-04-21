# Smart Contract Integration

Transaction building and SC payload encoding live in `src/components/qubic/util/quotteryTx.js`.

---

## Contract Identity

- **Contract Index:** 2 (`QUOTTERY_CONTRACT_ID`)
- **Destination Public Key:** First uint64 = 2, remaining bytes zero. This is how Qubic addresses smart contracts.

---

## Qubic Transaction Layout

Every Qubic transaction follows this binary layout:

```
Offset  Size   Field
  0     32     sourcePublicKey
 32     32     destinationPublicKey (contract address)
 64      8     amount (int64 LE — antiSpamAmount for SC calls)
 72      4     tick (uint32 LE — scheduled execution tick)
 76      2     inputType (uint16 LE — procedure number)
 78      2     inputSize (uint16 LE — payload byte length)
 80      N     payload (procedure-specific input)
80+N    64     signature (filled by wallet)
```

Total size: `80 + payloadSize + 64` bytes.

---

## Procedures (Write Operations)

Procedures modify on-chain state. Each requires a signed transaction.

| # | Name | Payload | Description |
|---|------|---------|-------------|
| 1 | CreateEvent | (complex, see Quottery.h) | Create a new prediction event |
| 2 | AddToAskOrder | OrderPayload (32 bytes) | Place a sell order |
| 3 | RemoveAskOrder | OrderPayload (32 bytes) | Cancel a sell order |
| 4 | AddToBidOrder | OrderPayload (32 bytes) | Place a buy order |
| 5 | RemoveBidOrder | OrderPayload (32 bytes) | Cancel a buy order |
| 6 | PublishResult | PublishPayload (16 bytes) | Operator publishes the event result |
| 7 | TryFinalizeEvent | EventIdPayload (8 bytes) | Finalize after dispute window |
| 8 | Dispute | EventIdPayload (8 bytes) | Dispute a published result |
| 9 | ResolveDispute | ResolvePayload (16 bytes) | Operator resolves a dispute |
| 10 | UserClaimReward | EventIdPayload (8 bytes) | Claim payout after finalization |
| 11 | GOForceClaimReward | EventIdPayload (8 bytes) | Operator force-claims |
| 12 | TransferQUSD | (custom) | Transfer GARTH between accounts |
| 100 | ProposalVote | (custom) | Vote on a governance proposal |

---

## Payload Builders

Defined in `quotteryTx.js`:

### `packOrderPayload(eventId, option, amount, price)`

Builds a 32-byte payload for order operations (procedures 2–5):

```
Offset  Size  Type     Field
  0      8    uint64   eventId
  8      8    uint64   option (0 or 1)
 16      8    uint64   amount (number of shares)
 24      8    uint64   price (per share, out of 100,000)
```

Note: The SC structs define `amount` and `price` as `sint64` for `AddToBidOrder`/`AddToAskOrder`, but the GUI passes them as unsigned via `BigUint64`. This works because the values are always positive.

### `packPublishPayload(eventId, option)`

Builds a 16-byte payload for PublishResult (procedure 6):

```
Offset  Size  Type     Field
  0      8    uint64   eventId
  8      8    uint64   option (winning option: 0 or 1)
```

### `packEventIdPayload(eventId)`

Builds an 8-byte payload for Dispute, TryFinalize, and ClaimReward (procedures 7, 8, 10, 11):

```
Offset  Size  Type     Field
  0      8    uint64   eventId
```

### `packResolveDisputePayload(eventId, vote)`

Builds a 16-byte payload for ResolveDispute (procedure 9):

```
Offset  Size  Type     Field
  0      8    uint64   eventId
  8      8    sint64   vote (0 = uphold result, 1 = overturn)
```

---

## Transaction Builder

### `buildQuotteryTx(sourcePubkey, tick, inputType, amount, payload)`

Assembles the full unsigned transaction packet:

1. Allocates `80 + payloadSize + 64` bytes.
2. Writes source public key at offset 0.
3. Writes contract destination (index 2) at offset 32.
4. Writes amount (anti-spam fee) as int64 LE at offset 64.
5. Writes tick as uint32 LE at offset 72.
6. Writes inputType (procedure number) as uint16 LE at offset 76.
7. Writes inputSize (payload length) as uint16 LE at offset 78.
8. Copies payload at offset 80.
9. Leaves signature area (last 64 bytes) as zeros.

Returns a `Uint8Array` ready for signing.

---

## View Functions (Read Operations)

View functions are read-only SC queries. They don't require signing — they go through Bob's `/querySmartContract` endpoint. See [Bob API](./bob-api.md) for details.

| # | Name | Input | Output |
|---|------|-------|--------|
| 1 | BasicInfo | (none) | Fees, anti-spam amount, operator, stats |
| 2 | GetEventInfo | eventId (8 bytes) | Event metadata, result, dispute info |
| 3 | GetOrders | eventId + option + isBid + offset (32 bytes) | Order book entries |
| 4 | GetActiveEvent | (none) | Array of active event IDs |
| 5 | GetEventInfoBatch | Up to 64 event IDs | Batch event info |
| 6 | GetUserPosition | pubkey (32 bytes) | User's share positions |
| 7 | GetApprovedAmount | pubkey (32 bytes) | GARTH balance |
| 8 | GetTopProposals | (none) | Governance proposals |

---

## Order Matching

The SC matches orders automatically when conditions are met. The GUI doesn't need to do anything special — it just places orders and the SC handles matching.

Three match types:

### Mint (B0 + B1)

Two bids on opposite options whose prices sum to ≥ 100,000 (the whole share price). Both bidders receive shares.

Example: User A bids 60,000 on Yes, User B bids 40,000 on No. 60,000 + 40,000 = 100,000 → Mint. User A gets Yes shares, User B gets No shares.

### Trade (A ↔ B, same option)

An ask and a bid on the same option where the ask price ≤ bid price. Shares transfer from seller to buyer.

Example: User A asks 48,000 on Yes, User B bids 48,000 on Yes. 48,000 ≤ 48,000 → Trade.

### Merge (A0 + A1)

Two asks on opposite options whose prices sum to ≤ 100,000. Both sellers return shares.

Example: User A asks 40,000 on No, User B asks 60,000 on Yes. 40,000 + 60,000 = 100,000 → Merge.

---

## Event Lifecycle

```
Created → Active (accepting orders)
  → End date passes
  → Operator publishes result (PublishResult)
  → Dispute window opens (QUOTTERY_DISPUTE_WINDOW ticks)
    → If disputed: operator resolves (ResolveDispute)
  → Dispute window closes
  → Operator finalizes (TryFinalizeEvent)
  → Users claim rewards (UserClaimReward)
```
