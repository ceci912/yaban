import type { ChildProfile, FocusRange, Grade, GrowthGoal, SupportMode } from "../../lib/agent/types";

type AssessmentFormProps = {
  value: ChildProfile;
  onChange: (value: ChildProfile) => void;
  onSubmit: () => void;
  onReset: () => void;
};

export function AssessmentForm({ value, onChange, onSubmit, onReset }: AssessmentFormProps) {
  function update<K extends keyof ChildProfile>(key: K, next: ChildProfile[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <section className="form-page">
      <div className="form-heading">
        <span className="eyebrow">第一步 · 家长告诉我们</span>
        <h2>孩子最近的真实状态</h2>
        <p>没有标准答案。信息越贴近家庭日常，计划越容易执行。</p>
      </div>
      <div className="form-card">
        <div className="two-cols">
          <label>
            孩子的小名
            <input value={value.name} onChange={(e) => update("name", e.target.value)} />
          </label>
          <label>
            当前年级
            <select value={value.grade} onChange={(e) => update("grade", e.target.value as Grade)}>
              <option>一年级</option><option>二年级</option><option>三年级</option>
            </select>
          </label>
        </div>
        <div className="two-cols">
          <label>
            单次专注时长
            <select value={value.focus} onChange={(e) => update("focus", e.target.value as FocusRange)}>
              <option>少于 15 分钟</option><option>15–25 分钟</option>
              <option>25–40 分钟</option><option>40 分钟以上</option>
            </select>
          </label>
          <label>
            本周优先目标
            <select value={value.goal} onChange={(e) => update("goal", e.target.value as GrowthGoal)}>
              <option>专注力</option><option>阅读表达</option><option>学习习惯</option>
              <option>数学思维</option><option>情绪与自信</option>
            </select>
          </label>
        </div>
        <label>
          孩子最近喜欢什么？
          <input value={value.interest} onChange={(e) => update("interest", e.target.value)} />
        </label>
        <label>
          你最想改善的一个具体场景
          <textarea value={value.concern} onChange={(e) => update("concern", e.target.value)} />
        </label>
        <div className="two-cols">
          <label>
            每天最多投入
            <select value={value.dailyMinutes} onChange={(e) => update("dailyMinutes", Number(e.target.value))}>
              <option value={10}>10分钟</option><option value={20}>20分钟</option>
              <option value={30}>30分钟</option><option value={45}>45分钟</option>
            </select>
          </label>
          <label>
            家庭陪伴情况
            <select value={value.supportMode} onChange={(e) => update("supportMode", e.target.value as SupportMode)}>
              <option>工作日时间有限</option><option>每天可以陪伴</option><option>主要由孩子独立完成</option>
            </select>
          </label>
        </div>
        <div className="form-foot">
          <button className="text-button" onClick={onReset}>恢复示例</button>
          <button className="primary-button" onClick={onSubmit}>
            生成家长行动计划 <span>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

