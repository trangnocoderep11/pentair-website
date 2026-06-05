import pg from 'pg';

const url = process.env.DATABASE_URL.replace(/[?&]options=[^&]*/g, '').replace(/[?&]$/, '');
const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
const { rows } = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
console.log(rows.map(r => r.table_name).join('\n'));
await pool.end();
