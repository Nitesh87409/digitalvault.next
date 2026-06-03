'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, Phone, Mail, Send, X, Clock, ArrowLeft, Bot } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

export default function FloatingContact() {
  const pathname = usePathname();
  const { settings, loading } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const widgetRef = useRef(null);

  // AI Chat States
  const [view, setView] = useState('options'); // 'options' or 'chat'
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Set mounted on mount to avoid hydration warnings
  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (view === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading, view]);

  // Welcome message initialization
  useEffect(() => {
    if (view === 'chat' && chatMessages.length === 0) {
      setChatMessages([
        {
          role: 'assistant',
          content: `Hello! 👋 Welcome to ${settings.app_name || 'DigitalVault'} AI Support. Ask me anything about our digital assets, your orders, or refund policies!`
        }
      ]);
    }
  }, [view, settings.app_name, chatMessages.length]);

  // Set default view on open/close
  useEffect(() => {
    if (isOpen) {
      if (settings.support_bot_enabled) {
        setView('chat');
      } else {
        setView('options');
      }
    } else {
      setView('options');
    }
  }, [isOpen, settings.support_bot_enabled]);

  // Close the popup when clicking outside the widget
  useEffect(() => {
    function handleClickOutside(event) {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Hide the floating contact button on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  if (!mounted) {
    return null;
  }

  // Master Toggle Check: Hide entirely if disabled in admin dashboard
  if (settings.floating_support_enabled === false) {
    return null;
  }

  const getIndianWhatsAppNumber = (value) => {
    const cleaned = String(value || '').replace(/\D/g, '');
    return cleaned.length === 10 ? `91${cleaned}` : cleaned;
  };

  const buildWhatsAppLink = (number, text = "Hi! I need help with my DigitalVault order.") => {
    const whatsappNumber = getIndianWhatsAppNumber(number);
    return whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}` : null;
  };

  const normalizeWhatsAppLink = (url) => {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '');
      const isWhatsAppHost = host === 'wa.me' || host === 'api.whatsapp.com' || host === 'whatsapp.com';

      if (!isWhatsAppHost) {
        return url;
      }

      const number = host === 'wa.me'
        ? parsed.pathname.split('/').filter(Boolean)[0]
        : parsed.searchParams.get('phone');
      const text = parsed.searchParams.get('text') || "Hi! I need help with my DigitalVault order.";

      return buildWhatsAppLink(number, text) || url;
    } catch {
      return buildWhatsAppLink(url);
    }
  };

  // Generate a direct WhatsApp link based on support phone if the explicit URL isn't configured
  const getWhatsAppLink = () => {
    if (settings.social_whatsapp_enabled && settings.social_whatsapp_url) {
      return normalizeWhatsAppLink(settings.social_whatsapp_url);
    }
    if (settings.support_phone) {
      return buildWhatsAppLink(settings.support_phone);
    }
    return null;
  };

  // Submit message to support chatbot route
  const handleSendChatMsg = async (e) => {
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
          messages: updatedMessages.filter(m => m.role !== 'assistant' || m.content !== chatMessages[0]?.content)
        })
      });
      const data = await res.json();
      if (data.flag) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: "I apologize, but I am facing a connection issue with my AI brain. Please try contacting support directly via direct call or WhatsApp helpline!" }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please check your internet connection or use other support helpline channels.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const whatsappLink = getWhatsAppLink();
  const showWhatsapp = settings.social_whatsapp_enabled || (settings.support_phone && !settings.social_whatsapp_url);
  const showTelegram = settings.social_telegram_enabled && settings.social_telegram_url;

  const isProductPage = pathname?.startsWith('/product/');

  return (
    <div
      ref={widgetRef}
      className={`fixed ${isProductPage ? 'bottom-[130px]' : 'bottom-[80px]'} md:bottom-6 right-4 md:right-6 z-[999] font-sans transition-all duration-300`}
    >
      {/* Support Card Popup */}
      <div
        className={`absolute bottom-16 md:bottom-20 right-0 w-[320px] sm:w-[350px] max-w-[calc(100vw-2rem)] origin-bottom-right transition-all duration-300 transform shadow-2xl ${isOpen
            ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto'
            : 'scale-90 opacity-0 translate-y-4 pointer-events-none'
          }`}
      >
        <div className="flex flex-col h-[480px] max-h-[80vh] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-lg">

          {/* Header */}
          <div className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] p-4 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              {view === 'chat' ? (
                <button
                  onClick={() => setView('options')}
                  className="p-1 hover:bg-[#0a0a0f]/10 rounded-full transition-colors duration-200 border-none bg-transparent cursor-pointer flex items-center justify-center text-[#0a0a0f]"
                  aria-label="Back to support options"
                >
                  <ArrowLeft size={18} />
                </button>
              ) : (
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#0a0a0f] flex items-center justify-center font-syne font-bold text-[#f5c842] border border-[#0a0a0f]/10 shadow-inner">
                    {settings.app_name ? settings.app_name.substring(0, 2).toUpperCase() : 'DV'}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#f5c842] rounded-full animate-pulse"></span>
                </div>
              )}

              <div>
                <h3 className="font-syne font-bold text-sm tracking-tight leading-none text-[#0a0a0f]">
                  {view === 'chat' ? 'AI Support Agent' : 'Support Center'}
                </h3>
                <span className="text-[10px] font-semibold opacity-90 mt-1 block">
                  {view === 'chat' ? '⬅️ WhatsApp/Helpline' : 'Online & ready to help'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-[#0a0a0f]/10 rounded-full transition-colors duration-200 border-none bg-transparent cursor-pointer flex items-center justify-center"
              aria-label="Close support panel"
            >
              <X size={18} className="text-[#0a0a0f]" />
            </button>
          </div>

          {/* Dynamic View Viewport */}
          {view === 'chat' ? (
            /* AI CHAT VIEWPORT */
            <div className="flex flex-col flex-1 min-h-0 bg-[#0a0a0f]/30">
              {/* Chat Messages List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'align-end ml-auto' : 'align-start mr-auto'
                      }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user'
                          ? 'bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] rounded-tr-none font-semibold shadow-md shadow-[#f5c842]/10'
                          : 'bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text)] rounded-tl-none shadow-sm'
                        }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="align-start mr-auto max-w-[85%] flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--line)] p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <span className="text-xs text-[var(--muted-2)]">Bot is thinking</span>
                    <span className="w-1 h-1 bg-[#f5c842] rounded-full animate-bounce delay-75"></span>
                    <span className="w-1 h-1 bg-[#f5c842] rounded-full animate-bounce delay-150"></span>
                    <span className="w-1 h-1 bg-[#f5c842] rounded-full animate-bounce delay-225"></span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Footer Form */}
              <form
                onSubmit={handleSendChatMsg}
                className="p-3 bg-[var(--surface-2)] border-t border-[var(--line)] flex gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your question (refunds, orders)..."
                  disabled={chatLoading}
                  className="flex-1 bg-[var(--surface)] border border-[var(--line)] text-[var(--heading)] px-3 py-2 rounded-xl outline-none focus:border-[#f5c842]/50 transition-colors text-xs placeholder:text-[var(--muted-2)] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] border-none font-bold text-xs p-2 rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed w-9 h-9 shrink-0"
                  aria-label="Send message"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          ) : (
            /* STANDARD SUPPORT OPTIONS VIEW */
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar">
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Hello! 👋 Welcome to <strong>{settings.app_name || 'DigitalVault'}</strong>. How can we assist you today? Tap on any support channel below:
                </p>

                <div className="flex flex-col gap-3">
                  {/* AI Support Bot Option Link */}
                  {settings.support_bot_enabled && (
                    <button
                      onClick={() => setView('chat')}
                      className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] hover:text-[#0a0a0f] font-bold text-xs rounded-xl transition-all shadow-md shadow-[#f5c842]/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bot size={16} />
                        <span>Chat with AI Support Bot</span>
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#0a0a0f]/10 animate-pulse">Ask Anything</span>
                    </button>
                  )}

                  {/* WhatsApp Support Button */}
                  {settings.floating_whatsapp_enabled !== false && showWhatsapp && whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full px-4 py-3 bg-[#25d366] hover:bg-[#20ba5a] text-[#ffffff] hover:text-[#ffffff] font-bold text-xs rounded-xl transition-all shadow-md shadow-[#25d366]/15 hover:scale-[1.02] active:scale-[0.98] select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                          <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.83.496 3.614 1.442 5.176L2 22l4.986-1.307c1.517.82 3.21 1.25 4.966 1.25.04 0 .08 0 .12-.002C17.59 21.94 22 17.48 22 12.004 22 6.48 17.522 2 12.004 2zm5.097 13.52c-.22.613-1.277 1.173-1.826 1.236-.49.056-.975.253-3.13-.6-2.756-1.093-4.532-3.9-4.67-4.084-.136-.184-1.108-1.472-1.108-2.81 0-1.337.702-1.996.95-2.257.25-.262.548-.328.73-.328.18 0 .363.002.52.01.164.007.387-.062.603.46.223.538.762 1.86.828 1.994.066.13.11.285.02.46-.088.175-.132.285-.263.438-.13.15-.276.338-.394.453-.13.13-.267.273-.114.537.153.264.68 1.12 1.46 1.812.996.886 1.834 1.16 2.097 1.293.263.13.417.11.57-.066.154-.175.657-.766.833-1.028.175-.263.35-.22.592-.13.24.088 1.524.72 1.787.852.264.13.439.197.505.306.066.11.066.634-.153 1.246z" />
                        </svg>
                        <span>Chat on WhatsApp</span>
                      </div>
                      <span className="text-[10px] font-semibold opacity-90 px-1.5 py-0.5 rounded-full bg-black/10">Active</span>
                    </a>
                  )}

                  {/* Telegram Support Button */}
                  {settings.floating_telegram_enabled !== false && showTelegram && (
                    <a
                      href={settings.social_telegram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full px-4 py-3 bg-[#229ed9] hover:bg-[#1e8ec3] text-[#ffffff] hover:text-[#ffffff] font-bold text-xs rounded-xl transition-all shadow-md shadow-[#229ed9]/15 hover:scale-[1.02] active:scale-[0.98] select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <Send size={15} />
                        <span>Join our Telegram</span>
                      </div>
                      <span className="text-[10px] font-semibold opacity-90 px-1.5 py-0.5 rounded-full bg-black/10">Online</span>
                    </a>
                  )}

                  {/* Direct Support Call Button */}
                  {settings.floating_phone_enabled !== false && settings.support_phone && (
                    <a
                      href={`tel:${settings.support_phone}`}
                      className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--line)] hover:border-[#f5c842]/40 text-[var(--heading)] hover:text-[var(--heading)] font-semibold text-xs rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <Phone size={15} className="text-[#f5c842]" />
                        <span>Call Helpline</span>
                      </div>
                      <span className="text-[10px] text-[var(--muted-2)] font-mono">{settings.support_phone}</span>
                    </a>
                  )}

                  {/* Support Email Button */}
                  {settings.floating_email_enabled !== false && settings.support_email && (
                    <a
                      href={`mailto:${settings.support_email}?subject=${encodeURIComponent("Support Request - " + (settings.app_name || "DigitalVault"))}`}
                      className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--line)] hover:border-[#f5c842]/40 text-[var(--heading)] hover:text-[var(--heading)] font-semibold text-xs rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <Mail size={15} className="text-[#f5c842]" />
                        <span>Email Support</span>
                      </div>
                      <span className="text-[10px] text-[var(--muted-2)] truncate max-w-[150px]">{settings.support_email}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Footer / Business Hours */}
              <div className="bg-[var(--surface-2)] px-4 py-3 border-t border-[var(--line)] flex items-center justify-center gap-2 text-[10px] text-[var(--muted-2)] font-medium shrink-0">
                <Clock size={12} className="text-[#f5c842]" />
                <span>Support Timing: {settings.business_hours || 'Mon–Sat, 10am–6pm IST'}</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] shadow-lg shadow-[#f5c842]/30 transition-all hover:scale-105 active:scale-95 duration-300 relative group"
        aria-expanded={isOpen}
        aria-label="Toggle support channels"
      >
        {/* Pulsing ring animation */}
        <span className="absolute -inset-1 rounded-full bg-[#f5c842]/20 animate-ping -z-10 opacity-75"></span>

        {/* Hover tag label on desktop */}
        <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-[var(--surface)] text-[var(--heading)] border border-[var(--line)] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden md:block select-none">
          Contact Support 👋
        </span>

        {/* Dynamic rotating icon */}
        <div className="transition-transform duration-300 transform">
          {isOpen ? (
            <X size={24} className="animate-in spin-in-90 duration-200" />
          ) : (
            <MessageSquare size={24} className="animate-in zoom-in duration-200" />
          )}
        </div>
      </button>
    </div>
  );
}
