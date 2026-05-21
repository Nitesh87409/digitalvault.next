'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    password_login_enabled: true,
    email_otp_enabled: false,
    mobile_otp_enabled: false,
    google_login_enabled: false,
    apple_login_enabled: false,
    otp_length: 6,
    app_name: 'DigitalVault',
    app_logo: ''
  });
  const [activeTab, setActiveTab] = useState('');
  
  // Shared state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  // Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // OTP state
  const [otpStep, setOtpStep] = useState(1); // 1 = identifier, 2 = code
  const [identifier, setIdentifier] = useState(''); // email or mobile
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    fetch('/api/settings?t=' + new Date().getTime(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        console.log("Fetched settings data:", data.settings);
        if (data.flag && data.settings) {
          setSettings({
            password_login_enabled: data.settings.password_login_enabled ?? true,
            email_otp_enabled: data.settings.email_otp_enabled ?? false,
            mobile_otp_enabled: data.settings.mobile_otp_enabled ?? false,
            google_login_enabled: data.settings.google_login_enabled ?? false,
            apple_login_enabled: data.settings.apple_login_enabled ?? false,
            otp_length: data.settings.otp_length ?? 6,
            app_name: data.settings.app_name || process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault',
            app_logo: data.settings.app_logo || ''
          });
          
          if (data.settings.password_login_enabled !== false) {
            setActiveTab('password');
          } else if (data.settings.email_otp_enabled) {
            setActiveTab('email');
          } else if (data.settings.mobile_otp_enabled) {
            setActiveTab('mobile');
          }
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

  // Load social SDKs
  useEffect(() => {
    if (settings.google_login_enabled) {
      const initGoogle = () => {
        if (window.google && document.getElementById('googleSignInDiv')) {
          try {
            window.google.accounts.id.initialize({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id',
              callback: (response) => {
                if (response.error) {
                  console.error('Google Auth Error:', response.error);
                  return;
                }
                handleSocialBackendAuth('google', response.credential);
              },
              use_fedcm_for_prompt: false,
              ux_mode: 'popup',
            });
            window.google.accounts.id.renderButton(
              document.getElementById('googleSignInDiv'),
              { theme: 'outline', size: 'large', type: 'standard', width: 348 }
            );
          } catch (err) {
            console.error('Google init error:', err);
          }
        }
      };

      if (window.google) {
        initGoogle();
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGoogle;
        document.body.appendChild(script);
      }
    }
    
    if (settings.apple_login_enabled) {
      if (!window.AppleID) {
        const script = document.createElement('script');
        script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [settings.google_login_enabled, settings.apple_login_enabled]);

  const handleSuccess = (data) => {
    localStorage.setItem('dv_customer', JSON.stringify(data.customer));
    window.dispatchEvent(new Event('auth-updated'));
    router.refresh();
    const params = new URLSearchParams(window.location.search);
    router.push(params.get('redirect') || '/');
  };

  async function handleSocialBackendAuth(provider, token, userData = {}) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, token, userData })
      });
      const data = await res.json();
      if (data.flag) {
        handleSuccess(data);
      } else {
        setError(data.message || 'Social login failed.');
      }
    } catch (e) {
      setError('Connection error during social login.');
    }
    setLoading(false);
  }

  const handleAppleLogin = async () => {
    if (!window.AppleID) {
      setError('Apple SDK not loaded yet.');
      return;
    }
    try {
      window.AppleID.auth.init({
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || 'dummy-client-id',
        scope: 'name email',
        redirectURI: window.location.origin + '/login',
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      handleSocialBackendAuth('apple', response.authorization.id_token, response.user);
    } catch (err) {
      setError('Apple login cancelled or failed.');
    }
  };

  async function loginPassword() {
    setError('');
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
      });
      const data = await res.json();
      if (data.flag) {
        handleSuccess(data);
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (e) {
      setError('Connection error.');
    }
    setLoading(false);
  }

  async function sendOtp() {
    setError('');
    if (!identifier) { setError('Identifier is required.'); return; }
    setLoading(true);
    try {
      const endpoint = activeTab === 'email' ? '/api/auth/send-email-otp' : '/api/auth/send-mobile-otp';
      const body = activeTab === 'email' ? { email: identifier } : { phone: identifier };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.flag) {
        setOtpStep(2);
        setTimer(data.cooldown || 60);
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch (e) {
      setError('Connection error.');
    }
    setLoading(false);
  }

  async function verifyOtp() {
    setError('');
    if (!otpCode) { setError('Please enter OTP code.'); return; }
    setLoading(true);
    try {
      const endpoint = activeTab === 'email' ? '/api/auth/verify-email-otp' : '/api/auth/verify-mobile-otp';
      const body = activeTab === 'email' ? { email: identifier, otp: otpCode } : { phone: identifier, otp: otpCode };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.flag) {
        handleSuccess(data);
      } else {
        setError(data.message || 'Invalid OTP.');
      }
    } catch (e) {
      setError('Connection error.');
    }
    setLoading(false);
  }

  const changeTab = (tab) => {
    setActiveTab(tab);
    setOtpStep(1);
    setIdentifier('');
    setOtpCode('');
    setError('');
  };

  const getPlaceholder = () => {
    if (activeTab === 'email') return 'your@email.com';
    if (activeTab === 'mobile') return 'e.g. +919876543210';
    return '';
  };

  const hasSocialLogins = settings.google_login_enabled || settings.apple_login_enabled;

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0f', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Blobs */}
      <div style={{ position: 'fixed', width: '384px', height: '384px', background: '#f5c842', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.08, top: '-100px', left: '-100px', pointerEvents: 'none' }}></div>
      <div style={{ position: 'fixed', width: '320px', height: '320px', background: '#7c3aed', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.08, bottom: '-80px', right: '-80px', pointerEvents: 'none' }}></div>

      {/* Nav */}
      <nav style={{ background: 'rgba(10,10,15,0.9)', borderBottom: '1px solid rgba(245,200,66,0.1)', backdropFilter: 'blur(20px)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#f5c842', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {settings.app_logo ? (
              <img src={settings.app_logo} alt={settings.app_name} style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
            ) : null}
            {settings.app_name}
          </Link>
          <Link href="/" style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>← Back to Store</Link>
        </div>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', position: 'relative', zIndex: 1 }}>
        <div style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.15)', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👋</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Welcome Back</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Login to your {settings.app_name} account</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#1a1a2a', padding: '4px', borderRadius: '12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {settings.password_login_enabled && (
              <button
                onClick={() => changeTab('password')}
                style={{ flex: 1, minWidth: '90px', padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'password' ? '#2d2d3a' : 'transparent', color: activeTab === 'password' ? '#fff' : '#6b7280', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, transition: '0.2s' }}
              >
                Password
              </button>
            )}
            {settings.email_otp_enabled && (
              <button
                onClick={() => changeTab('email')}
                style={{ flex: 1, minWidth: '90px', padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'email' ? '#2d2d3a' : 'transparent', color: activeTab === 'email' ? '#fff' : '#6b7280', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, transition: '0.2s' }}
              >
                Email OTP
              </button>
            )}
            {settings.mobile_otp_enabled && (
              <button
                onClick={() => changeTab('mobile')}
                style={{ flex: 1, minWidth: '90px', padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'mobile' ? '#2d2d3a' : 'transparent', color: activeTab === 'mobile' ? '#fff' : '#6b7280', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, transition: '0.2s' }}
              >
                Mobile OTP
              </button>
            )}
          </div>

          {!activeTab && !hasSocialLogins ? (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Loading login methods...</div>
          ) : activeTab === 'password' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loginPassword()}
                  placeholder="your@email.com"
                  style={{ background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,200,66,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loginPassword()}
                    placeholder="••••••••"
                    style={{ background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', width: '100%', padding: '12px 48px 12px 16px', borderRadius: '12px', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(245,200,66,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                  <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '1rem' }}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                <div style={{ textAlign: 'right', marginTop: '8px' }}>
                  <Link href="/forgot-password" style={{ color: '#9ca3af', fontSize: '0.75rem', textDecoration: 'none' }}>Forgot Password?</Link>
                </div>
              </div>

              {error && (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              <button
                onClick={loginPassword}
                disabled={loading}
                style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne, sans-serif', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', opacity: loading ? 0.7 : 1, marginTop: '4px', transition: 'transform 0.2s' }}
                onMouseOver={e => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseOut={e => !loading && (e.currentTarget.style.transform = 'scale(1)')}
              >
                {loading ? 'Logging in...' : 'Login →'}
              </button>
            </div>
          ) : activeTab === 'email' || activeTab === 'mobile' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {otpStep === 1 ? (
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                    {activeTab === 'email' ? 'Email Address' : 'Mobile Number'}
                  </label>
                  <input
                    type={activeTab === 'email' ? 'email' : 'tel'}
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    placeholder={getPlaceholder()}
                    style={{ background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(245,200,66,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                  {error && (
                    <div style={{ color: '#ef4444', fontSize: '0.8rem', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', marginTop: '16px' }}>
                      {error}
                    </div>
                  )}
                  <button
                    onClick={sendOtp}
                    disabled={loading}
                    style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne, sans-serif', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', opacity: loading ? 0.7 : 1, marginTop: '16px', transition: 'transform 0.2s' }}
                    onMouseOver={e => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseOut={e => !loading && (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {loading ? 'Sending...' : 'Send OTP →'}
                  </button>
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                    Enter {settings.otp_length}-Digit OTP
                  </label>
                  <input
                    type="text"
                    maxLength={settings.otp_length}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                    placeholder={"0".repeat(settings.otp_length)}
                    style={{ background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '1.25rem', letterSpacing: '4px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(245,200,66,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                  {error && (
                    <div style={{ color: '#ef4444', fontSize: '0.8rem', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', marginTop: '16px' }}>
                      {error}
                    </div>
                  )}
                  <button
                    onClick={verifyOtp}
                    disabled={loading || otpCode.length < settings.otp_length}
                    style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne, sans-serif', fontWeight: 700, border: 'none', cursor: (loading || otpCode.length < settings.otp_length) ? 'not-allowed' : 'pointer', width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', opacity: (loading || otpCode.length < settings.otp_length) ? 0.7 : 1, marginTop: '16px', transition: 'transform 0.2s' }}
                    onMouseOver={e => !(loading || otpCode.length < settings.otp_length) && (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseOut={e => !(loading || otpCode.length < settings.otp_length) && (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {loading ? 'Verifying...' : 'Verify & Login →'}
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <button onClick={() => setOtpStep(1)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.875rem' }}>← Back</button>
                    <button onClick={sendOtp} disabled={timer > 0 || loading} style={{ background: 'none', border: 'none', color: timer > 0 ? '#4b5563' : '#f5c842', cursor: timer > 0 ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                      {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {hasSocialLogins && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
                <div style={{ flex: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}></div>
                <span style={{ padding: '0 12px', color: '#6b7280', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>or continue with</span>
                <div style={{ flex: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {settings.google_login_enabled && (
                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%', background: '#fff', borderRadius: '12px', padding: '2px', overflow: 'hidden' }}>
                    <div id="googleSignInDiv"></div>
                  </div>
                )}
                {settings.apple_login_enabled && (
                  <button onClick={handleAppleLogin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.365 14.802c.026 3.238 2.806 4.316 2.836 4.327-.023.078-.445 1.545-1.503 3.093-1.022 1.496-2.096 2.987-3.766 3.017-1.637.032-2.176-.97-4.043-.97-1.868 0-2.463.936-4.015 1.002-1.605.06-2.83-1.616-3.856-3.1-2.09-3.056-3.69-8.625-1.55-12.336 1.06-1.833 2.92-2.997 4.965-3.03 1.57-.033 3.064 1.05 4.043 1.05 1.008 0 2.825-1.306 4.776-1.114 1.028.046 3.25.412 4.793 2.68-1.597.986-2.585 2.766-2.58 4.675a4.707 4.707 0 00-.1 4.706M15.42 4.24a4.444 4.444 0 001.077-3.16 4.636 4.636 0 00-3.065 1.56 4.303 4.303 0 00-1.1 3.096 3.738 3.738 0 003.088-1.496z"/>
                    </svg>
                    Apple
                  </button>
                )}
              </div>
              
              {error && (!activeTab || hasSocialLogins) && (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', marginTop: '16px', textAlign: 'center' }}>
                  {error}
                </div>
              )}
            </>
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' }}></div>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: '#f5c842', fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}