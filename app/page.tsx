"use client";

import { useMemo, useState } from "react";

type FormState = {
  name: string;
  grade: string;
  focus: string;
  interest: string;
  concern: string;
};

const defaults: FormState = {
  name: "小满",
  grade: "二年级",
  focus: "15–25 分钟",
  interest: "画画、自然观察",
  concern: "写作业容易走神，阅读后不太愿意复述",
};

const plans = [
  {
    day: "周一",
    tag: "轻启动",
    title: "15分钟专注小挑战",
    detail: "写作业前先定一个小目标，完成后让孩子自己打勾。",
    time: "15 min",
    color: "mint",
  },
  {
    day: "周三",
    tag: "会表达",
    title: "把故事讲给玩偶听",
    detail: "读完绘本后只问三个问题：谁、发生了什么、你最喜欢哪里？",
    time: "20 min",
    color: "peach",
  },
  {
    day: "周六",
    tag: "去探索",
    title: "一张叶子的观察日记",
    detail: "散步时选一片叶子，画下来并写三个发现，不要求写长句。",
    time: "30 min",
    color: "yellow",
  },
];

export default function Home() {
  const [form, setForm] = useState<FormState>(defaults);
  const [step, setStep] = useState<"intro" | "form" | "report">("intro");
  const [tab, setTab] = useState<"week" | "portrait">("week");

  const firstName = useMemo(() => form.name.trim() || "孩子", [form.name]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <main>
      <header className="nav">
        <button className="brand" onClick={() => setStep("intro")} aria-label="返回芽伴首页">
          <span className="brand-mark">芽</span>
          <span>芽伴</span>
        </button>
        <span className="nav-note">1–3年级家庭成长规划助手</span>
        <button className="ghost-button" onClick={() => setStep("form")}>
          重新规划
        </button>
      </header>

      {step === "intro" && (
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">AI 家庭成长规划</span>
            <h1>
              看见孩子的节奏，
              <br />
              找到<span>下一步。</span>
            </h1>
            <p>
              不比较、不催促。用 3 分钟了解孩子的学习习惯、兴趣与家庭节奏，
              生成一份真正做得到的成长计划。
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => setStep("form")}>
                开始为孩子规划 <span>→</span>
              </button>
              <span className="microcopy">免费体验 · 无需注册</span>
            </div>
            <div className="trust-row">
              <span>✓ 尊重个体差异</span>
              <span>✓ 每周只做 3 件事</span>
              <span>✓ 家长随时可调整</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="芽伴成长计划预览">
            <div className="sun" />
            <div className="cloud cloud-one" />
            <div className="cloud cloud-two" />
            <div className="plan-card">
              <div className="card-top">
                <div>
                  <span>本周成长计划</span>
                  <strong>小满的第 3 周</strong>
                </div>
                <span className="week-badge">稳稳向前</span>
              </div>
              <div className="progress-label">
                <span>本周已完成 2 项</span>
                <b>67%</b>
              </div>
              <div className="progress">
                <i />
              </div>
              <div className="mini-task done">
                <span>✓</span>
                <div><b>15分钟专注小挑战</b><small>周一 · 已完成</small></div>
              </div>
              <div className="mini-task">
                <span>三</span>
                <div><b>把故事讲给玩偶听</b><small>周三 · 20分钟</small></div>
              </div>
              <div className="mini-task">
                <span>六</span>
                <div><b>一张叶子的观察日记</b><small>周六 · 30分钟</small></div>
              </div>
            </div>
            <div className="ground">
              <span className="sprout">⌇</span>
            </div>
          </div>
        </section>
      )}

      {step === "form" && (
        <section className="form-page">
          <div className="form-heading">
            <span className="eyebrow">第一步 · 认识孩子</span>
            <h2>先聊聊孩子最近的状态</h2>
            <p>没有标准答案，真实的信息才能带来合适的建议。</p>
          </div>
          <div className="form-card">
            <label>
              孩子的小名
              <input value={form.name} onChange={(e) => update("name", e.target.value)} />
            </label>
            <div className="two-cols">
              <label>
                当前年级
                <select value={form.grade} onChange={(e) => update("grade", e.target.value)}>
                  <option>一年级</option>
                  <option>二年级</option>
                  <option>三年级</option>
                </select>
              </label>
              <label>
                单次专注时长
                <select value={form.focus} onChange={(e) => update("focus", e.target.value)}>
                  <option>少于 15 分钟</option>
                  <option>15–25 分钟</option>
                  <option>25–40 分钟</option>
                  <option>40 分钟以上</option>
                </select>
              </label>
            </div>
            <label>
              孩子最近喜欢什么？
              <input value={form.interest} onChange={(e) => update("interest", e.target.value)} />
            </label>
            <label>
              你最想改善的一件事
              <textarea value={form.concern} onChange={(e) => update("concern", e.target.value)} />
            </label>
            <div className="form-foot">
              <button className="text-button" onClick={() => setForm(defaults)}>使用示例</button>
              <button className="primary-button" onClick={() => setStep("report")}>
                生成成长计划 <span>→</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {step === "report" && (
        <section className="dashboard">
          <div className="welcome">
            <div>
              <span className="eyebrow">{form.grade} · 本周计划</span>
              <h2>{firstName}，按自己的节奏长大。</h2>
              <p>我们把目标缩小成了三件轻松、具体、能坚持的小事。</p>
            </div>
            <div className="score-ring"><strong>82</strong><span>成长适配度</span></div>
          </div>

          <div className="tabs" role="tablist">
            <button className={tab === "week" ? "active" : ""} onClick={() => setTab("week")}>本周行动</button>
            <button className={tab === "portrait" ? "active" : ""} onClick={() => setTab("portrait")}>成长画像</button>
          </div>

          {tab === "week" ? (
            <div className="report-grid">
              <div className="tasks-panel">
                {plans.map((plan, index) => (
                  <article className={`task-card ${plan.color}`} key={plan.day}>
                    <div className="day-box"><span>{plan.day}</span><b>0{index + 1}</b></div>
                    <div className="task-copy">
                      <span className="tag">{plan.tag}</span>
                      <h3>{plan.title}</h3>
                      <p>{plan.detail}</p>
                    </div>
                    <div className="task-time">{plan.time}</div>
                  </article>
                ))}
              </div>
              <aside className="parent-tip">
                <span className="tip-icon">☀</span>
                <small>给家长的一句话</small>
                <h3>先肯定过程，再讨论结果。</h3>
                <p>
                  当{firstName}完成一小步时，可以说：“我看到你刚才很专心。”
                  具体的观察，比笼统的“真棒”更能帮助孩子建立信心。
                </p>
                <div className="tip-footer">本周陪伴重点 · 专注与表达</div>
              </aside>
            </div>
          ) : (
            <div className="portrait-grid">
              <article>
                <span>当前优势</span>
                <h3>好奇心与视觉表达</h3>
                <p>{firstName}喜欢{form.interest}，适合用画、说、做的方式带动阅读与表达。</p>
              </article>
              <article>
                <span>优先培养</span>
                <h3>短时专注与复述</h3>
                <p>当前专注时长约为{form.focus}。先建立短而稳定的完成体验，再逐步增加难度。</p>
              </article>
              <article>
                <span>家庭策略</span>
                <h3>少提醒，多设计环境</h3>
                <p>每次只给一个清晰任务，把计时器、纸笔和读物提前放好，让开始变得容易。</p>
              </article>
            </div>
          )}

          <div className="report-actions">
            <button className="secondary-button" onClick={() => setStep("form")}>调整信息</button>
            <button className="primary-button" onClick={() => window.print()}>保存成长报告</button>
          </div>
        </section>
      )}

      <footer>
        <span><b>芽伴</b> · 了解孩子，也帮助父母找到下一步。</span>
        <span>建议仅用于家庭教育规划，不替代专业诊断。</span>
      </footer>
    </main>
  );
}
