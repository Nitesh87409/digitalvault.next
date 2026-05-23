'use client';
import { useState } from 'react';

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="theme-card cursor-pointer rounded-2xl p-6" onClick={() => setOpen(!open)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="text-[0.95rem] font-semibold text-[var(--heading)]">{q}</span>
        <span style={{ color: '#f5c842', fontSize: '1.2rem', transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'none' }}>↓</span>
      </div>
      {open && <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{a}</p>}
    </div>
  );
}

export default function FaqSection({ faqs }) {
  return (
    <section id="faq" className="content-lazy bg-[var(--bg)] px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-14 text-center">
          <h2 className="font-syne text-4xl font-bold text-[var(--heading)]">Frequently Asked Questions</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, i) => (
            <FaqItem key={faq._id || i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
