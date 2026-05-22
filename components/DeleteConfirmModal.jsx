'use client';
import { useState } from 'react';

export default function DeleteConfirmModal({ open, onClose, onConfirm, title, message, itemName, permanent = false }) {
  const [confirming, setConfirming] = useState(false);

  if (!open) return null;

  async function handleConfirm() {
    setConfirming(true);
    await onConfirm();
    setConfirming(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#12121a] border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        {/* Top accent */}
        <div className={`h-1 w-full ${permanent ? 'bg-red-500' : 'bg-[#f5c842]'}`} />

        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl ${permanent ? 'bg-red-500/10' : 'bg-[#f5c842]/10'}`}>
            {permanent ? '⚠️' : '🗑️'}
          </div>

          {/* Title */}
          <h3 className="font-syne text-lg font-bold text-white mb-2">
            {title || (permanent ? 'Permanently Delete?' : 'Move to Bin?')}
          </h3>

          {/* Message */}
          <p className="text-gray-400 text-sm mb-2 leading-relaxed">
            {message || (permanent
              ? 'This action cannot be undone. The item will be permanently deleted.'
              : 'This item will be moved to the recycle bin. You can restore it later.'
            )}
          </p>

          {/* Item name */}
          {itemName && (
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 mt-3 mb-1">
              <p className="text-white text-sm font-medium truncate">{itemName}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={confirming}
            className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className={`flex-1 border-none px-4 py-3 rounded-xl text-sm font-syne font-bold cursor-pointer transition-all ${
              permanent
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
                : 'bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] shadow-lg shadow-[#f5c842]/20 hover:scale-[1.02]'
            } ${confirming ? 'opacity-70' : ''}`}
          >
            {confirming ? 'Deleting...' : permanent ? 'Delete Forever' : 'Move to Bin'}
          </button>
        </div>
      </div>
    </div>
  );
}
