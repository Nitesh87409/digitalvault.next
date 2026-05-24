'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function AdminRefundPolicyPage() {
  const refundRef = useRef(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const loadRichEditor = (refundContent) => {
    setTimeout(() => {
      if (refundRef.current) {
        refundRef.current.innerHTML = refundContent || '';
      }
    }, 50);
  };

  const fmt = (cmd, val = null) => {
    refundRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (data.flag && data.settings) {
        const refundContent = data.settings.refund_policy_content ?? '';
        setContent(refundContent);
        loadRichEditor(refundContent);
      }
    } catch (e) {
      console.error(e);
      setMessage('Failed to load settings.');
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');
    const newContent = refundRef.current?.innerHTML || '';

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refund_policy_content: newContent })
      });
      const data = await res.json();
      if (data.flag) {
        setContent(newContent);
        setMessage('Refund policy saved successfully! 💸');
      } else {
        setMessage(data.message || 'Failed to save settings');
      }
    } catch (e) {
      setMessage('Connection error');
    }
    setSaving(false);
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(''), 3000);
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="font-syne text-2xl md:text-3xl font-bold text-white tracking-tight">💸 Refund Policy</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and edit your customer refund policy and money-back guarantees.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <Link
            href="/refund-policy"
            target="_blank"
            className="w-full sm:w-auto text-center bg-white/5 border border-white/10 hover:bg-white/10 text-white font-syne font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-all text-sm no-underline hover:scale-[1.02]"
          >
            🌐 View Live Page
          </Link>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto my-2 px-2 flex-1 flex flex-col">
        {loading ? (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-[#f5c842] border-white/5 animate-[spin_0.6s_linear_infinite]"></div>
            <span className="text-sm font-medium">Loading content...</span>
          </div>
        ) : (
          <div className="bg-[#0e0e18] rounded-2xl p-5 sm:p-8 border border-white/5 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0f] mb-6">
              {/* Editor Toolbar */}
              <div className="bg-[#12121a] border-b border-white/10 p-3 flex flex-wrap gap-2 items-center w-full overflow-x-auto custom-scrollbar shrink-0 select-none">
                {[['bold','B','font-extrabold'],['italic','I','italic'],['underline','U','underline'],['strikeThrough','S','line-through']].map(([cmd,label,className]) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => fmt(cmd)}
                    className={`bg-white/5 border border-white/10 hover:border-[#f5c842]/30 text-gray-200 px-3.5 py-2 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors shrink-0 ${className}`}
                  >
                    {label}
                  </button>
                ))}
                <div className="w-[1px] h-6 bg-white/10 mx-1 shrink-0"></div>
                <button
                  type="button"
                  onClick={() => fmt('insertUnorderedList')}
                  className="bg-white/5 border border-white/10 hover:border-[#f5c842]/30 text-gray-200 px-3.5 py-2 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors shrink-0"
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={() => fmt('insertOrderedList')}
                  className="bg-white/5 border border-white/10 hover:border-[#f5c842]/30 text-gray-200 px-3.5 py-2 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors shrink-0"
                >
                  1. List
                </button>
                
                <div className="w-[1px] h-6 bg-white/10 mx-1 shrink-0"></div>
                
                {/* Size Dropdown */}
                <div className="relative shrink-0">
                  <select
                    onChange={e => { fmt('fontSize', e.target.value); e.target.value=''; }}
                    className="bg-white/5 border border-white/10 hover:border-[#f5c842]/30 text-gray-200 px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-all outline-none appearance-none pr-8 font-semibold"
                  >
                    <option value="" className="bg-[#12121a]">Size</option>
                    {[['1','Small'],['3','Normal'],['5','Large'],['7','Huge']].map(([v,l]) => (
                      <option key={v} value={v} className="bg-[#12121a]">{l}</option>
                    ))}
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]">▼</span>
                </div>

                {/* Color Dropdown */}
                <div className="relative shrink-0">
                  <select
                    onChange={e => { fmt('foreColor', e.target.value); e.target.value=''; }}
                    className="bg-white/5 border border-white/10 hover:border-[#f5c842]/30 text-gray-200 px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-all outline-none appearance-none pr-8 font-semibold"
                  >
                    <option value="" className="bg-[#12121a]">Color</option>
                    {[['#f5c842','Gold'],['#ffffff','White'],['#10b981','Green'],['#ef4444','Red'],['#3b82f6','Blue']].map(([v,l]) => (
                      <option key={v} value={v} className="bg-[#12121a]">{l}</option>
                    ))}
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]">▼</span>
                </div>

                {/* Heading Dropdown */}
                <div className="relative shrink-0">
                  <select
                    onChange={e => { fmt('formatBlock', e.target.value); e.target.value=''; }}
                    className="bg-white/5 border border-white/10 hover:border-[#f5c842]/30 text-gray-200 px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-all outline-none appearance-none pr-8 font-semibold"
                  >
                    <option value="" className="bg-[#12121a]">Heading</option>
                    {[['h1','Heading 1'],['h2','Heading 2'],['h3','Heading 3'],['p','Paragraph']].map(([v,l]) => (
                      <option key={v} value={v} className="bg-[#12121a]">{l}</option>
                    ))}
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]">▼</span>
                </div>

                <button
                  type="button"
                  onClick={() => fmt('removeFormat')}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-3.5 py-2 rounded-lg text-xs cursor-pointer hover:bg-red-500/25 transition-colors ml-auto shrink-0 font-bold"
                >
                  ✕ Clear
                </button>
              </div>

              {/* Editor body */}
              <div
                ref={refundRef}
                className="w-full min-h-[400px] max-h-[600px] p-6 sm:p-8 text-sm leading-[1.8] text-gray-200 bg-[#07070d] outline-none overflow-y-auto custom-scrollbar whitespace-pre-wrap break-words focus:ring-1 focus:ring-[#f5c842]/20"
                contentEditable
                suppressContentEditableWarning
              />
            </div>

            {/* Save Section */}
            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-8 py-3 rounded-xl shadow-lg shadow-[#f5c842]/10 cursor-pointer transition-all ${saving ? 'opacity-70' : 'hover:scale-[1.02]'}`}
              >
                {saving ? 'Saving...' : '💾 Save Refund Policy'}
              </button>
              {message && (
                <span className={`font-semibold text-sm ${message.includes('successfully') ? 'text-[#10b981]' : 'text-red-500'} animate-fade-in`}>
                  {message}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
