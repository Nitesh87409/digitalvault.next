'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [strength, setStrength] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function checkStrength(val) {
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    setStrength(score);
  }

  const strengthColors = ['#ef4444', '#f97316', '#f5c842', '#10b981'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  async function register() {
    setError(''); setSuccess('');
    const { name, email, phone, password } = form;
    if (!name || !email || !phone || !password) { setError('Please fill all fields.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email.'); return; }
    if (!/^\d{10}$/.test(phone)) { setError('Enter valid 10-digit phone.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name, email, phone, password })
      });
      const data = await res.json();
      if (data.flag) {
        localStorage.setItem('dv_customer', JSON.stringify(data.customer));
        setSuccess('Account created! Redirecting...');
        setTimeout(() => {
          const params = new URLSearchParams(window.location.search);
          router.push(params.get('redirect') || '/');
        }, 1200);
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch(e) {
      setError('Connection error. Is server running?');
    }
    setLoading(false);
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0f', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'fixed', width: '384px', height: '384px', background: '#f5c842', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.08, top: '-100px', right: '-100px', pointerEvents: 'none' }}></div>
      <div style={{ position: 'fixed', width: '320px', height: '320px', background: '#7c3aed', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.08, bottom: '-80px', left: '-80px', pointerEvents: 'none' }}></div>

      <nav style={{ background: 'rgba(10,10,15,0.9)', borderBottom: '1px solid rgba(245,200,66,0.1)', backdropFilter: 'blur(20px)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#f5c842', textDecoration: 'none' }}>DigitalVault</Link>
          <Link href="/" style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>← Back to Store</Link>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', position: 'relative', zIndex: 1 }}>
        <div style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.15)', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🚀</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Create Account</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Join DigitalVault and get instant access</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your full name' },
              { label: 'Email Address', key: 'email', type: 'email', placeholder: 'your@email.com' },
              { label: 'Phone Number (Optional)', key: 'phone', type: 'tel', placeholder: '10-digit mobile number', maxLength: 10 },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  maxLength={f.maxLength}
                  style={{ background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>
            ))}

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); checkStrength(e.target.value); }}
                  placeholder="Min 6 characters"
                  style={{ background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', width: '100%', padding: '12px 48px 12px 16px', borderRadius: '12px', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' }}
                />
                <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {/* Strength bars */}
              {form.password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i < strength ? strengthColors[strength - 1] : '#1a1a2a', transition: 'all 0.3s' }}></div>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.7rem', color: strengthColors[strength - 1] || '#6b7280' }}>
                    {form.password.length > 0 ? strengthLabels[strength - 1] || 'Weak' : ''}
                  </p>
                </div>
              )}
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: '0.8rem', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
            {success && <div style={{ color: '#10b981', fontSize: '0.8rem', padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>{success}</div>}

            <button
              onClick={register}
              disabled={loading}
              style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne, sans-serif', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', opacity: loading ? 0.7 : 1, marginTop: '4px' }}
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' }}></div>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#f5c842', fontWeight: 600, textDecoration: 'none' }}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
;
}
