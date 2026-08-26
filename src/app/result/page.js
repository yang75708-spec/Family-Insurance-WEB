'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculate } from '@/lib/calculator';
import { getFormData, resetFormData } from '@/lib/store';

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

function buildView(r) {
  const riskClass = r.riskLevel === '低风险' ? 'ok' : r.riskLevel === '中等风险' ? 'warn' : 'danger';

  const f = r.firstPerson;
  const s = r.secondPerson;

  const first = {
    health: [
      row('建议重疾保额', fmt(f.recCI) + ' 万'),
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
      row('建议寿险保额', fmt(f.recLife) + ' 万'),
      row('已有寿险', fmt(f.existingLife) + ' 万'),
      row('寿险缺口', fmt(f.lifeGap) + ' 万'),
      row('年保费', fmt(f.estLifePrem) + ' 万'),
      row('期限建议', f.lifeTerm),
      row('预算检验', f.lifeBudget, budgetCls(f.lifeBudget)),
    ],
    pension: [
      row('退休年目标', fmt(f.annualRetireGoal) + ' 万'),
      row('退休需求现值', fmt(f.pensionGap + f.existingPensionFV) + ' 万'),
      row('已有储备终值', fmt(f.existingPensionFV) + ' 万'),
      row('养老缺口', fmt(f.pensionGap) + ' 万'),
      row('每年建议投入', fmt(f.recPension) + ' 万'),
      row('缴费年限', f.payYears + ' 年'),
      row('预算检验', f.pensionBudget, budgetCls(f.pensionBudget)),
    ],
  };

  const second = {
    health: [
      row('建议重疾保额', fmt(s.recCI) + ' 万'),
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
      row('建议寿险保额', fmt(s.recLife) + ' 万'),
      row('已有寿险', fmt(s.existingLife) + ' 万'),
      row('寿险缺口', fmt(s.lifeGap) + ' 万'),
      row('年保费', fmt(s.estLifePrem) + ' 万'),
      row('期限建议', s.lifeTerm),
      row('预算检验', s.lifeBudget, budgetCls(s.lifeBudget)),
    ],
    pension: [
      row('退休年目标', fmt(s.annualRetireGoal) + ' 万'),
      row('退休需求现值', fmt(s.pensionGap + s.existingPensionFV) + ' 万'),
      row('已有储备终值', fmt(s.existingPensionFV) + ' 万'),
      row('养老缺口', fmt(s.pensionGap) + ' 万'),
      row('每年建议投入', fmt(s.recPension) + ' 万'),
      row('缴费年限', s.payYears + ' 年'),
      row('预算检验', s.pensionBudget, budgetCls(s.pensionBudget)),
    ],
  };

  const child = {
    rows: [
      row('建议重疾保额', fmt(r.child.recCI) + ' 万'),
      row('重疾缺口', fmt(r.child.ciGap) + ' 万'),
      row('医疗险建议', r.child.recMIType),
      row('说明', r.child.miReason),
      row('寿险', fmt(r.child.recLife) + ' 万'),
      row('结论', r.child.lifeConclusion),
    ],
  };

  const parent = {
    rows: [
      row('医疗险建议', r.parent.recMIType),
      row('说明', r.parent.miReason),
      row('结论', r.parent.lifeConclusion),
    ],
  };

  const summary = {
    riskLevel: r.riskLevel,
    riskClass,
    priority: r.priority,
    totalGap: fmt(r.totalGap) + ' 万',
    totalHealthGap: fmt(r.totalHealthGap) + ' 万',
    totalLifeGap: fmt(r.totalLifeGap) + ' 万',
    totalPensionGap: fmt(r.totalPensionGap) + ' 万',
    totalAnnualPrem: fmt(r.totalAnnualPrem) + ' 万',
    ratio: fmtPct(r.premiumToIncomeRatio),
    alpha: r.alpha,
    liquidAsset: fmt(r.liquidAsset) + ' 万',
    alphaDeduct: fmt(r.liquidAsset * r.alpha) + ' 万',
    ciPayPeriod: r.ciPayPeriod,
  };

  return { summary, first, second, child, parent };
}

export default function ResultPage() {
  const router = useRouter();
  const [view] = useState(() => {
    const form = getFormData();
    if (!form) return null;
    return buildView(calculate(form));
  });

  if (!view) {
    router.replace('/');
    return null;
  }

  const renderSection = (title, section) => (
    <div className="card">
      <div className="card-title">{title}</div>
      {section.health.length > 0 && <div className="sec-title">健康险</div>}
      {section.health.map((r) => (
        <div key={'h' + r.label} className="row"><div className="label">{r.label}</div><div className={'value ' + r.cls}>{r.value}</div></div>
      ))}
      {section.life.length > 0 && <div className="sec-title">寿险</div>}
      {section.life.map((r) => (
        <div key={'l' + r.label} className="row"><div className="label">{r.label}</div><div className={'value ' + r.cls}>{r.value}</div></div>
      ))}
      {section.pension.length > 0 && <div className="sec-title">养老</div>}
      {section.pension.map((r) => (
        <div key={'p' + r.label} className="row"><div className="label">{r.label}</div><div className={'value ' + r.cls}>{r.value}</div></div>
      ))}
    </div>
  );

  return (
    <div className="page">
      <div className="card summary-card">
        <div className="summary-head">
          <div className={'summary-risk ' + view.summary.riskClass}>{view.summary.riskLevel}</div>
          <div className="summary-priority">优先建议：{view.summary.priority}</div>
        </div>
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-num">{view.summary.totalGap}</div>
            <div className="summary-label">总保障缺口</div>
          </div>
          <div className="summary-item">
            <div className="summary-num">{view.summary.totalAnnualPrem}</div>
            <div className="summary-label">建议年总保费</div>
          </div>
          <div className="summary-item">
            <div className="summary-num">{view.summary.ratio}</div>
            <div className="summary-label">占家庭收入</div>
          </div>
        </div>
        <div className="summary-breakdown">
          <div className="b-row"><div>健康险缺口</div><div>{view.summary.totalHealthGap}</div></div>
          <div className="b-row"><div>寿险缺口</div><div>{view.summary.totalLifeGap}</div></div>
          <div className="b-row"><div>养老缺口</div><div>{view.summary.totalPensionGap}</div></div>
          <div className="b-row"><div>流动资产 × {view.summary.alpha}（家庭系数）</div><div>- {view.summary.alphaDeduct}</div></div>
          <div className="b-row muted"><div>流动资产合计</div><div>{view.summary.liquidAsset}</div></div>
          <div className="b-row muted"><div>重疾险缴费方式</div><div>{view.summary.ciPayPeriod}</div></div>
        </div>
      </div>

      {renderSection('第一经济支柱', view.first)}
      {renderSection('第二经济支柱', view.second)}

      <div className="card">
        <div className="card-title">子女</div>
        {view.child.rows.map((r) => (
          <div key={r.label} className="row"><div className="label">{r.label}</div><div className={'value ' + r.cls}>{r.value}</div></div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">父母</div>
        {view.parent.rows.map((r) => (
          <div key={r.label} className="row"><div className="label">{r.label}</div><div className={'value ' + r.cls}>{r.value}</div></div>
        ))}
      </div>

      <div className="tip">本报告基于您填写的区间中值估算，仅为决策参考，请以实际投保方案为准。</div>

      <div className="footer">
        <button className="btn" onClick={() => router.back()}>上一步</button>
        <button className="btn-primary" onClick={() => { resetFormData(); router.push('/'); }}>重新评估</button>
      </div>
    </div>
  );
}
