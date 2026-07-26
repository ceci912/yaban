"use client";

import { useCallback, useEffect, useState } from "react";
import { AssessmentForm } from "../components/assessment/AssessmentForm";
import { AuthPanel } from "../components/auth/AuthPanel";
import { Hero } from "../components/home/Hero";
import { GrowthDashboard } from "../components/report/GrowthDashboard";
import type { ChildProfile, SavedChild } from "../lib/agent/types";
import type { CaregiverRole } from "../lib/caregiver";

const defaultProfile: ChildProfile = {
  name: "小满",
  gender: "女孩",
  grade: "二年级",
  focus: "15–25 分钟",
  interest: "画画、自然观察",
  concern: "写作业容易走神，阅读后不太愿意复述",
  goal: "阅读表达",
  dailyMinutes: 20,
  supportMode: "工作日时间有限",
  painPoints: ["拖拉磨蹭", "时间观念较弱"],
  weekdayTime: "19:30",
  weekendTime: "10:00",
};

type Parent = { id: string; username: string; caregiverRole: CaregiverRole };
type Step = "intro" | "auth" | "form" | "report";

export default function Home() {
  const [parent, setParent] = useState<Parent | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [children, setChildren] = useState<SavedChild[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ChildProfile>(defaultProfile);
  const [step, setStep] = useState<Step>("intro");
  const [saving, setSaving] = useState(false);
  const activeChild = children.find((child) => child.id === activeChildId) ?? null;

  const loadChildren = useCallback(async () => {
    const response = await fetch("/api/children", { cache: "no-store" });
    if (!response.ok) return [];
    const data = (await response.json()) as { children?: SavedChild[] };
    const savedChildren = data.children ?? [];
    setChildren(savedChildren);
    if (savedChildren.length > 0) {
      setActiveChildId((current) => current ?? savedChildren[0].id);
      setProfile((current) => {
        const selected = savedChildren.find((child) => child.id === activeChildId) ?? savedChildren[0];
        return { ...defaultProfile, ...selected.profile, weekdayTime: selected.profile.weekdayTime ?? "19:30", weekendTime: selected.profile.weekendTime ?? "10:00" };
      });
    }
    return savedChildren;
  }, [activeChildId]);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await response.json()) as { parent?: Parent | null };
        if (data.parent) {
          setParent(data.parent);
          await loadChildren();
        }
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  function selectChild(id: string) {
    const child = children.find((item) => item.id === id);
    if (!child) return;
    setActiveChildId(id);
    setProfile({ ...defaultProfile, ...child.profile });
    setStep("report");
  }

  function newChild() {
    setActiveChildId(null);
    setProfile({ ...defaultProfile, name: "" });
    setStep("form");
  }

  async function saveProfile(cycle = activeChild?.cycle ?? 1) {
    setSaving(true);
    try {
      const response = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeChildId ?? undefined, profile, cycle }),
      });
      const data = (await response.json()) as { child?: SavedChild; error?: string };
      if (!response.ok || !data.child) throw new Error(data.error ?? "档案保存失败");
      const child = data.child;
      setChildren((current) => {
        const exists = current.some((item) => item.id === child.id);
        return exists ? current.map((item) => item.id === child.id ? child : item) : [child, ...current];
      });
      setActiveChildId(child.id);
      setProfile(child.profile);
      setStep("report");
      return child;
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "档案保存失败");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function changeCycle(nextCycle: number) {
    const child = await saveProfile(nextCycle);
    if (child) {
      setChildren((current) => current.map((item) => item.id === child.id ? child : item));
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setParent(null);
    setChildren([]);
    setActiveChildId(null);
    setStep("intro");
  }

  if (!authReady) {
    return <main className="loading-page"><span className="brand-mark">芽</span><p>正在打开家庭成长档案…</p></main>;
  }

  return (
    <main>
      <header className="nav">
        <button className="brand" onClick={() => setStep("intro")} aria-label="返回芽伴首页">
          <span className="brand-mark">芽</span>
          <span>芽伴</span>
        </button>
        <span className="nav-note">1–3年级家长成长规划助手</span>
        {parent ? (
          <div className="account-nav">
            {children.length > 0 && (
              <select
                aria-label="切换孩子"
                value={activeChildId ?? ""}
                onChange={(event) => selectChild(event.target.value)}
              >
                {children.map((child) => <option key={child.id} value={child.id}>{child.profile.name}</option>)}
              </select>
            )}
            <span className="account-role">{parent.caregiverRole}</span>
            <button className="ghost-button" onClick={newChild}>＋ 添加孩子</button>
            <button className="account-button" onClick={logout} title={`退出账号 ${parent.username}`}>
              <span className="logout-full">退出登录</span>
              <span className="logout-short">退出</span>
            </button>
          </div>
        ) : (
          <button className="ghost-button" onClick={() => setStep("auth")}>登录</button>
        )}
      </header>

      {step === "intro" && (
        <Hero onStart={() => setStep(parent ? (children.length > 0 ? "report" : "form") : "auth")} />
      )}
      {step === "auth" && (
        <AuthPanel
          onBack={() => setStep("intro")}
          onAuthenticated={async (nextParent) => {
            setParent(nextParent);
            const savedChildren = await loadChildren();
            setStep(savedChildren.length > 0 ? "report" : "form");
          }}
        />
      )}
      {step === "form" && parent && (
        <AssessmentForm
          value={profile}
          onChange={setProfile}
          onSubmit={() => void saveProfile()}
          onReset={() => setProfile({ ...defaultProfile, name: activeChild ? activeChild.profile.name : "" })}
          saving={saving}
        />
      )}
      {step === "report" && parent && activeChild && (
        <GrowthDashboard
          key={`${activeChild.id}-${activeChild.cycle}`}
          child={activeChild}
          onEdit={() => setStep("form")}
          onCycleChange={changeCycle}
        />
      )}

      <footer>
        <span><b>芽伴</b> · 帮助家长理解孩子，找到下一步。</span>
        <span>建议用于家庭成长规划，不替代教师、医生或心理专业人员的判断。</span>
      </footer>
    </main>
  );
}
