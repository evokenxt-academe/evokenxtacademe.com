declare global {
    // Temporary global fallback while migrating/validating DB types
    // Prefer using the full `Database` interface in `src/types/database.v2.types.ts`
    type Database = any;
}

export { };
