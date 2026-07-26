"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { courseProgress, type Course, type CourseSessionStatus } from "../../lib/courses";

type CourseManagerProps = {
  childId: string;
  childName: string;
};

const weekdayOptions = [
  { value: 1, label: "周一" },
  { value: 2, label: "周二" },
  { value: 3, label: "周三" },
  { value: 4, label: "周四" },
  { value: 5, label: "周五" },
  { value: 6, label: "周六" },
  { value: 0, label: "周日" },
];

const initialForm = {
  title: "",
  provider: "",
  totalUnits: 10,
  unitsPerSession: 1,
  startDate: new Date().toISOString().slice(0, 10),
  weekdays: [] as number[],
  classTime: "18:30",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${value}T12:00:00`));
}

export function CourseManager({ childId, childName }: CourseManagerProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/courses?childId=${encodeURIComponent(childId)}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as { courses?: Course[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "课程读取失败");
        if (!cancelled) setCourses(data.courses ?? []);
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "课程读取失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [childId]);

  const totals = useMemo(
    () =>
      courses.reduce(
        (summary, course) => {
          const progress = courseProgress(course);
          summary.total += course.totalUnits;
          summary.used += progress.usedUnits;
          summary.remaining += progress.remainingUnits;
          return summary;
        },
        { total: 0, used: 0, remaining: 0 },
      ),
    [courses],
  );

  function toggleWeekday(day: number) {
    setForm((current) => ({
      ...current,
      weekdays: current.weekdays.includes(day)
        ? current.weekdays.filter((item) => item !== day)
        : [...current.weekdays, day],
    }));
  }

  async function createCourse(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, ...form }),
      });
      const data = (await response.json()) as { courses?: Course[]; error?: string };
      if (!response.ok || !data.courses) throw new Error(data.error ?? "课程保存失败");
      setCourses(data.courses);
      setForm({ ...initialForm, startDate: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
      setMessage("课程已保存，课次已自动排好");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "课程保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function updateSession(courseId: string, sessionId: string, status: CourseSessionStatus) {
    setMessage("正在保存课时记录…");
    try {
      const response = await fetch("/api/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, sessionId, status }),
      });
      const data = (await response.json()) as { courses?: Course[]; error?: string };
      if (!response.ok || !data.courses) throw new Error(data.error ?? "课时保存失败");
      setCourses(data.courses);
      setMessage(status === "completed" ? "已扣除本次课时" : "本次未扣课时，余额已更新");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "课时保存失败");
    }
  }

  return (
    <div className="course-manager">
      <div className="course-heading">
        <div>
          <span className="tag">课时管家</span>
          <h3>{childName}的培训课程，一次录入持续记录</h3>
          <p>勾选“已上课”才会扣课；请假或取消后，课时会自动退回。</p>
        </div>
        <button className="primary-button" onClick={() => setShowForm((current) => !current)}>
          {showForm ? "收起录入" : "＋ 添加课程"}
        </button>
      </div>

      {courses.length > 0 && (
        <div className="course-summary">
          <span><small>课程数量</small><b>{courses.length}</b></span>
          <span><small>累计购买</small><b>{totals.total} 节</b></span>
          <span><small>已经完成</small><b>{totals.used} 节</b></span>
          <span><small>剩余课时</small><b>{totals.remaining} 节</b></span>
        </div>
      )}

      {showForm && (
        <form className="course-form" onSubmit={createCourse}>
          <div className="course-form-grid">
            <label>
              课程名称
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="例如：数学思维"
                required
              />
            </label>
            <label>
              培训机构或老师
              <input
                value={form.provider}
                onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))}
                placeholder="选填"
              />
            </label>
            <label>
              购买课时
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={form.totalUnits}
                onChange={(event) => setForm((current) => ({ ...current, totalUnits: Number(event.target.value) }))}
                required
              />
            </label>
            <label>
              每次消耗
              <select
                value={form.unitsPerSession}
                onChange={(event) => setForm((current) => ({ ...current, unitsPerSession: Number(event.target.value) }))}
              >
                <option value="0.5">0.5节</option>
                <option value="1">1节</option>
                <option value="1.5">1.5节</option>
                <option value="2">2节</option>
              </select>
            </label>
            <label>
              开始日期
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                required
              />
            </label>
            <label>
              上课时间
              <input
                type="time"
                value={form.classTime}
                onChange={(event) => setForm((current) => ({ ...current, classTime: event.target.value }))}
              />
            </label>
          </div>
          <fieldset>
            <legend>每周哪几天上课？</legend>
            <div className="weekday-picker">
              {weekdayOptions.map((day) => (
                <button
                  type="button"
                  key={day.value}
                  className={form.weekdays.includes(day.value) ? "selected" : ""}
                  onClick={() => toggleWeekday(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </fieldset>
          <button className="primary-button" disabled={saving || form.weekdays.length === 0}>
            {saving ? "正在生成课次…" : "保存并自动排课"}
          </button>
        </form>
      )}

      {message && <div className="course-message">{message}</div>}

      {loading ? (
        <div className="course-empty">正在读取课程安排…</div>
      ) : courses.length === 0 ? (
        <div className="course-empty">
          <b>还没有录入培训课程</b>
          <span>添加第一门课程后，芽伴会自动生成日期并计算剩余课时。</span>
        </div>
      ) : (
        <div className="course-list">
          {courses.map((course) => {
            const progress = courseProgress(course);
            const percent = Math.min(100, (progress.usedUnits / course.totalUnits) * 100);
            return (
              <article className="course-card" key={course.id}>
                <div className="course-card-top">
                  <div>
                    <span>{course.provider || "家庭课程"}</span>
                    <h3>{course.title}</h3>
                  </div>
                  <div className={progress.remainingUnits <= 3 ? "course-balance warning" : "course-balance"}>
                    <strong>{progress.remainingUnits}</strong>
                    <small>剩余课时</small>
                  </div>
                </div>
                <div className="course-progress">
                  <i style={{ width: `${percent}%` }} />
                </div>
                <div className="course-progress-label">
                  <span>已上 {progress.usedUnits} 节</span>
                  <span>共 {course.totalUnits} 节</span>
                </div>
                <div className="session-list">
                  {course.sessions.map((session) => (
                    <div className={`session-row ${session.status}`} key={session.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={session.status === "completed"}
                          onChange={(event) =>
                            void updateSession(
                              course.id,
                              session.id,
                              event.target.checked ? "completed" : "scheduled",
                            )
                          }
                        />
                        <span>
                          <b>{formatDate(session.date)} {course.classTime}</b>
                          <small>
                            {session.status === "completed"
                              ? `已上课，扣除 ${session.consumedUnits} 节`
                              : session.status === "skipped"
                                ? "请假/取消，不扣课时"
                                : "待确认"}
                          </small>
                        </span>
                      </label>
                      <button
                        className="text-button"
                        onClick={() =>
                          void updateSession(
                            course.id,
                            session.id,
                            session.status === "skipped" ? "scheduled" : "skipped",
                          )
                        }
                      >
                        {session.status === "skipped" ? "恢复排课" : "请假/取消"}
                      </button>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
