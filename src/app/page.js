'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadDraft, saveFormData, clearDraft, markInFlow } from '@/lib/store';
import HeroIllustration from '@/components/HeroIllustration';

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
