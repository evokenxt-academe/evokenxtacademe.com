import postgres from "postgres";

const url1 = "postgresql://postgres.jmsemifwjvhxicscvfrv:Admin@ea2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
const url2 = "postgresql://postgres.tvyakrbmfqeylgkqwkdu:Admin@ea2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

async function test(url, label) {
  try {
    console.log(`Testing connection for ${label}...`);
    // Parse it manually to avoid @ issues
    const remaining = url.substring("postgresql://".length);
    const slashIndex = remaining.indexOf("/");
    const connPart = slashIndex === -1 ? remaining : remaining.substring(0, slashIndex);
    const dbPart = slashIndex === -1 ? "" : remaining.substring(slashIndex + 1);
    
    const lastAt = connPart.lastIndexOf("@");
    const creds = connPart.substring(0, lastAt);
    const hostPort = connPart.substring(lastAt + 1);
    
    const colonIndex = creds.indexOf(":");
    const username = creds.substring(0, colonIndex);
    const password = creds.substring(colonIndex + 1);
    
    const portColon = hostPort.indexOf(":");
    const host = hostPort.substring(0, portColon);
    const port = parseInt(hostPort.substring(portColon + 1), 10);
    
    const qMark = dbPart.indexOf("?");
    const database = qMark === -1 ? dbPart : dbPart.substring(0, qMark);

    const sql = postgres({
      host,
      port,
      username,
      password,
      database,
      ssl: { rejectUnauthorized: false }
    });

    const res = await sql`SELECT 1 as connected;`;
    console.log(`${label} SUCCESS:`, res);
    await sql.end();
    return true;
  } catch (err) {
    console.error(`${label} FAILED:`, err.message);
    return false;
  }
}

async function run() {
  const ok1 = await test(url1, "URL 1 (jmsemifwjvhxicscvfrv)");
  const ok2 = await test(url2, "URL 2 (tvyakrbmfqeylgkqwkdu)");
}

run();
