'use client';

export default function TestimonialsSection({ homepageReviews }) {
  return (
    <section className="content-lazy bg-[#f5c842]/[0.03] px-6 py-20">
      <div className="mx-auto max-w-[1152px]">
        <div className="mb-14 text-center">
          <h2 className="font-syne text-4xl font-bold text-[var(--heading)]">What Customers Say</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {homepageReviews.map(t => (
            <div key={t._id || t.name} className="theme-card rounded-2xl p-6">
              <div className="stars text-[#f5c842]" style={{ marginBottom: '12px', fontSize: '1.1rem' }}>
                {'★'.repeat(t.rating || 5) + '☆'.repeat(5 - (t.rating || 5))}
              </div>
              <p className="mb-5 text-sm text-[var(--text)]">{t.review}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: t.color, color: t.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>{t.initials}</div>
                <div>
                  <div className="text-sm font-semibold text-[var(--heading)]">{t.name}</div>
                  <div className="text-xs text-[var(--muted)]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
