import React, { useState } from 'react';
import {
  ArrowRight,
  Laptop,
  Smartphone,
  KeyRound,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { EncryptionDemo } from './EncryptionDemo';

interface HomePageProps {
  onOpenChat: (initialCode?: string) => void;
  onOpenAbout: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenChat,
  onOpenAbout,
}) => {
  const [quickCode, setQuickCode] = useState('234');

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickCode.replace(/\D/g, '').slice(0, 6);
    if (clean.length >= 3) {
      onOpenChat(clean);
    } else {
      onOpenChat('234');
    }
  };

  return (
    <div className="w-full bg-[#0F1419] dark:bg-[#0F1419] bg-[#F8F9FA] text-[#E8E6E1] dark:text-[#E8E6E1] text-[#0F1419] font-sans transition-colors">
      {/* =========================================================================
          1. HERO SECTION (Asymmetric, Monospace Headings, Midnight & Emerald Green)
      ========================================================================= */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pt-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Product Narrative & Asymmetric Launcher */}
          <div className="lg:col-span-6 space-y-6 lg:pt-2">
            {/* Unboxed Kicker */}
            <div className="flex items-center gap-2 text-xs font-mono text-[#059669] dark:text-[#10B981] font-semibold">
              <span className="text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500">[01 // PROTOCOL_SPEC]</span>
              <span>Client-Side AES-256-GCM · Blind WebSocket Relay</span>
            </div>

            {/* Monospace Headline */}
            <div className="space-y-3">
              <h1 className="font-mono text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900 tracking-tight leading-[1.14]">
                Two people. AES-256. <br className="hidden sm:inline" />
                <span className="text-[#059669] dark:text-[#10B981]">A dumb relay in between.</span>
              </h1>

              <p className="font-sans text-base sm:text-lg text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 leading-relaxed max-w-xl font-normal pt-1">
                Pick a channel PIN, send the link to a friend, and start talking. Keys are derived in your browser's WebCrypto memory, the server only forwards opaque ciphertext blobs, and there are no accounts, phone numbers, or passwords to manage.
              </p>
            </div>

            {/* Quick Channel Launcher Bar */}
            <div className="p-4 bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 rounded-xl shadow-lg space-y-3 max-w-lg">
              <form onSubmit={handleQuickJoin} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#059669] dark:text-[#10B981]">
                    <span className="font-mono text-xs font-semibold">#</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={quickCode}
                    onChange={(e) => setQuickCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Pick a PIN (e.g. 234)"
                    className="w-full pl-7 pr-3 py-2 text-sm font-mono font-semibold bg-[#0F1419] dark:bg-[#0F1419] bg-slate-50 border border-[#27323F] dark:border-[#27323F] border-slate-300 rounded-md text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 placeholder-[#6E7681] dark:placeholder-[#6E7681] placeholder-slate-400 focus:outline-none focus:border-[#059669] dark:focus:border-[#10B981] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#059669] hover:bg-[#047857] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white dark:text-[#022c22] text-xs sm:text-sm font-mono font-bold rounded-md shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Connect to Channel</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </form>

              <div className="flex items-center justify-between text-xs text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 pt-1.5 border-t border-[#27323F] dark:border-[#27323F] border-slate-200">
                <span className="text-[11px] font-mono">Pick any 3–6 digit PIN. Share it out of band.</span>
                <button
                  type="button"
                  onClick={() => onOpenChat('234')}
                  className="text-[11px] font-mono text-[#059669] dark:text-[#10B981] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Test with channel #234</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Monospace Technical Invariants Strip */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-3 pt-1 text-xs font-mono text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500">
              <span className="text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 font-medium">PBKDF2-SHA256 (120k rounds)</span>
              <span className="text-[#27323F] dark:text-[#27323F] text-slate-300" aria-hidden="true">/</span>
              <span className="text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 font-medium">Fresh 96-bit Nonce / Msg</span>
              <span className="text-[#27323F] dark:text-[#27323F] text-slate-300" aria-hidden="true">/</span>
              <span className="text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 font-medium">Zero Server Disk Storage</span>
            </div>
          </div>

          {/* Right Column: Live WebCrypto Demo */}
          <div className="lg:col-span-6 w-full">
            <EncryptionDemo />
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. STEP-BY-STEP HOW IT WORKS (Asymmetric 4-Step Narrative)
      ========================================================================= */}
      <section id="how-it-works" className="border-t border-[#27323F] dark:border-[#27323F] border-slate-200 bg-[#11161D] dark:bg-[#11161D] bg-slate-100 py-16 sm:py-20 scroll-mt-14 transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-10">
          <div className="max-w-xl space-y-2">
            <h2 className="font-mono text-xs uppercase tracking-wider text-[#059669] dark:text-[#10B981] font-bold">
              02 // How It Works (For Real)
            </h2>
            <h3 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
              Four steps. No accounts, no password resets.
            </h3>
            <p className="font-sans text-sm sm:text-base text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600">
              No email verification links. No contact list sync requests. Just pick a number and start typing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Step 1 */}
            <div className="bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="text-xs font-mono font-bold text-[#059669] dark:text-[#10B981]">
                STEP 01
              </div>
              <h4 className="font-mono text-base font-bold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
                Pick a channel PIN
              </h4>
              <p className="font-sans text-xs sm:text-sm text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 leading-relaxed">
                Pick any 3–6 digit number (like 234) or hit the dice for a random one. That number acts as your temporary room ID and key seed.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="text-xs font-mono font-bold text-[#059669] dark:text-[#10B981]">
                STEP 02
              </div>
              <h4 className="font-mono text-base font-bold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
                Send it to your friend
              </h4>
              <p className="font-sans text-xs sm:text-sm text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 leading-relaxed">
                Pass them the link or PIN over Signal, email, or a sticky note. Just remember: anyone with the PIN can enter until the room hits its 2-person cap.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="text-xs font-mono font-bold text-[#059669] dark:text-[#10B981]">
                STEP 03
              </div>
              <h4 className="font-mono text-base font-bold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
                Derive keys in RAM
              </h4>
              <p className="font-sans text-xs sm:text-sm text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 leading-relaxed">
                When you both connect, WebCrypto runs 120,000 rounds of PBKDF2 locally to generate identical symmetric keys in RAM. The server never gets the key.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="text-xs font-mono font-bold text-[#059669] dark:text-[#10B981]">
                STEP 04
              </div>
              <h4 className="font-mono text-base font-bold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
                Chat &amp; purge
              </h4>
              <p className="font-sans text-xs sm:text-sm text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 leading-relaxed">
                Send text, images, or PDFs. Hit delete to remove a message, or set a self-destruct timer. Zero disk logs on the relay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. BLIND RELAY ARCHITECTURE DIAGRAM
      ========================================================================= */}
      <section className="border-t border-[#27323F] dark:border-[#27323F] border-slate-200 bg-[#0F1419] dark:bg-[#0F1419] bg-[#F8F9FA] py-16 sm:py-20 transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <h2 className="font-mono text-xs uppercase tracking-wider text-[#059669] dark:text-[#10B981] font-bold">
                03 // Blind Relay Architecture
              </h2>
              <h3 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
                The relay server has no idea what you're saying.
              </h3>
              <p className="font-sans text-sm text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600">
                Everything is encrypted on your machine before touching the WebSocket. The server routes raw scrambled bytes from person A to person B and drops them from memory.
              </p>
            </div>
          </div>

          {/* Diagram Container */}
          <div className="p-6 sm:p-8 rounded-xl bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4 max-w-3xl mx-auto">
              {/* Alice Device */}
              <div className="flex flex-col items-center space-y-2 w-36 text-center">
                <div className="w-12 h-12 rounded-lg bg-[#0F1419] dark:bg-[#0F1419] bg-slate-100 border border-[#27323F] dark:border-[#27323F] border-slate-300 flex items-center justify-center text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800">
                  <Laptop className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="font-mono font-semibold text-xs text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">Alice</div>
                <div className="font-sans text-[11px] text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500">Sender Client</div>
              </div>

              {/* Connecting Line Left */}
              <div className="flex-1 flex flex-col items-center justify-center w-full sm:w-auto">
                <div className="w-full hidden sm:flex items-center">
                  <div className="h-px bg-[#27323F] dark:bg-[#27323F] bg-slate-300 flex-1" />
                  <span className="text-[10px] font-mono font-semibold text-[#059669] dark:text-[#10B981] bg-[#0F1419] dark:bg-[#0F1419] bg-emerald-50 px-2 py-0.5 rounded border border-[#27323F] dark:border-[#27323F] border-emerald-300 mx-1">
                    #234
                  </span>
                  <div className="h-px bg-[#27323F] dark:bg-[#27323F] bg-slate-300 flex-1" />
                </div>
                <div className="sm:hidden text-[10px] font-mono text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 py-1">
                  ↓ joins #234
                </div>
              </div>

              {/* Shared Channel Relay */}
              <div className="flex flex-col items-center space-y-2 px-5 py-3.5 rounded-lg bg-[#11161D] dark:bg-[#11161D] bg-emerald-50/40 border border-[#059669]/60 dark:border-[#10B981]/60 min-w-[180px] text-center shadow-xs">
                <div className="w-7 h-7 rounded bg-[#059669] dark:bg-[#10B981] text-white dark:text-[#022c22] flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="font-mono font-bold text-xs text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
                  Channel 234
                </div>
                <div className="font-mono text-[10px] text-[#059669] dark:text-[#10B981] font-semibold">
                  Blind WebSocket Relay
                </div>
              </div>

              {/* Connecting Line Right */}
              <div className="flex-1 flex flex-col items-center justify-center w-full sm:w-auto">
                <div className="w-full hidden sm:flex items-center">
                  <div className="h-px bg-[#27323F] dark:bg-[#27323F] bg-slate-300 flex-1" />
                  <span className="text-[10px] font-mono font-semibold text-[#059669] dark:text-[#10B981] bg-[#0F1419] dark:bg-[#0F1419] bg-emerald-50 px-2 py-0.5 rounded border border-[#27323F] dark:border-[#27323F] border-emerald-300 mx-1">
                    #234
                  </span>
                  <div className="h-px bg-[#27323F] dark:bg-[#27323F] bg-slate-300 flex-1" />
                </div>
                <div className="sm:hidden text-[10px] font-mono text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 py-1">
                  ↓ joins #234
                </div>
              </div>

              {/* Bob Device */}
              <div className="flex flex-col items-center space-y-2 w-36 text-center">
                <div className="w-12 h-12 rounded-lg bg-[#0F1419] dark:bg-[#0F1419] bg-slate-100 border border-[#27323F] dark:border-[#27323F] border-slate-300 flex items-center justify-center text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800">
                  <Smartphone className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="font-mono font-semibold text-xs text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">Bob</div>
                <div className="font-sans text-[11px] text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500">Recipient Client</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. WHAT IT DOES & WHAT IT DOESN'T (Honest Developer Breakdown)
      ========================================================================= */}
      <section className="border-t border-[#27323F] dark:border-[#27323F] border-slate-200 bg-[#11161D] dark:bg-[#11161D] bg-slate-100 py-16 sm:py-20 transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-10">
          <div className="max-w-xl space-y-2">
            <h2 className="font-mono text-xs uppercase tracking-wider text-[#059669] dark:text-[#10B981] font-bold">
              04 // What It Does &amp; What It Doesn't
            </h2>
            <h3 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
              Built for quick private chats. Honest about the trade-offs.
            </h3>
            <p className="font-sans text-sm sm:text-base text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600">
              No marketing buzzwords, no user tracking. Here is what you get—and where the real-world limits are.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
            <div className="space-y-2">
              <div className="text-[#059669] dark:text-[#10B981] font-mono font-bold text-xs uppercase tracking-wider">
                01 · Ephemeral Channels
              </div>
              <h4 className="font-mono text-base font-bold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
                Rooms vanish when you leave
              </h4>
              <p className="font-sans text-xs sm:text-sm text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 leading-relaxed">
                Meet in a shared channel without an address book. Once both people close the tab, the room disappears from server memory entirely. No database rows left behind.
              </p>
            </div>

            <div className="space-y-2 md:border-l md:border-[#27323F] md:dark:border-[#27323F] md:border-slate-300 md:pl-6">
              <div className="text-[#059669] dark:text-[#10B981] font-mono font-bold text-xs uppercase tracking-wider">
                02 · In-Browser Crypto
              </div>
              <h4 className="font-mono text-base font-bold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
                Math does the heavy lifting
              </h4>
              <p className="font-sans text-xs sm:text-sm text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 leading-relaxed">
                Keys are derived in your browser via WebCrypto with 120,000 PBKDF2 rounds. Even if the server owner dumps RAM, all they see is scrambled binary noise.
              </p>
            </div>

            <div className="space-y-2 md:border-l md:border-[#27323F] md:dark:border-[#27323F] md:border-slate-300 md:pl-6">
              <div className="text-[#059669] dark:text-[#10B981] font-mono font-bold text-xs uppercase tracking-wider">
                03 · Media Attachments
              </div>
              <h4 className="font-mono text-base font-bold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
                Photos, videos, and PDFs
              </h4>
              <p className="font-sans text-xs sm:text-sm text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 leading-relaxed">
                Send files up to 25 MB. Every file is read into binary locally, encrypted with its own fresh IV, and forwarded through the pipe.
              </p>
            </div>

            <div className="space-y-2 md:border-l md:border-[#27323F] md:dark:border-[#27323F] md:border-slate-300 md:pl-6">
              <div className="text-[#059669] dark:text-[#10B981] font-mono font-bold text-xs uppercase tracking-wider">
                04 · Honest Limits
              </div>
              <h4 className="font-mono text-base font-bold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
                Screenshots beat cryptography
              </h4>
              <p className="font-sans text-xs sm:text-sm text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 leading-relaxed">
                Deleted messages vanish from both screens, but they can't erase screenshots, photo snaps, or shoulder surfers. If the recipient takes a picture of their monitor, math can't save you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. READY TO CHAT ACTION
      ========================================================================= */}
      <section className="border-t border-[#27323F] dark:border-[#27323F] border-slate-200 bg-[#0F1419] dark:bg-[#0F1419] bg-[#F8F9FA] py-16 sm:py-20 transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 text-center space-y-4">
          <h2 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
            Need to send something sensitive?
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 max-w-md mx-auto leading-relaxed">
            Pick a PIN, send it to the other person, and have your conversation. When you're done, close the tab and move on.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onOpenChat()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#059669] hover:bg-[#047857] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white dark:text-[#022c22] font-mono text-sm font-bold rounded-md shadow-xs transition-colors cursor-pointer w-full sm:w-auto"
            >
              <span>Open CipherLink Messages</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={onOpenAbout}
              className="inline-flex items-center justify-center px-5 py-3 font-mono text-sm font-medium text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 hover:text-[#059669] dark:hover:text-[#10B981] bg-[#151B22] dark:bg-[#151B22] bg-white hover:bg-[#1B222A] dark:hover:bg-[#1B222A] hover:bg-slate-100 border border-[#27323F] dark:border-[#27323F] border-slate-300 rounded-md transition-colors cursor-pointer w-full sm:w-auto"
            >
              Read How It Works &amp; FAQ
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. CLEAN PRODUCT FOOTER
      ========================================================================= */}
      <footer className="border-t border-[#27323F] dark:border-[#27323F] border-slate-200 bg-[#11161D] dark:bg-[#11161D] bg-slate-100 py-8 text-xs text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 font-medium text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800">
            <BrandLogo size="xs" />
            <span className="font-mono font-bold">CipherLink</span>
            <span className="text-[#27323F] dark:text-[#27323F] text-slate-300">·</span>
            <span className="font-sans font-normal text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500">
              Browser-encrypted messaging for two. No accounts, no persistent server memory.
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <button
              type="button"
              onClick={onOpenAbout}
              className="hover:text-[#059669] dark:hover:text-[#10B981] transition-colors cursor-pointer"
            >
              About &amp; Limits FAQ
            </button>
            <a
              href="https://github.com/Devputta/CipherLink-.git"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#059669] dark:hover:text-[#10B981] transition-colors"
            >
              GitHub
            </a>
            <button
              type="button"
              onClick={() => onOpenChat()}
              className="text-[#059669] dark:text-[#10B981] font-bold hover:underline cursor-pointer"
            >
              Open Messenger →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
