'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function AdminSettingsPage() {
  const searchParams = useSearchParams();

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
    app_alt_name: '',
    app_logo: '',
    app_name_size: 20,
    refund_policy_content: '',
    terms_privacy_content: '',
    social_instagram_enabled: false,
    social_instagram_url: '',
    social_whatsapp_enabled: false,
    social_whatsapp_url: '',
    social_twitter_enabled: false,
    social_twitter_url: '',
    social_facebook_enabled: false,
    social_facebook_url: '',
    social_telegram_enabled: false,
    social_telegram_url: '',
    floating_support_enabled: true,
    floating_whatsapp_enabled: true,
    floating_telegram_enabled: true,
    floating_phone_enabled: true,
    floating_email_enabled: true,
    custom_social_links: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(''); // Stores the name of the section being saved
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('branding');

  const [newSocial, setNewSocial] = useState({ name: '', url: '', logo: '', enabled: true });

  const handleCustomLogoUpload = async (e, index = -1) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSaving(index === -1 ? 'new_custom_social' : `custom_social_${index}`);
    setMessage('Uploading logo...');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.flag && data.url) {
        if (index === -1) {
          setNewSocial(prev => ({ ...prev, logo: data.url }));
          setMessage('Logo uploaded!');
        } else {
          const updated = [...(settings.custom_social_links || [])];
          updated[index].logo = data.url;
          handleChange('custom_social_links', updated);
          setMessage('Logo uploaded! Please save settings.');
        }
      } else {
        setMessage('Logo upload failed.');
      }
    } catch(err) {
      setMessage('Error uploading logo.');
    }
    setSaving('');
    setTimeout(() => setMessage(''), 3000);
  };

  const addCustomSocial = () => {
    if (!newSocial.name || !newSocial.url) {
      setMessage('Name and URL are required.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    const updated = [...(settings.custom_social_links || []), { ...newSocial }];
    handleChange('custom_social_links', updated);
    saveSectionSettingsDirect({ custom_social_links: updated }, 'Custom Social Links');
    setNewSocial({ name: '', url: '', logo: '', enabled: true });
  };

  const deleteCustomSocial = (index) => {
    const updated = (settings.custom_social_links || []).filter((_, i) => i !== index);
    handleChange('custom_social_links', updated);
    saveSectionSettingsDirect({ custom_social_links: updated }, 'Custom Social Links');
  };

  const saveCustomSocialItem = (index) => {
    const updated = [...(settings.custom_social_links || [])];
    saveSectionSettingsDirect({ custom_social_links: updated }, `Custom Social ${updated[index].name}`);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['branding', 'contact', 'login', 'social', 'social_links'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
          app_alt_name: data.settings.app_alt_name ?? '',
          app_logo: data.settings.app_logo ?? '',
          app_name_size: data.settings.app_name_size ?? 20,
          refund_policy_content: data.settings.refund_policy_content ?? '',
          terms_privacy_content: data.settings.terms_privacy_content ?? '',
          social_instagram_enabled: data.settings.social_instagram_enabled ?? false,
          social_instagram_url: data.settings.social_instagram_url ?? '',
          social_whatsapp_enabled: data.settings.social_whatsapp_enabled ?? false,
          social_whatsapp_url: data.settings.social_whatsapp_url ?? '',
          social_twitter_enabled: data.settings.social_twitter_enabled ?? false,
          social_twitter_url: data.settings.social_twitter_url ?? '',
          social_facebook_enabled: data.settings.social_facebook_enabled ?? false,
          social_facebook_url: data.settings.social_facebook_url ?? '',
          social_telegram_enabled: data.settings.social_telegram_enabled ?? false,
          social_telegram_url: data.settings.social_telegram_url ?? '',
          floating_support_enabled: data.settings.floating_support_enabled ?? true,
          floating_whatsapp_enabled: data.settings.floating_whatsapp_enabled ?? true,
          floating_telegram_enabled: data.settings.floating_telegram_enabled ?? true,
          floating_phone_enabled: data.settings.floating_phone_enabled ?? true,
          floating_email_enabled: data.settings.floating_email_enabled ?? true,
          custom_social_links: Array.isArray(data.settings.custom_social_links) ? data.settings.custom_social_links : []
        };
        setSettings(fetched);
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
      if (data.flag && data.settings) {
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
    { id: 'social_links', label: 'Social Media Links' }
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
                <div className="flex flex-col gap-6">
                  {/* Card 1: Main Branding Settings */}
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
                        <label className="text-sm font-semibold text-[var(--muted)] block mb-2 uppercase tracking-wider">Website Name Font Size</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="12"
                            max="36"
                            value={settings.app_name_size || 20}
                            onChange={(e) => handleChange('app_name_size', parseInt(e.target.value))}
                            className="w-full h-2 bg-[var(--surface)] rounded-lg appearance-none cursor-pointer accent-[#f5c842]"
                            style={{ accentColor: '#f5c842' }}
                          />
                          <span className="font-syne font-bold text-lg text-[#f5c842] shrink-0 min-w-[48px] text-right">
                            {settings.app_name_size || 20}px
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted-2)] mt-2">Adjust the font size of the website name displayed next to the logo in headers (Default: 20px).</p>
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
                            <p className="text-xs text-[#f5c842] mt-1.5 font-semibold">Recommended size: 200px width × 50px height (Landscape) or 1:1 Square (min 128px × 128px)</p>
                            {settings.app_logo && (
                              <button type="button" onClick={() => handleChange('app_logo', '')} className="text-xs text-red-500 mt-2 hover:underline">Remove Logo</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t border-[var(--line)]">
                      <button
                        onClick={() => saveSectionSettings(['app_name', 'app_logo', 'app_name_size'], 'Branding settings')}
                        disabled={saving === 'Branding settings'}
                        className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-8 py-3 rounded-xl shadow-lg shadow-[#f5c842]/20 cursor-pointer transition-transform ${saving === 'Branding settings' ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                      >
                        {saving === 'Branding settings' ? 'Saving...' : 'Save Branding'}
                      </button>
                      {message && message.toLowerCase().includes('branding') && <span className={`font-medium text-sm ${message.includes('success') ? 'text-[#10b981]' : 'text-red-500'}`}>{message}</span>}
                    </div>
                  </div>

                  {/* Card 2: Google Search & SEO Settings */}
                  <div className="bg-[var(--surface-2)] rounded-2xl p-5 sm:p-8 border border-[var(--line)] shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-xl font-syne font-bold text-[var(--heading)] mb-6">Google Search / SEO Settings</h2>
                    
                    <div className="grid grid-cols-1 gap-6 mb-8">
                      <div>
                        <label className="text-sm font-semibold text-[var(--muted)] block mb-2 uppercase tracking-wider">Google Search / SEO Alternative Name (Spaced Brand Name)</label>
                        <input
                          type="text"
                          value={settings.app_alt_name}
                          onChange={(e) => handleChange('app_alt_name', e.target.value)}
                          placeholder="e.g. Download Kart"
                          className="bg-[var(--surface)] border border-[var(--line)] text-[var(--heading)] px-4 py-3 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors"
                        />
                        <p className="text-xs text-[var(--muted-2)] mt-2">Enter the spaced version or secondary SEO name of your brand (e.g., "Download Kart") to help Google index and rank spaced searches.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t border-[var(--line)]">
                      <button
                        onClick={() => saveSectionSettings(['app_alt_name'], 'SEO settings')}
                        disabled={saving === 'SEO settings'}
                        className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-8 py-3 rounded-xl shadow-lg shadow-[#f5c842]/20 cursor-pointer transition-transform ${saving === 'SEO settings' ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                      >
                        {saving === 'SEO settings' ? 'Saving...' : 'Save SEO Settings'}
                      </button>
                      {message && message.toLowerCase().includes('seo') && <span className={`font-medium text-sm ${message.includes('success') ? 'text-[#10b981]' : 'text-red-500'}`}>{message}</span>}
                    </div>
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

                  {/* Floating support widget controls */}
                  <div className="mt-8 pt-8 border-t border-[var(--line)]">
                    <h3 className="text-lg font-syne font-bold text-[var(--heading)] mb-2 flex items-center gap-2">
                      💬 Floating Support Widget Controls
                    </h3>
                    <p className="text-xs text-[var(--muted-2)] mb-6">
                      Configure your global "Contact Now" support widget floating at the bottom right. Toggle options to match your helpline status.
                    </p>

                    <div className="flex flex-col gap-4">
                      {/* Master Toggle */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
                        <div>
                          <div className="font-semibold text-sm text-[var(--heading)] mb-1">Enable Floating Support Button</div>
                          <div className="text-xs text-[var(--muted-2)]">Show the floating bubble globally on all pages (except Admin panel).</div>
                        </div>
                        <label className="relative inline-block w-12 h-6 shrink-0 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!!settings.floating_support_enabled} 
                            onChange={(e) => handleChange('floating_support_enabled', e.target.checked)} 
                            className="opacity-0 w-0 h-0" 
                          />
                          <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${settings.floating_support_enabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                            <span className={`absolute h-4 w-4 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${settings.floating_support_enabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
                          </span>
                        </label>
                      </div>

                      {/* Option Toggles */}
                      {settings.floating_support_enabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)]/50 animate-in fade-in slide-in-from-top-2 duration-300">
                          {/* WhatsApp Toggle */}
                          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface)] border border-[var(--line-soft)]">
                            <div>
                              <div className="font-medium text-xs text-[var(--heading)]">Show WhatsApp Link</div>
                              <div className="text-[10px] text-[var(--muted-2)]">Direct WhatsApp chat option</div>
                            </div>
                            <label className="relative inline-block w-10 h-5 shrink-0 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={!!settings.floating_whatsapp_enabled} 
                                onChange={(e) => handleChange('floating_whatsapp_enabled', e.target.checked)} 
                                className="opacity-0 w-0 h-0" 
                              />
                              <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${settings.floating_whatsapp_enabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                                <span className={`absolute h-3 w-3 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${settings.floating_whatsapp_enabled ? 'translate-x-5' : 'translate-x-0'}`}></span>
                              </span>
                            </label>
                          </div>

                          {/* Telegram Toggle */}
                          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface)] border border-[var(--line-soft)]">
                            <div>
                              <div className="font-medium text-xs text-[var(--heading)]">Show Telegram Channel</div>
                              <div className="text-[10px] text-[var(--muted-2)]">Direct Telegram chat option</div>
                            </div>
                            <label className="relative inline-block w-10 h-5 shrink-0 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={!!settings.floating_telegram_enabled} 
                                onChange={(e) => handleChange('floating_telegram_enabled', e.target.checked)} 
                                className="opacity-0 w-0 h-0" 
                              />
                              <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${settings.floating_telegram_enabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                                <span className={`absolute h-3 w-3 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${settings.floating_telegram_enabled ? 'translate-x-5' : 'translate-x-0'}`}></span>
                              </span>
                            </label>
                          </div>

                          {/* Phone Helpline Toggle */}
                          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface)] border border-[var(--line-soft)]">
                            <div>
                              <div className="font-medium text-xs text-[var(--heading)]">Show Call Helpline</div>
                              <div className="text-[10px] text-[var(--muted-2)]">Direct telephone call option</div>
                            </div>
                            <label className="relative inline-block w-10 h-5 shrink-0 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={!!settings.floating_phone_enabled} 
                                onChange={(e) => handleChange('floating_phone_enabled', e.target.checked)} 
                                className="opacity-0 w-0 h-0" 
                              />
                              <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${settings.floating_phone_enabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                                <span className={`absolute h-3 w-3 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${settings.floating_phone_enabled ? 'translate-x-5' : 'translate-x-0'}`}></span>
                              </span>
                            </label>
                          </div>

                          {/* Email Support Toggle */}
                          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface)] border border-[var(--line-soft)]">
                            <div>
                              <div className="font-medium text-xs text-[var(--heading)]">Show Email Support</div>
                              <div className="text-[10px] text-[var(--muted-2)]">Direct email mailto link</div>
                            </div>
                            <label className="relative inline-block w-10 h-5 shrink-0 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={!!settings.floating_email_enabled} 
                                onChange={(e) => handleChange('floating_email_enabled', e.target.checked)} 
                                className="opacity-0 w-0 h-0" 
                              />
                              <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${settings.floating_email_enabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                                <span className={`absolute h-3 w-3 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${settings.floating_email_enabled ? 'translate-x-5' : 'translate-x-0'}`}></span>
                              </span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t border-[var(--line)] mt-6">
                    <button
                      onClick={() => saveSectionSettings(['support_email', 'support_phone', 'business_hours', 'floating_support_enabled', 'floating_whatsapp_enabled', 'floating_telegram_enabled', 'floating_phone_enabled', 'floating_email_enabled'], 'Contact settings')}
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

              {/* SOCIAL MEDIA LINKS TAB */}
              {activeTab === 'social_links' && (
                <div className="bg-[var(--surface-2)] rounded-2xl p-5 sm:p-8 border border-[var(--line)] shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="text-xl font-syne font-bold text-[var(--heading)] mb-2">🔗 Social Media Links</h2>
                  <p className="text-sm text-[var(--muted-2)] mb-8">Configure your public social channels displayed in the footer. Toggle visibility ON/OFF and save settings individually for each platform.</p>

                  <div className="flex flex-col gap-6">
                    {[
                      {
                        id: 'instagram',
                        name: 'Instagram',
                        placeholder: 'https://instagram.com/yourprofile',
                        icon: (
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-[#e1306c]">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                          </svg>
                        )
                      },
                      {
                        id: 'whatsapp',
                        name: 'WhatsApp',
                        placeholder: 'https://wa.me/919876543210',
                        icon: (
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-[#25d366]">
                            <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.83.496 3.614 1.442 5.176L2 22l4.986-1.307c1.517.82 3.21 1.25 4.966 1.25.04 0 .08 0 .12-.002C17.59 21.94 22 17.48 22 12.004 22 6.48 17.522 2 12.004 2zm5.097 13.52c-.22.613-1.277 1.173-1.826 1.236-.49.056-.975.253-3.13-.6-2.756-1.093-4.532-3.9-4.67-4.084-.136-.184-1.108-1.472-1.108-2.81 0-1.337.702-1.996.95-2.257.25-.262.548-.328.73-.328.18 0 .363.002.52.01.164.007.387-.062.603.46.223.538.762 1.86.828 1.994.066.13.11.285.02.46-.088.175-.132.285-.263.438-.13.15-.276.338-.394.453-.13.13-.267.273-.114.537.153.264.68 1.12 1.46 1.812.996.886 1.834 1.16 2.097 1.293.263.13.417.11.57-.066.154-.175.657-.766.833-1.028.175-.263.35-.22.592-.13.24.088 1.524.72 1.787.852.264.13.439.197.505.306.066.11.066.634-.153 1.246z"/>
                          </svg>
                        )
                      },
                      {
                        id: 'twitter',
                        name: 'Twitter / X',
                        placeholder: 'https://x.com/yourhandle',
                        icon: (
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-white">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        )
                      },
                      {
                        id: 'facebook',
                        name: 'Facebook',
                        placeholder: 'https://facebook.com/yourpage',
                        icon: (
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-[#1877f2]">
                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z"/>
                          </svg>
                        )
                      },
                      {
                        id: 'telegram',
                        name: 'Telegram',
                        placeholder: 'https://t.me/yourusername',
                        icon: (
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-[#229ed9]">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.02-.75 4-1.74 6.67-2.88 8-3.42 3.81-1.56 4.6-1.83 5.12-1.84.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.15-.02.22z"/>
                          </svg>
                        )
                      }
                    ].map((platform) => {
                      const isEnabled = settings[`social_${platform.id}_enabled`];
                      const urlVal = settings[`social_${platform.id}_url`];
                      const currentSavingKey = `${platform.name} Link`;

                      return (
                        <div
                          key={platform.id}
                          className="bg-[#0e0e18] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                {platform.icon}
                              </div>
                              <div>
                                <h3 className="font-syne font-bold text-white text-base">{platform.name}</h3>
                                <p className="text-xs text-[var(--muted-2)]">Toggle display on website footer</p>
                              </div>
                            </div>
                            
                            {/* Toggle Switch */}
                            <label className="relative inline-block w-12 h-6 shrink-0 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!isEnabled}
                                onChange={(e) => handleChange(`social_${platform.id}_enabled`, e.target.checked)}
                                className="opacity-0 w-0 h-0"
                              />
                              <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${isEnabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                                <span className={`absolute h-4 w-4 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
                              </span>
                            </label>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-3">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={urlVal || ''}
                                onChange={(e) => handleChange(`social_${platform.id}_url`, e.target.value)}
                                placeholder={platform.placeholder}
                                className="bg-[var(--surface)] border border-[var(--line)] text-[var(--heading)] px-4 py-2.5 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors text-sm"
                              />
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const payload = {
                                  [`social_${platform.id}_enabled`]: !!settings[`social_${platform.id}_enabled`],
                                  [`social_${platform.id}_url`]: settings[`social_${platform.id}_url`] || ''
                                };
                                saveSectionSettingsDirect(payload, currentSavingKey);
                              }}
                              disabled={saving === currentSavingKey}
                              className={`bg-white/5 border border-white/10 hover:bg-white/10 text-white font-syne font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-transform text-sm ${saving === currentSavingKey ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                            >
                              {saving === currentSavingKey ? 'Saving...' : `Save ${platform.name}`}
                            </button>
                          </div>
                          {message && message.includes(platform.name) && (
                            <p className="text-xs text-[#10b981] mt-2 font-medium">✓ {message}</p>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Add Custom Social Links Header */}
                    <div className="mt-10 pt-8 border-t border-white/5">
                      <h3 className="font-syne font-bold text-white text-lg mb-2">➕ Add Custom Social Account</h3>
                      <p className="text-xs text-[var(--muted-2)] mb-6">Need to add another network (like YouTube, Discord, or LinkedIn)? Configure it here dynamically.</p>

                      <div className="bg-[#0e0e18] border border-white/5 rounded-2xl p-5 flex flex-col gap-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-[var(--muted)] block mb-2 uppercase tracking-wider">Account Name</label>
                            <input
                              type="text"
                              value={newSocial.name}
                              onChange={(e) => setNewSocial(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g. YouTube"
                              className="bg-[var(--surface)] border border-[var(--line)] text-[var(--heading)] px-4 py-2.5 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-[var(--muted)] block mb-2 uppercase tracking-wider">Account URL</label>
                            <input
                              type="text"
                              value={newSocial.url}
                              onChange={(e) => setNewSocial(prev => ({ ...prev, url: e.target.value }))}
                              placeholder="e.g. https://youtube.com/c/yourchannel"
                              className="bg-[var(--surface)] border border-[var(--line)] text-[var(--heading)] px-4 py-2.5 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-[var(--muted)] block mb-2 uppercase tracking-wider">Account Logo Image</label>
                          <div className="flex flex-wrap items-center gap-4">
                            {newSocial.logo ? (
                              <img src={newSocial.logo} alt="Logo" className="w-10 h-10 object-contain rounded-lg p-1 bg-white/5 border border-white/10" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs text-[var(--muted-2)]">No Logo</div>
                            )}
                            <div className="flex-1 min-w-[200px]">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleCustomLogoUpload(e, -1)}
                                className="text-xs text-[var(--muted)] file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#f5c842]/10 file:text-[#f5c842] hover:file:bg-[#f5c842]/20 cursor-pointer"
                              />
                              <p className="text-[10px] text-[var(--muted-2)] mt-1.5">Upload a square PNG or SVG file to use as the logo icon.</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={addCustomSocial}
                            className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold px-6 py-2.5 rounded-xl cursor-pointer hover:scale-[1.02] transition-transform text-sm shadow-md shadow-[#f5c842]/10"
                          >
                            ➕ Add Account
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Manage Dynamic Custom Social Accounts */}
                    {settings.custom_social_links && settings.custom_social_links.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-white/5">
                        <h3 className="font-syne font-bold text-white text-lg mb-6">⚙️ Manage Custom Social Accounts</h3>
                        <div className="flex flex-col gap-4">
                          {settings.custom_social_links.map((item, index) => {
                            const currentSavingKey = `custom_social_${index}`;
                            return (
                              <div
                                key={index}
                                className="bg-[#0e0e18] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-4 mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden p-1">
                                      {item.logo ? (
                                        <img src={item.logo} alt={item.name} className="w-full h-full object-contain" />
                                      ) : (
                                        <span className="text-xs text-[var(--muted-2)]">🔗</span>
                                      )}
                                    </div>
                                    <div>
                                      <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => {
                                          const updated = [...settings.custom_social_links];
                                          updated[index].name = e.target.value;
                                          handleChange('custom_social_links', updated);
                                        }}
                                        className="bg-transparent border-b border-transparent hover:border-white/10 focus:border-[#f5c842]/50 text-white font-syne font-bold text-base outline-none py-0.5"
                                      />
                                      <p className="text-[10px] text-[var(--muted-2)]">Edit name directly in the box above</p>
                                    </div>
                                  </div>

                                  {/* Toggle Switch */}
                                  <label className="relative inline-block w-12 h-6 shrink-0 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!item.enabled}
                                      onChange={(e) => {
                                        const updated = [...settings.custom_social_links];
                                        updated[index].enabled = e.target.checked;
                                        handleChange('custom_social_links', updated);
                                      }}
                                      className="opacity-0 w-0 h-0"
                                    />
                                    <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${item.enabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                                      <span className={`absolute h-4 w-4 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${item.enabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                    </span>
                                  </label>
                                </div>

                                <div className="flex flex-col gap-4 mt-4">
                                  <div>
                                    <label className="text-[10px] font-semibold text-[var(--muted)] block mb-1.5 uppercase tracking-wider">Edit URL</label>
                                    <input
                                      type="text"
                                      value={item.url}
                                      onChange={(e) => {
                                        const updated = [...settings.custom_social_links];
                                        updated[index].url = e.target.value;
                                        handleChange('custom_social_links', updated);
                                      }}
                                      className="bg-[var(--surface)] border border-[var(--line)] text-[var(--heading)] px-4 py-2 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors text-sm"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-semibold text-[var(--muted)] block mb-1.5 uppercase tracking-wider">Change Logo</label>
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleCustomLogoUpload(e, index)}
                                        className="text-xs text-[var(--muted)] file:mr-4 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#f5c842]/10 file:text-[#f5c842] hover:file:bg-[#f5c842]/20 cursor-pointer"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between gap-4 mt-2 pt-4 border-t border-white/5">
                                    <button
                                      type="button"
                                      onClick={() => deleteCustomSocial(index)}
                                      className="text-xs text-red-500 hover:text-red-400 font-syne font-bold cursor-pointer transition-colors"
                                    >
                                      🗑️ Delete Account
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => saveCustomSocialItem(index)}
                                      disabled={saving === currentSavingKey}
                                      className={`bg-white/5 border border-white/10 hover:bg-white/10 text-white font-syne font-bold px-4 py-2 rounded-xl cursor-pointer transition-transform text-xs ${saving === currentSavingKey ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                                    >
                                      {saving === currentSavingKey ? 'Saving...' : `Save Changes`}
                                    </button>
                                  </div>
                                </div>
                                {message && message.includes(item.name) && (
                                  <p className="text-xs text-[#10b981] mt-2 font-medium">✓ {message}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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



            </div>
          )}
        </div>
      </div>
    </>
  );
}
