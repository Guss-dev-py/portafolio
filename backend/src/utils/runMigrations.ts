import fs from 'fs';
import path from 'path';
import pool from '../db';

export async function runMigrations(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // En Docker `database/` queda fuera del build context: el compose la monta
  // y apunta acá con MIGRATIONS_DIR. El path relativo sirve para dev local.
  const migrationsDir =
    process.env.MIGRATIONS_DIR ?? path.resolve(__dirname, '../../../database/migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.warn(`[migrations] Directorio no encontrado, se omite: ${migrationsDir}`);
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const { rows } = await pool.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations'
  );
  const applied = new Set(rows.map(r => r.filename));

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`[migrations] Applied: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`[migrations] Failed on ${file}: ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }
}
