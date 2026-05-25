'use client';

import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function AdminSupportBotPage() {
  const [settings, setSettings] = useState({
    support_bot_enabled: false,
    openrouter_api_key: '',
    support_bot_model_mode: 'auto',
    openrouter_model: 'openrouter/free',
    support_bot_prompt: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // OpenRouter Models State
  const [modelsList, setModelsList] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);

  // Connection Test Status
  const [testStatus, setTestStatus] = useState({ loading: false, type: '', message: '' });

  // Live Bot Simulator State
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Support Bot simulator. Save your settings above and type below to test how I answer based on your custom system instructions.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat simulator
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Fetch settings and models on mount
  useEffect(() => {
    async function initData() {
      try {
        // Fetch Settings
        const settingsRes = await fetch('/api/settings?t=' + Date.now(), { cache: 'no-store' });
        const settingsData = await settingsRes.json();
        if (settingsData.flag && settingsData.settings) {
          setSettings({
            support_bot_enabled: !!settingsData.settings.support_bot_enabled,
            openrouter_api_key: settingsData.settings.openrouter_api_key || '',
            support_bot_model_mode: settingsData.settings.support_bot_model_mode || 'auto',
            openrouter_model: settingsData.settings.openrouter_model || 'openrouter/free',
            support_bot_prompt: settingsData.settings.support_bot_prompt || ''
          });
        }
      } catch (e) {
        console.error('Error loading settings:', e);
      } finally {
        setLoading(false);
      }

      try {
        // Fetch OpenRouter Models dynamically
        const modelsRes = await fetch('/api/admin/openrouter-models');
        const modelsData = await modelsRes.json();
        if (modelsData.flag && Array.isArray(modelsData.data)) {
          setModelsList(modelsData.data);
        }
      } catch (e) {
        console.error('Error fetching OpenRouter models:', e);
      } finally {
        setModelsLoading(false);
      }
    }

    initData();
  }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          support_bot_enabled: settings.support_bot_enabled,
          openrouter_api_key: settings.openrouter_api_key,
          support_bot_model_mode: settings.support_bot_model_mode,
          openrouter_model: settings.openrouter_model,
          support_bot_prompt: settings.support_bot_prompt
        })
      });
      const data = await res.json();
      if (data.flag) {
        setMessage('AI settings saved successfully!');
      } else {
        setMessage(data.message || 'Failed to save settings.');
      }
    } catch (e) {
      setMessage('Connection error occurred.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Test the API key connection in real-time
  const handleTestConnection = async () => {
    if (!settings.openrouter_api_key) {
      setTestStatus({
        loading: false,
        type: 'error',
        message: '❌ Please enter your API Key first!'
      });
      return;
    }

    setTestStatus({
      loading: true,
      type: '',
      message: '🔌 Connecting to OpenRouter... Testing credentials...'
    });

    try {
      const res = await fetch('/api/admin/test-openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: settings.openrouter_api_key,
          model: settings.support_bot_model_mode === 'auto' ? 'openrouter/free' : settings.openrouter_model
        })
      });
      const data = await res.json();
      if (data.flag) {
        setTestStatus({
          loading: false,
          type: 'success',
          message: `✅ API Connected Successfully! Bot responded: "${data.reply}"`
        });
      } else {
        setTestStatus({
          loading: false,
          type: 'error',
          message: `❌ ${data.message}`
        });
      }
    } catch (e) {
      setTestStatus({
        loading: false,
        type: 'error',
        message: '❌ Network timeout or server exception occurred during verification.'
      });
    }
  };

  // Send message in simulator
  const handleSendSimulatorMsg = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = { role: 'user', content: chatInput.trim() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.filter(m => m.role !== 'assistant' || m.content !== chatMessages[0].content)
        })
      });
      const data = await res.json();
      if (data.flag) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${data.message || 'Check your OpenRouter key and save settings.'}` }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Simulator connection error. Ensure your server is running.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Divide models list into Free and Paid categories
  const freeModels = modelsList.filter(m => {
    const promptPrice = Number(m.pricing?.prompt || 0);
    const completionPrice = Number(m.pricing?.completion || 0);
    return promptPrice === 0 && completionPrice === 0;
  });

  const paidModels = modelsList.filter(m => {
    const promptPrice = Number(m.pricing?.prompt || 0);
    const completionPrice = Number(m.pricing?.completion || 0);
    return promptPrice > 0 || completionPrice > 0;
  });

  // Sort lists alphabetically by name
  freeModels.sort((a, b) => a.name.localeCompare(b.name));
  paidModels.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 shrink-0">
          <div>
            <h1 className="font-syne text-2xl md:text-3xl font-bold text-[#ffffff] tracking-tight">🤖 AI Support Bot Configuration</h1>
            <p className="text-gray-400 text-xs mt-1">Configure your automated support agent using free or premium models provided by OpenRouter.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading configurations...</div>
        ) : (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Form Settings (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Form Card */}
              <div className="bg-[#12121a] border border-[#f5c842]/15 rounded-2xl p-6 sm:p-8 shadow-2xl">
                <h2 className="text-lg font-syne font-bold text-white mb-6 flex items-center gap-2">
                  ⚙️ Bot Settings
                </h2>
                
                <div className="flex flex-col gap-6">
                  
                  {/* Master Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a2a] border border-white/5">
                    <div>
                      <div className="font-semibold text-sm text-white mb-1">Enable AI Support Chatbot</div>
                      <div className="text-[11px] text-gray-400">Show the AI chat option inside the floating support tray on your site.</div>
                    </div>
                    <label className="relative inline-block w-12 h-6 shrink-0 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.support_bot_enabled} 
                        onChange={(e) => handleChange('support_bot_enabled', e.target.checked)} 
                        className="opacity-0 w-0 h-0" 
                      />
                      <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${settings.support_bot_enabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                        <span className={`absolute h-4 w-4 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${settings.support_bot_enabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
                      </span>
                    </label>
                  </div>

                  {/* OpenRouter API Key */}
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-2 uppercase tracking-wider">OpenRouter API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={settings.openrouter_api_key}
                        onChange={(e) => handleChange('openrouter_api_key', e.target.value)}
                        placeholder="sk-or-v1-..."
                        className="bg-[#1a1a2a] border border-white/5 text-white px-4 py-3 pr-12 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors text-sm font-mono animate-in fade-in"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white bg-transparent border-none cursor-pointer text-xs"
                      >
                        {showApiKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
                      <p className="text-[10px] text-gray-400">
                        Get a free API key by signing up on <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] hover:underline">openrouter.ai</a>.
                      </p>
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testStatus.loading}
                        className="text-xs text-[#f5c842] hover:text-[#e0a800] bg-[#f5c842]/5 border border-[#f5c842]/20 hover:border-[#f5c842]/40 px-3 py-1.5 rounded-xl cursor-pointer transition-all shrink-0 active:scale-95 font-semibold font-syne uppercase tracking-wider"
                      >
                        {testStatus.loading ? 'Testing...' : '🔌 Test Connection'}
                      </button>
                    </div>

                    {/* Test Connection Results Badge */}
                    {testStatus.message && (
                      <div className={`mt-3 p-3 rounded-xl text-xs font-medium leading-relaxed border animate-in fade-in slide-in-from-top-2 duration-300 ${
                        testStatus.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                          : testStatus.type === 'error'
                          ? 'bg-red-500/10 border-red-500/25 text-red-400'
                          : 'bg-[#1a1a2a] border-white/5 text-gray-300'
                      }`}>
                        {testStatus.message}
                      </div>
                    )}
                  </div>

                  {/* Model Routing Mode */}
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-2 uppercase tracking-wider">
                      Model Routing Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#1a1a2a] border border-white/5">
                      <button
                        type="button"
                        onClick={() => handleChange('support_bot_model_mode', 'auto')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold font-syne tracking-wide transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                          settings.support_bot_model_mode === 'auto'
                            ? 'bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] shadow-md shadow-[#f5c842]/10'
                            : 'bg-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        ✨ Automatic (Recommended)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange('support_bot_model_mode', 'manual')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold font-syne tracking-wide transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                          settings.support_bot_model_mode === 'manual'
                            ? 'bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] shadow-md shadow-[#f5c842]/10'
                            : 'bg-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        🛠️ Manual Selection
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {settings.support_bot_model_mode === 'auto'
                        ? 'Automatic Mode load-balances multiple free models (via openrouter/free) to prevent service outages.'
                        : 'Manual Mode allows you to select a specific free or premium model below.'}
                    </p>
                  </div>

                  {/* Model dropdown */}
                  <div className="transition-all duration-300">
                    <label className="text-xs font-semibold text-gray-400 block mb-2 uppercase tracking-wider">
                      AI Model Selection
                    </label>
                    {modelsLoading ? (
                      <div className="text-xs text-[#f5c842] animate-pulse">Loading models from OpenRouter...</div>
                    ) : (
                      <select
                        value={settings.support_bot_model_mode === 'auto' ? 'openrouter/free' : settings.openrouter_model}
                        onChange={(e) => handleChange('openrouter_model', e.target.value)}
                        disabled={settings.support_bot_model_mode === 'auto'}
                        className={`bg-[#1a1a2a] border border-white/5 text-white px-4 py-3 rounded-xl w-full outline-none transition-all text-xs cursor-pointer custom-scrollbar ${
                          settings.support_bot_model_mode === 'auto'
                            ? 'opacity-40 cursor-not-allowed border-white/10'
                            : 'focus:border-[#f5c842]/50'
                        }`}
                      >
                        {settings.support_bot_model_mode === 'auto' ? (
                          <option value="openrouter/free">Free Models Router (openrouter/free) - Active (Auto-managed)</option>
                        ) : (
                          <>
                            <optgroup label="🎁 100% FREE MODELS">
                              {freeModels.length === 0 ? (
                                <option value="openrouter/free">Free Models Router (openrouter/free) - Recommended</option>
                              ) : (
                                freeModels.map(model => (
                                  <option key={model.id} value={model.id}>
                                    {model.name} ({model.id}) - FREE
                                  </option>
                                ))
                              )}
                            </optgroup>
                            
                            <optgroup label="💳 PREMIUM/PAID MODELS (Price per Million Tokens)">
                              {paidModels.map(model => {
                                const promptPrice = (Number(model.pricing?.prompt || 0) * 1000000).toFixed(2);
                                const completionPrice = (Number(model.pricing?.completion || 0) * 1000000).toFixed(2);
                                return (
                                  <option key={model.id} value={model.id}>
                                    {model.name} ({model.id}) - Prompt: ${promptPrice}/M | Gen: ${completionPrice}/M
                                  </option>
                                );
                              })}
                            </optgroup>
                          </>
                        )}
                      </select>
                    )}
                    <p className="text-[10px] text-gray-400 mt-2">
                      {settings.support_bot_model_mode === 'auto'
                        ? 'Model select is locked in Automatic Routing Mode.'
                        : 'Select Gemini/Llama free models for $0 token costs, or select paid models (like GPT-4o, Claude 3.5 Sonnet) if your OpenRouter key has credits.'}
                    </p>
                  </div>

                  {/* System Prompt Instruction */}
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-2 uppercase tracking-wider">System Instructions / Prompt</label>
                    <textarea
                      value={settings.support_bot_prompt}
                      onChange={(e) => handleChange('support_bot_prompt', e.target.value)}
                      rows={8}
                      placeholder="Enter system prompts to train your bot..."
                      className="bg-[#1a1a2a] border border-white/5 text-white p-4 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors text-xs font-sans leading-relaxed resize-y"
                    />
                    <p className="text-[10px] text-gray-400 mt-2">
                      Define the AI bot\'s personality, response rules, and boundaries. Phone, email, and timing are dynamically integrated by the backend pipeline automatically.
                    </p>
                  </div>

                </div>

                {/* Save CTA */}
                <div className="flex items-center gap-4 pt-6 border-t border-white/5 mt-6">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-8 py-3 rounded-xl shadow-lg shadow-[#f5c842]/20 cursor-pointer transition-transform ${saving ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                  {message && (
                    <span className={`font-semibold text-sm ${message.includes('success') ? 'text-[#10b981]' : 'text-red-500'}`}>
                      {message}
                    </span>
                  )}
                </div>

              </div>

            </div>

            {/* Right Column: Interactive Bot Simulator (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Simulator Card */}
              <div className="bg-[#12121a] border border-[#f5c842]/15 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[610px]">
                {/* Header */}
                <div className="bg-[#1a1a2a] p-4 border-b border-[#f5c842]/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <div>
                      <h3 className="font-syne font-bold text-sm text-white leading-none">Live Bot Simulator</h3>
                      <span className="text-[9px] text-gray-400 mt-0.5 block">Test your custom prompt settings in real-time</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setChatMessages([
                      { role: 'assistant', content: 'Simulator reset. Type below to test your newly configured prompt instructions!' }
                    ])}
                    className="text-[10px] text-red-500 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 bg-red-500/5 px-2 py-1 rounded-lg cursor-pointer transition-all font-semibold uppercase tracking-wider"
                  >
                    Reset
                  </button>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-[#0a0a0f]/50">
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'align-end ml-auto' : 'align-start mr-auto'}`}
                    >
                      <div 
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] rounded-tr-none font-semibold' 
                            : 'bg-[#1a1a2a] border border-white/5 text-gray-200 rounded-tl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  
                  {chatLoading && (
                    <div className="align-start mr-auto max-w-[80%] flex items-center gap-2 bg-[#1a1a2a] border border-white/5 p-3 rounded-2xl rounded-tl-none">
                      <span className="text-xs text-gray-400">AI is thinking...</span>
                      <span className="w-1.5 h-1.5 bg-[#f5c842] rounded-full animate-bounce delay-100"></span>
                      <span className="w-1.5 h-1.5 bg-[#f5c842] rounded-full animate-bounce delay-200"></span>
                      <span className="w-1.5 h-1.5 bg-[#f5c842] rounded-full animate-bounce delay-300"></span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Footer Input */}
                <form 
                  onSubmit={handleSendSimulatorMsg} 
                  className="bg-[#1a1a2a] p-3 border-t border-white/5 flex gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask the bot something (e.g. refund rules?)..."
                    disabled={chatLoading}
                    className="flex-1 bg-[#12121a] border border-white/5 text-white px-3 py-2 rounded-xl outline-none focus:border-[#f5c842]/50 transition-colors text-xs placeholder:text-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-[#f5c842] text-[#0a0a0f] border-none font-bold text-xs px-4 py-2 rounded-xl cursor-pointer hover:bg-[#e0a800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}
      </div>
    </AdminLayout>
  );
}
