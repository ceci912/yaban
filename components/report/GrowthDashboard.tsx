"use client";

import { useEffect, useMemo, useState } from "react";
import { generatePlan } from "../../lib/agent/generate-plan";
import { readingCatalog } from "../../lib/agent/reading-catalog";
import type { SavedChild, TaskFeedback, WeeklyCheckin } from "../../lib/agent/types";

type GrowthDashboardProps = {
  child: SavedChild;
  onEdit: () => void;
  onCycleChange: (cycle: number) => Promise<void>;
};

const feedbackOptions: Array<{ value: TaskFeedback; label: string }> = [
  { value: "done", label: "✓ 顺利完成" },
  { value: "hard", label: "有点难" },
  { value: "dislike", label: "孩子不喜欢" },
];

export function GrowthDashboard({ child, onEdit, onCycleChange }: GrowthDashboardProps) {
  const [tab, setTab] = useState<
    "week" | "portrait" | "subjects" | "psychology" | "books" | "month" | "review"
  >("week");
  const [feedback, setFeedback] = useState<Record<string, TaskFeedback>>({});
  const [showReason, setShowReason] = useState<string | null>(null);
  const [weeklyNote, setWeeklyNote] = useState("");
  const [childMood, setChildMood] = useState<"轻松" | "一般" | "有点抗拒">("轻松");
  const [copyState, setCopyState] = useState("复制本周计划");
  const [calendarCopyState, setCalendarCopyState] = useState("复制安卓订阅地址");
  const [saveState, setSaveState] = useState("正在读取云端记录…");
  const [hydrated, setHydrated] = useState(false);
  const profile = child.profile;
  const cycle = child.cycle;
  const plan = useMemo(() => generatePlan(profile, feedback, cycle), [profile, feedback, cycle]);
  const name = profile.name.trim() || "孩子";
  const completed = Object.values(feedback).filter((item) => item !== "pending").length;
  const calendarPath = `/api/calendar/${child.calendarToken}`;
  const calendarHttpsUrl = typeof window === "undefined" ? calendarPath : `${window.location.origin}${calendarPath}`;
  const calendarWebcalUrl = calendarHttpsUrl.replace(/^https?:\/\//, "webcal://");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/checkins?childId=${encodeURIComponent(child.id)}&cycle=${cycle}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as { checkin?: WeeklyCheckin };
        if (!cancelled && data.checkin) {
          setFeedback(data.checkin.feedback ?? {});
          setWeeklyNote(data.checkin.weeklyNote ?? "");
          setChildMood(data.checkin.childMood ?? "轻松");
        }
        if (!cancelled) setSaveState("已与家长账号同步");
      } catch {
        if (!cancelled) setSaveState("云端读取失败，请刷新重试");
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, [child.id, cycle]);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState("正在自动保存…");
    const timer = window.setTimeout(() => {
      const checkin: WeeklyCheckin = { feedback, weeklyNote, childMood };
      void fetch("/api/checkins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: child.id, cycle, checkin }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("save failed");
          setSaveState("已自动保存到家长账号");
        })
        .catch(() => setSaveState("保存失败，请检查网络"));
    }, 550);
    return () => window.clearTimeout(timer);
  }, [feedback, weeklyNote, childMood, child.id, cycle, hydrated]);

  async function adjustNextWeek() {
    setSaveState("正在生成下一周…");
    await onCycleChange(cycle + 1);
    setTab("week");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyPlan() {
    const content = [
      `芽伴｜${name}的第${cycle}周成长计划`,
      `本周重点：${profile.goal}`,
      ...plan.tasks.map((task, index) => `${index + 1}. ${task.day}｜${task.title}（${task.minutes}分钟）\n${task.detail}`),
      `家长话术：${plan.parentScript}`,
    ].join("\n\n");
    try {
      await navigator.clipboard.writeText(content);
      setCopyState("✓ 已复制，可发给家人");
      window.setTimeout(() => setCopyState("复制本周计划"), 2200);
    } catch {
      setCopyState("复制失败，请用保存报告");
    }
  }

  async function copyCalendarUrl() {
    try {
      await navigator.clipboard.writeText(calendarHttpsUrl);
      setCalendarCopyState("✓ 已复制，去日历网页版添加");
      window.setTimeout(() => setCalendarCopyState("复制安卓订阅地址"), 2600);
    } catch {
      setCalendarCopyState("复制失败，请长按地址");
    }
  }

  return (
    <section className="dashboard">
      <div className="welcome">
        <div>
          <span className="eyebrow">{cycle === 1 ? "本周" : `第 ${cycle} 周`} · 家长行动计划</span>
          <h2>陪{name}，按自己的节奏长大。</h2>
          <p>计划依据孩子状态与家庭时间生成；执行后反馈，下一周会自动调整。</p>
        </div>
        <div className="cycle-badge"><strong>{completed}/3</strong><span>已反馈</span></div>
      </div>

      <div className="evidence-row" aria-label="计划生成依据">
        <span>规划依据</span>
        {plan.evidence.map((item) => <b key={item}>{item}</b>)}
      </div>

      <div className="tabs" role="tablist">
        <button className={tab === "portrait" ? "active" : ""} onClick={() => setTab("portrait")}>成长评估</button>
        <button className={tab === "month" ? "active" : ""} onClick={() => setTab("month")}>四周规划</button>
        <button className={tab === "subjects" ? "active" : ""} onClick={() => setTab("subjects")}>分科学习</button>
        <button className={tab === "psychology" ? "active" : ""} onClick={() => setTab("psychology")}>心理成长</button>
        <button className={tab === "books" ? "active" : ""} onClick={() => setTab("books")}>推荐书单</button>
        <button className={tab === "week" ? "active" : ""} onClick={() => setTab("week")}>本周行动</button>
        <button className={tab === "review" ? "active" : ""} onClick={() => setTab("review")}>家长复盘</button>
      </div>

      {tab === "week" ? (
        <>
          <div className="report-grid">
            <div className="tasks-panel">
              {plan.tasks.map((task, index) => (
                <article className={`task-card ${task.color}`} key={`${cycle}-${task.id}`}>
                  <div className="day-box"><span>{task.day}</span><b>0{index + 1}</b></div>
                  <div className="task-copy">
                    <span className="tag">{task.tag}</span>
                    <h3>{task.title}</h3>
                    <p>{task.detail}</p>
                    <button className="why-button" onClick={() => setShowReason(showReason === task.id ? null : task.id)}>
                      {showReason === task.id ? "收起依据" : "为什么这样安排？"}
                    </button>
                    {showReason === task.id && <small className="reason">{task.why}</small>}
                    <div className="feedback-row" aria-label={`${task.title}完成反馈`}>
                      {feedbackOptions.map((option) => (
                        <button
                          key={option.value}
                          className={feedback[task.id] === option.value ? "selected" : ""}
                          onClick={() => setFeedback((current) => ({ ...current, [task.id]: option.value }))}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="task-time">{task.minutes} min</div>
                </article>
              ))}
            </div>
            <aside className="parent-tip">
              <span className="tip-icon">☀</span>
              <small>家长本周可以这样说</small>
              <h3>先描述看到的过程，再讨论结果。</h3>
              <p>{plan.parentScript}</p>
              <div className="tip-footer">本周重点 · {profile.goal}</div>
            </aside>
          </div>
          <div className="adjust-card">
            <div>
              <b>{completed === 0 ? "完成一次后，回来告诉芽伴" : `已收到 ${completed} 项反馈`}</b>
              <span>{completed < 3 ? "反馈“太难”或“不喜欢”也很重要。" : "信息已足够，可以生成更适合的下一周。"}</span>
            </div>
            <button className="primary-button" disabled={completed === 0} onClick={adjustNextWeek}>
              根据反馈调整下一周
            </button>
          </div>
          <div className="calendar-card">
            <div className="calendar-icon" aria-hidden="true"><b>3</b><span>件事</span></div>
            <div className="calendar-copy">
              <span className="tag">不用每周回网站找计划</span>
              <h3>把{name}的行动计划订阅到手机日历</h3>
              <p>
                周一、周三和周六会成为具体事件，并提前 10 分钟提醒。生成下一周后，
                同一个订阅地址会自动提供最新计划。
              </p>
              <small>订阅地址相当于私密钥匙，请只发给共同照顾孩子的家人。</small>
            </div>
            <div className="calendar-actions">
              <a className="primary-button" href={calendarWebcalUrl}>苹果一键订阅</a>
              <button className="secondary-button" onClick={copyCalendarUrl}>{calendarCopyState}</button>
              <a className="text-button download-link" href={`${calendarPath}?download=1`}>下载本周 .ics 文件</a>
            </div>
            <details className="calendar-help">
              <summary>安卓手机怎么添加？</summary>
              <p>Google 日历需在电脑网页版打开“其他日历 → 通过网址”，粘贴上面的订阅地址；添加一次后会同步到手机。也可以直接下载本周 .ics 文件导入系统日历。</p>
            </details>
          </div>
        </>
      ) : tab === "portrait" ? (
        <>
          <div className="assessment-lead">
            <span className="tag">家庭教育成长评估 · 非医学诊断</span>
            <h3>{plan.assessment.summary}</h3>
            <p>{plan.assessment.possibleCause}</p>
          </div>
          <div className="portrait-grid">
            <article>
              <span>优势入口</span>
              <h3>{plan.strengths[0]}</h3>
              <p>{plan.strengths[1]}。建议用已有优势带动新的学习体验。</p>
            </article>
            <article>
              <span>本月优先方向</span>
              <h3>{profile.goal}</h3>
              <p>{plan.priority}</p>
            </article>
            <article>
              <span>家庭策略</span>
              <h3>少催促，先降低开始门槛</h3>
              <p>{plan.strategy}</p>
            </article>
          </div>
          <div className="observe-card">
            <b>接下来请家长观察3件事</b>
            {plan.assessment.observeNext.map((item) => <span key={item}>✓ {item}</span>)}
          </div>
          {plan.painPointGuidance.length > 0 && (
            <div className="pain-guidance-grid">
              {plan.painPointGuidance.map((item, index) => (
                <article className="pain-guidance-card" key={item.label}>
                  <span>优先痛点 0{index + 1}</span>
                  <h3>{item.label}</h3>
                  <div><b>先观察</b><p>{item.observe}</p></div>
                  <div><b>家庭动作</b><p>{item.action}</p></div>
                  <blockquote>{item.parentLanguage}</blockquote>
                </article>
              ))}
            </div>
          )}
          <article className="companion-card">
            <div>
              <span>推荐陪伴方式</span>
              <h3>{plan.companionPlan.mode}</h3>
              <p>{plan.companionPlan.description}</p>
            </div>
            <div className="companion-columns">
              <section>
                <b>尽量避免</b>
                {plan.companionPlan.avoid.map((item) => <p key={item}>× {item}</p>)}
              </section>
              <section>
                <b>可以这样做</b>
                {plan.companionPlan.doInstead.map((item) => <p key={item}>✓ {item}</p>)}
              </section>
            </div>
          </article>
        </>
      ) : tab === "month" ? (
        <div className="month-grid">
          {plan.monthPlan.map((item, index) => (
            <article key={item.week}>
              <b>0{index + 1}</b>
              <span>{item.week}</span>
              <h3>{item.focus}</h3>
              <p>阶段结果：{item.outcome}</p>
            </article>
          ))}
        </div>
      ) : tab === "subjects" ? (
        <div className="subject-grid">
          {plan.subjects.map((subject) => (
            <article key={subject.name}>
              <span className="subject-name">{subject.name}</span>
              <small>{profile.grade}阶段目标</small>
              <h3>{subject.stageGoal}</h3>
              <div><b>本周怎么做</b><p>{subject.weeklyAction}</p></div>
              <div><b>家长怎么看效果</b><p>{subject.parentCheck}</p></div>
            </article>
          ))}
        </div>
      ) : tab === "psychology" ? (
        <div className="psychology-grid">
          <article>
            <span className="tag">本月心理成长主题</span>
            <h3>{plan.psychology.theme}</h3>
            <div className="action-list">
              {plan.psychology.familyActions.map((item, index) => (
                <p key={item}><b>0{index + 1}</b>{item}</p>
              ))}
            </div>
          </article>
          <aside>
            <small>家长可以这样说</small>
            <blockquote>{plan.psychology.parentLanguage}</blockquote>
            <p>{plan.psychology.boundary}</p>
          </aside>
        </div>
      ) : tab === "books" ? (
        <>
          <div className="book-grid">
            {plan.books.map((book, index) => (
              <article key={book.title}>
                <span>本周优先 0{index + 1}</span>
                <h3>{book.title}</h3>
                <small>{book.author}</small>
                <p>{book.reason}</p>
                <div><b>亲子共读方法</b>{book.readTogether}</div>
              </article>
            ))}
            <p className="book-source">优先推荐结合当前年级与成长目标，每周选 1 本或一小段即可，不要求一次读完。</p>
          </div>
          <section className="reading-library">
            <div className="library-heading">
              <div>
                <span className="tag">{profile.grade} · 完整书库</span>
                <h3>按兴趣和阅读能力慢慢选</h3>
              </div>
              <b>{readingCatalog[profile.grade].reduce((total, group) => total + group.titles.length, 0)} 项书目与篇目</b>
            </div>
            <p className="library-note">以下内容来自你提供的分年级去重书单，保留课内、拓展与学校补充分类。它是选书参考，不代表孩子必须全部完成。</p>
            <div className="reading-groups">
              {readingCatalog[profile.grade].map((group, index) => (
                <details key={group.category} open={index === 0}>
                  <summary>
                    <span>{group.category}<small>{group.source}</small></span>
                    <b>{group.titles.length} 项</b>
                  </summary>
                  <div className="title-cloud">
                    {group.titles.map((title) => <span key={title}>{title}</span>)}
                  </div>
                </details>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="review-grid">
          <article className="review-form">
            <span className="tag">一周轻复盘</span>
            <h3>这周孩子整体感受如何？</h3>
            <div className="mood-row">
              {(["轻松", "一般", "有点抗拒"] as const).map((mood) => (
                <button className={childMood === mood ? "selected" : ""} onClick={() => setChildMood(mood)} key={mood}>
                  {mood === "轻松" ? "🙂 " : mood === "一般" ? "😐 " : "🙁 "}{mood}
                </button>
              ))}
            </div>
            <label>
              家长观察到的一件具体小事
              <textarea
                placeholder="例如：周三孩子主动把故事讲给奶奶听，虽然只有两句话。"
                value={weeklyNote}
                onChange={(event) => setWeeklyNote(event.target.value)}
              />
            </label>
            <small>{saveState}</small>
          </article>
          <aside className="review-summary">
            <small>芽伴复盘摘要</small>
            <h3>{completed === 0 ? "先从一次真实反馈开始" : `${completed} 项行动已有反馈`}</h3>
            <p>
              孩子本周整体感受为“{childMood}”。
              {childMood === "有点抗拒"
                ? " 下一周建议降低任务时长，并优先使用孩子喜欢的活动。"
                : " 下一周保持小步推进，不因为顺利完成就突然加量。"}
            </p>
            {weeklyNote && <blockquote>“{weeklyNote}”</blockquote>}
            <button className="primary-button" disabled={completed === 0} onClick={() => void adjustNextWeek()}>
              生成下一周计划
            </button>
          </aside>
        </div>
      )}

      <div className="report-actions">
        <button className="secondary-button" onClick={onEdit}>调整孩子信息</button>
        <button className="secondary-button" onClick={copyPlan}>{copyState}</button>
        <button className="primary-button" onClick={() => window.print()}>保存家长报告</button>
      </div>
    </section>
  );
}
