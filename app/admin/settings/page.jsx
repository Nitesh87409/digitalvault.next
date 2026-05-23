'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const refundRef = useRef(null);
  const termsRef = useRef(null);

  const [settings, setSettings] = useState({
    password_login_enabled: true,
    email_otp_enabled: true,
    mobile_otp_enabled: false,
    google_login_enabled: false,
    apple_login_enabled: false,
    otp_expiry_minutes: 5,
    otp_max_attempts: 5,
    otp_length: 6,
    otp_resend_cooldown_seconds: 60,
    support_email: 'support@digitalvault.in',
    support_phone: '+91 98765 43210',
    business_hours: 'Mon–Sat, 10am–6pm IST',
    app_name: '',
    app_logo: '',
    refund_policy_content: '',
    terms_privacy_content: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(''); // Stores the name of the section being saved
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('branding');

  useEffect(() => {
    fetchSettings();
  }, []);

  const loadRichEditors = (currentSettings = settings) => {
    setTimeout(() => {
      if (refundRef.current) refundRef.current.innerHTML = currentSettings.refund_policy_content || '';
      if (termsRef.current) termsRef.current.innerHTML = currentSettings.terms_privacy_content || '';
    }, 50);
  };

  const fmt = (cmd, val = null, activeRef = 'refund') => {
    const ref = activeRef === 'refund' ? refundRef : termsRef;
    ref.current?.focus();
    document.execCommand(cmd, false, val);
  };

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (data.flag && data.settings) {
        const fetched = {
          password_login_enabled: data.settings.password_login_enabled ?? true,
          email_otp_enabled: data.settings.email_otp_enabled ?? true,
          mobile_otp_enabled: data.settings.mobile_otp_enabled ?? false,
          google_login_enabled: data.settings.google_login_enabled ?? false,
          apple_login_enabled: data.settings.apple_login_enabled ?? false,
          otp_expiry_minutes: data.settings.otp_expiry_minutes ?? 5,
          otp_max_attempts: data.settings.otp_max_attempts ?? 5,
          otp_length: data.settings.otp_length ?? 6,
          otp_resend_cooldown_seconds: data.settings.otp_resend_cooldown_seconds ?? 60,
          support_email: data.settings.support_email ?? 'support@digitalvault.in',
          support_phone: data.settings.support_phone ?? '+91 98765 43210',
          business_hours: data.settings.business_hours ?? 'Mon–Sat, 10am–6pm IST',
          app_name: data.settings.app_name ?? '',
          app_logo: data.settings.app_logo ?? '',
          refund_policy_content: data.settings.refund_policy_content ?? '',
          terms_privacy_content: data.settings.terms_privacy_content ?? ''
        };
        setSettings(fetched);
        if (activeTab === 'pages') {
          loadRichEditors(fetched);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function saveSectionSettings(sectionKeys, sectionName) {
    setSaving(sectionName);
    setMessage('');
    
    const payload = {};
    sectionKeys.forEach(k => payload[k] = settings[k]);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.flag) {
        setMessage(`${sectionName} saved successfully!`);
      } else {
        setMessage(data.message || `Failed to save ${sectionName}`);
      }
    } catch (e) {
      setMessage('Connection error');
    }
    setSaving('');
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(''), 3000);
  }

  async function saveSectionSettingsDirect(payload, sectionName) {
    setSaving(sectionName);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.flag) {
        setMessage(`${sectionName} saved successfully!`);
      } else {
        setMessage(data.message || `Failed to save ${sectionName}`);
      }
    } catch (e) {
      setMessage('Connection error');
    }
    setSaving('');
    setTimeout(() => setMessage(''), 3000);
  }

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSaving('branding');
    setMessage('Uploading logo...');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.flag && data.url) {
        setSettings(prev => ({ ...prev, app_logo: data.url }));
        setMessage('Logo uploaded! Please save settings.');
      } else {
        setMessage('Logo upload failed.');
      }
    } catch(err) {
      setMessage('Error uploading logo.');
    }
    setSaving('');
  };

  const tabs = [
    { id: 'branding', label: 'Branding & Website Settings' },
    { id: 'contact', label: 'Contact & Support Settings' },
    { id: 'login', label: 'Login Methods' },
    { id: 'social', label: 'Social Login Methods' },
    { id: 'pages', label: 'Custom Pages Content' }
  ];

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
        <h1 className="font-syne text-2xl md:text-3xl font-bold text-[var(--heading)] tracking-tight">⚙️ Settings</h1>
      </div>

      <div className="w-full max-w-6xl mx-auto my-2 px-2 flex-1 flex flex-col md:flex-row gap-6 lg:gap-10">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { 
                  setActiveTab(tab.id); 
                  setMessage(''); 
                  if (tab.id === 'pages') {
                    loadRichEditors();
                  }
                }}
                className={`text-left whitespace-nowrap px-4 py-3 rounded-xl font-syne font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#f5c842]/20 to-transparent text-[#f5c842] border-l-2 border-[#f5c842]'
                    : 'text-[var(--muted)] border-l-2 border-transparent hover:bg-[var(--surface-muted)] hover:text-[var(--heading)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="p-8 text-center text-[var(--muted)]">Loading settings...</div>
          ) : (
            <div className="flex flex-col gap-6">
              
              {/* BRANDING TAB */}
              {activeTab === 'branding' && (
                <div className="bg-[var(--surface-2)] rounded-2xl p-5 sm:p-8 border border-[var(--line)] shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="text-xl font-syne font-bold text-[var(--heading)] mb-6">Branding & Website Settings</h2>
                  
                  <div className="grid grid-cols-1 gap-6 mb-8">
                    <div>
                      <label className="text-sm font-semibold text-[var(--muted)] block mb-2 uppercase tracking-wider">Website Display Name</label>
                      <input
                        type="text"
                        value={settings.app_name}
                        onChange={(e) => handleChange('app_name', e.target.value)}
                        placeholder={process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault'}
                        className="bg-[var(--surface)] border border-[var(--line)] text-[var(--heading)] px-4 py-3 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors"
                      />
                      <p className="text-xs text-[var(--muted-2)] mt-2">Leave blank to use the ENV variable (NEXT_PUBLIC_APP_NAME).</p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-[var(--muted)] block mb-2 uppercase tracking-wider">Website Logo</label>
                      <div className="flex items-center gap-4">
                        {settings.app_logo && (
                          <img src={settings.app_logo} alt="Logo" className="w-16 h-16 object-contain bg-white rounded-lg p-1" />
                        )}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="text-sm text-[var(--muted)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#f5c842]/10 file:text-[#f5c842] hover:file:bg-[#f5c842]/20"
                          />
                          <p className="text-xs text-[var(--muted-2)] mt-2">Upload a logo to display in the navbar and emails.</p>
                          {settings.app_logo && (
                            <button type="button" onClick={() => handleChange('app_logo', '')} className="text-xs text-red-500 mt-2 hover:underline">Remove Logo</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t border-[var(--line)]">
                    <button
                      onClick={() => saveSectionSettings(['app_name', 'app_logo'], 'Branding settings')}
                      disabled={saving === 'Branding settings'}
                      className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-8 py-3 rounded-xl shadow-lg shadow-[#f5c842]/20 cursor-pointer transition-transform ${saving === 'Branding settings' ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                    >
                      {saving === 'Branding settings' ? 'Saving...' : 'Save Branding'}
                    </button>
                    {message && <span className={`font-medium text-sm ${message.includes('success') ? 'text-[#10b981]' : 'text-red-500'}`}>{message}</span>}
                  </div>
                </div>
              )}

              {/* CONTACT TAB */}
              {activeTab === 'contact' && (
                <div className="bg-[var(--surface-2)] rounded-2xl p-5 sm:p-8 border border-[var(--line)] shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="text-xl font-syne font-bold text-[var(--heading)] mb-6">Contact & Support Settings</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div className="sm:col-span-2">
                      <label className="text-sm font-semibold text-[var(--muted)] block mb-2 uppercase tracking-wider">Support Email</label>
                      <input
                        type="email"
                        value={settings.support_email}
                        onChange={(e) => handleChange('support_email', e.target.value)}
                        className="bg-[var(--surface)] border border-[var(--line)] text-[var(--heading)] px-4 py-3 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-[var(--muted)] block mb-2 uppercase tracking-wider">Support Phone</label>
                      <input
                        type="text"
                        value={settings.support_phone}
                        onChange={(e) => handleChange('support_phone', e.target.value)}
                        className="bg-[var(--surface)] border border-[var(--line)] text-[var(--heading)] px-4 py-3 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-[var(--muted)] block mb-2 uppercase tracking-wider">Business Hours</label>
                      <input
                        type="text"
                        value={settings.business_hours}
                        onChange={(e) => handleChange('business_hours', e.target.value)}
                        className="bg-[var(--surface)] border border-[var(--line)] text-[var(--heading)] px-4 py-3 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t border-[var(--line)]">
                    <button
                      onClick={() => saveSectionSettings(['support_email', 'support_phone', 'business_hours'], 'Contact settings')}
                      disabled={saving === 'Contact settings'}
                      className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-8 py-3 rounded-xl shadow-lg shadow-[#f5c842]/20 cursor-pointer transition-transform ${saving === 'Contact settings' ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                    >
                      {saving === 'Contact settings' ? 'Saving...' : 'Save Contact'}
                    </button>
                    {message && <span className={`font-medium text-sm ${message.includes('success') ? 'text-[#10b981]' : 'text-red-500'}`}>{message}</span>}
                  </div>
                </div>
              )}

              {/* LOGIN TAB */}
              {activeTab === 'login' && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-[var(--surface-2)] rounded-2xl p-5 sm:p-8 border border-[var(--line)] shadow-[var(--shadow-soft)]">
                    <h2 className="text-xl font-syne font-bold text-[var(--heading)] mb-6">Login Methods</h2>
                    
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-[var(--line-soft)]">
                      <div className="pr-4">
                        <div className="font-semibold text-[var(--heading)] mb-1">Password Login</div>
                        <div className="text-sm text-[var(--muted-2)]">Allow users to login with email and password.</div>
                      </div>
                      <label className="relative inline-block w-12 h-6 shrink-0">
                        <input type="checkbox" checked={settings.password_login_enabled} onChange={(e) => handleChange('password_login_enabled', e.target.checked)} className="opacity-0 w-0 h-0" />
                        <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${settings.password_login_enabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                          <span className={`absolute h-4 w-4 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${settings.password_login_enabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-[var(--line-soft)]">
                      <div className="pr-4">
                        <div className="font-semibold text-[var(--heading)] mb-1">Email OTP Login</div>
                        <div className="text-sm text-[var(--muted-2)]">Allow users to login with a one-time password sent to their email.</div>
                      </div>
                      <label className="relative inline-block w-12 h-6 shrink-0">
                        <input type="checkbox" checked={settings.email_otp_enabled} onChange={(e) => handleChange('email_otp_enabled', e.target.checked)} className="opacity-0 w-0 h-0" />
                        <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${settings.email_otp_enabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                          <span className={`absolute h-4 w-4 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${settings.email_otp_enabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <div className="font-semibold text-[var(--heading)] mb-1">Mobile OTP Login</div>
                        <div className="text-sm text-[var(--muted-2)]">Allow users to login with a one-time password sent via SMS.</div>
                      </div>
                      <label className="relative inline-block w-12 h-6 shrink-0">
                        <input type="checkbox" checked={settings.mobile_otp_enabled} onChange={(e) => handleChange('mobile_otp_enabled', e.target.checked)} className="opacity-0 w-0 h-0" />
                        <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${settings.mobile_otp_enabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                          <span className={`absolute h-4 w-4 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${settings.mobile_otp_enabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-[var(--surface-2)] rounded-2xl p-5 sm:p-8 border border-[var(--line)] shadow-[var(--shadow-soft)]">
                    <h2 className="text-xl font-syne font-bold text-[var(--heading)] mb-6">OTP Configuration</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                      <div>
                        <label className="text-sm font-semibold text-[var(--muted)] block mb-2 uppercase tracking-wider">OTP Expiry Time (Minutes)</label>
                        <select
                          value={settings.otp_expiry_minutes}
                          onChange={(e) => handleChange('otp_expiry_minutes', parseInt(e.target.value))}
                          className="bg-[var(--surface)] border border-[var(--line)] text-[var(--heading)] px-4 py-3 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors cursor-pointer appearance-none"
                        >
                          <option value={1}>1 Minute</option>
                          <option value={3}>3 Minutes</option>
                          <option value={5}>5 Minutes</option>
                          <option value={10}>10 Minutes</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-[var(--muted)] block mb-2 uppercase tracking-wider">OTP Length</label>
                        <select
                          value={settings.otp_length}
                          onChange={(e) => handleChange('otp_length', parseInt(e.target.value))}
                          className="bg-[var(--surface)] border border-[var(--line)] text-[var(--heading)] px-4 py-3 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors cursor-pointer appearance-none"
                        >
                          <option value={4}>4 Digits</option>
                          <option value={6}>6 Digits</option>
                          <option value={8}>8 Digits</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-[var(--muted)] block mb-2 uppercase tracking-wider">Max OTP Attempts</label>
                        <select
                          value={settings.otp_max_attempts}
                          onChange={(e) => handleChange('otp_max_attempts', parseInt(e.target.value))}
                          className="bg-[var(--surface)] border border-[var(--line)] text-[var(--heading)] px-4 py-3 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors cursor-pointer appearance-none"
                        >
                          <option value={3}>3 Attempts</option>
                          <option value={5}>5 Attempts</option>
                          <option value={10}>10 Attempts</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-[var(--muted)] block mb-2 uppercase tracking-wider">OTP Resend Cooldown</label>
                        <select
                          value={settings.otp_resend_cooldown_seconds}
                          onChange={(e) => handleChange('otp_resend_cooldown_seconds', parseInt(e.target.value))}
                          className="bg-[var(--surface)] border border-[var(--line)] text-[var(--heading)] px-4 py-3 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors cursor-pointer appearance-none"
                        >
                          <option value={30}>30 Seconds</option>
                          <option value={60}>60 Seconds</option>
                          <option value={120}>120 Seconds</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t border-[var(--line)]">
                      <button
                        onClick={() => saveSectionSettings(['password_login_enabled', 'email_otp_enabled', 'mobile_otp_enabled', 'otp_expiry_minutes', 'otp_length', 'otp_max_attempts', 'otp_resend_cooldown_seconds'], 'Login settings')}
                        disabled={saving === 'Login settings'}
                        className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-8 py-3 rounded-xl shadow-lg shadow-[#f5c842]/20 cursor-pointer transition-transform ${saving === 'Login settings' ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                      >
                        {saving === 'Login settings' ? 'Saving...' : 'Save Login Settings'}
                      </button>
                      {message && <span className={`font-medium text-sm ${message.includes('success') ? 'text-[#10b981]' : 'text-red-500'}`}>{message}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* SOCIAL TAB */}
              {activeTab === 'social' && (
                <div className="bg-[var(--surface-2)] rounded-2xl p-5 sm:p-8 border border-[var(--line)] shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="text-xl font-syne font-bold text-[var(--heading)] mb-6">Social Login Methods</h2>
                  
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-[var(--line-soft)]">
                    <div className="pr-4">
                      <div className="font-semibold text-[var(--heading)] mb-1">Google Login</div>
                      <div className="text-sm text-[var(--muted-2)]">Allow users to login with Google.</div>
                    </div>
                    <label className="relative inline-block w-12 h-6 shrink-0">
                      <input type="checkbox" checked={settings.google_login_enabled} onChange={(e) => handleChange('google_login_enabled', e.target.checked)} className="opacity-0 w-0 h-0" />
                      <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${settings.google_login_enabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                        <span className={`absolute h-4 w-4 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${settings.google_login_enabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between mb-8">
                    <div className="pr-4">
                      <div className="font-semibold text-[var(--heading)] mb-1">Apple Login</div>
                      <div className="text-sm text-[var(--muted-2)]">Allow users to login with Apple.</div>
                    </div>
                    <label className="relative inline-block w-12 h-6 shrink-0">
                      <input type="checkbox" checked={settings.apple_login_enabled} onChange={(e) => handleChange('apple_login_enabled', e.target.checked)} className="opacity-0 w-0 h-0" />
                      <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${settings.apple_login_enabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                        <span className={`absolute h-4 w-4 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${settings.apple_login_enabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t border-[var(--line)]">
                    <button
                      onClick={() => saveSectionSettings(['google_login_enabled', 'apple_login_enabled'], 'Social settings')}
                      disabled={saving === 'Social settings'}
                      className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-8 py-3 rounded-xl shadow-lg shadow-[#f5c842]/20 cursor-pointer transition-transform ${saving === 'Social settings' ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                    >
                      {saving === 'Social settings' ? 'Saving...' : 'Save Social Settings'}
                    </button>
                    {message && <span className={`font-medium text-sm ${message.includes('success') ? 'text-[#10b981]' : 'text-red-500'}`}>{message}</span>}
                  </div>
                </div>
              )}

              {/* PAGES TAB */}
              {activeTab === 'pages' && (
                <div className="bg-[var(--surface-2)] rounded-2xl p-5 sm:p-8 border border-[var(--line)] shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="text-xl font-syne font-bold text-[var(--heading)] mb-6">📝 Custom Pages Content Settings</h2>
                  
                  <div className="flex flex-col gap-8">
                    
                    {/* REFUND POLICY SECTION */}
                    <div className="mb-2 border-b border-white/5 pb-8">
                      <label className="text-sm font-semibold text-[#f5c842] block mb-3 uppercase tracking-wider">Refund Policy Content</label>
                      <div className="flex flex-col border border-white/10 rounded-2xl overflow-hidden bg-[#0e0e18] mb-4">
                        {/* Editor Toolbar */}
                        <div className="bg-[#12121a] border-b border-white/10 p-2 flex flex-wrap gap-1.5 items-center w-full overflow-x-auto custom-scrollbar shrink-0">
                          {[['bold','B','font-extrabold'],['italic','I','italic'],['underline','U','underline'],['strikeThrough','S','line-through']].map(([cmd,label,className]) => (
                            <button key={cmd} type="button" onClick={() => fmt(cmd, null, 'refund')} className={`bg-white/5 border border-white/10 text-gray-200 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors shrink-0 ${className}`}>{label}</button>
                          ))}
                          <div className="w-[1px] h-6 bg-white/10 mx-1 shrink-0"></div>
                          <button type="button" onClick={() => fmt('insertUnorderedList', null, 'refund')} className="bg-white/5 border border-white/10 text-gray-200 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors shrink-0">• List</button>
                          <button type="button" onClick={() => fmt('insertOrderedList', null, 'refund')} className="bg-white/5 border border-white/10 text-gray-200 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors shrink-0">1. List</button>
                          <select onChange={e => { fmt('fontSize', e.target.value, 'refund'); e.target.value=''; }} className="bg-white/5 border border-white/10 text-gray-200 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors outline-none appearance-none shrink-0">
                            <option value="" className="bg-[#12121a]">Size</option>
                            {[['1','Small'],['3','Normal'],['5','Large'],['7','Huge']].map(([v,l]) => <option key={v} value={v} className="bg-[#12121a]">{l}</option>)}
                          </select>
                          <select onChange={e => { fmt('foreColor', e.target.value, 'refund'); e.target.value=''; }} className="bg-white/5 border border-white/10 text-gray-200 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors outline-none appearance-none shrink-0">
                            <option value="" className="bg-[#12121a]">Color</option>
                            {[['#f5c842','Gold'],['#ffffff','White'],['#10b981','Green'],['#ef4444','Red'],['#3b82f6','Blue']].map(([v,l]) => <option key={v} value={v} className="bg-[#12121a]">{l}</option>)}
                          </select>
                          <select onChange={e => { fmt('formatBlock', e.target.value, 'refund'); e.target.value=''; }} className="bg-white/5 border border-white/10 text-gray-200 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors outline-none appearance-none shrink-0">
                            <option value="" className="bg-[#12121a]">Heading</option>
                            {[['h1','H1'],['h2','H2'],['h3','H3'],['p','Normal']].map(([v,l]) => <option key={v} value={v} className="bg-[#12121a]">{l}</option>)}
                          </select>
                          <button type="button" onClick={() => fmt('removeFormat', null, 'refund')} className="bg-white/5 border border-white/10 text-red-400 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-red-500/20 transition-colors ml-auto shrink-0">✕ Clear</button>
                        </div>
                        {/* Editor body */}
                        <div ref={refundRef} className="w-full min-h-[220px] p-5 text-sm leading-[1.8] text-gray-200 bg-[#0a0a0f] outline-none overflow-y-auto custom-scrollbar whitespace-pre-wrap break-words focus:ring-2 focus:ring-[#f5c842]/20" contentEditable suppressContentEditableWarning />
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            const content = refundRef.current?.innerHTML || '';
                            setSettings(prev => ({ ...prev, refund_policy_content: content }));
                            saveSectionSettingsDirect({ refund_policy_content: content }, 'Refund Policy');
                          }}
                          disabled={saving === 'Refund Policy'}
                          className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-6 py-2.5 rounded-xl shadow-lg cursor-pointer transition-transform ${saving === 'Refund Policy' ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                        >
                          {saving === 'Refund Policy' ? 'Saving...' : '💾 Save Refund Policy'}
                        </button>
                        {message && saving === 'Refund Policy' && <span className="font-medium text-sm text-[#10b981] animate-pulse">{message}</span>}
                      </div>
                    </div>

                    {/* TERMS & PRIVACY SECTION */}
                    <div>
                      <label className="text-sm font-semibold text-[#f5c842] block mb-3 uppercase tracking-wider">Terms & Privacy Content</label>
                      <div className="flex flex-col border border-white/10 rounded-2xl overflow-hidden bg-[#0e0e18] mb-4">
                        {/* Editor Toolbar */}
                        <div className="bg-[#12121a] border-b border-white/10 p-2 flex flex-wrap gap-1.5 items-center w-full overflow-x-auto custom-scrollbar shrink-0">
                          {[['bold','B','font-extrabold'],['italic','I','italic'],['underline','U','underline'],['strikeThrough','S','line-through']].map(([cmd,label,className]) => (
                            <button key={cmd} type="button" onClick={() => fmt(cmd, null, 'terms')} className={`bg-white/5 border border-white/10 text-gray-200 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors shrink-0 ${className}`}>{label}</button>
                          ))}
                          <div className="w-[1px] h-6 bg-white/10 mx-1 shrink-0"></div>
                          <button type="button" onClick={() => fmt('insertUnorderedList', null, 'terms')} className="bg-white/5 border border-white/10 text-gray-200 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors shrink-0">• List</button>
                          <button type="button" onClick={() => fmt('insertOrderedList', null, 'terms')} className="bg-white/5 border border-white/10 text-gray-200 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors shrink-0">1. List</button>
                          <select onChange={e => { fmt('fontSize', e.target.value, 'terms'); e.target.value=''; }} className="bg-white/5 border border-white/10 text-gray-200 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors outline-none appearance-none shrink-0">
                            <option value="" className="bg-[#12121a]">Size</option>
                            {[['1','Small'],['3','Normal'],['5','Large'],['7','Huge']].map(([v,l]) => <option key={v} value={v} className="bg-[#12121a]">{l}</option>)}
                          </select>
                          <select onChange={e => { fmt('foreColor', e.target.value, 'terms'); e.target.value=''; }} className="bg-white/5 border border-white/10 text-gray-200 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors outline-none appearance-none shrink-0">
                            <option value="" className="bg-[#12121a]">Color</option>
                            {[['#f5c842','Gold'],['#ffffff','White'],['#10b981','Green'],['#ef4444','Red'],['#3b82f6','Blue']].map(([v,l]) => <option key={v} value={v} className="bg-[#12121a]">{l}</option>)}
                          </select>
                          <select onChange={e => { fmt('formatBlock', e.target.value, 'terms'); e.target.value=''; }} className="bg-white/5 border border-white/10 text-gray-200 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors outline-none appearance-none shrink-0">
                            <option value="" className="bg-[#12121a]">Heading</option>
                            {[['h1','H1'],['h2','H2'],['h3','H3'],['p','Normal']].map(([v,l]) => <option key={v} value={v} className="bg-[#12121a]">{l}</option>)}
                          </select>
                          <button type="button" onClick={() => fmt('removeFormat', null, 'terms')} className="bg-white/5 border border-white/10 text-red-400 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-red-500/20 transition-colors ml-auto shrink-0">✕ Clear</button>
                        </div>
                        {/* Editor body */}
                        <div ref={termsRef} className="w-full min-h-[220px] p-5 text-sm leading-[1.8] text-gray-200 bg-[#0a0a0f] outline-none overflow-y-auto custom-scrollbar whitespace-pre-wrap break-words focus:ring-2 focus:ring-[#f5c842]/20" contentEditable suppressContentEditableWarning />
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            const content = termsRef.current?.innerHTML || '';
                            setSettings(prev => ({ ...prev, terms_privacy_content: content }));
                            saveSectionSettingsDirect({ terms_privacy_content: content }, 'Terms & Privacy Policy');
                          }}
                          disabled={saving === 'Terms & Privacy Policy'}
                          className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-6 py-2.5 rounded-xl shadow-lg cursor-pointer transition-transform ${saving === 'Terms & Privacy Policy' ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                        >
                          {saving === 'Terms & Privacy Policy' ? 'Saving...' : '💾 Save Terms & Privacy'}
                        </button>
                        {message && saving === 'Terms & Privacy Policy' && <span className="font-medium text-sm text-[#10b981] animate-pulse">{message}</span>}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );
}
