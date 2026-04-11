import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: [".env" , ".env.local"] });


if(!process.env.DATABASE_URL){
    throw new Error("database Url is missing in env")
}
export default defineConfig({
  out: './drizzle',
  schema: './lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  migrations:{
    table:"__drizzle_migration",
    schema:"public",
  }, // i really dont know what is this abt
  verbose:true,
  strict:true,

});
