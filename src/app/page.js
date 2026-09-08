'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadDraft, saveFormData, clearDraft, markInFlow } from '@/lib/store';
import HeroIllustration from '@/components/HeroIllustration';

const FEATURES = [
  { icon: '🩺', title: '健康险缺口', desc: '重疾 + 医疗缺口测算，家庭流动资产自动抵扣' },
  { icon: '🛡️', title: '寿险保额', desc: '支出缺口 vs 收入损失双法取大，按职业稳定度修正' },
  { icon: '💰', title: '养老储备', desc: '目标替代率测算 + 分资产滚存，给出年缴建议' },
  { icon: '📋', title: '子女 / 父母', desc: '子女重疾保额与医疗方案、父母医疗配置建议' },
];

export default function Home() {
  const router = useRouter();
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    markInFlow();
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
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-eyebrow">保小家 · 家庭保障顾问</span>
          <h1 className="hero-title">为家庭建立<br /><span className="hl">更安心的保障结构</span></h1>
          <p className="hero-sub">
            基于家庭收入、责任与生命周期，测算健康、寿险与养老保障缺口，
            为您生成一份看得懂、能执行的保障方案。
          </p>
          <div className="hero-cta">
            <button className="btn-start" onClick={() => router.push('/basic')}>
              开始规划<span>→</span>
            </button>
          </div>
          <p className="hero-note">数据仅保存在您的浏览器中，可放心填写</p>
        </div>

        <HeroIllustration />
      </section>

      <div className="feature-wrap">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-ico">{f.icon}</div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>

      <div className="trust-note">
        本工具测算结果仅供参考，具体投保请咨询持牌保险经纪人或核保人员。
      </div>

      {draft && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-emoji">📝</div>
            <div className="modal-title">继续上次的规划？</div>
            <div className="modal-desc">检测到本机保存的填写数据，是否保留并继续？</div>
            <div className="modal-actions">
              <button className="btn" onClick={discard}>重新开始</button>
              <button className="btn-primary" onClick={keep}>保留并继续</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
