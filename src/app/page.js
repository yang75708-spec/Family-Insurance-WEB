'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadDraft, saveFormData, clearDraft } from '@/lib/store';

const FEATURES = [
  { icon: '🩺', title: '健康险缺口', desc: '重疾 + 医疗缺口测算，家庭流动资产自动抵扣' },
  { icon: '🛡️', title: '寿险保额', desc: '支出缺口 vs 收入损失双法取大，按职业稳定度修正' },
  { icon: '💰', title: '养老储备', desc: '目标替代率测算 + 分资产滚存，给出年缴建议' },
  { icon: '📋', title: '子女/父母', desc: '子女重疾保额与医疗方案、父母医疗配置建议' },
];

export default function Home() {
  const router = useRouter();
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    // 有上次本机数据 → 询问是否保留（第一次使用无草稿，直接默认值）
    setDraft(loadDraft());
  }, []);

  function keep() {
    if (draft) saveFormData(draft);
    setDraft(null);
  }

  function discard() {
    clearDraft();
    setDraft(null);
  }

  return (
    <div className="home">
      <div className="hero">
        <div className="hero-title">家庭保险决策助手</div>
        <div className="hero-sub">4 步填写家庭信息 · 生成健康 / 寿险 / 养老三大保障建议</div>
      </div>

      <div className="card intro">
        <div className="card-title">它能做什么</div>
        {FEATURES.map((f) => (
          <div key={f.title} className="feature">
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-body">
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card note">
        <div className="tip">本工具测算结果仅供参考，具体投保请咨询持牌保险经纪人或核保人员。</div>
      </div>

      <div className="home-footer">
        <button className="btn-primary" onClick={() => router.push('/basic')}>开始评估</button>
      </div>

      {draft && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">保留上次数据？</div>
            <div className="modal-desc">检测到本机保存的填写数据，是否保留并继续填写？</div>
            <div className="modal-actions">
              <button className="btn" onClick={discard}>不保留</button>
              <button className="btn-primary" onClick={keep}>保留</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
