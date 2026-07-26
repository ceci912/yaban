type HeroProps = {
  onStart: () => void;
};

export function Hero({ onStart }: HeroProps) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">给家长的 AI 成长规划助手</span>
        <h1>
          看见孩子的节奏，
          <br />
          找到<span>下一步。</span>
        </h1>
        <p>
          不比较、不催促。用 3 分钟告诉我们孩子的状态与家庭节奏，
          得到一份家长真正能执行、还能根据反馈调整的成长计划。
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={onStart}>
            开始为孩子规划 <span>→</span>
          </button>
          <span className="microcopy">家长填写 · 无需孩子操作</span>
        </div>
        <div className="trust-row">
          <span>✓ 每周只做 3 件事</span>
          <span>✓ 根据家庭时间生成</span>
          <span>✓ 反馈后自动调整</span>
        </div>
      </div>

      <div className="hero-visual" aria-label="芽伴家长成长计划预览">
        <div className="sun" />
        <div className="cloud cloud-one" />
        <div className="cloud cloud-two" />
        <div className="plan-card">
          <div className="card-top">
            <div>
              <span>给家长的本周陪伴建议</span>
              <strong>小满的 3 个小行动</strong>
            </div>
            <span className="week-badge">稳稳向前</span>
          </div>
          <div className="progress-label">
            <span>完成后告诉芽伴感受</span>
            <b>可调整</b>
          </div>
          <div className="progress"><i /></div>
          <div className="mini-task done">
            <span>✓</span>
            <div><b>15分钟可完成目标</b><small>周一 · 家长已反馈</small></div>
          </div>
          <div className="mini-task">
            <span>三</span>
            <div><b>三句话讲给家长听</b><small>周三 · 20分钟</small></div>
          </div>
          <div className="mini-task">
            <span>六</span>
            <div><b>兴趣变成一次表达</b><small>周六 · 孩子自选形式</small></div>
          </div>
        </div>
        <div className="ground"><span className="sprout">⌇</span></div>
      </div>
    </section>
  );
}

