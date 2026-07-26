import { NextResponse } from "next/server";
import { ensureSchema, getD1 } from "../../../db/storage";
import { requireParentSession } from "../../../lib/auth";
import type { Course, CourseSession, CourseSessionStatus } from "../../../lib/courses";

type CourseRow = {
  id: string;
  child_id: string;
  title: string;
  provider: string;
  total_units: number;
  units_per_session: number;
  start_date: string;
  weekdays_json: string;
  class_time: string;
};

type SessionRow = {
  id: string;
  course_id: string;
  session_date: string;
  status: CourseSessionStatus;
  consumed_units: number;
  note: string;
};

function unauthorized(error: unknown) {
  return error instanceof Error && error.message === "UNAUTHORIZED";
}

async function ownsChild(parentId: string, childId: string) {
  return getD1()
    .prepare("SELECT id FROM children WHERE id = ? AND parent_id = ?")
    .bind(childId, parentId)
    .first<{ id: string }>();
}

async function ownsCourse(parentId: string, courseId: string) {
  return getD1()
    .prepare(`
      SELECT courses.id
      FROM courses
      JOIN children ON children.id = courses.child_id
      WHERE courses.id = ? AND children.parent_id = ?
    `)
    .bind(courseId, parentId)
    .first<{ id: string }>();
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function generateDates(startDate: string, weekdays: number[], count: number) {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T12:00:00Z`);
  const allowed = new Set(weekdays);
  for (let checked = 0; dates.length < count && checked < 730; checked += 1) {
    if (allowed.has(cursor.getUTCDay())) dates.push(toDateString(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function mapSession(row: SessionRow): CourseSession {
  return {
    id: row.id,
    date: row.session_date,
    status: row.status,
    consumedUnits: row.consumed_units,
    note: row.note,
  };
}

async function readCourses(childId: string): Promise<Course[]> {
  const db = getD1();
  const courseResult = await db
    .prepare(`
      SELECT id, child_id, title, provider, total_units, units_per_session,
             start_date, weekdays_json, class_time
      FROM courses WHERE child_id = ? ORDER BY created_at DESC
    `)
    .bind(childId)
    .all<CourseRow>();
  const courses: Course[] = [];
  for (const row of courseResult.results) {
    const sessionResult = await db
      .prepare(`
        SELECT id, course_id, session_date, status, consumed_units, note
        FROM course_sessions WHERE course_id = ? ORDER BY session_date
      `)
      .bind(row.id)
      .all<SessionRow>();
    courses.push({
      id: row.id,
      childId: row.child_id,
      title: row.title,
      provider: row.provider,
      totalUnits: row.total_units,
      unitsPerSession: row.units_per_session,
      startDate: row.start_date,
      weekdays: JSON.parse(row.weekdays_json) as number[],
      classTime: row.class_time,
      sessions: sessionResult.results.map(mapSession),
    });
  }
  return courses;
}

export async function GET(request: Request) {
  try {
    await ensureSchema();
    const parent = await requireParentSession();
    const childId = new URL(request.url).searchParams.get("childId") ?? "";
    if (!(await ownsChild(parent.id, childId))) {
      return NextResponse.json({ error: "没有找到这个孩子档案" }, { status: 404 });
    }
    return NextResponse.json({ courses: await readCourses(childId) });
  } catch (error) {
    return NextResponse.json(
      { error: unauthorized(error) ? "请先登录" : "课程读取失败" },
      { status: unauthorized(error) ? 401 : 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const parent = await requireParentSession();
    const body = (await request.json()) as {
      childId?: string;
      title?: string;
      provider?: string;
      totalUnits?: number;
      unitsPerSession?: number;
      startDate?: string;
      weekdays?: number[];
      classTime?: string;
    };
    const childId = body.childId ?? "";
    if (!(await ownsChild(parent.id, childId))) {
      return NextResponse.json({ error: "没有找到这个孩子档案" }, { status: 404 });
    }
    const title = body.title?.trim() ?? "";
    const totalUnits = Number(body.totalUnits);
    const unitsPerSession = Number(body.unitsPerSession ?? 1);
    const weekdays = [...new Set(body.weekdays ?? [])].filter((day) => day >= 0 && day <= 6);
    if (!title || !body.startDate || weekdays.length === 0 || totalUnits <= 0 || unitsPerSession <= 0) {
      return NextResponse.json({ error: "请完整填写课程名称、课时和上课日期" }, { status: 400 });
    }

    const db = getD1();
    const courseId = crypto.randomUUID();
    const now = Date.now();
    await db
      .prepare(`
        INSERT INTO courses
        (id, child_id, title, provider, total_units, units_per_session, start_date,
         weekdays_json, class_time, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        courseId,
        childId,
        title,
        body.provider?.trim() ?? "",
        totalUnits,
        unitsPerSession,
        body.startDate,
        JSON.stringify(weekdays),
        body.classTime ?? "",
        now,
        now,
      )
      .run();

    const sessionCount = Math.ceil(totalUnits / unitsPerSession);
    const dates = generateDates(body.startDate, weekdays, sessionCount);
    if (dates.length > 0) {
      await db.batch(
        dates.map((date) =>
          db
            .prepare(`
              INSERT INTO course_sessions
              (id, course_id, session_date, status, consumed_units, note, updated_at)
              VALUES (?, ?, ?, 'scheduled', 0, '', ?)
            `)
            .bind(crypto.randomUUID(), courseId, date, now),
        ),
      );
    }
    return NextResponse.json({ courses: await readCourses(childId) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: unauthorized(error) ? "请先登录" : "课程保存失败" },
      { status: unauthorized(error) ? 401 : 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureSchema();
    const parent = await requireParentSession();
    const body = (await request.json()) as {
      courseId?: string;
      sessionId?: string;
      status?: CourseSessionStatus;
      note?: string;
    };
    const courseId = body.courseId ?? "";
    if (!(await ownsCourse(parent.id, courseId))) {
      return NextResponse.json({ error: "没有找到这门课程" }, { status: 404 });
    }
    if (!body.sessionId || !["scheduled", "completed", "skipped"].includes(body.status ?? "")) {
      return NextResponse.json({ error: "无效的课时记录" }, { status: 400 });
    }
    const course = await getD1()
      .prepare("SELECT child_id, units_per_session FROM courses WHERE id = ?")
      .bind(courseId)
      .first<{ child_id: string; units_per_session: number }>();
    if (!course) return NextResponse.json({ error: "没有找到这门课程" }, { status: 404 });
    const consumedUnits = body.status === "completed" ? course.units_per_session : 0;
    await getD1()
      .prepare(`
        UPDATE course_sessions
        SET status = ?, consumed_units = ?, note = ?, updated_at = ?
        WHERE id = ? AND course_id = ?
      `)
      .bind(body.status, consumedUnits, body.note ?? "", Date.now(), body.sessionId, courseId)
      .run();
    return NextResponse.json({ courses: await readCourses(course.child_id) });
  } catch (error) {
    return NextResponse.json(
      { error: unauthorized(error) ? "请先登录" : "课时状态保存失败" },
      { status: unauthorized(error) ? 401 : 500 },
    );
  }
}
