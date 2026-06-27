import fs from "fs";
import path from "path";

// Read .env file
const envPath = path.join(process.cwd(), ".env");
let envContent = "";
try {
  envContent = fs.readFileSync(envPath, "utf8");
} catch (e) {}

let dbUrl = "";
for (const line of envContent.split("\n")) {
  if (line.startsWith("DATABASE_URL=")) {
    dbUrl = line.substring("DATABASE_URL=".length).trim();
    if ((dbUrl.startsWith('"') && dbUrl.endsWith('"')) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
      dbUrl = dbUrl.slice(1, -1);
    }
    break;
  }
}

if (!dbUrl) {
  try {
    const envLocalPath = path.join(process.cwd(), ".env.local");
    const envLocalContent = fs.readFileSync(envLocalPath, "utf8");
    for (const line of envLocalContent.split("\n")) {
      if (line.startsWith("DATABASE_URL=")) {
        dbUrl = line.substring("DATABASE_URL=".length).trim();
        if ((dbUrl.startsWith('"') && dbUrl.endsWith('"')) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
          dbUrl = dbUrl.slice(1, -1);
        }
        break;
      }
    }
  } catch (e) {}
}

if (!dbUrl) {
  console.error("DATABASE_URL not found in .env or .env.local");
  process.exit(1);
}

// Parse the connection string robustly to handle password containing '@'
function parseConnectionString(url) {
  if (!url.startsWith("postgresql://")) {
    throw new Error("Invalid connection string format");
  }
  
  const remaining = url.substring("postgresql://".length);
  const slashIndex = remaining.indexOf("/");
  const connPart = slashIndex === -1 ? remaining : remaining.substring(0, slashIndex);
  const dbPart = slashIndex === -1 ? "" : remaining.substring(slashIndex + 1);
  
  // Find the last '@' which separates credentials from host:port
  const lastAt = connPart.lastIndexOf("@");
  if (lastAt === -1) {
    throw new Error("Invalid connection string structure: missing '@'");
  }
  
  const creds = connPart.substring(0, lastAt);
  const hostPort = connPart.substring(lastAt + 1);
  
  const colonIndex = creds.indexOf(":");
  const username = colonIndex === -1 ? creds : creds.substring(0, colonIndex);
  const password = colonIndex === -1 ? "" : creds.substring(colonIndex + 1);
  
  const portColon = hostPort.indexOf(":");
  const host = portColon === -1 ? hostPort : hostPort.substring(0, portColon);
  const portStr = portColon === -1 ? "5432" : hostPort.substring(portColon + 1);
  const port = parseInt(portStr, 10);
  
  // Clean db name from query parameters if any
  const qMark = dbPart.indexOf("?");
  const database = qMark === -1 ? dbPart : dbPart.substring(0, qMark);
  
  return {
    host,
    port,
    username,
    password,
    database,
    ssl: { rejectUnauthorized: false }
  };
}

async function run() {
  const config = parseConnectionString(dbUrl);
  console.log(`Connecting to ${config.host}:${config.port}/${config.database} as ${config.username}...`);
  
  let client;
  const statement = `ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS enable_embed BOOLEAN NOT NULL DEFAULT TRUE;`;
  
  try {
    const { default: postgres } = await import("postgres");
    console.log("Using postgres package...");
    client = postgres(config);
    await client.unsafe(statement);
    console.log("SUCCESS: Column enable_embed added to live_streams successfully!");
    await client.end();
  } catch (err) {
    console.log("postgres package failed, trying pg...", err.message);
    try {
      const { default: pg } = await import("pg");
      client = new pg.Client({
        connectionString: dbUrl // pg client might support connectionString or we can use config
      });
      await client.connect();
      await client.query(statement);
      console.log("SUCCESS: Column enable_embed added to live_streams successfully!");
      await client.end();
    } catch (err2) {
      console.error("All database clients failed:", err2.message);
      process.exit(1);
    }
  }
}

run();
