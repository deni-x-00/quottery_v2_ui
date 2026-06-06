const fs = require('fs');
const path = require('path');
const { closePool, withTransaction } = require('./db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function hasMigration(client, name) {
  const result = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
  return result.rowCount > 0;
}

async function applyMigration(client, name, sql) {
  await client.query(sql);
  await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [name]);
}

async function migrate() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migrations found');
    return;
  }

  await withTransaction(async (client) => {
    await ensureMigrationsTable(client);

    for (const file of files) {
      if (await hasMigration(client, file)) {
        console.log(`Skipping ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await applyMigration(client, file, sql);
      console.log(`Applied ${file}`);
    }
  });
}

migrate()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closePool);
