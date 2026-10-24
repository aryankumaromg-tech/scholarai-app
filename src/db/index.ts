import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Lazy Postgres client.
 *
 * Next.js evaluates route modules while "Collecting page data" during `next build`.
 * Throwing at module top-level when DATABASE_URL is missing (common on Vercel until
 * the env var is attached to the Production environment) aborts the whole build.
 *
 * Connection is created on first use at runtime instead. If DATABASE_URL is still
 * missing then, callers get a clear error — but the build always succeeds.
 */
const globalForDb = globalThis as typeof globalThis & {
  __scholaraiPool?: Pool;
  __scholaraiDb?: NodePgDatabase;
};

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is required at runtime. Set it in your host's environment variables " +
        "(Vercel → Project → Settings → Environment Variables) and redeploy.",
    );
  }
  return url;
}

function getPool(): Pool {
  if (!globalForDb.__scholaraiPool) {
    globalForDb.__scholaraiPool = new Pool({
      connectionString: getDatabaseUrl(),
      // Serverless-friendly: few idle clients, short connection lifetime.
      max: Number(process.env.DB_POOL_MAX ?? 5),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      ssl:
        process.env.DATABASE_SSL === "0"
          ? undefined
          : process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : undefined,
    });
  }
  return globalForDb.__scholaraiPool;
}

function getDb(): NodePgDatabase {
  if (!globalForDb.__scholaraiDb) {
    globalForDb.__scholaraiDb = drizzle(getPool());
  }
  return globalForDb.__scholaraiDb;
}

/** Lazily-initialised Drizzle client — safe to import at module scope during build. */
export const db: NodePgDatabase = new Proxy({} as NodePgDatabase, {
  get(_target, prop, receiver) {
    const client = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const client = getPool() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
