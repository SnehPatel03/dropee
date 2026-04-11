import { migrate } from "drizzle-orm/neon-http/migrator"; // use http only no serverless for this import for migrate(i mean)
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import * as dotenv from "dotenv";
dotenv.config({ path: [".env" , ".env.local"] });

if (!process.env.DATABASE_URL) {
  throw new Error("database Url is missing in env");
}

async function runMigrate() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migration run successfully");
  } catch (error) {
    console.log("Error to Migrate the DB", error);
    process.exit(1);
  }
}
runMigrate();
