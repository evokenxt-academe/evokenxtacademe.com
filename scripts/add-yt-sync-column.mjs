import fs from "fs";
import path from "path";

// Read .env file
const envPath = path.join(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf8");
let dbUrl = "";
for (const line of envContent.split("\n")) {
  if (line.startsWith("DATABASE_URL=")) {
    dbUrl = line.substring("DATABASE_URL=".length).trim();
    // Strip surrounding quotes
    if ((dbUrl.startsWith('"') && dbUrl.endsWith('"')) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
      dbUrl = dbUrl.slice(1, -1);
    }
    break;
  }
}

if (!dbUrl) {
  // Try fallback to env.local
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

// Try using pg or postgres
async function run() {
  let client;
  const statement = `ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS yt_sync_title_desc BOOLEAN NOT NULL DEFAULT TRUE;`;
  
  try {
    const { default: postgres } = await import("postgres");
    console.log("Using postgres package...");
    client = postgres(dbUrl);
    await client.unsafe(statement);
    console.log("SUCCESS: Column yt_sync_title_desc added successfully!");
    await client.end();
  } catch (err) {
    console.log("postgres failed, trying pg...", err.message);
    try {
      const { default: pg } = await import("pg");
      client = new pg.Client({ connectionString: dbUrl });
      await client.connect();
      await client.query(statement);
      console.log("SUCCESS: Column yt_sync_title_desc added successfully!");
      await client.end();
    } catch (err2) {
      console.error("All database clients failed:", err2.message);
      process.exit(1);
    }
  }
}

run();
