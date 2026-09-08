// 首页 Hero 动态插画：暖晨里的家 —— 纯内联 SVG + CSS 微动效，零外部资源
export default function HeroIllustration() {
  return (
    <div className="hero-art" role="img" aria-label="晨光下一座亮着暖灯的小房子">
      <svg viewBox="0 0 360 330" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="haloG" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EED9A9" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#E8D8B0" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#E8D8B0" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="winG" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE9A8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFD98A" stopOpacity="0.1" />
          </radialGradient>
        </defs>

        {/* 暖光日晕（右上，缓慢呼吸） */}
        <g className="halo">
          <circle cx="296" cy="58" r="150" fill="url(#haloG)" />
          <circle cx="296" cy="58" r="26" fill="#F0DBA4" opacity="0.9" />
        </g>

        {/* 星光微粒 */}
        <g className="sparkles">
          {[
            [52, 52], [104, 30], [150, 56], [224, 34],
            [66, 108], [252, 108], [124, 96], [320, 120],
          ].map(([cx, cy], i) => (
            <circle key={i} className="twinkle" cx={cx} cy={cy} r="2.1"
              fill="#C58B65" style={{ animationDelay: `${i * 0.7}s`, animationDuration: `${3.5 + (i % 3)}s` }} />
          ))}
        </g>

        {/* 漂浮云朵 */}
        <g className="drift" style={{ animationDelay: '0s' }} fill="#FFFDF7" opacity="0.9">
          <ellipse cx="58" cy="128" rx="26" ry="12" />
          <ellipse cx="78" cy="122" rx="19" ry="13" />
          <ellipse cx="98" cy="129" rx="20" ry="11" />
        </g>
        <g className="drift" style={{ animationDelay: '-5s', animationDuration: '15s' }} fill="#FFFDF7" opacity="0.75">
          <ellipse cx="310" cy="150" rx="22" ry="10" />
          <ellipse cx="327" cy="145" rx="15" ry="11" />
        </g>

        {/* 背景缓坡（浅绿温柔托底） */}
        <ellipse cx="180" cy="292" rx="225" ry="66" fill="#9DBFA6" opacity="0.2" />
        <ellipse cx="180" cy="300" rx="238" ry="58" fill="#F6E8CE" opacity="0.85" />

        {/* 左侧圆冠小树（整体缓摆） */}
        <rect x="70" y="226" width="11" height="44" rx="5" fill="#B0744C" />
        <g className="sway">
          <circle cx="66" cy="196" r="26" fill="#8FAF9A" />
          <circle cx="88" cy="204" r="21" fill="#A9C4B0" />
          <circle cx="52" cy="212" r="17" fill="#9DBFA6" />
          <circle cx="78" cy="182" r="17" fill="#B4CDB8" />
        </g>

        {/* 房屋主体 */}
        <g>
          {/* 烟囱 + 轻烟（先画在屋顶后面） */}
          <rect x="228" y="86" width="15" height="46" rx="4" fill="#C58B65" />
          <g fill="#FFFDF7">
            <circle className="smoke" cx="235" cy="70" r="5" style={{ animationDelay: '0s' }} />
            <circle className="smoke" cx="239" cy="58" r="6" style={{ animationDelay: '2.4s' }} />
            <circle className="smoke" cx="236" cy="46" r="7" style={{ animationDelay: '4.8s' }} />
          </g>

          {/* 屋顶 */}
          <path d="M124 168 L236 168 L212 108 L148 108 Z" fill="#E6C48D" />
          <path d="M124 168 L236 168 L230 158 L130 158 Z" fill="#F0D6A6" opacity="0.6" />

          {/* 屋身 */}
          <rect x="137" y="164" width="124" height="94" rx="9" fill="#FCEFD3" />
          <rect x="137" y="164" width="124" height="94" rx="9" fill="none" stroke="#EFDCBB" strokeWidth="1.4" />

          {/* 门前小径 + 心形 */}
          <ellipse cx="199" cy="258" rx="86" ry="11" fill="#E8D8B0" opacity="0.5" />
          <g style={{ transform: 'translate(199px,204px)' }}>
            <path className="warm" d="M0 7 C-4 2 -10 0 -10 -4 A5 5 0 0 1 0 -9 A5 5 0 0 1 10 -4 C10 0 4 2 0 7 Z"
              fill="#C58B65" opacity="0.85" style={{ transform: 'scale(1.4)', transformOrigin: 'center' }} />
          </g>

          {/* 左暖窗 */}
          <circle cx="162" cy="192" r="27" fill="url(#winG)" className="warm" />
          <rect x="147" y="180" width="27" height="36" rx="5" fill="#FFE3A0" />
          <rect x="147" y="180" width="27" height="36" rx="5" fill="none" stroke="#D9B072" strokeWidth="1.6" />
          <rect x="159.5" y="180" width="2" height="36" fill="#D9B072" />
          <rect x="147" y="197" width="27" height="2" fill="#D9B072" />

          {/* 右暖窗 */}
          <circle cx="236" cy="192" r="27" fill="url(#winG)" className="warm" style={{ animationDelay: '1.2s' }} />
          <rect x="224" y="180" width="27" height="36" rx="5" fill="#FFE3A0" />
          <rect x="224" y="180" width="27" height="36" rx="5" fill="none" stroke="#D9B072" strokeWidth="1.6" />
          <rect x="236.5" y="180" width="2" height="36" fill="#D9B072" />
          <rect x="224" y="197" width="27" height="2" fill="#D9B072" />

          {/* 门 */}
          <rect x="183" y="214" width="32" height="44" rx="16" fill="#C99B6B" />
          <rect x="183" y="214" width="32" height="44" rx="16" fill="none" stroke="#B0744C" strokeWidth="1.2" />
          <circle cx="207" cy="238" r="2.2" fill="#8A6A4C" />
        </g>

        {/* 屋旁小丛花 */}
        <circle cx="116" cy="266" r="9" fill="#B4CDB8" />
        <circle cx="284" cy="268" r="8" fill="#B4CDB8" />
        <circle cx="118" cy="254" r="2.6" fill="#C58B65" />
        <circle cx="281" cy="258" r="2.6" fill="#E8D8B0" />
      </svg>
    </div>
  );
}
