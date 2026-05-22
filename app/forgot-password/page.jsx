'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    email_otp_enabled: true,
    mobile_otp_enabled: true,
    otp_length: 6,
    app_name: 'DigitalVault',
    app_logo: ''
  });
  
  const [step, setStep] = useState(1); // 1: identifier, 2: otp & password
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    fetch('/api/settings?t=' + new Date().getTime(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.flag && data.settings) {
          setSettings({
            email_otp_enabled: data.settings.email_otp_enabled ?? true,
            mobile_otp_enabled: data.settings.mobile_otp_enabled ?? true,
            otp_length: data.settings.otp_length ?? 6,
            app_name: data.settings.app_name || 'DigitalVault',
            app_logo: data.settings.app_logo || ''
          });
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  async function sendOtp() {
    setError('');
    setMessage('');
    if (!identifier) { setError('Please enter your email or mobile number.'); return; }
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp', identifier })
      });
      const data = await res.json();
      if (data.flag) {
        setStep(2);
        setMessage(data.message);
        setTimer(data.cooldown || 60);
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch (e) {
      setError('Connection error.');
    }
    setLoading(false);
  }

  async function resetPassword() {
    setError('');
    setMessage('');
    if (!otpCode) { setError('Please enter OTP code.'); return; }
    if (!newPassword) { setError('Please enter new password.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reset', 
          identifier, 
          otp: otpCode, 
          new_password: newPassword 
        })
      });
      const data = await res.json();
      if (data.flag) {
        setMessage(data.message);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.message || 'Reset failed.');
      }
    } catch (e) {
      setError('Connection error.');
    }
    setLoading(false);
  }

  return (
    <div className="font-sans bg-[#0a0a0f] min-h-screen flex flex-col">
      <div className="fixed w-96 h-96 bg-[#f5c842] rounded-full blur-[100px] opacity-[0.08] -top-[100px] -left-[100px] pointer-events-none"></div>
      
      <nav className="bg-[#0a0a0f]/90 border-b border-[#f5c842]/10 backdrop-blur-[20px] py-4 px-6 sticky top-0 z-10">
        <div className="max-w-[1152px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-['Syne',sans-serif] text-xl font-bold text-[#f5c842] no-underline flex items-center gap-2">
            {settings.app_logo ? (
              <img src={settings.app_logo} alt={settings.app_name} className="h-7 w-auto object-contain" />
            ) : null}
            {settings.app_name}
          </Link>
          <Link href="/login" className="text-[#6b7280] text-sm no-underline">← Back to Login</Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center py-10 px-4 relative z-[1]">
        <div className="bg-[#12121a] border border-[#f5c842]/15 rounded-[20px] p-9 w-full max-w-[420px] shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          <div className="text-center mb-7">
            <div className="text-[2.5rem] mb-3">🔒</div>
            <h2 className="font-['Syne',sans-serif] text-[1.6rem] font-bold text-white mb-1.5">Reset Password</h2>
            <p className="text-[#6b7280] text-sm">We'll send you a code to reset your password</p>
          </div>

          {step === 1 ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] block mb-1.5 font-semibold">Email or Mobile Number</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  placeholder="your@email.com or +91..."
                  className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-3 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors duration-200"
                />
              </div>

              {error && (
                <div className="text-[#ef4444] text-[0.8rem] px-3.5 py-2.5 bg-[#ef4444]/5 rounded-lg border border-[#ef4444]/20">
                  {error}
                </div>
              )}

              <button
                onClick={sendOtp}
                disabled={loading}
                className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne',sans-serif] font-bold border-none w-full p-3.5 rounded-xl text-base mt-1 transition-transform duration-200 disabled:opacity-70 disabled:cursor-not-allowed enabled:hover:scale-[1.02]"
              >
                {loading ? 'Sending...' : 'Send Reset Code →'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] block mb-1.5 font-semibold">Enter OTP Code</label>
                <input
                  type="text"
                  maxLength={settings.otp_length}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder={"0".repeat(settings.otp_length)}
                  className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-3 rounded-xl text-xl tracking-[4px] text-center font-sans focus:border-[#f5c842]/50 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="text-xs text-[#9ca3af] block mb-1.5 font-semibold">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-3 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="text-xs text-[#9ca3af] block mb-1.5 font-semibold">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-3 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors duration-200"
                />
              </div>

              {error && (
                <div className="text-[#ef4444] text-[0.8rem] px-3.5 py-2.5 bg-[#ef4444]/5 rounded-lg border border-[#ef4444]/20">
                  {error}
                </div>
              )}

              {message && (
                <div className="text-[#10b981] text-[0.8rem] px-3.5 py-2.5 bg-[#10b981]/5 rounded-lg border border-[#10b981]/20">
                  {message}
                </div>
              )}

              <button
                onClick={resetPassword}
                disabled={loading}
                className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne',sans-serif] font-bold border-none w-full p-3.5 rounded-xl text-base mt-1 transition-transform duration-200 disabled:opacity-70 disabled:cursor-not-allowed enabled:hover:scale-[1.02]"
              >
                {loading ? 'Resetting...' : 'Reset Password →'}
              </button>

              <div className="text-center mt-2">
                <button 
                  onClick={() => setStep(1)} 
                  disabled={loading}
                  className="bg-transparent border-none text-[#9ca3af] cursor-pointer text-sm disabled:cursor-not-allowed"
                >
                  ← Change Email/Mobile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}