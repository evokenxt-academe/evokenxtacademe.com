const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

async function fetchSchema() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    console.error("Missing SUPABASE URL or ANON KEY in env");
    return;
  }
  
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch schema: ${res.statusText}`);
    }
    
    const schema = await res.json();
    console.log("Database Tables:");
    const tables = Object.keys(schema.definitions || {});
    console.log(tables);
    
    if (schema.definitions && schema.definitions.users) {
      console.log("\nUsers schema properties:");
      console.log(Object.keys(schema.definitions.users.properties));
    }
    
    if (schema.definitions && schema.definitions.courses) {
      console.log("\nCourses schema properties:");
      console.log(Object.keys(schema.definitions.courses.properties));
    }
  } catch (error) {
    console.error("Error fetching schema:", error);
  }
}

fetchSchema();
