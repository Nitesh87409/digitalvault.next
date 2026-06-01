'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [strength, setStrength] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { settings } = useSettings();

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
        if (data.customer) {
          localStorage.setItem('dv_customer', JSON.stringify(data.customer));
        }
        window.dispatchEvent(new Event('auth-updated'));
        router.refresh();
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
    <div className="font-sans bg-[#0a0a0f] min-h-screen flex flex-col">
      <div className="fixed w-[384px] h-[384px] bg-[#f5c842] rounded-full blur-[100px] opacity-[0.08] -top-[100px] -right-[100px] pointer-events-none"></div>
      <div className="fixed w-[320px] h-[320px] bg-[#7c3aed] rounded-full blur-[100px] opacity-[0.08] -bottom-[80px] -left-[80px] pointer-events-none"></div>

      <nav className="bg-[#0a0a0f]/90 border-b border-[#f5c842]/10 backdrop-blur-[20px] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-[1152px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-['Syne',sans-serif] text-xl font-bold text-[#f5c842] no-underline flex items-center gap-2">
            {settings.app_logo ? (
              <img src={settings.app_logo} alt={settings.app_name} className="h-7 w-auto object-contain" loading="eager" />
            ) : null}
            {settings.app_name}
          </Link>
          <Link href="/" className="text-[#6b7280] text-sm no-underline">← Back to Store</Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center py-4 px-4 relative z-[1]">
        <div className="bg-[#12121a] border border-[#f5c842]/15 rounded-[20px] p-5 w-full max-w-[440px]">
          <div className="text-center mb-4">
            <h2 className="font-['Syne',sans-serif] text-xl font-bold text-white mb-1">Create Account</h2>
            <p className="text-[#6b7280] text-xs">Join {settings.app_name} and get instant access</p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your full name' },
              { label: 'Email Address', key: 'email', type: 'email', placeholder: 'your@email.com' },
              { label: 'Phone Number (Optional)', key: 'phone', type: 'tel', placeholder: '10-digit mobile number', maxLength: 10 },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-[#9ca3af] block mb-1 font-semibold">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  maxLength={f.maxLength}
                  className="bg-[#1a1a2a] border border-white/5 text-white outline-none w-full px-3.5 py-2.5 rounded-xl text-sm font-sans"
                />
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="text-xs text-[#9ca3af] block mb-1 font-semibold">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); checkStrength(e.target.value); }}
                  placeholder="Min 6 characters"
                  className="bg-[#1a1a2a] border border-white/5 text-white outline-none w-full pl-3.5 pr-12 py-2.5 rounded-xl text-sm font-sans"
                />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-[#6b7280]">
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {form.password && (
                <div className="mt-1.5">
                  <div className="flex gap-1 mb-0.5">
                    {[0,1,2,3].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-sm transition-all duration-300" style={{ background: i < strength ? strengthColors[strength - 1] : '#1a1a2a' }}></div>
                    ))}
                  </div>
                  <p className="text-[0.7rem]" style={{ color: strengthColors[strength - 1] || '#6b7280' }}>
                    {form.password.length > 0 ? strengthLabels[strength - 1] || 'Weak' : ''}
                  </p>
                </div>
              )}
            </div>

            {error && <div className="text-[#ef4444] text-[0.8rem] px-3 py-2 bg-[#ef4444]/5 rounded-lg border border-[#ef4444]/20">{error}</div>}
            {success && <div className="text-[#10b981] text-[0.8rem] px-3 py-2 bg-[#10b981]/5 rounded-lg border border-[#10b981]/20">{success}</div>}

            <button
              onClick={register}
              disabled={loading}
              className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne',sans-serif] font-bold border-none w-full py-2.5 rounded-xl text-base mt-0.5 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </div>

          <div className="border-t border-white/5 my-4"></div>
          <p className="text-center text-[#6b7280] text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-[#f5c842] font-semibold no-underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
