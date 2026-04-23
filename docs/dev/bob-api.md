# Bob API Integration

All communication with the Qubic network goes through a Bob REST server. The client-side API layer lives in `src/components/qubic/util/bobApi.js`.

---

## Transport Layer

### `bobPost(bobUrl, path, payload, maxRetries=10)`

Generic POST helper with automatic retry on `202 Accepted` (pending) responses. Bob's `/querySmartContract` endpoint returns 202 when the SC query isn't ready yet. This function retries up to `maxRetries` times with 200–500ms delays until a 200 response is received.

### `querySc(bobUrl, funcNumber, inputHex)`

Queries a Quottery SC view function. Generates a random nonce, POSTs to `/querySmartContract`, and returns the decoded hex response as a `Uint8Array`.

Parameters passed to Bob:
- `nonce` — Random uint32 (for request deduplication).
- `scIndex` — Always `2` (Quottery contract index).
- `funcNumber` — The SC view function number.
- `data` — Hex-encoded input bytes.

---

## View Functions

These are read-only SC queries. They don't require signing.

| Function | Number | Input | Purpose |
|----------|--------|-------|---------|
| `getBasicInfo` | 1 | (none) | Returns fees, anti-spam amount, deposit, operator address |
| `getEventInfo` | 2 | eventId (uint64) | Returns event metadata, result, dispute info |
| `getOrders` | 3 | eventId + option + isBid + offset | Returns order book entries for one side |
| `getActiveEventIds` | 4 | (none) | Returns array of active event IDs |
| `getEventInfoBatch` | 5 | array of up to 64 event IDs | Returns info for multiple events at once |
| `getUserPosition` | 6 | identity pubkey (32 bytes) | Returns user's share positions |
| `getApprovedAmount` | 7 | identity pubkey (32 bytes) | Returns user's approved GARTH balance |
| `getTopProposals` | 8 | (none) | Returns governance proposals |

### Binary decoding

All SC responses are raw binary. `bobApi.js` includes decoders for each:

- **Integers:** `readUint64LE`, `readInt64LE`, `readUint32LE`, `readInt32LE`, `readUint16LE` — Read little-endian values from byte arrays.
- **Identities:** `pubkeyToIdentity(bytes)` — Converts 32-byte public key to 60-char Qubic identity string.
- **Dates:** `readDatetime(bytes, offset)` / `decodeDatetime(bigint)` — Decodes Qubic packed datetime format.
- **Text:** `readTextFromBytes(bytes)` — Extracts null-terminated ASCII text from byte arrays.

---

## Composite Queries

Higher-level functions that combine multiple SC queries:

### `fetchAllActiveEvents(bobUrl)`

1. Calls `getActiveEventIds()` to get all active event IDs.
2. Splits IDs into batches of 64.
3. Calls `getEventInfoBatch()` for each batch.
4. Returns array of event objects with decoded fields.

### `fetchFullOrderbook(bobUrl, eid)`

Fetches all 4 sides of the order book for an event:
- Option 0 bids, Option 0 asks
- Option 1 bids, Option 1 asks

Returns `{ option0: { bids, asks }, option1: { bids, asks } }`.

### `fetchUserBalanceAndPositions(bobUrl, publicId)`

1. Converts identity string to 32-byte pubkey.
2. Calls `getApprovedAmount()` for GARTH balance.
3. Calls `getUserPosition()` for share positions.
4. Returns `{ balance, positions }`.

---

## Write Operations

### `broadcastTransaction(bobUrl, signedHex)`

POSTs `{ data: signedHex }` to `/broadcastTransaction`. Bob relays the raw transaction bytes to the Qubic node. Returns the tx hash from Bob's response.

### `getLatestTick(bobUrl)`

GETs `/status` and extracts the highest tick value from all available fields (`latestTick`, `lastProcessedTick`, `currentTick`, `tick`, `lastTick`, `currentFetchingTick`). Uses `Math.max()` across all fields to avoid using a stale tick for scheduling.

### `getEntityBalance(bobUrl, identity)`

GETs `/balance/{identity}` for the native QU balance.

### `getTxByHash(bobUrl, hash)`

GETs `/tx/{hash}` to check if a transaction exists. Used by `useTxTracker` for confirmation polling.

