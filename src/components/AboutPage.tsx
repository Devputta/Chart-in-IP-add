import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface AboutPageProps {
  onStartMessaging: () => void;
  onBackHome?: () => void;
}

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: 'Do I need to sign up, give a phone number, or download an app?',
    a: 'Nope. No accounts, no email verification links, no phone numbers, and no passwords to reset. You open CipherLink in any modern browser, pick a 3–6 digit PIN, and share it with your friend. That is the entire onboarding flow.',
  },
  {
    q: 'Can I delete messages after sending them?',
    a: "Yes. You can delete any message you sent, and it disappears from both your screen and your friend's screen in real time. But real talk: deletion cannot erase screenshots, camera photos of the screen, or human memory. If someone took a screenshot or looked over your shoulder, cryptography cannot turn back time.",
  },
  {
    q: 'What does the auto-delete timer actually do?',
    a: 'If you turn on auto-delete (30 seconds or 5 minutes), messages count down and vanish from browser RAM once the timer expires. It keeps your active screen tidy, but remember the screenshot rule: if the other person is fast with Command+Shift+4, self-destruct timers cannot stop them.',
  },
  {
    q: 'How does the browser encryption actually work under the hood?',
    a: 'Your browser uses the native Web Cryptography API. When you pick a PIN (e.g. 234), WebCrypto runs 120,000 rounds of PBKDF2 with SHA-256 to derive a 256-bit AES-GCM symmetric key in RAM. Every message gets a fresh 96-bit random nonce and a 128-bit authentication tag before hitting the network pipe.',
  },
  {
    q: 'Can the server read our messages or files?',
    a: "No. The server is a tiny Node.js WebSocket relay whose only job is forwarding opaque binary envelopes from person A to person B. Even if someone inspects the relay's process memory, all they see is scrambled ciphertext blobs. What the server CAN see is standard networking metadata: your IP address and the timestamp of your connection.",
  },
  {
    q: 'What happens when we close the tab?',
    a: 'Everything evaporates. The encryption keys were held in browser memory; once you close the window, they are gone forever. When both participants disconnect, the relay frees the channel from memory. There is no database or disk backup, so we could not restore your chat even if you begged us.',
  },
  {
    q: 'Can a third person sneak into our channel?',
    a: "No. Every channel is strictly hard-capped at two active connections. If you and your friend are in channel #234 and someone else tries to join #234, the relay rejects them with an error. For best privacy, choose a random 5–6 digit PIN so strangers don't accidentally join before your friend does.",
  },
  {
    q: 'Can I send photos, videos, and PDFs?',
    a: 'Yes, up to 25 MB per file. The browser reads the file as raw binary, encrypts it on your machine with AES-256-GCM, and sends the ciphertext envelope. The recipient decrypts it locally in RAM for preview or download.',
  },
  {
    q: 'What are CipherLink’s honest security limits?',
    a: "Math protects data in transit, but it can't fix human errors or compromised hardware. If your computer has a keylogger, if someone is looking over your shoulder at a coffee shop, or if your friend's phone is unlocked on a table, AES-256 won't save you. Treat it as a secure temporary pipe, not an invisibility cloak.",
  },
];

export const AboutPage: React.FC<AboutPageProps> = ({
  onStartMessaging,
  onBackHome,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="w-full max-w-[880px] mx-auto px-4 py-8 sm:py-12 space-y-8 text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 font-sans transition-colors">
      {/* Top back button */}
      {onBackHome && (
        <div>
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#059669] dark:hover:text-[#10B981] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>
      )}

      {/* Intro Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BrandLogo size="md" />
          <span className="font-mono text-xs text-[#059669] dark:text-[#10B981] font-semibold">
            [SPEC // ARCHITECTURE] Ephemeral 2-Party Channel Relay
          </span>
        </div>

        <h1 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900 leading-tight">
          Encrypted messaging without the corporate surveillance.
        </h1>

        <p className="font-sans text-sm sm:text-base text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 leading-relaxed">
          We built CipherLink because sometimes you just need to send a private credential, a sensitive document, or a quick note to a friend without handing your phone number to a massive advertising network or installing yet another 200MB messaging app.
        </p>

        {/* Primary Call to Action */}
        <div className="pt-1 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onStartMessaging}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#059669] hover:bg-[#047857] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white dark:text-[#022c22] font-mono text-xs sm:text-sm font-bold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <span>Open Messenger</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      <hr className="border-[#27323F] dark:border-[#27323F] border-slate-200" />

      {/* How It Works - 3 Step Practical Walkthrough */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#059669] dark:text-[#10B981]">
          How it works in practice
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 rounded-lg shadow-sm space-y-1.5">
            <div className="font-mono text-xs font-bold text-[#059669] dark:text-[#10B981]">
              01 · Pick a PIN
            </div>
            <div className="font-mono text-xs font-semibold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
              3–6 digits
            </div>
            <p className="font-sans text-xs text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 leading-relaxed">
              Use a quick number like <span className="font-mono text-[#059669] dark:text-[#10B981] font-semibold">#234</span> or generate a random one. That's your room ID and key seed.
            </p>
          </div>

          <div className="p-4 bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 rounded-lg shadow-sm space-y-1.5">
            <div className="font-mono text-xs font-bold text-[#059669] dark:text-[#10B981]">
              02 · Share PIN
            </div>
            <div className="font-mono text-xs font-semibold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
              Send link to friend
            </div>
            <p className="font-sans text-xs text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 leading-relaxed">
              Send the code or link over Signal, email, or Slack. The first person to arrive with the code locks the 2nd slot.
            </p>
          </div>

          <div className="p-4 bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 rounded-lg shadow-sm space-y-1.5">
            <div className="font-mono text-xs font-bold text-[#059669] dark:text-[#10B981]">
              03 · Talk &amp; Disconnect
            </div>
            <div className="font-mono text-xs font-semibold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
              In-memory AES
            </div>
            <p className="font-sans text-xs text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 leading-relaxed">
              WebCrypto derives keys in browser RAM. Chat, share attachments, and close the tab when you're done. No traces left.
            </p>
          </div>
        </div>
      </section>

      <hr className="border-[#27323F] dark:border-[#27323F] border-slate-200" />

      {/* Frequently Asked Questions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#059669] dark:text-[#10B981]">
            Frequently Asked Questions &amp; Honest Limits
          </h2>
          <span className="text-[11px] font-mono text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500">
            Direct answers only
          </span>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={faq.q}
                className="bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 rounded-lg overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-mono font-medium text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900 hover:text-[#059669] dark:hover:text-[#10B981] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#059669] dark:text-[#10B981] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 text-xs font-sans text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 leading-relaxed border-t border-[#27323F]/60 dark:border-[#27323F]/60 border-slate-100 pt-2.5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <hr className="border-[#27323F] dark:border-[#27323F] border-slate-200" />

      {/* Bottom Launch Banner */}
      <div className="p-5 bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="font-mono text-sm font-bold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
            Ready to test CipherLink?
          </div>
          <div className="font-sans text-xs text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600">
            Open channel #234 in two tabs or on two devices to test the encrypted relay in action.
          </div>
        </div>
        <button
          type="button"
          onClick={onStartMessaging}
          className="px-4 py-2 bg-[#059669] hover:bg-[#047857] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white dark:text-[#022c22] font-mono text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer shrink-0"
        >
          Launch Messages →
        </button>
      </div>
    </div>
  );
};
