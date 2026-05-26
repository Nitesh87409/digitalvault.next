'use client';
import { useState, useEffect } from 'react';

// Helper: resolve the deadline and compute the diff from it, all synchronously.
// Returns { parsedDeadline, diff, countdown, isExpired } without any side-effects on localStorage.
function resolveDeadline(settings) {
  if (!settings.bundle_timer_enabled) {
    return { parsedDeadline: 0, diff: 0, countdown: { d: '--', h: '--', m: '--', s: '--' }, isExpired: false };
  }

  const key = 'dv_deadline';
  const durationKey = 'dv_deadline_duration';
  const updatedKey = 'dv_settings_updated';

  const configDays = Math.max(0, Number(settings.bundle_timer_days) || 0);
  const configHours = Math.max(0, Number(settings.bundle_timer_hours) || 0);
  const configMinutes = Math.max(0, Number(settings.bundle_timer_minutes) || 0);
  const totalMs = (configDays * 86400000) + (configHours * 3600000) + (configMinutes * 60000);
  const durationFingerprint = `${configDays}d${configHours}h${configMinutes}m`;
  const configUpdated = settings.updatedAt || '';

  let deadline = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  let savedDuration = typeof window !== 'undefined' ? localStorage.getItem(durationKey) : null;
  let savedUpdated = typeof window !== 'undefined' ? localStorage.getItem(updatedKey) : null;

  let parsedDeadline = parseInt(deadline, 10);
  const isDeadlineInvalid = isNaN(parsedDeadline) || parsedDeadline <= 0;
  let needsReset = isDeadlineInvalid || savedDuration !== durationFingerprint || (configUpdated && savedUpdated !== configUpdated);

  if (needsReset) {
    parsedDeadline = Date.now() + (totalMs > 0 ? totalMs : 86400000);
  }

  const diff = parsedDeadline - Date.now();
  if (diff <= 0) {
    return { parsedDeadline, diff: 0, countdown: { d: '00', h: '00', m: '00', s: '00' }, isExpired: true, needsReset };
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return {
    parsedDeadline,
    diff,
    countdown: {
      d: days.toString().padStart(2, '0'),
      h: hours.toString().padStart(2, '0'),
      m: mins.toString().padStart(2, '0'),
      s: secs.toString().padStart(2, '0'),
    },
    isExpired: false,
    needsReset,
  };
}

export default function CountdownTimer({ settings, onExpired }) {
  // Compute initial state synchronously so the first paint shows the real time (no '00:00' flash)
  const [countdown, setCountdown] = useState(() => {
    const resolved = resolveDeadline(settings);
    return resolved.countdown;
  });
  const [isTimerExpired, setIsTimerExpired] = useState(() => {
    const resolved = resolveDeadline(settings);
    return resolved.isExpired;
  });

  useEffect(() => {
    if (!settings.bundle_timer_enabled) {
      if (onExpired) onExpired(false);
      return;
    }

    const key = 'dv_deadline';
    const durationKey = 'dv_deadline_duration';
    const updatedKey = 'dv_settings_updated';

    const configDays = Math.max(0, Number(settings.bundle_timer_days) || 0);
    const configHours = Math.max(0, Number(settings.bundle_timer_hours) || 0);
    const configMinutes = Math.max(0, Number(settings.bundle_timer_minutes) || 0);
    const totalMs = (configDays * 86400000) + (configHours * 3600000) + (configMinutes * 60000);
    const durationFingerprint = `${configDays}d${configHours}h${configMinutes}m`;
    const configUpdated = settings.updatedAt || '';

    let deadline = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    let savedDuration = typeof window !== 'undefined' ? localStorage.getItem(durationKey) : null;
    let savedUpdated = typeof window !== 'undefined' ? localStorage.getItem(updatedKey) : null;

    let parsedDeadline = parseInt(deadline, 10);
    const isDeadlineInvalid = isNaN(parsedDeadline) || parsedDeadline <= 0;

    if (isDeadlineInvalid || savedDuration !== durationFingerprint || (configUpdated && savedUpdated !== configUpdated)) {
      parsedDeadline = Date.now() + (totalMs > 0 ? totalMs : 86400000);
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, String(parsedDeadline));
        localStorage.setItem(durationKey, durationFingerprint);
        if (configUpdated) {
          localStorage.setItem(updatedKey, configUpdated);
        } else {
          localStorage.removeItem(updatedKey);
        }
      }
      setIsTimerExpired(false);
      if (onExpired) onExpired(false);
    } else {
      if (parsedDeadline - Date.now() <= 0) {
        setIsTimerExpired(true);
        if (onExpired) onExpired(true);
      } else {
        setIsTimerExpired(false);
        if (onExpired) onExpired(false);
      }
    }

    // Immediately compute and set the countdown to avoid any gap between mount and first interval tick
    const immediateDiff = parsedDeadline - Date.now();
    if (immediateDiff > 0) {
      const days = Math.floor(immediateDiff / 86400000);
      const hours = Math.floor((immediateDiff % 86400000) / 3600000);
      const mins = Math.floor((immediateDiff % 3600000) / 60000);
      const secs = Math.floor((immediateDiff % 60000) / 1000);
      setCountdown({
        d: days.toString().padStart(2, '0'),
        h: hours.toString().padStart(2, '0'),
        m: mins.toString().padStart(2, '0'),
        s: secs.toString().padStart(2, '0'),
      });
    }

    const timer = setInterval(() => {
      const diff = parsedDeadline - Date.now();
      if (diff <= 0) {
        setCountdown({ d: '00', h: '00', m: '00', s: '00' });
        setIsTimerExpired(true);
        if (onExpired) onExpired(true);
        clearInterval(timer);
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown({
        d: days.toString().padStart(2, '0'),
        h: hours.toString().padStart(2, '0'),
        m: mins.toString().padStart(2, '0'),
        s: secs.toString().padStart(2, '0'),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    settings.bundle_timer_enabled,
    settings.bundle_timer_days,
    settings.bundle_timer_hours,
    settings.bundle_timer_minutes,
    settings.updatedAt,
    settings.bundle_timer_action,
    onExpired
  ]);

  if (!settings.bundle_timer_enabled) return null;

  if (isTimerExpired && (settings.bundle_timer_action === 'disable_checkout' || settings.bundle_timer_action === 'show_expired')) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg sm:rounded-xl border border-red-500/20 bg-red-500/10 py-2 sm:py-4 px-3 sm:px-6 text-center animate-pulse">
        <span className="font-syne text-[10px] sm:text-lg font-bold text-red-500 tracking-wide uppercase">
          ⚠️ Expired
        </span>
        <span className="mt-0.5 text-[7px] sm:text-xs text-red-400/80 font-medium hidden xs:inline">
          Promotion ended
        </span>
      </div>
    );
  }

  if (isTimerExpired && settings.bundle_timer_action === 'hide_timer') {
    return null;
  }

  return (
    <div>
      <div className="mb-1 sm:mb-2 text-center text-[7px] sm:text-[10px] md:text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-[var(--muted-2)]">
        Offer Ending Soon:
      </div>
      <div className="flex justify-center gap-0.5 xs:gap-1 sm:gap-1.5 lg:gap-3">
        {[
          { val: countdown.d, label: 'Days' },
          { val: countdown.h, label: 'Hours' },
          { val: countdown.m, label: 'Mins' },
          { val: countdown.s, label: 'Secs' }
        ].map(c => (
          <div
            key={c.label}
            className="flex flex-col items-center min-w-[24px] xs:min-w-[28px] sm:min-w-[38px] md:min-w-[42px] lg:min-w-[60px] rounded-md sm:rounded-xl border border-[var(--line)] bg-[var(--surface-2)] py-0.5 px-0.5 sm:py-1 sm:px-1.5 md:py-1.5 md:px-2 lg:py-2 lg:px-3"
          >
            <span className="font-syne text-[9px] xs:text-[10px] sm:text-sm md:text-base lg:text-2xl font-bold text-[#f5c842] whitespace-nowrap">
              {c.val}
            </span>
            <span className="text-[4px] xs:text-[5px] sm:text-[7px] md:text-[8px] lg:text-[10px] text-[var(--muted-2)] uppercase font-semibold">
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
