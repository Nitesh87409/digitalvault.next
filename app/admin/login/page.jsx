'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function login() {
    setError('');
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.flag) {
        console.log('ADMIN LOGIN SUCCESS');

        localStorage.setItem(
          'admin_data',
          JSON.stringify(data.admin)
        );

        router.push('/admin/dashboard');
      } else {
        setError(data.message || 'Invalid credentials.');
      }
    } catch (e) {
      setError('Connection error.');
    }
    setLoading(false);
  }

  return (
    <div className="font-dm bg-dark min-h-screen flex flex-col text-[#e8e8f0]">
      <nav className="bg-dark/90 border-b border-[#f5c842]/10 backdrop-blur-[20px] py-4 px-6">
        <div className="max-w-[1152px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-syne text-xl font-bold text-gold no-underline">DigitalVault</Link>
          <span className="text-sm text-[#6b7280]">Admin Panel</span>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="bg-card border border-[#f5c842]/15 rounded-[20px] p-[36px] w-full max-w-[400px]">
          <div className="text-center mb-[28px]">
            <div className="text-[2.5rem] mb-3">🔐</div>
            <h2 className="font-syne text-2xl font-bold text-white mb-1.5">Admin Login</h2>
            <p className="text-[#6b7280] text-sm">DigitalVault Admin Panel</p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-[#9ca3af] block mb-1.5 font-semibold">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} placeholder="admin@digitalvault.in"
                className="bg-[#1a1a2a] border border-white/[0.08] text-white outline-none w-full py-3 px-4 rounded-xl text-sm font-dm" />
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] block mb-1.5 font-semibold">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} placeholder="••••••••"
                className="bg-[#1a1a2a] border border-white/[0.08] text-white outline-none w-full py-3 px-4 rounded-xl text-sm font-dm" />
            </div>
            {error && <div className="text-[#ef4444] text-[0.8rem] py-[10px] px-[14px] bg-[#ef4444]/[0.08] rounded-lg border border-[#ef4444]/20">{error}</div>}
            <button onClick={login} disabled={loading} className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-dark font-syne font-bold border-none w-full p-[14px] rounded-xl text-base mt-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </div>
          <p className="text-center mt-5"><Link href="/" className="text-sm text-[#6b7280] no-underline">← Back to site</Link></p>
        </div>
      </div>
    </div>
  );
}
