import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Un error en un cliente idle emite 'error' en el pool; sin listener,
// Node mata el proceso entero.
pool.on('error', (err) => {
  console.error('Error en cliente idle de pg:', err.message);
});

export default pool;
