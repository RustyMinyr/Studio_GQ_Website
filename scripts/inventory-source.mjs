import { createClient } from '@tursodatabase/serverless/compat';
const client = createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
try {
  const tables = await client.execute("select name from sqlite_master where type='table' order by name");
  const counts = {};
  for (const {name} of tables.rows) {
    if (!/^studio_[a-z_]+$/.test(name)) continue;
    counts[name] = Number((await client.execute(`select count(*) as count from "${name}"`)).rows[0].count);
  }
  console.log(JSON.stringify({tables:tables.rows.map(r=>r.name),studioCounts:counts},null,2));
} finally {client.close();}
