"use client";

import { useMemo, useState } from "react";
import { generatePlan } from "../../lib/agent/generate-plan";
import type { ChildProfile, TaskFeedback } from "../../lib/agent/types";

type GrowthDashboardProps = {
  profile: ChildProfile;
  onEdit: () => void;
};

const feedbackOptions: Array<{ value: TaskFeedback; label: string }> = [
  { value: "done", label: "✓ 顺利完成" },
  { value: "hard", label: "有点难" },
  { value: "dislike", label: "孩子不喜欢" },
];

export function GrowthDashboard({ profile, onEdit }: GrowthDashboardProps) {
  const [tab, setTab] = useState<"week" | "portrait">("week");
  const [feedback, setFeedback] = useState<Record<string, TaskFeedback>>({});
  const [cycle, setCycle] = useState(1);
  const [showReason, setShowReason] = useState<string | null>(null);
  const plan = useMemo(() => generatePlan(profile, feedback, cycle), [profile, feedback, cycle]);
  const name = profile.name.trim() || "孩子";
  const completed = Object.values(feedback).filter((item) => item !== "pending").length;

  function adjustNextWeek() {
    setCycle((current) => current + 1);
    setTab("week");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        <button className={tab === "week" ? "active" : ""} onClick={() => setTab("week")}>家长本周行动</button>
        <button className={tab === "portrait" ? "active" : ""} onClick={() => setTab("portrait")}>孩子成长画像</button>
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
        </>
      ) : (
        <div className="portrait-grid">
          <article>
            <span>当前优势</span>
            <h3>{plan.strengths[0]}</h3>
            <p>{plan.strengths[1]}。建议用已有优势带动新的学习体验。</p>
          </article>
          <article>
            <span>优先培养</span>
            <h3>{profile.goal}</h3>
            <p>{plan.priority}</p>
          </article>
          <article>
            <span>家庭策略</span>
            <h3>少催促，先降低开始门槛</h3>
            <p>{plan.strategy}</p>
          </article>
        </div>
      )}

      <div className="report-actions">
        <button className="secondary-button" onClick={onEdit}>调整孩子信息</button>
        <button className="primary-button" onClick={() => window.print()}>保存家长报告</button>
      </div>
    </section>
  );
}

