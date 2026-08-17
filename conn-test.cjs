const { Client } = require('pg');
const url = process.argv[2];
(async () => {
  const c = new Client({ connectionString: url });
  try {
    await c.connect();
    const r = await c.query('select version(), current_database()');
    console.log('OK:', r.rows[0].current_database, '|', r.rows[0].version.split(',')[0]);
    const t = await c.query("select count(*)::int n from information_schema.tables where table_schema='public'");
    console.log('existing public tables:', t.rows[0].n);
    await c.end();
  } catch (e) { console.log('FAIL:', e.message); process.exit(1); }
})();
