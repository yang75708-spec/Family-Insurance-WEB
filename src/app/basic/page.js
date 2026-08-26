'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OPTIONS } from '@/lib/options';
import { getFormData, saveFormData } from '@/lib/store';
import { Picker, NumInput } from '@/components/fields';

const PICKERS = {
  city: OPTIONS.city,
  firstPersonGender: OPTIONS.gender,
  secondPersonGender: OPTIONS.gender,
  firstPersonIncome: OPTIONS.firstPersonIncome,
  secondPersonIncome: OPTIONS.secondPersonIncome,
  incomeStability: OPTIONS.incomeStability,
  incomeStability2: OPTIONS.incomeStability2,
  mortgageBalance: OPTIONS.mortgageBalance,
  otherLoanAmount: OPTIONS.otherLoanAmount,
  bankDeposit: OPTIONS.bankDeposit,
  lowRiskInvestment: OPTIONS.lowRiskInvestment,
  annualExpense: OPTIONS.annualExpense,
};

const NUM_FIELDS = ['firstPersonAge', 'secondPersonAge', 'childAge', 'childCount', 'parentSupportCount'];

export default function BasicPage() {
  const router = useRouter();
  const [form, setForm] = useState(() => ({ ...getFormData() }));
  const [error, setError] = useState('');

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  function next() {
    const f = { ...form };
    NUM_FIELDS.forEach((k) => { f[k] = Number(f[k]) || 0; });
    if (f.firstPersonAge < 18 || f.firstPersonAge > 70) {
      setError('第一支柱年龄需在 18-70 岁');
      return;
    }
    if (f.secondPersonAge && (f.secondPersonAge < 18 || f.secondPersonAge > 70)) {
      setError('第二支柱年龄需在 18-70 岁');
      return;
    }
    saveFormData(f);
    router.push('/health');
  }

  return (
    <div className="page">
      <div className="tip" style={{ marginBottom: '16px' }}>第 1 / 4 步：先填写家庭结构与财务底数，后续步骤将据此测算保障缺口。</div>

      <div className="card">
        <div className="card-title">家庭成员</div>
        <NumInput label="第一支柱年龄" value={form.firstPersonAge} onChange={(v) => set('firstPersonAge', v)} placeholder="岁" />
        <Picker label="第一支柱性别" options={PICKERS.firstPersonGender} value={form.firstPersonGender} onChange={(v) => set('firstPersonGender', v)} />
        <NumInput label="第二支柱年龄" value={form.secondPersonAge} onChange={(v) => set('secondPersonAge', v)} placeholder="岁" />
        <Picker label="第二支柱性别" options={PICKERS.secondPersonGender} value={form.secondPersonGender} onChange={(v) => set('secondPersonGender', v)} />
        <NumInput label="子女年龄" value={form.childAge} onChange={(v) => set('childAge', v)} placeholder="岁（无子女填0）" />
        <NumInput label="子女数量" value={form.childCount} onChange={(v) => set('childCount', v)} placeholder="个" />
        <NumInput label="赡养老人数量" value={form.parentSupportCount} onChange={(v) => set('parentSupportCount', v)} placeholder="位" />
        <Picker label="所在城市" options={PICKERS.city} value={form.city} onChange={(v) => set('city', v)} />
      </div>

      <div className="card">
        <div className="card-title">收入与职业稳定性</div>
        <Picker label="第一支柱年收入" options={PICKERS.firstPersonIncome} value={form.firstPersonIncome} onChange={(v) => set('firstPersonIncome', v)} />
        <Picker label="第一支柱职业稳定性" options={PICKERS.incomeStability} value={form.incomeStability} onChange={(v) => set('incomeStability', v)} />
        <Picker label="第二支柱年收入" options={PICKERS.secondPersonIncome} value={form.secondPersonIncome} onChange={(v) => set('secondPersonIncome', v)} />
        <Picker label="第二支柱职业稳定性" options={PICKERS.incomeStability2} value={form.incomeStability2} onChange={(v) => set('incomeStability2', v)} />
      </div>

      <div className="card">
        <div className="card-title">资产负债与开支</div>
        <Picker label="房贷余额" options={PICKERS.mortgageBalance} value={form.mortgageBalance} onChange={(v) => set('mortgageBalance', v)} />
        <Picker label="其他贷款" options={PICKERS.otherLoanAmount} value={form.otherLoanAmount} onChange={(v) => set('otherLoanAmount', v)} />
        <Picker label="银行存款" options={PICKERS.bankDeposit} value={form.bankDeposit} onChange={(v) => set('bankDeposit', v)} />
        <Picker label="低风险理财" options={PICKERS.lowRiskInvestment} value={form.lowRiskInvestment} onChange={(v) => set('lowRiskInvestment', v)} />
        <Picker label="家庭年生活支出" options={PICKERS.annualExpense} value={form.annualExpense} onChange={(v) => set('annualExpense', v)} />
      </div>

      {error && <div className="tip" style={{ color: '#c62828', background: '#fdecea' }}>{error}</div>}

      <div className="footer">
        <button className="btn" onClick={() => router.back()}>上一步</button>
        <button className="btn-primary" onClick={next}>下一步：健康险配置</button>
      </div>
    </div>
  );
}
