'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

function isFacebookBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|FB_IAB|FBIOS|Instagram|LinkedInApp/.test(ua);
}

function getExternalBrowserUrl() {
  const url = window.location.href;
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) {
    return 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
  }
  return url;
}

export default function LoginPage() {
  const router = useRouter();
  const googleInitializedRef = useRef(false);
  const googleRenderedRef = useRef(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
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
  const [loadingSettings, setLoadingSettings] = useState(true);
  
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
    setIsInAppBrowser(isFacebookBrowser());
  }, []);

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
      .catch(console.error)
      .finally(() => setLoadingSettings(false));
  }, []);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handle Google redirect callback (when user returns from Google after redirect auth)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleRedirect = params.get('google_redirect');

    if (googleRedirect === 'success') {
      const redirectTo = params.get('redirect') || '/';
      const finishRedirectLogin = (customerData) => {
        localStorage.setItem('dv_customer', JSON.stringify(customerData));
        window.dispatchEvent(new Event('auth-updated'));
        document.cookie = 'dv_google_customer=; path=/; max-age=0';
        router.replace(redirectTo);
      };
      const restoreFromSession = async () => {
        try {
          const res = await fetch('/api/customer', { cache: 'no-store' });
          const data = await res.json();
          if (data.flag && data.customer) {
            finishRedirectLogin(data.customer);
            return;
          }
        } catch (e) {
          console.error('Google redirect profile restore failed:', e);
        }
        setError('Login succeeded but failed to load profile. Please refresh.');
        window.history.replaceState({}, '', '/login');
      };

      // Read customer data from the temporary cookie set by /api/auth/google-redirect
      const cookieMatch = document.cookie.match(/(?:^|;\s*)dv_google_customer=([^;]*)/);
      if (cookieMatch) {
        try {
          let cookieValue = cookieMatch[1];
          for (let i = 0; i < 2; i++) {
            const decoded = decodeURIComponent(cookieValue);
            if (decoded === cookieValue) break;
            cookieValue = decoded;
          }
          finishRedirectLogin(JSON.parse(cookieValue));
          return;
        } catch (e) {
          restoreFromSession();
          return;
        }
      }
      restoreFromSession();
    } else if (googleRedirect === 'error') {
      const errorMessage = params.get('error_message') || 'Google login failed. Please try again.';
      setError(errorMessage);
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const getGoogleOAuthUrl = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = window.location.origin + '/api/auth/google-redirect';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  const initGoogle = () => {
    let attempts = 0;
    const tryRender = () => {
      const el = document.getElementById('googleSignInDiv');
      if (window.google && el) {
        try {
          const containerWidth = el.offsetWidth || 348;
          const safeWidth = Math.max(200, Math.min(400, containerWidth));

          if (!googleInitializedRef.current) {
            window.google.accounts.id.initialize({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id',
              login_uri: window.location.origin + '/api/auth/google-redirect',
              use_fedcm_for_prompt: false,
              ux_mode: 'redirect',
            });
            googleInitializedRef.current = true;
          }
          if (!googleRenderedRef.current) {
            window.google.accounts.id.renderButton(
              el,
              {
                theme: 'outline',
                size: 'large',
                type: 'standard',
                text: 'continue_with',
                shape: 'rectangular',
                width: safeWidth
              }
            );
            googleRenderedRef.current = true;
          }
        } catch (err) {
          googleRenderedRef.current = false;
        }
      } else if (attempts < 30) {
        attempts++;
        setTimeout(tryRender, 100);
      }
    };
    tryRender();
  };

  // Load social SDKs
  useEffect(() => {
    if (settings.google_login_enabled && window.google) {
      initGoogle();
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
    if (data?.customer) {
      localStorage.setItem('dv_customer', JSON.stringify(data.customer));
    } else {
      localStorage.removeItem('dv_customer');
    }
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
    <div className="font-sans bg-[#0a0a0f] min-h-screen flex flex-col">
      {/* Blobs */}
      <div className="fixed w-96 h-96 bg-[#f5c842] rounded-full blur-[100px] opacity-[0.08] -top-[100px] -left-[100px] pointer-events-none"></div>
      <div className="fixed w-80 h-80 bg-[#7c3aed] rounded-full blur-[100px] opacity-[0.08] -bottom-[80px] -right-[80px] pointer-events-none"></div>

      {/* Nav */}
      <nav className="bg-[#0a0a0f]/90 border-b border-[#f5c842]/10 backdrop-blur-[20px] py-4 px-6 sticky top-0 z-10">
        <div className="max-w-[1152px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-['Syne',sans-serif] text-xl font-bold text-[#f5c842] no-underline flex items-center gap-2">
            {settings.app_logo ? (
              <img src={settings.app_logo} alt={settings.app_name} className="h-7 w-auto object-contain" />
            ) : null}
            {settings.app_name}
          </Link>
          <Link href="/" className="text-[#6b7280] text-sm no-underline">← Back to Store</Link>
        </div>
      </nav>

      {/* Facebook In-App Browser Banner */}
      {isInAppBrowser && (
        <div className="bg-[#1877f2] text-white text-center px-4 py-3 text-sm">
          <p className="mb-2 font-semibold">Google Sign-In ke liye Chrome mein open karein 👇</p>
          <a
            href={getExternalBrowserUrl()}
            className="inline-block bg-white text-[#1877f2] font-bold px-5 py-2 rounded-lg text-sm no-underline"
          >
            🌐 Chrome mein Open Karein
          </a>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex items-center justify-center py-4 md:py-8 px-4 relative z-[1]">
        <div className="bg-[#12121a] border border-[#f5c842]/15 rounded-[16px] md:rounded-[20px] p-5 sm:p-7 md:p-9 w-full max-w-[420px] shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          <style jsx>{`
            @keyframes skeleton-loading {
              0% { background-position: 100% 50%; }
              100% { background-position: 0 50%; }
            }
            .skeleton {
              background: linear-gradient(90deg, #161622 25%, #222232 50%, #161622 75%);
              background-size: 200% 100%;
              animation: skeleton-loading 1.5s infinite ease-in-out;
            }
          `}</style>

          {loadingSettings ? (
            <div className="flex flex-col gap-4">
              {/* Header Skeleton */}
              <div className="text-center mb-4 md:mb-6">
                <div className="skeleton h-6 w-36 mx-auto mb-2 rounded-lg" />
                <div className="skeleton h-4 w-48 mx-auto rounded-lg" />
              </div>

              {/* Tabs Skeleton */}
              <div className="flex gap-2 mb-4 bg-[#1a1a2a]/40 p-1 rounded-xl">
                <div className="skeleton h-8 flex-1 rounded-lg" />
                <div className="skeleton h-8 flex-1 rounded-lg" />
              </div>

              {/* Input 1 Skeleton */}
              <div className="flex flex-col gap-1.5">
                <div className="skeleton h-4.5 w-24 rounded-lg" />
                <div className="skeleton h-10 w-full rounded-xl" />
              </div>

              {/* Input 2 Skeleton */}
              <div className="flex flex-col gap-1.5">
                <div className="skeleton h-4.5 w-16 rounded-lg" />
                <div className="skeleton h-10 w-full rounded-xl" />
                <div className="skeleton h-3.5 w-24 align-right self-end mt-1 rounded-lg" />
              </div>

              {/* CTA Button Skeleton */}
              <div className="skeleton h-10 w-full mt-2 rounded-xl" />

              {/* Divider Skeleton */}
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-white/5"></div>
                <div className="skeleton h-3.5 w-24 mx-3 rounded-lg" />
                <div className="flex-1 border-t border-white/5"></div>
              </div>

              {/* Social Login Button Skeleton */}
              <div className="skeleton h-10 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <div className="text-center mb-4 md:mb-6">
                <h2 className="font-['Syne',sans-serif] text-xl md:text-[1.6rem] font-bold text-white mb-1">Welcome Back</h2>
                <p className="text-[#6b7280] text-xs md:text-sm">Login to your {settings.app_name} account</p>
              </div>

              <div className="flex gap-2 mb-4 md:mb-6 bg-[#1a1a2a] p-1 rounded-xl overflow-x-auto [scrollbar-width:none]">
                {settings.password_login_enabled && (
                  <button
                    onClick={() => changeTab('password')}
                    className={`flex-1 min-w-[90px] p-2.5 rounded-lg border-none cursor-pointer text-sm font-semibold transition-all duration-200 ${activeTab === 'password' ? 'bg-[#2d2d3a] text-white' : 'bg-transparent text-[#6b7280]'}`}
                  >
                    Password
                  </button>
                )}
                {settings.email_otp_enabled && (
                  <button
                    onClick={() => changeTab('email')}
                    className={`flex-1 min-w-[90px] p-2.5 rounded-lg border-none cursor-pointer text-sm font-semibold transition-all duration-200 ${activeTab === 'email' ? 'bg-[#2d2d3a] text-white' : 'bg-transparent text-[#6b7280]'}`}
                  >
                    Email OTP
                  </button>
                )}
                {settings.mobile_otp_enabled && (
                  <button
                    onClick={() => changeTab('mobile')}
                    className={`flex-1 min-w-[90px] p-2.5 rounded-lg border-none cursor-pointer text-sm font-semibold transition-all duration-200 ${activeTab === 'mobile' ? 'bg-[#2d2d3a] text-white' : 'bg-transparent text-[#6b7280]'}`}
                  >
                    Mobile OTP
                  </button>
                )}
              </div>

              {!activeTab && !hasSocialLogins ? (
                <div className="text-[#9ca3af] text-center p-5">Loading login methods...</div>
              ) : activeTab === 'password' ? (
                <div className="flex flex-col gap-3 md:gap-4">
                  <div>
                    <label className="text-xs text-[#9ca3af] block mb-1 font-semibold">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && loginPassword()}
                      placeholder="your@email.com"
                      className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl text-sm font-sans transition-colors duration-200 focus:border-[#f5c842]/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] block mb-1 font-semibold">Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && loginPassword()}
                        placeholder="••••••••"
                        className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full pl-3.5 pr-12 py-2.5 md:pl-4 md:py-3 rounded-xl text-sm font-sans transition-colors duration-200 focus:border-[#f5c842]/50"
                      />
                      <button onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#6b7280] text-base">
                        {showPass ? '🙈' : '👁'}
                      </button>
                    </div>
                    <div className="text-right mt-1">
                      <Link href="/forgot-password" className="text-[#9ca3af] text-xs no-underline font-medium">Forgot Password?</Link>
                    </div>
                  </div>

                  {error && (
                    <div className="text-[#ef4444] text-[0.8rem] px-3 py-2 bg-[#ef4444]/5 rounded-lg border border-[#ef4444]/20">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={loginPassword}
                    disabled={loading}
                    className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne',sans-serif] font-bold border-none w-full py-2.5 md:py-3.5 rounded-xl text-base mt-0.5 transition-transform duration-200 disabled:opacity-70 disabled:cursor-not-allowed enabled:hover:scale-[1.02]"
                  >
                    {loading ? 'Logging in...' : 'Login →'}
                  </button>
                </div>
              ) : activeTab === 'email' || activeTab === 'mobile' ? (
                <div className="flex flex-col gap-3 md:gap-4">
                  {otpStep === 1 ? (
                    <div>
                      <label className="text-xs text-[#9ca3af] block mb-1 font-semibold">
                        {activeTab === 'email' ? 'Email Address' : 'Mobile Number'}
                      </label>
                      <input
                        type={activeTab === 'email' ? 'email' : 'tel'}
                        value={identifier}
                        onChange={e => setIdentifier(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendOtp()}
                        placeholder={getPlaceholder()}
                        className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl text-sm font-sans transition-colors duration-200 focus:border-[#f5c842]/50"
                      />
                      {error && (
                        <div className="text-[#ef4444] text-[0.8rem] px-3 py-2 bg-[#ef4444]/5 rounded-lg border border-[#ef4444]/20 mt-3">
                          {error}
                        </div>
                      )}
                      <button
                        onClick={sendOtp}
                        disabled={loading}
                        className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne',sans-serif] font-bold border-none w-full py-2.5 md:py-3.5 rounded-xl text-base mt-3 transition-transform duration-200 disabled:opacity-70 disabled:cursor-not-allowed enabled:hover:scale-[1.02]"
                      >
                        {loading ? 'Sending...' : 'Send OTP →'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs text-[#9ca3af] block mb-1 font-semibold">
                        Enter {settings.otp_length}-Digit OTP
                      </label>
                      <input
                        type="text"
                        maxLength={settings.otp_length}
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                        placeholder={"0".repeat(settings.otp_length)}
                        className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl text-xl tracking-[4px] text-center font-sans transition-colors duration-200 focus:border-[#f5c842]/50"
                      />
                      {error && (
                        <div className="text-[#ef4444] text-[0.8rem] px-3 py-2 bg-[#ef4444]/5 rounded-lg border border-[#ef4444]/20 mt-3">
                          {error}
                        </div>
                      )}
                      <button
                        onClick={verifyOtp}
                        disabled={loading || otpCode.length < settings.otp_length}
                        className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne',sans-serif] font-bold border-none w-full py-2.5 md:py-3.5 rounded-xl text-base mt-3 transition-transform duration-200 disabled:opacity-70 disabled:cursor-not-allowed enabled:hover:scale-[1.02]"
                      >
                        {loading ? 'Verifying...' : 'Verify & Login →'}
                      </button>
                      <div className="flex justify-between items-center mt-4">
                        <button onClick={() => setOtpStep(1)} className="bg-transparent border-none text-[#9ca3af] cursor-pointer text-sm">← Back</button>
                        <button onClick={sendOtp} disabled={timer > 0 || loading} className="bg-transparent border-none text-sm font-semibold disabled:cursor-not-allowed disabled:text-[#4b5563] enabled:text-[#f5c842] enabled:cursor-pointer">
                          {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {hasSocialLogins && (
                <>
                  <div className="flex items-center my-4 md:my-6">
                    <div className="flex-1 border-t border-white/5"></div>
                    <span className="px-3 text-[#6b7280] text-[0.8rem] font-semibold uppercase">or continue with</span>
                    <div className="flex-1 border-t border-white/5"></div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {settings.google_login_enabled && (
                      isInAppBrowser ? (
                        <div className="w-full text-center px-3 py-3 bg-[#1a1a2a] border border-[#f5c842]/20 rounded-xl text-[#9ca3af] text-sm">
                          Google Sign-In ke liye upar diye button se <strong className="text-[#f5c842]">Chrome mein open karein</strong>
                        </div>
                      ) : (
                      <div className="w-full flex justify-center overflow-hidden rounded-xl bg-white hover:scale-[1.02] transition-transform duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                        <div 
                          id="googleSignInDiv" 
                          className="w-full flex justify-center overflow-hidden rounded-xl [&>iframe]:!rounded-xl [&>iframe]:!overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = getGoogleOAuthUrl();
                            }}
                            className="flex items-center justify-center gap-2.5 w-full p-3 bg-white text-black border-none text-[0.95rem] font-semibold cursor-pointer font-sans"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                            </svg>
                            Continue with Google
                          </button>
                        </div>
                      </div>
                      )
                    )}
                    {settings.apple_login_enabled && (
                      <button onClick={handleAppleLogin} className="flex items-center justify-center gap-2.5 w-full p-3 bg-black text-white border border-white/20 rounded-xl text-[0.95rem] font-semibold cursor-pointer transition-transform duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-[1.02]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16.365 14.802c.026 3.238 2.806 4.316 2.836 4.327-.023.078-.445 1.545-1.503 3.093-1.022 1.496-2.096 2.987-3.766 3.017-1.637.032-2.176-.97-4.043-.97-1.868 0-2.463.936-4.015 1.002-1.605.06-2.83-1.616-3.856-3.1-2.09-3.056-3.69-8.625-1.55-12.336 1.06-1.833 2.92-2.997 4.965-3.03 1.57-.033 3.064 1.05 4.043 1.05 1.008 0 2.825-1.306 4.776-1.114 1.028.046 3.25.412 4.793 2.68-1.597.986-2.585 2.766-2.58 4.675a4.707 4.707 0 00-.1 4.706M15.42 4.24a4.444 4.444 0 001.077-3.16 4.636 4.636 0 00-3.065 1.56 4.303 4.303 0 00-1.1 3.096 3.738 3.738 0 003.088-1.496z"/>
                        </svg>
                        Apple
                      </button>
                    )}
                  </div>
                  
                  {error && (!activeTab || hasSocialLogins) && (
                    <div className="text-[#ef4444] text-[0.8rem] px-3.5 py-2.5 bg-[#ef4444]/5 rounded-lg border border-[#ef4444]/20 mt-4 text-center">
                      {error}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          <div className="border-t border-white/5 my-5"></div>
          <p className="text-center text-[#6b7280] text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#f5c842] font-semibold no-underline">Register here</Link>
          </p>
          <Script
            src="https://accounts.google.com/gsi/client"
            onLoad={initGoogle}
            strategy="afterInteractive"
          />
        </div>
      </div>
    </div>
  );
}
