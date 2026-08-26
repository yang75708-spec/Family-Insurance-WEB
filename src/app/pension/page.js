'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OPTIONS } from '@/lib/options';
import { getFormData, saveFormData, isInFlow } from '@/lib/store';
import { Picker } from '@/components/fields';

const PILLAR_FIELDS = [
  { key: 'retireAge', label: '预计退休年龄', options: OPTIONS.retireAge },
  { key: 'retireYears', label: '退休后领取年限', options: OPTIONS.retireYears },
  { key: 'retireGoal', label: '退休生活目标（每年）', options: OPTIONS.retireGoal },
  { key: 'pensionFund', label: '现有养老储备（存款类）', options: OPTIONS.pensionFund },
  { key: 'comPension', label: '现有商业养老年金', options: OPTIONS.pensionFund },
  { key: 'personalPension', label: '现有个人养老账户', options: OPTIONS.pensionFund },
  { key: 'socialPension', label: '预计社保月领养老金', options: OPTIONS.socialPension },
  { key: 'payYears', label: '计划缴费年限', options: OPTIONS.payYears },
  { key: 'pensionBudget', label: '养老年缴预算', options: OPTIONS.pensionBudget },
];

function fieldName(prefix, key) {
  return prefix + key[0].toUpperCase() + key.slice(1);
}

export default function PensionPage() {
  const router = useRouter();
  const [form, setForm] = useState(() => ({ ...getFormData() }));

  useEffect(() => {
    if (!isInFlow()) router.replace('/');
  }, [router]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  function card(prefix, title) {
    return (
      <div className="card">
        <div className="card-title">{title}</div>
        {PILLAR_FIELDS.map((f) => (
          <Picker
            key={f.key}
            label={f.label}
            options={f.options}
            value={form[fieldName(prefix, f.key)]}
            onChange={(v) => set(fieldName(prefix, f.key), v)}
          />
        ))}
      </div>
    );
  }

  function next() {
    saveFormData({ ...form });
    router.push('/result');
  }

  return (
    <div className="page">
      <div className="tip" style={{ marginBottom: '16px' }}>第 4 / 4 步：填写养老目标与已有储备，工具将测算退休前每年还需投入多少（按 58.3% 替代率上限修正目标）。</div>
      {card('firstPerson', '第一经济支柱 · 养老')}
      {card('secondPerson', '第二经济支柱 · 养老')}
      <div className="footer">
        <button className="btn" onClick={() => router.back()}>上一步</button>
        <button className="btn-primary" onClick={next}>生成保险方案</button>
      </div>
    </div>
  );
}
