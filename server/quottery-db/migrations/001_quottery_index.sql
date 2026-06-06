CREATE TABLE IF NOT EXISTS indexer_state (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  identity text PRIMARY KEY,
  first_seen_tick bigint,
  last_seen_tick bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raw_transactions (
  tx_hash text PRIMARY KEY,
  epoch integer,
  tick bigint NOT NULL,
  tx_from text,
  tx_to text,
  amount numeric(38,0),
  input_type integer,
  input_size integer,
  input_data text,
  executed boolean,
  tx_timestamp timestamptz,
  raw jsonb NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS raw_transactions_tx_timestamp_idx ON raw_transactions(tx_timestamp DESC);

CREATE TABLE IF NOT EXISTS raw_logs (
  log_uid text PRIMARY KEY,
  tx_hash text,
  epoch integer,
  tick bigint NOT NULL,
  log_id bigint,
  log_type integer,
  sc_index integer,
  sc_log_type integer,
  log_timestamp timestamptz,
  sc_end_epoch boolean NOT NULL DEFAULT false,
  raw jsonb NOT NULL,
  inserted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS raw_logs_log_timestamp_idx ON raw_logs(log_timestamp DESC);
CREATE INDEX IF NOT EXISTS raw_logs_epoch_log_id_idx ON raw_logs(epoch, log_id);
CREATE INDEX IF NOT EXISTS raw_logs_sc_end_epoch_tick_idx ON raw_logs(tick) WHERE sc_end_epoch = true;

CREATE TABLE IF NOT EXISTS events (
  event_id bigint PRIMARY KEY,
  creator text,
  description text,
  option0 text,
  option1 text,
  open_date timestamptz,
  end_date timestamptz,
  result smallint,
  status text NOT NULL DEFAULT 'pending',
  win_payout_per_share numeric(38,0) NOT NULL DEFAULT 95000,
  created_tick bigint,
  result_tick bigint,
  finalized_tick bigint,
  archived_tick bigint,
  created_tx_hash text,
  created_tx_timestamp timestamptz,
  result_tx_timestamp timestamptz,
  finalized_tx_timestamp timestamptz,
  archived_tx_timestamp timestamptz,
  archived_sc_end_epoch boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  order_uid text PRIMARY KEY,
  owner text NOT NULL REFERENCES accounts(identity),
  event_id bigint NOT NULL,
  option smallint NOT NULL CHECK (option IN (0, 1)),
  side text NOT NULL CHECK (side IN ('bid', 'ask')),
  original_amount numeric(38,0) NOT NULL,
  open_amount numeric(38,0) NOT NULL,
  price numeric(38,0) NOT NULL,
  status text NOT NULL CHECK (status IN ('open', 'matched', 'partially_matched', 'removed_by_user', 'removed_by_system')),
  created_tick bigint NOT NULL,
  closed_tick bigint,
  created_tx_hash text,
  closed_tx_hash text,
  created_tx_timestamp timestamptz,
  closed_tx_timestamp timestamptz,
  created_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_owner_tick_idx ON orders(owner, created_tick DESC);
CREATE INDEX IF NOT EXISTS orders_event_open_idx ON orders(event_id, option, side, status, price);

CREATE TABLE IF NOT EXISTS order_events (
  order_event_uid text PRIMARY KEY,
  order_uid text REFERENCES orders(order_uid),
  owner text NOT NULL REFERENCES accounts(identity),
  event_id bigint NOT NULL,
  option smallint,
  side text CHECK (side IN ('bid', 'ask')),
  action text NOT NULL,
  amount numeric(38,0),
  price numeric(38,0),
  tick bigint NOT NULL,
  tx_hash text,
  log_uid text,
  tx_timestamp timestamptz,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_events_owner_tick_idx ON order_events(owner, tick DESC);
CREATE INDEX IF NOT EXISTS order_events_event_tick_idx ON order_events(event_id, tick DESC);
CREATE INDEX IF NOT EXISTS order_events_tx_timestamp_idx ON order_events(owner, tx_timestamp DESC);

CREATE TABLE IF NOT EXISTS trades (
  trade_uid text PRIMARY KEY,
  event_id bigint NOT NULL,
  match_type integer NOT NULL,
  option smallint,
  address_a text NOT NULL REFERENCES accounts(identity),
  address_b text NOT NULL REFERENCES accounts(identity),
  taker text REFERENCES accounts(identity),
  maker text REFERENCES accounts(identity),
  taker_side text CHECK (taker_side IN ('buy', 'sell')),
  maker_side text CHECK (maker_side IN ('buy', 'sell')),
  taker_option smallint CHECK (taker_option IN (0, 1)),
  maker_option smallint CHECK (maker_option IN (0, 1)),
  taker_price numeric(38,0),
  maker_price numeric(38,0),
  amount numeric(38,0) NOT NULL,
  price0 numeric(38,0) NOT NULL DEFAULT 0,
  price1 numeric(38,0) NOT NULL DEFAULT 0,
  tick bigint NOT NULL,
  tx_hash text,
  log_uid text,
  tx_timestamp timestamptz,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trades_event_tick_idx ON trades(event_id, tick DESC);
CREATE INDEX IF NOT EXISTS trades_address_a_tick_idx ON trades(address_a, tick DESC);
CREATE INDEX IF NOT EXISTS trades_address_b_tick_idx ON trades(address_b, tick DESC);
CREATE INDEX IF NOT EXISTS trades_taker_tick_idx ON trades(taker, tick DESC);
CREATE INDEX IF NOT EXISTS trades_maker_tick_idx ON trades(maker, tick DESC);
CREATE INDEX IF NOT EXISTS trades_tx_timestamp_idx ON trades(tx_timestamp DESC);

CREATE TABLE IF NOT EXISTS transfers (
  transfer_uid text PRIMARY KEY,
  token text NOT NULL CHECK (token IN ('GARTH', 'QTRYGOV')),
  source text,
  destination text,
  amount numeric(38,0) NOT NULL,
  direction text,
  reason text,
  event_id bigint,
  tick bigint NOT NULL,
  tx_hash text,
  log_uid text,
  tx_timestamp timestamptz,
  sc_end_epoch boolean NOT NULL DEFAULT false,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transfers_source_tick_idx ON transfers(source, tick DESC);
CREATE INDEX IF NOT EXISTS transfers_destination_tick_idx ON transfers(destination, tick DESC);
CREATE INDEX IF NOT EXISTS transfers_token_tick_idx ON transfers(token, tick DESC);
CREATE INDEX IF NOT EXISTS transfers_tx_timestamp_idx ON transfers(tx_timestamp DESC);

CREATE TABLE IF NOT EXISTS payouts (
  payout_uid text PRIMARY KEY,
  owner text REFERENCES accounts(identity),
  event_id bigint,
  token text NOT NULL CHECK (token IN ('GARTH')),
  amount numeric(38,0) NOT NULL,
  reason text NOT NULL,
  tick bigint NOT NULL,
  tx_timestamp timestamptz,
  tx_hash text,
  log_uid text,
  sc_end_epoch boolean NOT NULL DEFAULT false,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payouts_owner_tick_idx ON payouts(owner, tick DESC);
CREATE INDEX IF NOT EXISTS payouts_event_tick_idx ON payouts(event_id, tick DESC);
CREATE INDEX IF NOT EXISTS payouts_log_uid_idx ON payouts(log_uid);

CREATE TABLE IF NOT EXISTS positions (
  owner text NOT NULL REFERENCES accounts(identity),
  event_id bigint NOT NULL,
  option smallint NOT NULL CHECK (option IN (0, 1)),
  amount numeric(38,0) NOT NULL DEFAULT 0,
  locked_amount numeric(38,0) NOT NULL DEFAULT 0,
  avg_entry_price numeric(38,8),
  realized_trade_cost numeric(38,8) NOT NULL DEFAULT 0,
  realized_trade_pnl numeric(38,8) NOT NULL DEFAULT 0,
  settlement_pnl numeric(38,8) NOT NULL DEFAULT 0,
  realized_pnl numeric(38,8) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'win', 'lose')),
  opened_tick bigint,
  closed_tick bigint,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner, event_id, option)
);

CREATE INDEX IF NOT EXISTS positions_owner_idx ON positions(owner, event_id);

CREATE TABLE IF NOT EXISTS position_events (
  position_event_uid text PRIMARY KEY,
  owner text NOT NULL REFERENCES accounts(identity),
  event_id bigint NOT NULL,
  option smallint NOT NULL CHECK (option IN (0, 1)),
  action text NOT NULL,
  amount_delta numeric(38,0) NOT NULL,
  price numeric(38,0),
  tick bigint NOT NULL,
  tx_hash text,
  log_uid text,
  tx_timestamp timestamptz,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS position_events_owner_tick_idx ON position_events(owner, tick DESC);

CREATE TABLE IF NOT EXISTS account_stats (
  identity text PRIMARY KEY REFERENCES accounts(identity),
  open_bid_volume numeric(38,0) NOT NULL DEFAULT 0,
  open_ask_volume numeric(38,0) NOT NULL DEFAULT 0,
  traded_volume numeric(38,0) NOT NULL DEFAULT 0,
  realized_pnl numeric(38,8) NOT NULL DEFAULT 0,
  trade_count bigint NOT NULL DEFAULT 0,
  transfer_count bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS historical_import_rows (
  import_uid text PRIMARY KEY,
  source_file text NOT NULL,
  sheet_name text NOT NULL,
  row_number integer NOT NULL,
  block_name text NOT NULL,
  tx_hash text,
  tick bigint,
  parsed jsonb NOT NULL DEFAULT '{}'::jsonb,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS end_epoch_log_cursors (
  epoch integer PRIMARY KEY,
  before_end_log_id bigint,
  last_scanned_log_id bigint,
  scan_started_at timestamptz,
  scan_finished_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE VIEW event_volume_summary AS
SELECT
  e.event_id,
  COALESCE((
    SELECT sum(open_amount * price)
    FROM orders o
    WHERE o.event_id = e.event_id
      AND o.status IN ('open', 'partially_matched')
  ), 0) AS open_order_volume,
  COALESCE((
    SELECT sum(amount * (price0 + CASE WHEN price1 > 0 THEN price1 ELSE 100000 - price0 END))
    FROM trades t
    WHERE t.event_id = e.event_id
  ), 0) AS traded_volume
FROM events e;
