import pg from 'pg';

const url = process.env.DATABASE_URL.replace(/[?&]options=[^&]*/g, '').replace(/[?&]$/, '');
const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
const { rows } = await pool.query(`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='videos'
  ORDER BY ordinal_position
`);
console.log(rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));
const count = await pool.query('SELECT COUNT(*) FROM public.videos');
console.log('rows:', count.rows[0].count);
await pool.end();
