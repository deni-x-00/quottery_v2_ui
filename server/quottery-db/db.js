const { Pool } = require('pg');

let pool = null;

function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
}

function createPool() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for Quottery DB access');
  }

  return new Pool({
    connectionString,
    max: Number(process.env.PGPOOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.PGPOOL_IDLE_TIMEOUT_MS || 30000),
  });
}

function getPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

async function query(text, params = []) {
  return getPool().query(text, params);
}

async function withClient(task) {
  const client = await getPool().connect();
  try {
    return await task(client);
  } finally {
    client.release();
  }
}

async function withTransaction(task) {
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const result = await task(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  closePool,
  getDatabaseUrl,
  getPool,
  query,
  withClient,
  withTransaction,
};
