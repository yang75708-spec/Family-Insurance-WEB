'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OPTIONS } from '@/lib/options';
import { getFormData, saveFormData, isInFlow } from '@/lib/store';
import { Picker, NumInput, Switch } from '@/components/fields';

export default function LifePage() {
  const router = useRouter();
  const [form, setForm] = useState(() => ({ ...getFormData() }));

  useEffect(() => {
    if (!isInFlow()) router.replace('/');
  }, [router]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  function pillarBlock(formKey) {
    return (
      <>
        <Switch label="已配置寿险" checked={form[formKey + 'HasLifeIns']} onChange={(v) => set(formKey + 'HasLifeIns', v)} />
        {form[formKey + 'HasLifeIns'] && (
          <>
            <Picker label="已有寿险保额" options={OPTIONS.lifeCoverage} value={form[formKey + 'LifeCoverage']} onChange={(v) => set(formKey + 'LifeCoverage', v)} />
            <Picker label="已缴费年限" options={OPTIONS.existingLifeYears} value={form[formKey + 'ExistingLifeYears']} onChange={(v) => set(formKey + 'ExistingLifeYears', v)} />
          </>
        )}
        <Picker label="保障期限偏好" options={OPTIONS.lifeTerm} value={form[formKey + 'LifeTerm']} onChange={(v) => set(formKey + 'LifeTerm', v)} />
        <NumInput label="寿险年保费预算（万）" value={form[formKey + 'LifeBudget']} onChange={(v) => set(formKey + 'LifeBudget', v)} placeholder="如 1" />
      </>
    );
  }

  function next() {
    const f = { ...form };
    f.firstPersonLifeBudget = Number(f.firstPersonLifeBudget) || 0;
    f.secondPersonLifeBudget = Number(f.secondPersonLifeBudget) || 0;
    saveFormData(f);
    router.push('/pension');
  }

  return (
    <div className="page">
      <div className="tip" style={{ marginBottom: '16px' }}>第 3 / 4 步：寿险保额按「支出缺口」与「收入损失」两种算法取较大值。若已配置寿险，请填写已有保额与缴费年限。</div>

      <div className="card">
        <div className="card-title">第一经济支柱 · 寿险</div>
        {pillarBlock('firstPerson')}
      </div>

      <div className="card">
        <div className="card-title">第二经济支柱 · 寿险</div>
        {pillarBlock('secondPerson')}
      </div>

      <div className="card">
        <div className="card-title">子女 / 父母寿险</div>
        <Picker label="子女/父母寿险配置意愿" options={OPTIONS.childParentLifeIns} value={form.childParentLifeIns} onChange={(v) => set('childParentLifeIns', v)} />
        <div className="tip">子女与父母通常无收入，寿险非必需，一般不建议单独配置；此选项仅影响建议文案。</div>
      </div>

      <div className="footer">
        <button className="btn" onClick={() => router.back()}>上一步</button>
        <button className="btn-primary" onClick={next}>下一步：养老规划</button>
      </div>
    </div>
  );
}
