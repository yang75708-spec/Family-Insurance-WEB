'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculate } from '@/lib/calculator';
import { getFormData, resetFormData, isInFlow } from '@/lib/store';
import JourneyBar from '@/components/JourneyBar';

/* ---------- 纯展示辅助：不参与任何算法，仅用于把数字讲清楚 ---------- */
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const v = Math.round(n * 100) / 100;
  return String(v);
}

function fmtPct(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Math.round(n * 1000) / 10 + '%';
}

function row(label, value, cls) {
  return { label, value: String(value), cls: cls || '' };
}

function budgetCls(str) {
  return str.indexOf('✅') === 0 ? 'ok' : str.indexOf('⚠️') === 0 ? 'danger' : '';
}

function riskMeta(level) {
  const map = {
    低风险: { cls: 'ok', label: '低风险', color: '#8FAF9A' },
    中等风险: { cls: 'warn', label: '中等风险', color: '#D8BE8F' },
    高风险: { cls: 'danger', label: '高风险', color: '#C0604F' },
  };
  return map[level] || map.中等风险;
}

function riskWord(level, priority) {
  if (level === '低风险')
    return '您家的保障基础已经比较扎实，预算也处在健康区间。接下来只需按建议定期复核，让这份安全感一直陪伴家人。';
  if (level === '高风险')
    return '目前保障仍有较明显的缺口。别担心，规划是一步步来的——建议从健康保障开始优先补齐，给家人更多从容。';
  return `家庭保障已初步覆盖，但仍有部分缺口值得补足。建议${priority ? '优先关注「' + priority + '」' : '优先从健康保障开始'}，逐步加固。`;
}

/* rAF 缓动数值（仅表现层） */
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

/* 卡片内缺口条入场 */
function useGrow(delay = 140) {
  const [g, setG] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setG(true), delay);
    return () => clearTimeout(id);
  }, [delay]);
  return g;
}

function useCount(to) { return useTween(to, 1200); }

/* ---------- 视图组装 ---------- */
function buildView(r) {
  const f = r.firstPerson;
  const s = r.secondPerson;

  const first = {
    health: [
      row('建议重疾保额', fmt(f.recCI) + ' 万', 'big'),
      row('重疾缺口', fmt(f.ciGap) + ' 万'),
      row('期望医疗年花销', fmt(f.recMI) + ' 万'),
      row('医疗缺口', fmt(f.miGap) + ' 万'),
      row('健康险合计缺口', fmt(f.totalHealthGap) + ' 万'),
      row('重疾险年保费', fmt(f.estCIPrem) + ' 万'),
      row('医疗险年保费', fmt(f.estMIPrem) + ' 万'),
      row('年保费合计', fmt(f.totalHealthPrem) + ' 万'),
      row('预算检验', f.healthBudget, budgetCls(f.healthBudget)),
    ],
    life: [
      row('建议寿险保额', fmt(f.recLife) + ' 万', 'big'),
      row('已有寿险', fmt(f.existingLife) + ' 万'),
      row('寿险缺口', fmt(f.lifeGap) + ' 万'),
      row('年保费', fmt(f.estLifePrem) + ' 万'),
      row('期限建议', f.lifeTerm),
      row('预算检验', f.lifeBudget, budgetCls(f.lifeBudget)),
    ],
    pension: [
      row('每年建议投入', fmt(f.recPension) + ' 万', 'big'),
      row('退休年目标', fmt(f.annualRetireGoal) + ' 万'),
      row('已有储备终值', fmt(f.existingPensionFV) + ' 万'),
      row('养老缺口', fmt(f.pensionGap) + ' 万'),
      row('缴费年限', f.payYears + ' 年'),
      row('预算检验', f.pensionBudget, budgetCls(f.pensionBudget)),
    ],
  };

  const second = {
    health: [
      row('建议重疾保额', fmt(s.recCI) + ' 万', 'big'),
      row('重疾缺口', fmt(s.ciGap) + ' 万'),
      row('期望医疗年花销', fmt(s.recMI) + ' 万'),
      row('医疗缺口', fmt(s.miGap) + ' 万'),
      row('健康险合计缺口', fmt(s.totalHealthGap) + ' 万'),
      row('重疾险年保费', fmt(s.estCIPrem) + ' 万'),
      row('医疗险年保费', fmt(s.estMIPrem) + ' 万'),
      row('年保费合计', fmt(s.totalHealthPrem) + ' 万'),
      row('预算检验', s.healthBudget, budgetCls(s.healthBudget)),
    ],
    life: [
      row('建议寿险保额', fmt(s.recLife) + ' 万', 'big'),
      row('已有寿险', fmt(s.existingLife) + ' 万'),
      row('寿险缺口', fmt(s.lifeGap) + ' 万'),
      row('年保费', fmt(s.estLifePrem) + ' 万'),
      row('期限建议', s.lifeTerm),
      row('预算检验', s.lifeBudget, budgetCls(s.lifeBudget)),
    ],
    pension: [
      row('每年建议投入', fmt(s.recPension) + ' 万', 'big'),
      row('退休年目标', fmt(s.annualRetireGoal) + ' 万'),
      row('已有储备终值', fmt(s.existingPensionFV) + ' 万'),
      row('养老缺口', fmt(s.pensionGap) + ' 万'),
      row('缴费年限', s.payYears + ' 年'),
      row('预算检验', s.pensionBudget, budgetCls(s.pensionBudget)),
    ],
  };

  const child = {
    rows: [
      row('建议重疾保额', fmt(r.child.recCI) + ' 万', 'big'),
      row('重疾缺口', fmt(r.child.ciGap) + ' 万'),
      row('医疗险建议', r.child.recMIType),
      row('说明', r.child.miReason, 'muted'),
      row('寿险', fmt(r.child.recLife) + ' 万'),
      row('结论', r.child.lifeConclusion),
    ],
  };

  const parent = {
    rows: [
      row('医疗险建议', r.parent.recMIType, 'big'),
      row('说明', r.parent.miReason, 'muted'),
      row('结论', r.parent.lifeConclusion),
    ],
  };

  const covered = (x) => !(x > 0);

  return {
    riskLevel: r.riskLevel,
    priority: r.priority,
    // 原始数值（直接来自 calculator，仅用于展示与动效）
    gaps: [
      { name: '健康险缺口', emoji: '🩺', gap: r.totalHealthGap, covered: covered(r.totalHealthGap) },
      { name: '寿险缺口', emoji: '🛡️', gap: r.totalLifeGap, covered: covered(r.totalLifeGap) },
      { name: '养老缺口', emoji: '🌅', gap: r.totalPensionGap, covered: covered(r.totalPensionGap) },
    ],
    totalGap: r.totalGap,
    totalPrem: r.totalAnnualPrem,
    ratio: r.premiumToIncomeRatio,
    alpha: r.alpha,
    first, second, child, parent,
  };
}

