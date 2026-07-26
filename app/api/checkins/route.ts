import { NextResponse } from "next/server";
import { ensureSchema, getD1 } from "../../../db/storage";
import { requireParentSession } from "../../../lib/auth";
import type { WeeklyCheckin } from "../../../lib/agent/types";

type CheckinRow = {
  feedback_json: string;
  weekly_note: string;
  child_mood: WeeklyCheckin["childMood"];
};

async function ownsChild(parentId: string, childId: string) {
  return getD1()
    .prepare("SELECT id FROM children WHERE id = ? AND parent_id = ?")
    .bind(childId, parentId)
    .first<{ id: string }>();
}

function unauthorized(error: unknown) {
  return error instanceof Error && error.message === "UNAUTHORIZED";
}

export async function GET(request: Request) {
  try {
    await ensureSchema();
    const parent = await requireParentSession();
    const url = new URL(request.url);
    const childId = url.searchParams.get("childId") ?? "";
    const cycle = Math.max(1, Number(url.searchParams.get("cycle") ?? 1));
    if (!(await ownsChild(parent.id, childId))) {
      return NextResponse.json({ error: "没有找到这个孩子档案" }, { status: 404 });
    }
    const row = await getD1()
      .prepare(`
        SELECT feedback_json, weekly_note, child_mood
        FROM checkins WHERE child_id = ? AND cycle = ?
      `)
      .bind(childId, cycle)
      .first<CheckinRow>();
    const checkin: WeeklyCheckin = row
      ? {
          feedback: JSON.parse(row.feedback_json),
          weeklyNote: row.weekly_note,
          childMood: row.child_mood,
        }
      : { feedback: {}, weeklyNote: "", childMood: "轻松" };
    return NextResponse.json({ checkin });
  } catch (error) {
    return NextResponse.json(
      { error: unauthorized(error) ? "请先登录" : "打卡记录读取失败" },
      { status: unauthorized(error) ? 401 : 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    await ensureSchema();
    const parent = await requireParentSession();
    const body = (await request.json()) as {
      childId?: string;
      cycle?: number;
      checkin?: WeeklyCheckin;
    };
    const childId = body.childId ?? "";
    const cycle = Math.max(1, body.cycle ?? 1);
    if (!(await ownsChild(parent.id, childId))) {
      return NextResponse.json({ error: "没有找到这个孩子档案" }, { status: 404 });
    }
    const checkin = body.checkin ?? { feedback: {}, weeklyNote: "", childMood: "轻松" as const };
    await getD1()
      .prepare(`
        INSERT INTO checkins
        (child_id, cycle, feedback_json, weekly_note, child_mood, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(child_id, cycle) DO UPDATE SET
          feedback_json = excluded.feedback_json,
          weekly_note = excluded.weekly_note,
          child_mood = excluded.child_mood,
          updated_at = excluded.updated_at
      `)
      .bind(
        childId,
        cycle,
        JSON.stringify(checkin.feedback ?? {}),
        checkin.weeklyNote ?? "",
        checkin.childMood ?? "轻松",
        Date.now(),
      )
      .run();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: unauthorized(error) ? "请先登录" : "打卡记录保存失败" },
      { status: unauthorized(error) ? 401 : 500 },
    );
  }
}
