const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/facilities_feedback',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('[Database] Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('[Database] Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('[Database] Query error', { text, error: error.message });
      throw error;
    }
  }

  async getClient() {
    return this.pool.connect();
  }

  async close() {
    await this.pool.end();
  }

  async testConnection() {
    try {
      const client = await this.getClient();
      await client.query('SELECT NOW()');
      client.release();
      console.log('[Database] Connection test successful');
      return true;
    } catch (error) {
      console.error('[Database] Connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = new Database();