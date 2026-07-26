import { env } from "cloudflare:workers";

let schemaReady: Promise<void> | null = null;

export function getD1(): D1Database {
  if (!env.DB) {
    throw new Error("芽伴云端数据库尚未绑定。");
  }
  return env.DB;
}

export async function ensureSchema(): Promise<void> {
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    const db = getD1();
    await db.batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS parents (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS sessions (
          token_hash TEXT PRIMARY KEY,
          parent_id TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS children (
          id TEXT PRIMARY KEY,
          parent_id TEXT NOT NULL,
          profile_json TEXT NOT NULL,
          cycle INTEGER NOT NULL DEFAULT 1,
          calendar_token TEXT NOT NULL UNIQUE,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS checkins (
          child_id TEXT NOT NULL,
          cycle INTEGER NOT NULL,
          feedback_json TEXT NOT NULL,
          weekly_note TEXT NOT NULL DEFAULT '',
          child_mood TEXT NOT NULL DEFAULT '轻松',
          updated_at INTEGER NOT NULL,
          UNIQUE(child_id, cycle)
        )
      `),
      db.prepare("CREATE INDEX IF NOT EXISTS sessions_parent_idx ON sessions(parent_id)"),
      db.prepare("CREATE INDEX IF NOT EXISTS children_parent_idx ON children(parent_id)"),
    ]);
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });

  return schemaReady;
}
