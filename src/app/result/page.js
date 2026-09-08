'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculate } from '@/lib/calculator';
import { getFormData, resetFormData, isInFlow } from '@/lib/store';
import JourneyBar from '@/components/JourneyBar';

/* ---------- 纯展示辅助：不参与算法，仅负责“把账讲清楚” ---------- */
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function fmt(n) { return n === null || n === undefined || isNaN(n) ? '—' : String(Math.round(n * 100) / 100); }
function zero(n) { return n && !isNaN(n) ? n : 0; }
function isGap(x) { return zero(x) > 0.005; }

function riskMeta(level) {
  return {
    低风险: { cls: 'ok', label: '低风险', color: '#6F8072' },
    中等风险: { cls: 'warn', label: '中等风险', color: '#C0A26B' },
    高风险: { cls: 'danger', label: '高风险', color: '#B56A5A' },
  }[level] || { cls: 'warn', label: '中等风险', color: '#C0A26B' };
}

function riskWord(level, priority) {
  if (level === '低风险')
    return '您家的保障结构已经比较扎实，预算也处在健康区间。接下来只需按建议定期复核，让这份安心一直陪伴家人。';
  if (level === '高风险')
    return '目前保障仍有较明显缺口。别担心，规划是一步步来的——建议从健康保障开始优先补齐，给家人更多从容。';
  return `家庭保障已初步覆盖，但仍有一些值得补足的缺口。${priority ? '建议优先关注「' + priority + '」' : '建议从健康保障开始'}，逐步加固。`;
}

/* rAF 缓动数值（表现层） */
function useTween(to, dur = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf; let start;
    const step = (t) => {
      if (start === undefined) start = t;
      const p = clamp((t - start) / dur, 0, 1);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, dur]);
  return v;
}
function useGrow(delay = 200) {
  const [g, setG] = useState(false);
  useEffect(() => { const id = setTimeout(() => setG(true), delay); return () => clearTimeout(id); }, [delay]);
  return g;
}

/* 缺口占比条 */
function gapItem(name, emoji, gap) {
  return { name, emoji, gap: zero(gap), covered: !isGap(gap) };
}
function pillClass(x) {
  if (x <= 20) return 'ok';
  if (x <= 60) return 'warn';
  return 'danger';
}

/* ---------- 视图组装 ---------- */
function buildView(r) {
  const f = r.firstPerson;
  const s = r.secondPerson;

  // 四宫格保障模块（家庭口径汇总，全部来自 calculator 既有数值）
  const modules = [
    {
      name: '重疾保障', ico: '🩺', metric: fmt(zero(f.recCI) + zero(s.recCI) + zero(r.child.recCI)),
      unit: '万 · 建议保额',
      sub: () => {
        const gap = zero(f.ciGap) + zero(s.ciGap) + zero(r.child.ciGap);
        const prem = zero(f.estCIPrem) + zero(s.estCIPrem);
        return <>重疾缺口 <b>{fmt(gap)} 万</b> · 建议年保费 {fmt(prem)} 万</>;
      },
      state: pillClass(zero(f.ciGap) + zero(s.ciGap)),
    },
    {
      name: '医疗保障', ico: '💊', metric: fmt(zero(f.recMI) + zero(s.recMI)),
      unit: '万 · 期望花销',
      sub: () => {
        const gap = zero(f.miGap) + zero(s.miGap);
        const prem = zero(f.estMIPrem) + zero(s.estMIPrem);
        return <>医疗缺口 <b>{fmt(gap)} 万</b> · 建议年保费 {fmt(prem)} 万</>;
      },
      state: pillClass(zero(f.miGap) + zero(s.miGap)),
    },
    {
      name: '寿险保障', ico: '🛡️', metric: fmt(zero(f.recLife) + zero(s.recLife)),
      unit: '万 · 建议保额',
      sub: () => {
        const gap = zero(f.lifeGap) + zero(s.lifeGap);
        const prem = zero(f.estLifePrem) + zero(s.estLifePrem);
        return <>寿险缺口 <b>{fmt(gap)} 万</b> · 建议年保费 {fmt(prem)} 万</>;
      },
      state: pillClass(zero(f.lifeGap) + zero(s.lifeGap)),
    },
    {
      name: '养老规划', ico: '🌅', metric: fmt(zero(f.recPension) + zero(s.recPension)),
      unit: '万 / 年建议',
      sub: () => {
        const gap = zero(f.pensionGap) + zero(s.pensionGap);
        const fv = zero(f.existingPensionFV) + zero(s.existingPensionFV);
        return <>养老缺口 <b>{fmt(gap)} 万</b> · 已有储备终值 {fmt(fv)} 万</>;
      },
      state: pillClass(zero(f.pensionGap) + zero(s.pensionGap)),
    },
  ];

  // 成员档案
  function pillarMember(cls, title, role, P) {
    const items = [
      ['重疾', P.ciGap], ['医疗', P.miGap], ['寿险', P.lifeGap], ['养老', P.pensionGap],
    ].filter(([, v]) => isGap(v)).map(([t, v]) => ({ t, v }));
    const top = items.length ? items.reduce((a, b) => (b.v > a.v ? b : a)) : null;
    const ok = items.length === 0;
    const prem = zero(P.estCIPrem) + zero(P.estMIPrem) + zero(P.estLifePrem) + zero(P.recPension);
    return {
      cls, title, role,
      ok,
      gaps: ok ? [] : items.slice(0, 3).map(({ t, v }) => ({ t, v })),
      note: ok
        ? '保障覆盖较完整，按建议节奏定期复核即可。'
        : `优先补足「${top.t}」缺口，本年建议投入约 ${fmt(prem)} 万。`,
      prem: fmt(prem),
    };
  }

  const members = [
    pillarMember('c1', '第一经济支柱', '家庭收入与责任核心', f),
    pillarMember('c2', '第二经济支柱', '家庭共同防线', s),
  ];

  const child = {
    cls: 'c3', title: '子女', role: '成长中的下一代',
    ok: !isGap(r.child.ciGap),
    gaps: isGap(r.child.ciGap) ? [{ t: '重疾', v: r.child.ciGap }] : [],
    note: isGap(r.child.ciGap)
      ? `建议先补足子女重疾保额（${fmt(r.child.recCI)} 万）作为底仓。`
      : '重疾保障已到位，按年龄增长定期复核即可。',
    med: r.child.recMIType,
  };
  const parent = {
    cls: 'c4', title: '父母', role: '需温柔照护的长辈',
    ok: false,
    gaps: [],
    note: `医疗配置建议以惠民保/百万医疗等为主，关注投保年龄与体况告知。`,
    med: r.parent.recMIType,
  };
  members.push(child, parent);

  return {
    riskLevel: r.riskLevel,
    priority: r.priority,
    totalGap: r.totalGap,
    totalPrem: r.totalAnnualPrem,
    ratio: r.premiumToIncomeRatio,
    modules,
    members,
    gaps: [
      gapItem('健康险缺口', '🩺', r.totalHealthGap),
      gapItem('寿险缺口', '🛡️', r.totalLifeGap),
      gapItem('养老缺口', '🌅', r.totalPensionGap),
    ],
  };
}

