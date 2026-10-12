import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  LogOut,
  AlertTriangle,
  Sparkles,
  User,
  Trash2,
  QrCode,
  X,
  Smartphone,
} from 'lucide-react';
import QRCode from 'qrcode';
import { ChannelInfo } from '../types/chat';

interface ChannelSetupProps {
  channelInfo: ChannelInfo | null;
  onJoin: (code: string, passphrase?: string, name?: string) => Promise<void>;
  onLeave: () => void;
  isLoading: boolean;
  defaultName?: string;
  myUserName?: string;
  onPanicBurn?: () => void;
}

export const ChannelSetup: React.FC<ChannelSetupProps> = ({
  channelInfo,
  onJoin,
  onLeave,
  isLoading,
  defaultName = 'You',
  myUserName,
  onPanicBurn,
}) => {
  const [code, setCode] = useState('234');
  const [name, setName] = useState(myUserName || defaultName);
  const [copied, setCopied] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showBurnConfirm, setShowBurnConfirm] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrTargetPin, setQrTargetPin] = useState<string>('234');
  const [validationError, setValidationError] = useState<string | null>(null);

  const generateRandomCode = () => {
    const random = Math.floor(100 + Math.random() * 900).toString();
    setCode(random);
    setValidationError(null);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.replace(/\D/g, '').slice(0, 6);
    if (clean.length < 3) {
      setValidationError('PIN must be 3 to 6 numerical digits.');
      return;
    }
    setValidationError(null);
    onJoin(clean, undefined, name.trim() || 'You');
  };

  const getInviteUrl = (pin: string) => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('channel', pin);
    return url.toString();
  };

  const handleCopy = () => {
    if (!channelInfo) return;
    const url = getInviteUrl(channelInfo.code);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPinOnly = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleConfirmLeave = () => {
    setShowLeaveConfirm(false);
    onLeave();
  };

  const handleConfirmBurn = () => {
    setShowBurnConfirm(false);
    if (onPanicBurn) {
      onPanicBurn();
    } else {
      onLeave();
    }
  };

  // Generate QR Code for target PIN
  const openQrForPin = async (pin: string) => {
    setQrTargetPin(pin);
    setShowQrModal(true);
    try {
      const inviteUrl = getInviteUrl(pin);
      const dataUrl = await QRCode.toDataURL(inviteUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#052e16',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  // Close QR modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showQrModal) {
        setShowQrModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showQrModal]);

  // State: Connected to an active channel
  if (channelInfo) {
    const isOnline = Boolean(channelInfo.peerPresent);
    const peerDisplayName = channelInfo.peerName || 'Partner';

    return (
      <div className="bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 rounded-xl px-3 sm:px-4 py-2 shadow-lg transition-colors shrink-0 text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800">
        <div className="flex items-center justify-between gap-2.5">
          {/* Avatar + name + online/offline status */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Compact Avatar with status indicator */}
            <div className="relative shrink-0">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-mono font-bold text-xs sm:text-sm shadow-sm ${
                  isOnline
                    ? 'bg-[#059669] dark:bg-[#10B981] text-white dark:text-[#022c22]'
                    : 'bg-[#9BA3AF] dark:bg-[#9BA3AF] bg-slate-300 text-slate-700'
                }`}
              >
                {peerDisplayName.charAt(0).toUpperCase()}
              </div>
              {/* Online / Offline status indicator */}
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#151B22] dark:ring-[#151B22] ring-white ${
                  isOnline ? 'bg-[#10B981]' : 'bg-[#6E7681] dark:bg-[#6E7681] bg-slate-400'
                }`}
                title={isOnline ? 'Online' : 'Waiting for partner'}
              />
            </div>

            {/* Conversation Name & Online Status */}
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-xs sm:text-sm font-semibold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900 truncate leading-tight">
                  {peerDisplayName}
                </span>
                {/* Clickable channel PIN badge */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-[#059669] dark:text-[#10B981] bg-[#0F1419] dark:bg-[#0F1419] bg-emerald-50/60 border border-[#27323F] dark:border-[#27323F] border-emerald-300 hover:border-[#10B981] transition-colors cursor-pointer shrink-0"
                  title="Click to copy invite link"
                >
                  <span className="text-[9px] text-[#9BA3AF] mr-0.5 uppercase">PIN</span>
                  <span>{channelInfo.code}</span>
                  {copied ? (
                    <Check className="w-2.5 h-2.5 text-[#10B981] ml-0.5" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 ml-0.5" />
                  )}
                </button>
              </div>

              {/* Status line: Online or waiting */}
              <div className="flex items-center gap-1.5 text-[11px] font-sans leading-tight mt-0.5">
                {isOnline ? (
                  <span className="text-[#10B981] font-medium flex items-center gap-1">
                    online · keys synced in RAM
                  </span>
                ) : (
                  <span className="text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500">
                    waiting for partner to connect
                  </span>
                )}
                <span className="text-[#27323F] dark:text-[#27323F] text-slate-300">·</span>
                <span className="text-[10px] text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 font-mono hidden xs:inline">
                  You: {myUserName || 'You'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Controls: QR Code, Share, Shred RAM, & Leave */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Display QR Code button */}
            <button
              type="button"
              onClick={() => openQrForPin(channelInfo.code)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium bg-[#0F1419] dark:bg-[#0F1419] bg-slate-100 hover:bg-[#1B222A] dark:hover:bg-[#1B222A] hover:bg-slate-200 text-[#059669] dark:text-[#10B981] border border-[#27323F] dark:border-[#27323F] border-slate-300 hover:border-[#10B981] rounded-md transition-colors cursor-pointer shadow-xs"
              title="Show QR Code for mobile device"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">QR Code</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium bg-[#0F1419] dark:bg-[#0F1419] bg-slate-100 hover:bg-[#1B222A] dark:hover:bg-[#1B222A] hover:bg-slate-200 text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 border border-[#27323F] dark:border-[#27323F] border-slate-300 hover:border-[#10B981] rounded-md transition-colors cursor-pointer shadow-xs"
              title="Copy channel invite link"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-[#10B981] font-semibold text-[11px]">
                    Copied!
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500" />
                  <span className="text-[11px] hidden sm:inline">Copy link</span>
                </>
              )}
            </button>

            {/* Panic Shred / Burn Keys Button */}
            <button
              type="button"
              onClick={() => setShowBurnConfirm(true)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono font-medium text-[#EF4444] hover:bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-md transition-colors cursor-pointer"
              title="Shred Keys & Burn Room (Anti-Hacker Emergency Wipe)"
            >
              <Trash2 className="w-3 h-3 text-[#EF4444]" />
              <span className="text-[11px] hidden md:inline">Shred Keys</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLeaveConfirm(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#EF4444] hover:bg-[#1B222A] dark:hover:bg-[#1B222A] hover:bg-slate-100 border border-[#27323F] dark:border-[#27323F] border-slate-300 rounded-md transition-colors cursor-pointer"
              title="Leave channel"
            >
              <LogOut className="w-3 h-3" />
              <span className="text-[11px] hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>

        {/* QR Code Modal for Mobile Quick Join */}
        {showQrModal && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setShowQrModal(false)}
          >
            <div
              className="relative max-w-sm w-full bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-300 rounded-2xl p-5 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#27323F] dark:border-[#27323F] border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#059669] dark:text-[#10B981]" />
                  <span className="font-mono text-sm font-bold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
                    Scan to Join on Mobile
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="p-1 text-[#9BA3AF] hover:text-[#E8E6E1] dark:hover:text-[#E8E6E1] hover:text-slate-900 rounded cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Channel PIN Banner */}
              <div className="p-2.5 rounded-lg bg-[#0F1419] dark:bg-[#0F1419] bg-emerald-50/70 border border-[#059669]/30 dark:border-[#10B981]/30">
                <div className="text-[11px] font-mono text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 uppercase tracking-wider">
                  Channel PIN
                </div>
                <div className="text-2xl font-mono font-bold text-[#059669] dark:text-[#10B981] tracking-widest mt-0.5">
                  #{qrTargetPin}
                </div>
              </div>

              {/* QR Image Display */}
              <div className="flex justify-center p-3 bg-white rounded-xl shadow-inner border border-slate-200">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`CipherLink Channel #${qrTargetPin} QR Code`}
                    className="w-56 h-56 object-contain rounded"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center font-mono text-xs text-slate-400">
                    Generating QR code…
                  </div>
                )}
              </div>

              <p className="text-xs text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 font-sans leading-relaxed">
                Scan with any mobile camera or QR reader to instantly launch CipherLink and sync encryption keys in RAM.
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => handleCopyPinOnly(qrTargetPin)}
                  className="px-3 py-2 bg-[#0F1419] dark:bg-[#0F1419] bg-slate-100 hover:bg-[#1B222A] text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 rounded-lg border border-[#27323F] dark:border-[#27323F] border-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {copiedPin ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#9BA3AF]" />}
                  <span>{copiedPin ? 'PIN Copied' : 'Copy PIN'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2 bg-[#059669] hover:bg-[#047857] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white dark:text-[#022c22] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Panic Burn Confirmation */}
        {showBurnConfirm && (
          <div className="mt-2 pt-2 border-t border-[#EF4444]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#EF4444]/10 p-2.5 rounded-lg border border-[#EF4444]/30 text-xs">
            <div className="flex items-center gap-2 text-[#EF4444]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-sans font-medium">
                Emergency Shred: Immediately purge AES-256 keys from browser memory and drop socket?
              </span>
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto font-mono">
              <button
                type="button"
                onClick={() => setShowBurnConfirm(false)}
                className="px-2 py-0.5 text-[11px] text-[#9BA3AF] hover:text-white bg-[#151B22] border border-[#27323F] rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBurn}
                className="px-2.5 py-0.5 text-[11px] font-bold text-white bg-[#EF4444] hover:bg-[#DC2626] rounded shadow-xs cursor-pointer"
              >
                Burn &amp; Wipe Now
              </button>
            </div>
          </div>
        )}

        {/* Leave Channel Confirmation */}
        {showLeaveConfirm && (
          <div className="mt-2 pt-2 border-t border-[#27323F] dark:border-[#27323F] border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#0F1419] dark:bg-[#0F1419] bg-slate-50 p-2 rounded-lg border border-[#27323F] dark:border-[#27323F] border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800">
              <AlertTriangle className="w-3.5 h-3.5 text-[#059669] dark:text-[#10B981] shrink-0" />
              <span className="text-[11px] font-sans">
                Leave channel {channelInfo.code}? Keys will be wiped from RAM and the chat will vanish.
              </span>
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto font-mono">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="px-2 py-0.5 text-[11px] text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#E8E6E1] bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-300 rounded"
              >
                Stay here
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                className="px-2 py-0.5 text-[11px] font-semibold text-white bg-[#EF4444] hover:bg-[#DC2626] rounded shadow-xs cursor-pointer"
              >
                Drop session
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // State: Pre-join
  return (
    <div className="bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-lg transition-colors shrink-0 text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800">
      <form onSubmit={handleJoinSubmit} className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          {/* Small Channel Code & Small Name section */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            {/* PIN input */}
            <div className="relative shrink-0 w-28 sm:w-32">
              <button
                type="button"
                onClick={generateRandomCode}
                title="Roll a random PIN"
                className="absolute inset-y-0 left-0 pl-2 pr-1 flex items-center text-[#059669] dark:text-[#10B981] hover:text-[#047857] cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
              <input
                id="channel-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setValidationError(null);
                }}
                placeholder="PIN (234)"
                className="w-full pl-7 pr-1.5 py-1 bg-[#0F1419] dark:bg-[#0F1419] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-300 rounded-md text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 font-mono text-xs tracking-wider font-semibold focus:outline-none focus:border-[#059669] dark:focus:border-[#10B981] transition-colors shadow-inner"
                title="Enter 3-6 digit channel PIN"
              />
            </div>

            {/* Clickable Quick Random Symbol button */}
            <button
              type="button"
              onClick={generateRandomCode}
              className="p-1 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#059669] dark:hover:text-[#10B981] hover:bg-[#1B222A] dark:hover:bg-[#1B222A] hover:bg-slate-100 rounded border border-[#27323F] dark:border-[#27323F] border-slate-300 transition-colors cursor-pointer shrink-0"
              title="Roll random PIN"
              aria-label="Random PIN"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>

            {/* QR code button in pre-join state */}
            <button
              type="button"
              onClick={() => openQrForPin(code.replace(/\D/g, '').slice(0, 6) || '234')}
              className="p-1 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#059669] dark:hover:text-[#10B981] hover:bg-[#1B222A] dark:hover:bg-[#1B222A] hover:bg-slate-100 rounded border border-[#27323F] dark:border-[#27323F] border-slate-300 transition-colors cursor-pointer shrink-0"
              title="Preview QR Code for mobile"
              aria-label="Preview QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>

            {/* Handle / Name Section */}
            <div className="relative shrink-0 w-24 sm:w-32">
              <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-400">
                <User className="w-3 h-3" />
              </div>
              <input
                id="name-input"
                type="text"
                value={name}
                maxLength={20}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your handle"
                className="w-full pl-5 pr-1.5 py-1 text-xs bg-[#0F1419] dark:bg-[#0F1419] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-300 rounded-md text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 focus:outline-none focus:border-[#059669] dark:focus:border-[#10B981] font-sans font-medium"
                title="Your display handle"
              />
            </div>

            {/* Status indicator: Standby */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 truncate pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6E7681] dark:bg-[#6E7681] bg-slate-400 shrink-0" />
              <span className="truncate">standby</span>
            </div>
          </div>

          {/* Join Channel Button */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <button
              type="submit"
              disabled={isLoading || code.length < 3}
              className="px-3.5 py-1 text-xs font-mono font-bold text-white dark:text-[#022c22] bg-[#059669] hover:bg-[#047857] dark:bg-[#10B981] dark:hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              {isLoading ? 'Connecting…' : 'Connect'}
            </button>
          </div>
        </div>

        {validationError && (
          <p className="text-[11px] font-mono text-[#EF4444] font-medium mt-0.5">
            {validationError}
          </p>
        )}
      </form>

      {/* QR Code Modal for Pre-join State */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="relative max-w-sm w-full bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-300 rounded-2xl p-5 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#27323F] dark:border-[#27323F] border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#059669] dark:text-[#10B981]" />
                <span className="font-mono text-sm font-bold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
                  Scan to Join on Mobile
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1 text-[#9BA3AF] hover:text-[#E8E6E1] dark:hover:text-[#E8E6E1] hover:text-slate-900 rounded cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0F1419] dark:bg-[#0F1419] bg-emerald-50/70 border border-[#059669]/30 dark:border-[#10B981]/30">
              <div className="text-[11px] font-mono text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 uppercase tracking-wider">
                Channel PIN
              </div>
              <div className="text-2xl font-mono font-bold text-[#059669] dark:text-[#10B981] tracking-widest mt-0.5">
                #{qrTargetPin}
              </div>
            </div>

            <div className="flex justify-center p-3 bg-white rounded-xl shadow-inner border border-slate-200">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`CipherLink Channel #${qrTargetPin} QR Code`}
                  className="w-56 h-56 object-contain rounded"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center font-mono text-xs text-slate-400">
                  Generating QR code…
                </div>
              )}
            </div>

            <p className="text-xs text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 font-sans leading-relaxed">
              Scan with your phone camera to quickly join channel #{qrTargetPin} without typing manually.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
              <button
                type="button"
                onClick={() => handleCopyPinOnly(qrTargetPin)}
                className="px-3 py-2 bg-[#0F1419] dark:bg-[#0F1419] bg-slate-100 hover:bg-[#1B222A] text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 rounded-lg border border-[#27323F] dark:border-[#27323F] border-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {copiedPin ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#9BA3AF]" />}
                <span>{copiedPin ? 'PIN Copied' : 'Copy PIN'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const url = getInviteUrl(qrTargetPin);
                  navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3 py-2 bg-[#059669] hover:bg-[#047857] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white dark:text-[#022c22] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
