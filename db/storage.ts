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
          caregiver_role TEXT NOT NULL DEFAULT '其他照顾者',
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
      db.prepare(`
        CREATE TABLE IF NOT EXISTS courses (
          id TEXT PRIMARY KEY,
          child_id TEXT NOT NULL,
          title TEXT NOT NULL,
          provider TEXT NOT NULL DEFAULT '',
          total_units REAL NOT NULL,
          units_per_session REAL NOT NULL DEFAULT 1,
          start_date TEXT NOT NULL,
          weekdays_json TEXT NOT NULL,
          class_time TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS course_sessions (
          id TEXT PRIMARY KEY,
          course_id TEXT NOT NULL,
          session_date TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'scheduled',
          consumed_units REAL NOT NULL DEFAULT 0,
          note TEXT NOT NULL DEFAULT '',
          updated_at INTEGER NOT NULL,
          UNIQUE(course_id, session_date)
        )
      `),
      db.prepare("CREATE INDEX IF NOT EXISTS sessions_parent_idx ON sessions(parent_id)"),
      db.prepare("CREATE INDEX IF NOT EXISTS children_parent_idx ON children(parent_id)"),
      db.prepare("CREATE INDEX IF NOT EXISTS courses_child_idx ON courses(child_id)"),
      db.prepare("CREATE INDEX IF NOT EXISTS course_sessions_course_idx ON course_sessions(course_id)"),
    ]);
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });

  return schemaReady;
}
