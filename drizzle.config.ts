import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load .env.local first (for local development), then fallback to .env
dotenv.config({ path: '.env.local' });
dotenv.config();

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
