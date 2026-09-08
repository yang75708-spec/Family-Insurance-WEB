// 首页右侧场景：半透明保障卡 + 环形覆盖 + 柔光斑（自然系现代，克制）
export default function HeroIllustration() {
  return (
    <div className="hero-scene" role="img" aria-label="家庭保障顾问系统的抽象示意图">
      <div className="scene-blob b1" aria-hidden="true" />
      <div className="scene-blob b2" aria-hidden="true" />

      <span className="scene-sprig sprig-1" aria-hidden="true">🌿</span>
      <span className="scene-sprig sprig-2" aria-hidden="true">🌾</span>
      <span className="scene-dot" style={{ top: '12%', left: '16%' }} aria-hidden="true" />
      <span className="scene-dot" style={{ bottom: '18%', right: '14%' }} aria-hidden="true" />
      <span className="scene-dot" style={{ top: '30%', right: '6%' }} aria-hidden="true" />

      {/* 玻璃保障卡 */}
      <div className="glass-card gc-1">
        <div className="g-ico">🛡️</div>
        <div className="g-t"><b>三块保障</b>健康 · 寿险 · 养老</div>
      </div>
      <div className="glass-card gc-2">
        <div className="g-ico">🧭</div>
        <div className="g-t"><b>顾问式测算</b>按收入与家庭责任</div>
      </div>
      <div className="glass-card gc-3">
        <div className="g-ico">🏡</div>
        <div className="g-t"><b>家庭视角</b>两支柱 · 子女 · 父母</div>
      </div>

      {/* 中央环形覆盖 + 核心标 */}
      <div className="scene-core">
        <div className="ring-wrap">
          <svg viewBox="0 0 400 400" aria-hidden="true" focusable="false">
            <g className="ring-arc">
              <circle cx="200" cy="200" r="178" fill="none" stroke="#E4EBE3" strokeWidth="26" />
            </g>
            <g className="ring-arc" style={{ animationDelay: '.8s' }}>
              <circle cx="200" cy="200" r="178" fill="none"
                stroke="#D8CBB8" strokeWidth="26" strokeLinecap="round"
                strokeDasharray="360 758" transform="rotate(-92 200 200)" opacity=".9" />
            </g>
            <g className="ring-arc" style={{ animationDelay: '1.6s' }}>
              <circle cx="200" cy="200" r="178" fill="none"
                stroke="#A8B5A2" strokeWidth="26" strokeLinecap="round"
                strokeDasharray="240 878" transform="rotate(120 200 200)" opacity=".85" />
            </g>
          </svg>
          <div className="ring-center">
            <div className="ring-logo">家</div>
            <div className="ring-t"><b>安心，是有结构的</b>家庭保障顾问</div>
          </div>
        </div>
      </div>
    </div>
  );
}
