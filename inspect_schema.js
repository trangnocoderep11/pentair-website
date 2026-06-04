import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        ORDER BY table_name, ordinal_position;
      `);
      console.log("Database Schema Columns:\n");
      const tables = {};
      for (const row of res.rows) {
        if (!tables[row.table_name]) tables[row.table_name] = [];
        tables[row.table_name].push(`${row.column_name} (${row.data_type})`);
      }
      console.log(JSON.stringify(tables, null, 2));
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Failed to inspect schema:", err);
  } finally {
    await pool.end();
  }
}

run();
