'use client';

// 6 站「小房子旅程式」进度导航：🏠 欢迎 → 家庭 → 健康 → 寿险 → 养老 → 报告
// index 0..5，由各步骤页传入（首页 /、basic、health、life、pension、result）
const STEPS = [
  { icon: '🏠', label: '欢迎' },
  { icon: '👨‍👩‍👧', label: '家庭' },
  { icon: '🏥', label: '健康' },
  { icon: '🛡️', label: '寿险' },
  { icon: '🌅', label: '养老' },
  { icon: '✅', label: '报告' },
];

export default function JourneyBar({ index }) {
  const pct = Math.min(100, Math.max(0, (index / (STEPS.length - 1)) * 100));
  return (
    <div className="journey" role="group" aria-label={`家庭保障旅程，当前第 ${index + 1} 站`}>
      <div className="journey-track">
        <div className="journey-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="journey-house" style={{ left: `${pct}%` }} aria-hidden="true">🏠</div>
      <div className="journey-nodes">
        {STEPS.map((s, i) => (
          <div key={s.label} className={'journey-node' + (i === index ? ' is-now' : i < index ? ' is-done' : '')}>
            <span className="journey-dot" aria-hidden="true">{i < index ? '✓' : s.icon}</span>
            <span className="journey-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