export default function ResultPage() {
  const router = useRouter();
  const [view, setView] = useState(null);

  useEffect(() => {
    if (!isInFlow()) {
      router.replace('/');
      return;
    }
    const form = getFormData();
    if (!form) {
      router.replace('/');
      return;
    }
    setView(buildView(calculate(form)));
  }, [router]);

  // 展示口径派生（view 未就绪时用占位，保证 hooks 每次渲染都稳定调用）
  const metrics = view
    ? (() => {
        const risk = riskMeta(view.riskLevel);
        // 安全指数 = 风险评级基分 + 预算占收入修正 + 缺口清零加成（纯展示，不改算法）
        const base = { '低风险': 88, '中等风险': 72, '高风险': 54 }[view.riskLevel] || 72;
        const adj = view.ratio <= 0.06 ? 6 : view.ratio <= 0.10 ? 2 : -4;
        const gapBonus = view.totalGap <= 0 ? 6 : 0;
        const score = clamp(Math.round(base + adj + gapBonus), 20, 98);
        const maxGap = Math.max(0, ...view.gaps.map((g) => (g.covered ? 0 : g.gap)));
        // 视觉尺度：约 12.5% = 满格
        const ratioPct = clamp(view.ratio * 100 * 8, 2, 100);
        return { risk, score, maxGap, ratioPct, allCovered: view.totalGap <= 0 };
      })()
    : { risk: riskMeta('中等风险'), score: 0, maxGap: 0, ratioPct: 2, allCovered: false };

  const { risk, maxGap, ratioPct, allCovered } = metrics;

  const scoreV = useTween(metrics.score);
  const premV = useCount(view ? view.totalPrem : 0);
  const ratioV = useCount(view ? view.ratio * 100 : 0);
  const grow = useGrow();

  if (!view) return null;

  const renderCat = (rows) =>
    rows.map((x) => {
      if (x.label === '预算检验') {
        return (
          <div key={'b' + x.label + x.value} className="rep-row">
            <span className="rl">预算检验</span>
            <span className={'rv rep-chip ' + x.cls}>{x.value.replace('✅ ', '').replace('⚠️ ', '')}</span>
          </div>
        );
      }
      return (
        <div key={x.label} className="rep-row">
          <span className="rl">{x.label}</span>
          <span className={'rv' + (x.cls === 'big' ? ' big' : x.cls === 'muted' ? ' muted' : '')}>{x.value}</span>
        </div>
      );
    });

  const renderMember = (num, title, member, note) => {
    const cats = [
      ['健康险', member.health],
      ['寿险', member.life],
      ['养老', member.pension],
    ].filter(([, rows]) => rows && rows.length);
    return (
      <div className="card">
        <div className="rep-title"><span className="mini">{num}</span>{title}</div>
        {cats.map(([cat, rows]) => (
          <div key={cat}>
            <div className="rep-cat">{cat}</div>
            {renderCat(rows)}
          </div>
        ))}
        {note}
      </div>
    );
  };

  return (
    <div className="page">
      <JourneyBar index={5} />

      <div className="report-greet">
        <span className="eyebrow">✨ 测算完成</span>
        <h2>您家的保障画像已生成</h2>
        <p>以下结论基于您填写的信息估算，我们已把「缺口」与「建议」整理成一份可读的报告。</p>
      </div>

      {/* 1 · 家庭安全指数 */}
      <div className="card safety-card">
        <div className="safety-ring">
          <svg width="190" height="190" viewBox="0 0 190 190">
            <circle cx="95" cy="95" r="82" fill="none" stroke="rgba(232,216,176,.4)" strokeWidth="14" />
            <circle
              cx="95" cy="95" r="82" fill="none"
              stroke={risk.color} strokeWidth="14" strokeLinecap="round"
              pathLength="100" strokeDasharray="100"
              strokeDashoffset={100 - scoreV}
            />
          </svg>
          <div className="ring-core">
            <div className="ring-num">{Math.round(scoreV)}<em>分</em></div>
            <div className="ring-tag">家庭安全指数</div>
          </div>
        </div>
        <div className="safety-side">
          <span className={'safe-pill ' + risk.cls}>
            {risk.label} {allCovered ? '· 三大保障已覆盖' : ''}
          </span>
          <p className="s-name">给家稳稳的托底</p>
          <p className="s-desc">{riskWord(view.riskLevel, view.priority)}</p>
        </div>
      </div>

      {/* 2 · 风险缺口分析 */}
      <div className="card">
        <div className="card-title">风险缺口分析</div>
        <div className="card-sub">缺口 = 需要的保障 − 已有的保障，数值越大说明越值得优先补足。</div>
        <div className="gap-block">
          {view.gaps.map((g) => (
            <div className="gap-row" key={g.name}>
              <div className="gap-top">
                <span className="gap-name">{g.emoji} {g.name}</span>
                <span className="gap-val">
                  {g.covered ? '已覆盖 ✓' : (g.gap < 100 ? fmt(g.gap) : '100+')}
                  {!g.covered && <small>万</small>}
                </span>
              </div>
              <div className="gap-bar">
                <i style={{
                  width: grow ? (g.covered ? 100 : maxGap > 0 ? clamp(g.gap / maxGap * 100, 6, 100) : 0) : 0,
                  background: g.covered ? 'linear-gradient(90deg,#A9C4B0,#8FAF9A)' : undefined,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 · 分成员保障建议 */}
      {renderMember('①', '第一经济支柱 · 保障清单', view.first)}
      {renderMember('②', '第二经济支柱 · 保障清单', view.second)}

      <div className="card">
        <div className="rep-title"><span className="mini">👶</span>子女</div>
        {renderCat(view.child.rows)}
      </div>
      <div className="card">
        <div className="rep-title"><span className="mini">👴</span>父母</div>
        {renderCat(view.parent.rows)}
      </div>

      {/* 4 · 预算合理性 */}
      <div className="card">
        <div className="card-title">预算合理性</div>
        <div className="ratio-wrap">
          <div className="ratio-top">
            <span>建议年总保费</span>
            <b>{premV < 1 && view.totalPrem > 0 ? premV.toFixed(1) : Math.round(premV)} 万</b>
          </div>
          <div className="ratio-top">
            <span>占家庭年收入</span>
            <span>{ratioV.toFixed(1)}%</span>
          </div>
          <div className="ratio-bar"><i style={{ width: grow ? ratioPct + '%' : '0%' }} /></div>
          <div className="tip" style={{ marginTop: '14px' }}>
            {view.ratio <= 0.06
              ? '保费占收入比例健康，处于常见参考区间内，不会给家庭现金流带来明显压力。'
              : view.ratio <= 0.10
                ? '保费占比尚可，建议按上面给出的建议金额执行，避免挤占日常支出。'
                : '保费占比偏高，可在每类险种的预算上限内适当调整，不必一次配满。'}
          </div>
        </div>
      </div>

      {/* 5 · 温暖总结 */}
      <div className="card final-note">
        <div className="q">🕊️</div>
        <p>{riskWord(view.riskLevel, view.priority)}</p>
        <p className="s">本报告为区间中值估算，仅作决策参考，具体投保请以持牌保险经纪人或核保人员方案为准。</p>
      </div>

      <div className="footer">
        <button className="btn" onClick={() => router.back()}>返回修改</button>
        <button className="btn-primary" onClick={() => { resetFormData(); router.push('/'); }}>重新评估</button>
      </div>
    </div>
  );
}
