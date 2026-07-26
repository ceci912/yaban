"use client";

import { FormEvent, useState } from "react";

type AuthPanelProps = {
  onAuthenticated: (parent: { id: string; username: string }) => void;
  onBack: () => void;
};

export function AuthPanel({ onAuthenticated, onBack }: AuthPanelProps) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as {
        parent?: { id: string; username: string };
        error?: string;
      };
      if (!response.ok || !data.parent) throw new Error(data.error ?? "暂时无法登录");
      onAuthenticated(data.parent);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "暂时无法登录");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-intro">
        <span className="eyebrow">一个家长账号 · 全家都能继续</span>
        <h2>换手机，也不会丢掉孩子的成长记录。</h2>
        <p>账号只用于保存孩子档案、每周计划、打卡和日历订阅。我们不读取通讯录，也不要求孩子注册。</p>
        <div className="auth-benefits">
          <span><b>01</b>支持多个孩子</span>
          <span><b>02</b>打卡自动保存</span>
          <span><b>03</b>日历持续同步</span>
        </div>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <span className="tag">{mode === "register" ? "首次使用" : "欢迎回来"}</span>
        <h3>{mode === "register" ? "创建家长账号" : "登录家长账号"}</h3>
        <p>可使用手机号、邮箱或容易记住的家庭账号名。</p>
        <label>
          家长账号
          <input
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="例如：13800000000"
            required
          />
        </label>
        <label>
          密码
          <input
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="至少 8 位"
            minLength={8}
            required
          />
        </label>
        {error && <div className="auth-error">{error}</div>}
        <button className="primary-button auth-submit" disabled={loading}>
          {loading ? "正在保存…" : mode === "register" ? "注册并开始规划" : "登录并继续打卡"}
        </button>
        <button
          className="text-button auth-switch"
          type="button"
          onClick={() => {
            setError("");
            setMode((current) => current === "login" ? "register" : "login");
          }}
        >
          {mode === "register" ? "已经有账号？直接登录" : "第一次使用？创建账号"}
        </button>
        <button className="text-button auth-back" type="button" onClick={onBack}>先返回看看</button>
        <small>内测版暂不发送短信验证码，请务必记住账号和密码。</small>
      </form>
    </section>
  );
}
