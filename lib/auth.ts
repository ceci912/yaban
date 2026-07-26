import { cookies } from "next/headers";
import { ensureSchema, getD1 } from "../db/storage";
import type { CaregiverRole } from "./caregiver";

const SESSION_COOKIE = "yaban_session";
const SESSION_DAYS = 30;

type ParentRow = {
  id: string;
  username: string;
  caregiver_role: CaregiverRole;
  password_hash: string;
  password_salt: string;
};

export type ParentSession = {
  id: string;
  username: string;
  caregiverRole: CaregiverRole;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomToken(size = 32): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
}

async function derivePassword(password: string, salt: string): Promise<string> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      // Cloudflare Workers currently accepts PBKDF2 iteration counts up to 100,000.
      iterations: 100_000,
      salt: new TextEncoder().encode(salt),
    },
    material,
    256,
  );
  return bytesToBase64Url(new Uint8Array(bits));
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateCredentials(username: string, password: string): string | null {
  if (username.length < 3 || username.length > 40) return "账号需为 3–40 个字符";
  if (password.length < 8 || password.length > 72) return "密码至少 8 位";
  return null;
}

export async function registerParent(
  username: string,
  password: string,
  caregiverRole: CaregiverRole,
): Promise<ParentSession> {
  await ensureSchema();
  const db = getD1();
  const normalized = normalizeUsername(username);
  const existing = await db
    .prepare("SELECT id FROM parents WHERE username = ?")
    .bind(normalized)
    .first<{ id: string }>();
  if (existing) throw new Error("这个家长账号已经注册");

  const id = crypto.randomUUID();
  const salt = randomToken(18);
  const passwordHash = await derivePassword(password, salt);
  await db
    .prepare(
      "INSERT INTO parents (id, username, caregiver_role, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(id, normalized, caregiverRole, passwordHash, salt, Date.now())
    .run();

  await createSession(id);
  return { id, username: normalized, caregiverRole };
}

export async function loginParent(username: string, password: string): Promise<ParentSession> {
  await ensureSchema();
  const db = getD1();
  const normalized = normalizeUsername(username);
  const parent = await db
    .prepare(
      "SELECT id, username, caregiver_role, password_hash, password_salt FROM parents WHERE username = ?",
    )
    .bind(normalized)
    .first<ParentRow>();
  if (!parent) throw new Error("账号或密码不正确");

  const candidate = await derivePassword(password, parent.password_salt);
  if (candidate !== parent.password_hash) throw new Error("账号或密码不正确");

  await createSession(parent.id);
  return {
    id: parent.id,
    username: parent.username,
    caregiverRole: parent.caregiver_role,
  };
}

export async function updateCaregiverRole(
  parentId: string,
  caregiverRole: CaregiverRole,
): Promise<void> {
  await getD1()
    .prepare("UPDATE parents SET caregiver_role = ? WHERE id = ?")
    .bind(caregiverRole, parentId)
    .run();
}

async function createSession(parentId: string): Promise<void> {
  const token = randomToken();
  const tokenHash = await digest(token);
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  await getD1()
    .prepare(
      "INSERT INTO sessions (token_hash, parent_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    )
    .bind(tokenHash, parentId, expiresAt, Date.now())
    .run();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getParentSession(): Promise<ParentSession | null> {
  await ensureSchema();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = await digest(token);
  const row = await getD1()
    .prepare(`
      SELECT parents.id, parents.username, parents.caregiver_role, sessions.expires_at
      FROM sessions
      JOIN parents ON parents.id = sessions.parent_id
      WHERE sessions.token_hash = ?
    `)
    .bind(tokenHash)
    .first<{ id: string; username: string; caregiver_role: CaregiverRole; expires_at: number }>();
  if (!row || row.expires_at <= Date.now()) return null;
  return {
    id: row.id,
    username: row.username,
    caregiverRole: row.caregiver_role,
  };
}

export async function requireParentSession(): Promise<ParentSession> {
  const parent = await getParentSession();
  if (!parent) throw new Error("UNAUTHORIZED");
  return parent;
}

export async function logoutParent(): Promise<void> {
  await ensureSchema();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await getD1()
      .prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(await digest(token))
      .run();
  }
  cookieStore.delete(SESSION_COOKIE);
}

export function createCalendarToken(): string {
  return randomToken(24);
}
