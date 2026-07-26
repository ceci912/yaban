import { ensureSchema, getD1 } from "../../../../db/storage";
import { buildCalendar } from "../../../../lib/calendar";
import type { ChildProfile, WeeklyCheckin } from "../../../../lib/agent/types";

type CalendarRow = {
  profile_json: string;
  cycle: number;
  feedback_json: string | null;
  weekly_note: string | null;
  child_mood: WeeklyCheckin["childMood"] | null;
};

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  await ensureSchema();
  const { token } = await context.params;
  const row = await getD1()
    .prepare(`
      SELECT
        children.profile_json,
        children.cycle,
        checkins.feedback_json,
        checkins.weekly_note,
        checkins.child_mood
      FROM children
      LEFT JOIN checkins
        ON checkins.child_id = children.id
        AND checkins.cycle = children.cycle
      WHERE children.calendar_token = ?
    `)
    .bind(token)
    .first<CalendarRow>();
  if (!row) return new Response("Calendar not found", { status: 404 });

  const checkin: WeeklyCheckin = {
    feedback: row.feedback_json ? JSON.parse(row.feedback_json) : {},
    weeklyNote: row.weekly_note ?? "",
    childMood: row.child_mood ?? "轻松",
  };
  const calendar = buildCalendar({
    token,
    profile: JSON.parse(row.profile_json) as ChildProfile,
    cycle: row.cycle,
    checkin,
    siteUrl: new URL(request.url).origin,
  });
  const download = new URL(request.url).searchParams.get("download") === "1";
  return new Response(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      ...(download
        ? { "Content-Disposition": 'attachment; filename="yaban-growth-plan.ics"' }
        : {}),
    },
  });
}
