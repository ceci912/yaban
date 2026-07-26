import { NextResponse } from "next/server";
import { ensureSchema, getD1 } from "../../../db/storage";
import { createCalendarToken, requireParentSession } from "../../../lib/auth";
import type { ChildProfile, SavedChild } from "../../../lib/agent/types";

type ChildRow = {
  id: string;
  profile_json: string;
  cycle: number;
  calendar_token: string;
  updated_at: number;
};

function rowToChild(row: ChildRow): SavedChild {
  return {
    id: row.id,
    profile: JSON.parse(row.profile_json) as ChildProfile,
    cycle: row.cycle,
    calendarToken: row.calendar_token,
    updatedAt: row.updated_at,
  };
}

function unauthorized(error: unknown) {
  return error instanceof Error && error.message === "UNAUTHORIZED";
}

export async function GET() {
  try {
    await ensureSchema();
    const parent = await requireParentSession();
    const result = await getD1()
      .prepare(`
        SELECT id, profile_json, cycle, calendar_token, updated_at
        FROM children
        WHERE parent_id = ?
        ORDER BY updated_at DESC
      `)
      .bind(parent.id)
      .all<ChildRow>();
    return NextResponse.json({ children: result.results.map(rowToChild) });
  } catch (error) {
    return NextResponse.json(
      { error: unauthorized(error) ? "请先登录" : "孩子档案读取失败" },
      { status: unauthorized(error) ? 401 : 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const parent = await requireParentSession();
    const body = (await request.json()) as {
      id?: string;
      profile?: ChildProfile;
      cycle?: number;
    };
    if (!body.profile?.name?.trim()) {
      return NextResponse.json({ error: "请填写孩子的小名" }, { status: 400 });
    }

    const db = getD1();
    const now = Date.now();
    if (body.id) {
      const existing = await db
        .prepare("SELECT id FROM children WHERE id = ? AND parent_id = ?")
        .bind(body.id, parent.id)
        .first<{ id: string }>();
      if (!existing) return NextResponse.json({ error: "没有找到这个孩子档案" }, { status: 404 });
      await db
        .prepare(`
          UPDATE children
          SET profile_json = ?, cycle = ?, updated_at = ?
          WHERE id = ? AND parent_id = ?
        `)
        .bind(JSON.stringify(body.profile), Math.max(1, body.cycle ?? 1), now, body.id, parent.id)
        .run();
    } else {
      const id = crypto.randomUUID();
      await db
        .prepare(`
          INSERT INTO children
          (id, parent_id, profile_json, cycle, calendar_token, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          id,
          parent.id,
          JSON.stringify(body.profile),
          Math.max(1, body.cycle ?? 1),
          createCalendarToken(),
          now,
          now,
        )
        .run();
      body.id = id;
    }

    const row = await db
      .prepare(`
        SELECT id, profile_json, cycle, calendar_token, updated_at
        FROM children
        WHERE id = ? AND parent_id = ?
      `)
      .bind(body.id, parent.id)
      .first<ChildRow>();
    return NextResponse.json({ child: row ? rowToChild(row) : null });
  } catch (error) {
    return NextResponse.json(
      { error: unauthorized(error) ? "请先登录" : "孩子档案保存失败" },
      { status: unauthorized(error) ? 401 : 500 },
    );
  }
}
