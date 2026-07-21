CREATE TABLE IF NOT EXISTS profiles (
  identity text PRIMARY KEY,
  display_name text,
  avatar_mime_type text,
  avatar_data bytea,
  name_change_count integer NOT NULL DEFAULT 0 CHECK (name_change_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  avatar_updated_at timestamptz
);

ALTER TABLE profiles
  ALTER COLUMN display_name DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_display_name_ci_uidx
  ON profiles (lower(display_name));

CREATE TABLE IF NOT EXISTS profile_payments (
  tx_hash text PRIMARY KEY,
  identity text NOT NULL,
  game_operator text NOT NULL,
  amount numeric(38,0) NOT NULL CHECK (amount >= 0),
  scheduled_tick bigint,
  confirmed_tick bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_payments_identity_idx
  ON profile_payments(identity, created_at DESC);
