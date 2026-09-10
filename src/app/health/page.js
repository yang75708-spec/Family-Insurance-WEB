'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OPTIONS, getMedicalOptions, getMedicalHint } from '@/lib/options';
import { getFormData, saveFormData, isInFlow } from '@/lib/store';
import { Picker, NumInput, Switch } from '@/components/fields';
import JourneyBar from '@/components/JourneyBar';

const HI_TYPES = ['社保医保', '惠民保', '百万医疗', '中端医疗', '高端医疗', '重疾险'];
// 商业医疗险：社保医保默认勾选，不单独触发「已有医疗险保额」输入
const MED_COMMERCIAL = ['惠民保', '百万医疗', '中端医疗', '高端医疗'];

// 家庭成员（矩阵列）：m = 勾选 key 前缀，f = 表单字段前缀，mi = 是否含医疗险保额输入
const MEMBERS = [
  { m: 'p1', f: 'firstPerson', label: '第一支柱', mi: true },
  { m: 'p2', f: 'secondPerson', label: '第二支柱', mi: true },
  { m: 'child', f: 'child', label: '子女', mi: false },
  { m: 'parent', f: 'parent', label: '父母', mi: false },
];

export default function HealthPage() {
  const router = useRouter();
  const [form, setForm] = useState(() => ({ ...getFormData() }));

  useEffect(() => {
    if (!isInFlow()) router.replace('/');
  }, [router]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const toggle = (m, t) => set(m + '_' + t, !form[m + '_' + t]);
  const ciOn = (m) => !!form[m + '_重疾险'];
  const miOn = (m) => MED_COMMERCIAL.some((t) => !!form[m + '_' + t]);

  function next() {
    const f = { ...form };
    MEMBERS.forEach(({ m, f: fk, mi }) => {
      if (!f[m + '_重疾险']) f[fk + 'CIExisting'] = 0;
      if (mi && !MED_COMMERCIAL.some((t) => !!f[m + '_' + t])) f[fk + 'MIExisting'] = 0;
      const ciKey = fk + 'CIExisting';
      const miKey = fk + 'MIExisting';
      f[ciKey] = f[ciKey] === '' || f[ciKey] === undefined || f[ciKey] === null ? 0 : Number(f[ciKey]);
      if (mi) f[miKey] = f[miKey] === '' || f[miKey] === undefined || f[miKey] === null ? 0 : Number(f[miKey]);
    });
    saveFormData(f);
    router.push('/life');
  }

  function pillarBlock(member, formKey) {
    return (
      <>
        <div className="field-grid">
          <Picker label="身体状况自评" options={OPTIONS.healthStatus} value={form[formKey + 'HealthStatus']} onChange={(v) => set(formKey + 'HealthStatus', v)} />
          <Switch label="是否吸烟" checked={form[formKey + 'Smoke']} onChange={(v) => set(formKey + 'Smoke', v)} />
          <Picker
            label="期望医疗年花销"
            options={getMedicalOptions(form.city, form[formKey + 'HealthStatus'])}
            value={form[member + '_期望医疗消费档位']}
            onChange={(v) => set(member + '_期望医疗消费档位', v)}
          />
        </div>
        <div className="tip">{getMedicalHint(form.city, form[formKey + 'HealthStatus'], form[member + '_期望医疗消费档位'])}</div>
        <div className="field-grid">
          {ciOn(member) && (
            <NumInput label="已有重疾险保额（万）" value={form[formKey + 'CIExisting']} onChange={(v) => set(formKey + 'CIExisting', v)} placeholder="手动填写" />
          )}
          {miOn(member) && (
            <NumInput label="已有医疗险保额（万）" value={form[formKey + 'MIExisting']} onChange={(v) => set(formKey + 'MIExisting', v)} placeholder="手动填写" />
          )}
          <Picker label="重疾险保费预算" options={OPTIONS.ciBudget} value={form[formKey + 'CIPremiumBudget']} onChange={(v) => set(formKey + 'CIPremiumBudget', v)} />
          <Picker label="医疗险保费预算" options={OPTIONS.miBudget} value={form[formKey + 'MIPremiumBudget']} onChange={(v) => set(formKey + 'MIPremiumBudget', v)} />
        </div>
      </>
    );
  }

  function childBlock(member, formKey) {
    return (
      <div className="field-grid">
        {ciOn(member) && (
          <NumInput label="已有重疾险保额（万）" value={form[formKey + 'CIExisting']} onChange={(v) => set(formKey + 'CIExisting', v)} placeholder="手动填写" />
        )}
        <Picker label="医疗险保费预算" options={OPTIONS.miBudget} value={form[formKey + 'MIPremiumBudget']} onChange={(v) => set(formKey + 'MIPremiumBudget', v)} />
      </div>
    );
  }

  return (
    <div className="page">
      <JourneyBar index={2} />
      <p className="step-hint">先一次性勾选全家已有的险种，再逐个成员补充身体状况、期望医疗花销与保费预算；勾选的险种会按有效保额自动参与缺口测算。</p>

      <div className="card">
        <div className="card-title">家庭成员已有险种</div>
        <p className="card-sub">横向为家庭成员，纵向为险种，请勾选各自已配置的项目。</p>
        <div className="ins-wrap">
          <div className="ins-table">
            <div className="ins-row ins-head">
              <div className="ins-cell ins-name">险种</div>
              {MEMBERS.map((m) => (
                <div className="ins-cell ins-col" key={m.m}>{m.label}</div>
              ))}
            </div>
            {HI_TYPES.map((t) => (
              <div className="ins-row" key={t}>
                <div className="ins-cell ins-name">{t}</div>
                {MEMBERS.map((m) => (
                  <label className="ins-cell ins-pick" key={m.m}>
                    <input
                      type="checkbox"
                      aria-label={`${m.label} · ${t}`}
                      checked={!!form[m.m + '_' + t]}
                      onChange={() => toggle(m.m, t)}
                    />
                    <span className="check-box" aria-hidden="true" />
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">家庭系数与缴费方式</div>
        <div className="field-grid">
          <Picker label="重疾险缴费方式" options={OPTIONS.ciPayPeriod} value={form.ciPayPeriod} onChange={(v) => set('ciPayPeriod', v)} />
          <Picker label="家庭系数（治疗费用承担意愿）" options={OPTIONS.familyCoefficient} value={form.familyCoefficient} onChange={(v) => set('familyCoefficient', v)} />
        </div>
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