export default function ResultPage() {
  const router = useRouter();
  const [view, setView] = useState(null);

  useEffect(() => {
    if (!isInFlow()) { router.replace('/'); return; }
    const form = getFormData();
    if (!form) { router.replace('/'); return; }
    setView(buildView(calculate(form)));
  }, [router]);

  // 展示口径派生（view 未就绪用占位，保证 hooks 稳定）
  const metrics = view
    ? (() => {
        const risk = riskMeta(view.riskLevel);
        const base = { 低风险: 92, 中等风险: 76, 高风险: 56 }[view.riskLevel] || 76;
        const adj = view.ratio <= 0.06 ? 6 : view.ratio <= 0.10 ? 2 : -3;
        const gapBonus = view.totalGap <= 0 ? 6 : 0;
        const score = clamp(Math.round(base + adj + gapBonus), 20, 98);
        const cover = view.totalGap <= 0 ? 100 : clamp(Math.round(score * 0.92), 25, 96);
        const maxGap = Math.max(0, ...view.gaps.map((g) => (g.covered ? 0 : g.gap)));
        return { risk, score, cover, maxGap, allCovered: view.totalGap <= 0 };
      })()
    : { risk: riskMeta('中等风险'), score: 0, cover: 0, maxGap: 0, allCovered: false };

  const { risk, maxGap, allCovered } = metrics;
  const scoreV = useTween(metrics.score);
  const coverV = useTween(metrics.cover);
  const premV = useTween(view ? zero(view.totalPrem) : 0);
  const ratioV = useTween(view ? zero(view.ratio) * 100 : 0);
  const grow = useGrow();

  if (!view) return null;

  const stateTxt = { ok: '状态良好', warn: '尚有缺口', danger: '重点补足' };

  return (
    <div className="page">
      <JourneyBar index={5} />

      <div className="report-greet">
        <span className="eyebrow">体检完成 · 报告已生成</span>
        <h2>这是您家的保障画像</h2>
        <p>我们已把缺口与建议整理成一份清晰、可执行的「家庭保障体检报告」。</p>
      </div>

      {/* ── ① Dashboard：总览 ── */}
      <div className="card">
        <div className="dash-top">
          <div className="dash-stats">
            <div className="stat">
              <div className="s-num tnum">{Math.round(scoreV)}<em>分</em></div>
              <div className="s-name">综合保障评分</div>
              <div className="s-sub">基于风险评级与预算占比</div>
            </div>
            <div className="stat">
              <div className="s-num tnum">{Math.round(coverV)}<em>%</em></div>
              <div className="s-name">当前保障覆盖</div>
              <div className="s-sub">{allCovered ? '三大保障已覆盖' : '按缺口估算'}</div>
            </div>
            <div className="stat">
              <div className="s-num tnum">{premV.toFixed(1)}<em>万/年</em></div>
              <div className="s-name">建议年保费</div>
              <div className="s-sub">约占家庭收入 {ratioV.toFixed(1)}%</div>
            </div>
          </div>

          <div className="dash-chart">
            <div className="cover-ring">
              <svg viewBox="0 0 200 200" aria-hidden="true">
                <circle cx="100" cy="100" r="84" fill="none" stroke="rgba(47,52,48,.07)" strokeWidth="15" />
                <circle cx="100" cy="100" r="84" fill="none"
                  stroke={risk.color} strokeWidth="15" strokeLinecap="round"
                  pathLength="100" strokeDasharray="100" strokeDashoffset={100 - coverV} />
              </svg>
              <div className="ring-core">
                <div className="cover-num tnum">{Math.round(coverV)}<em>%</em></div>
                <div className="cover-tag">综合覆盖率</div>
              </div>
            </div>
            <div className="chart-side">
              <div className="head">
                <b>保障缺口概览</b>
                <span className={'mod-pill ' + risk.cls}>{risk.label}</span>
              </div>
              <p className="risk-line">{riskWord(view.riskLevel, view.priority)}</p>
              {view.gaps.map((g) => (
                <div className="bar-row" key={g.name}>
                  <div className="bar-top">
                    <span className="bar-name">{g.emoji} {g.name}</span>
                    <span className="bar-val tnum">{g.covered ? '已覆盖' : fmt(g.gap) + ' 万'}</span>
                  </div>
                  <div className="bar-track">
                    <i className={g.covered ? 'done' : ''} style={{
                      width: grow ? (g.covered ? 100 : maxGap > 0 ? clamp((g.gap / maxGap) * 100, 6, 100) : 0) : 0,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ② 四宫格保障模块 ── */}
      <section className="block">
        <h3 className="block-title">四块家庭保障</h3>
        <p className="block-sub">以「建议保额 / 缺口」两项核心指标，帮您快速判断每一块是否需要出手。</p>
        <div className="mod-grid">
          {view.modules.map((m) => (
            <div className="mod-card" key={m.name}>
              <div className="mod-head">
                <div className="mod-ico">{m.ico}</div>
                <div className="mod-name">{m.name}</div>
              </div>
              <div className="mod-metric tnum">{m.metric}<small>{m.unit}</small></div>
              <div className="mod-sub">{m.sub()}</div>
              <span className={'mod-pill ' + m.state}>{stateTxt[m.state]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── ③ 成员保障档案 ── */}
      <section className="block">
        <h3 className="block-title">家庭成员保障档案</h3>
        <p className="block-sub">每个人看的重点不一样：经济支柱看重疾与寿险，孩子看成长，长辈看医疗。</p>
        <div className="archive">
          {view.members.map((mb) => (
            <div className="member-card" key={mb.title}>
              <div className="m-head">
                <div className={'m-ava ' + mb.cls}>{mb.cls === 'c1' ? '1' : mb.cls === 'c2' ? '2' : mb.cls === 'c3' ? '3' : '4'}</div>
                <div>
                  <div className="m-name">{mb.title}</div>
                  <div className="m-role">{mb.role}</div>
                </div>
              </div>
              <div className="m-gap">
                {mb.ok ? <span className="m-chip ok">✓ 保障已覆盖</span> : mb.gaps.map((g) => (
                  <span key={g.t} className={'m-chip' + (g.v > 30 ? ' danger' : '')}>「{g.t}」缺口 {fmt(g.v)} 万</span>
                ))}
              </div>
              {mb.med && <span className="m-chip" style={{ alignSelf: 'flex-start' }}>医疗建议 · {mb.med}</span>}
              <p className="m-note">{mb.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ④ 温暖总结 ── */}
      <div className="card final-note">
        <div className="q">🕊️</div>
        <p>{riskWord(view.riskLevel, view.priority)}</p>
        <p className="s">本报告为区间中值估算，仅作决策参考。综合评分与覆盖率为展示口径，具体投保请以持牌保险经纪人或核保人员方案为准。</p>
      </div>

      <div className="footer">
        <button className="btn" onClick={() => router.back()}>返回修改</button>
        <button className="btn-primary" onClick={() => { resetFormData(); router.push('/'); }}>重新评估</button>
      </div>
    </div>
  );
}
