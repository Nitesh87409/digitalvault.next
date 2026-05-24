'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [settings, setSettings] = useState({ app_name: 'DigitalVault', app_logo: '' });
  const inputRefs = useRef([]);
  const router = useRouter();

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Load settings
  useEffect(() => {
    fetch('/api/settings?t=' + Date.now(), { cache: 'no-store' }).then(res => res.json()).then(data => {
      if (data.flag && data.settings) {
        setSettings({
          app_name: data.settings.app_name || 'DigitalVault',
          app_logo: data.settings.app_logo || ''
        });
      }
    }).catch(() => {});
  }, []);

  // Auto-focus first OTP input when step changes
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

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
      if (data.flag && data.requires_2fa) {
        setStep('otp');
        setCooldown(data.cooldown || 60);
        setOtp(['', '', '', '', '', '']);
      } else if (!data.flag) {
        setError(data.message || 'Invalid credentials.');
      }
    } catch (e) {
      setError('Connection error.');
    }
    setLoading(false);
  }

  async function verifyOtp() {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue })
      });
      const data = await res.json();
      if (data.flag) {
        localStorage.setItem('admin_data', JSON.stringify(data.admin));
        router.push('/admin/dashboard');
      } else {
        setError(data.message || 'Invalid OTP.');
        // If OTP expired or max attempts, go back to credentials
        if (data.message?.includes('login again')) {
          setTimeout(() => {
            setStep('credentials');
            setOtp(['', '', '', '', '', '']);
            setError('');
          }, 2000);
        }
      }
    } catch (e) {
      setError('Connection error.');
    }
    setLoading(false);
  }

  async function resendOtp() {
    if (cooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.flag && data.requires_2fa) {
        setCooldown(data.cooldown || 60);
        setOtp(['', '', '', '', '', '']);
        setError('');
      } else if (!data.flag) {
        setError(data.message || 'Failed to resend OTP.');
      }
    } catch (e) {
      setError('Connection error.');
    }
    setLoading(false);
  }

  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      verifyOtp();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  }

  return (
    <div className="font-dm bg-dark min-h-screen flex flex-col text-[#e8e8f0]">
      <nav className="bg-dark/90 border-b border-[#f5c842]/10 backdrop-blur-[20px] py-4 px-6">
        <div className="max-w-[1152px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-syne text-xl font-bold text-gold no-underline flex items-center gap-2">
            {settings.app_logo && (
              <img src={settings.app_logo} alt={settings.app_name} className="h-6 w-auto object-contain" />
            )}
            <span>{settings.app_name}</span>
          </Link>
          <span className="text-sm text-[#6b7280]">Admin Panel</span>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="bg-card border border-[#f5c842]/15 rounded-[20px] p-[36px] w-full max-w-[400px]">

          {/* Step 1: Credentials */}
          {step === 'credentials' && (
            <>
              <div className="text-center mb-[28px]">
                <div className="text-[2.5rem] mb-3">🔐</div>
                <h2 className="font-syne text-2xl font-bold text-white mb-1.5">Admin Login</h2>
                <p className="text-[#6b7280] text-sm">{settings.app_name} Admin Panel</p>
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
                  {loading ? 'Verifying...' : 'Continue →'}
                </button>
              </div>
              <p className="text-center mt-5"><Link href="/" className="text-sm text-[#6b7280] no-underline">← Back to site</Link></p>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <>
              <div className="text-center mb-[28px]">
                <div className="text-[2.5rem] mb-3">📧</div>
                <h2 className="font-syne text-2xl font-bold text-white mb-1.5">Verify Identity</h2>
                <p className="text-[#6b7280] text-sm">Enter the 6-digit code sent to</p>
                <p className="text-[#f5c842] text-sm font-semibold mt-1">{email}</p>
              </div>

              <div className="flex flex-col gap-4">
                {/* OTP Input Boxes */}
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => inputRefs.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(index, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-bold bg-[#1a1a2a] border border-white/[0.08] text-white outline-none rounded-xl font-dm focus:border-[#f5c842]/60 transition-colors"
                    />
                  ))}
                </div>

                {error && <div className="text-[#ef4444] text-[0.8rem] py-[10px] px-[14px] bg-[#ef4444]/[0.08] rounded-lg border border-[#ef4444]/20">{error}</div>}

                <button onClick={verifyOtp} disabled={loading || otp.join('').length !== 6} className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-dark font-syne font-bold border-none w-full p-[14px] rounded-xl text-base mt-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70">
                  {loading ? 'Verifying...' : 'Verify & Login →'}
                </button>

                {/* Resend OTP */}
                <div className="text-center">
                  {cooldown > 0 ? (
                    <p className="text-[#6b7280] text-sm">Resend code in <span className="text-[#f5c842] font-semibold">{cooldown}s</span></p>
                  ) : (
                    <button onClick={resendOtp} disabled={loading} className="text-[#f5c842] text-sm font-semibold bg-transparent border-none cursor-pointer hover:underline disabled:opacity-50">
                      Resend Code
                    </button>
                  )}
                </div>

                {/* Back button */}
                <button
                  onClick={() => { setStep('credentials'); setOtp(['', '', '', '', '', '']); setError(''); }}
                  className="text-[#6b7280] text-sm bg-transparent border-none cursor-pointer hover:text-white transition-colors"
                >
                  ← Back to login
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
