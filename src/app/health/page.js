'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OPTIONS, getMedicalOptions, getMedicalHint } from '@/lib/options';
import { getFormData, saveFormData } from '@/lib/store';
import { Picker, NumInput, Switch, CbGroup } from '@/components/fields';

const HI_TYPES = ['社保医保', '惠民保', '百万医疗', '中端医疗', '高端医疗', '重疾险'];

const EXISTING_NUM = [
  'firstPersonCIExisting', 'secondPersonCIExisting',
  'firstPersonMIExisting', 'secondPersonMIExisting',
  'childCIExisting', 'parentCIExisting',
];

export default function HealthPage() {
  const router = useRouter();
  const [form, setForm] = useState(() => ({ ...getFormData() }));

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const memberValues = (m) => HI_TYPES.reduce((acc, t) => { acc[t] = !!form[m + '_' + t]; return acc; }, {});
  const toggle = (m, t) => set(m + '_' + t, !form[m + '_' + t]);

  function next() {
    const f = { ...form };
    EXISTING_NUM.forEach((k) => {
      f[k] = f[k] === '' || f[k] === undefined || f[k] === null ? 0 : Number(f[k]);
    });
    saveFormData(f);
    router.push('/life');
  }

  function pillarBlock(member, formKey) {
    return (
      <>
        <Picker label="身体状况自评" options={OPTIONS.healthStatus} value={form[formKey + 'HealthStatus']} onChange={(v) => set(formKey + 'HealthStatus', v)} />
        <Switch label="是否吸烟" checked={form[formKey + 'Smoke']} onChange={(v) => set(formKey + 'Smoke', v)} />
        <Picker
          label="期望医疗年花销"
          options={getMedicalOptions(form.city, form[formKey + 'HealthStatus'])}
          value={form[member + '_期望医疗消费档位']}
          onChange={(v) => set(member + '_期望医疗消费档位', v)}
        />
        <div className="tip">{getMedicalHint(form.city, form[formKey + 'HealthStatus'], form[member + '_期望医疗消费档位'])}</div>
        <div className="sec-title">已有险种（勾选后自动计入已有保额）</div>
        <CbGroup types={HI_TYPES} values={memberValues(member)} onToggle={(t) => toggle(member, t)} />
        <NumInput label="已有重疾险保额（万）" value={form[formKey + 'CIExisting']} onChange={(v) => set(formKey + 'CIExisting', v)} placeholder="手动填写" />
        <NumInput label="已有医疗险保额（万）" value={form[formKey + 'MIExisting']} onChange={(v) => set(formKey + 'MIExisting', v)} placeholder="手动填写" />
        <Picker label="重疾险保费预算" options={OPTIONS.ciBudget} value={form[formKey + 'CIPremiumBudget']} onChange={(v) => set(formKey + 'CIPremiumBudget', v)} />
        <Picker label="医疗险保费预算" options={OPTIONS.miBudget} value={form[formKey + 'MIPremiumBudget']} onChange={(v) => set(formKey + 'MIPremiumBudget', v)} />
      </>
    );
  }

  function childBlock(member, formKey) {
    return (
      <>
        <div className="sec-title">已有险种（勾选后自动计入已有保额）</div>
        <CbGroup types={HI_TYPES} values={memberValues(member)} onToggle={(t) => toggle(member, t)} />
        <NumInput label="已有重疾险保额（万）" value={form[formKey + 'CIExisting']} onChange={(v) => set(formKey + 'CIExisting', v)} placeholder="手动填写" />
        <Picker label="医疗险保费预算" options={OPTIONS.miBudget} value={form[formKey + 'MIPremiumBudget']} onChange={(v) => set(formKey + 'MIPremiumBudget', v)} />
      </>
    );
  }

  return (
    <div className="page">
      <div className="tip" style={{ marginBottom: '16px' }}>第 2 / 4 步：勾选家庭成员已有的医疗/重疾险种，并设置期望医疗年花销与保费预算。勾选险种的有效保额会自动参与缺口测算。</div>

      <div className="card">
        <div className="card-title">家庭系数与缴费方式</div>
        <Picker label="重疾险缴费方式" options={OPTIONS.ciPayPeriod} value={form.ciPayPeriod} onChange={(v) => set('ciPayPeriod', v)} />
        <Picker label="家庭系数（治疗费用承担意愿）" options={OPTIONS.familyCoefficient} value={form.familyCoefficient} onChange={(v) => set('familyCoefficient', v)} />
        <div className="tip">家庭系数表示患病时家庭愿意动用流动资产的比例：保守约30%、稳健约50%、进取约60%。流动资产×系数将从健康险总缺口中一次性抵扣。</div>
      </div>

      <div className="card">
        <div className="card-title">第一经济支柱 · 健康险</div>
        {pillarBlock('p1', 'firstPerson')}
      </div>

      <div className="card">
        <div className="card-title">第二经济支柱 · 健康险</div>
        {pillarBlock('p2', 'secondPerson')}
      </div>

      <div className="card">
        <div className="card-title">子女 · 健康险</div>
        {childBlock('child', 'child')}
      </div>

      <div className="card">
        <div className="card-title">父母 · 健康险</div>
        {childBlock('parent', 'parent')}
      </div>

      <div className="footer">
        <button className="btn" onClick={() => router.back()}>上一步</button>
        <button className="btn-primary" onClick={next}>下一步：寿险配置</button>
      </div>
    </div>
  );
}
