"use client";

import { useState } from "react";
import { AssessmentForm } from "../components/assessment/AssessmentForm";
import { Hero } from "../components/home/Hero";
import { GrowthDashboard } from "../components/report/GrowthDashboard";
import type { ChildProfile } from "../lib/agent/types";

const defaultProfile: ChildProfile = {
  name: "小满",
  grade: "二年级",
  focus: "15–25 分钟",
  interest: "画画、自然观察",
  concern: "写作业容易走神，阅读后不太愿意复述",
  goal: "阅读表达",
  dailyMinutes: 20,
  supportMode: "工作日时间有限",
};

export default function Home() {
  const [profile, setProfile] = useState<ChildProfile>(defaultProfile);
  const [step, setStep] = useState<"intro" | "form" | "report">("intro");

  return (
    <main>
      <header className="nav">
        <button className="brand" onClick={() => setStep("intro")} aria-label="返回芽伴首页">
          <span className="brand-mark">芽</span>
          <span>芽伴</span>
        </button>
        <span className="nav-note">1–3年级家长成长规划助手</span>
        <button className="ghost-button" onClick={() => setStep("form")}>重新规划</button>
      </header>

      {step === "intro" && <Hero onStart={() => setStep("form")} />}
      {step === "form" && (
        <AssessmentForm
          value={profile}
          onChange={setProfile}
          onSubmit={() => setStep("report")}
          onReset={() => setProfile(defaultProfile)}
        />
      )}
      {step === "report" && <GrowthDashboard profile={profile} onEdit={() => setStep("form")} />}

      <footer>
        <span><b>芽伴</b> · 帮助家长理解孩子，找到下一步。</span>
        <span>建议用于家庭成长规划，不替代教师、医生或心理专业人员的判断。</span>
      </footer>
    </main>
  );
}
