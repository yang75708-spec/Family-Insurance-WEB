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

/* ---------- 明细辅助 ---------- */
function budgetState(txt) { return txt && txt.indexOf('✅') > -1 ? 'ok' : 'warn'; }
function budgetText(txt) { return (txt || '').replace('✅', '').replace('⚠️', '').trim(); }
// 已有保障：缺口>0 时用「建议保额 − 缺口」倒推；缺口为 0 表示已覆盖
function coverVal(rec, gap) { return isGap(gap) ? fmt(Math.max(0, zero(rec) - zero(gap))) : '已覆盖'; }
function coverUnit(gap) { return isGap(gap) ? '万' : ''; }

function KV({ label, value, unit, hl }) {
  return (
    <div className={'kv' + (hl ? ' hl' : '')}>
      <div className="kv-label">{label}</div>
      <div className="kv-num tnum">{value}<em>{unit}</em></div>
    </div>
  );
}

function Dsec({ title, pill, children }) {
  return (
    <div className="dsec">
      <div className="dsec-head">
        <div className="dsec-title">{title}</div>
        {pill}
      </div>
      {children}
    </div>
  );
}

function BudgetPill({ txt }) {
  return <span className={'budget-pill ' + budgetState(txt)}>预算检验 · {budgetText(txt)}</span>;
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

/* ---------- 成员明细卡 ---------- */
function MemberHead({ cls, num, title, role }) {
  return (
    <div className="mini-head">
      <div className={'m-ava ' + cls}>{num}</div>
      <div>
        <div className="m-name">{title}</div>
        <div className="m-role">{role}</div>
      </div>
    </div>
  );
}

function PillarCard({ cls, num, title, role, P }) {
  return (
    <div className="detail">
      <MemberHead cls={cls} num={num} title={title} role={role} />

      <Dsec title="健康险" pill={<BudgetPill txt={P.healthBudget} />}>
        <div className="dsec-label">重疾险</div>
        <div className="kv-grid">
          <KV label="建议保额" value={fmt(P.recCI)} unit="万" />
          <KV label="已有保障" value={coverVal(P.recCI, P.ciGap)} unit={coverUnit(P.ciGap)} />
          <KV label="目前缺口" value={fmt(P.ciGap)} unit="万" hl />
          <KV label="年保费" value={fmt(P.estCIPrem)} unit="万" />
        </div>
        <div className="dsec-label">医疗险</div>
        <div className="kv-grid">
          <KV label="期望花销" value={fmt(P.recMI)} unit="万" />
          <KV label="已有保障" value={coverVal(P.recMI, P.miGap)} unit={coverUnit(P.miGap)} />
          <KV label="目前缺口" value={fmt(P.miGap)} unit="万" hl />
          <KV label="年保费" value={fmt(P.estMIPrem)} unit="万" />
        </div>
        <div className="detail-foot">
          <div className="foot-line"><span>推荐医疗方案</span><b>{P.recMIType}</b></div>
          <p className="foot-note">{P.miReason}</p>
          <div className="foot-sum">
            健康险合计缺口 <b>{fmt(P.totalHealthGap)} 万</b> · 建议年保费 <b>{fmt(P.totalHealthPrem)} 万</b>
          </div>
        </div>
      </Dsec>

      <Dsec title="寿险" pill={<BudgetPill txt={P.lifeBudget} />}>
        <div className="kv-grid">
          <KV label="建议保额" value={fmt(P.recLife)} unit="万" />
          <KV label="已有保障" value={fmt(P.existingLife)} unit="万" />
          <KV label="目前缺口" value={fmt(P.lifeGap)} unit="万" hl />
          <KV label="年保费" value={fmt(P.estLifePrem)} unit="万" />
        </div>
        <div className="detail-foot">
          <div className="foot-line"><span>保障期限建议</span><b>{P.lifeTerm}</b></div>
        </div>
      </Dsec>

      <Dsec title="养老金" pill={<BudgetPill txt={P.pensionBudget} />}>
        <div className="kv-grid">
          <KV label="退休年目标" value={fmt(P.annualRetireGoal)} unit="万/年" />
          <KV label="已有储备终值" value={fmt(P.existingPensionFV)} unit="万" />
          <KV label="养老缺口" value={fmt(P.pensionGap)} unit="万" hl />
          <KV label="年缴建议" value={fmt(P.recPension)} unit="万/年" />
        </div>
        <div className="detail-foot">
          <div className="foot-line"><span>建议缴费年限</span><b>{P.payYears} 年</b></div>
        </div>
      </Dsec>
    </div>
  );
}

function ChildCard({ child }) {
  return (
    <div className="detail">
      <MemberHead cls="c3" num="3" title="子女" role="成长中的下一代" />

      <Dsec title="健康险">
        <div className="kv-grid">
          <KV label="重疾建议保额" value={fmt(child.recCI)} unit="万" />
          <KV label="已有重疾保障" value={fmt(child.existingCI)} unit="万" />
          <KV label="重疾缺口" value={fmt(child.ciGap)} unit="万" hl />
        </div>
        <div className="detail-foot">
          <div className="foot-line"><span>推荐医疗方案</span><b>{child.recMIType}</b></div>
          <p className="foot-note">{child.miReason}</p>
        </div>
      </Dsec>

      <Dsec title="寿险">
        <p className="dsec-text">{child.lifeConclusion}</p>
      </Dsec>
    </div>
  );
}

function ParentCard({ parent }) {
  return (
    <div className="detail">
      <MemberHead cls="c4" num="4" title="父母" role="需温柔照护的长辈" />

      <Dsec title="健康险">
        <div className="kv-grid">
          <KV label="已有重疾保障" value={fmt(parent.existingCI)} unit="万" />
        </div>
        <div className="detail-foot">
          <div className="foot-line"><span>推荐医疗方案</span><b>{parent.recMIType}</b></div>
          <p className="foot-note">{parent.miReason}</p>
        </div>
      </Dsec>

      <Dsec title="寿险">
        <p className="dsec-text">{parent.lifeConclusion}</p>
      </Dsec>
    </div>
  );
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

  return {
    riskLevel: r.riskLevel,
    priority: r.priority,
    totalGap: r.totalGap,
    totalPrem: r.totalAnnualPrem,
    ratio: r.premiumToIncomeRatio,
    modules,
    p1: f,
    p2: s,
    child: r.child,
    parent: r.parent,
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

      {/* ── ③ 家庭成员保障明细（每人一张卡） ── */}
      <section className="block">
        <h3 className="block-title">家庭成员保障明细</h3>
        <p className="block-sub">按成员分别呈现：每个人的重疾、医疗、寿险与养老缺口，以及对应的已有保障、年保费与预算检验。</p>
        <PillarCard cls="c1" num="1" title="第一经济支柱" role="家庭收入与责任核心" P={view.p1} />
        <PillarCard cls="c2" num="2" title="第二经济支柱" role="家庭共同防线" P={view.p2} />
        <ChildCard child={view.child} />
        <ParentCard parent={view.parent} />
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
