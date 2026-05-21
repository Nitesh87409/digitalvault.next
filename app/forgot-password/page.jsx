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
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0f', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'fixed', width: '384px', height: '384px', background: '#f5c842', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.08, top: '-100px', left: '-100px', pointerEvents: 'none' }}></div>
      
      <nav style={{ background: 'rgba(10,10,15,0.9)', borderBottom: '1px solid rgba(245,200,66,0.1)', backdropFilter: 'blur(20px)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#f5c842', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {settings.app_logo ? (
              <img src={settings.app_logo} alt={settings.app_name} style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
            ) : null}
            {settings.app_name}
          </Link>
          <Link href="/login" style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>← Back to Login</Link>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', position: 'relative', zIndex: 1 }}>
        <div style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.15)', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔒</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Reset Password</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>We'll send you a code to reset your password</p>
          </div>

          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Email or Mobile Number</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  placeholder="your@email.com or +91..."
                  style={{ background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>

              {error && (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              <button
                onClick={sendOtp}
                disabled={loading}
                style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne, sans-serif', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', opacity: loading ? 0.7 : 1, marginTop: '4px' }}
              >
                {loading ? 'Sending...' : 'Send Reset Code →'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Enter OTP Code</label>
                <input
                  type="text"
                  maxLength={settings.otp_length}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder={"0".repeat(settings.otp_length)}
                  style={{ background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '1.25rem', letterSpacing: '4px', textAlign: 'center' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem' }}
                />
              </div>

              {error && (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              {message && (
                <div style={{ color: '#10b981', fontSize: '0.8rem', padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                  {message}
                </div>
              )}

              <button
                onClick={resetPassword}
                disabled={loading}
                style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne, sans-serif', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', opacity: loading ? 0.7 : 1, marginTop: '4px' }}
              >
                {loading ? 'Resetting...' : 'Reset Password →'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <button 
                  onClick={() => setStep(1)} 
                  disabled={loading}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.875rem' }}
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