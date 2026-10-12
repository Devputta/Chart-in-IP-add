import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  Radio,
  FileText,
  Send,
  Terminal,
  Activity,
  CheckCircle2,
  Users,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Check,
  CornerDownLeft,
} from 'lucide-react';
import {
  deriveChannelKey,
  encryptMessage,
  decryptMessage,
  base64ToArrayBuffer,
  bufferToHex,
  KeyDetails,
  EncryptedPayload,
} from '../crypto/cipher';

interface ChatItem {
  id: string;
  sender: 'Alice' | 'Bob';
  text: string;
  timestamp: string;
  ivHex: string;
  cipherHex: string;
  tagHex: string;
  decrypted: boolean;
  timeMs: number;
}

export const EncryptionDemo: React.FC = () => {
  // Current active PIN for live simulation
  const [pin, setPin] = useState<string>('234');
  
  // Interactive dual message state: conversations between Alice and Bob
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: 'm-1',
      sender: 'Alice',
      text: 'Hey Bob! Ready for the secret project briefing?',
      timestamp: '10:14',
      ivHex: '4a81f09e2b1c8d76',
      cipherHex: '89fd3c10a748c2de5619fa20b08e2f89c4...',
      tagHex: '9f2a71d84c3e80b2',
      decrypted: true,
      timeMs: 0.8,
    },
    {
      id: 'm-2',
      sender: 'Bob',
      text: 'Yep, keys derived in RAM on PIN 234. Send coordinates!',
      timestamp: '10:15',
      ivHex: '7c29e1fa04889c12',
      cipherHex: 'a2bb48df920c7891ea55c18903e481ac98...',
      tagHex: '3d18ba90f4c721ea',
      decrypted: true,
      timeMs: 0.7,
    },
  ]);

  // Current inputs for each side so user can play with messaging themselves
  const [aliceInput, setAliceInput] = useState<string>('');
  const [bobInput, setBobInput] = useState<string>('');

  // Active in-flight transit state (shows the 3D flying envelope)
  const [inTransit, setInTransit] = useState<{
    sender: 'Alice' | 'Bob';
    recipient: 'Alice' | 'Bob';
    text: string;
    ivHex: string;
    cipherHex: string;
    tagHex: string;
    timeMs: number;
  } | null>(null);

  // Inspector card details
  const [inspectingMsg, setInspectingMsg] = useState<ChatItem | null>(null);

  // Derive key & encrypt real message
  const handleSendMessage = async (sender: 'Alice' | 'Bob', textToSend: string) => {
    if (!textToSend.trim()) return;
    const cleanText = textToSend.trim();
    if (sender === 'Alice') setAliceInput('');
    if (sender === 'Bob') setBobInput('');

    try {
      const startTime = performance.now();
      const derived = await deriveChannelKey(pin || '234');
      const payload = await encryptMessage(cleanText, derived.key);

      const ivBytes = base64ToArrayBuffer(payload.iv);
      const rawDataBytes = base64ToArrayBuffer(payload.data);
      const ivHex = bufferToHex(ivBytes);

      let cipherHex = '';
      let tagHex = '';
      if (rawDataBytes.length >= 16) {
        cipherHex = bufferToHex(rawDataBytes.slice(0, rawDataBytes.length - 16));
        tagHex = bufferToHex(rawDataBytes.slice(rawDataBytes.length - 16));
      } else {
        cipherHex = bufferToHex(rawDataBytes);
      }

      const endTime = performance.now();
      const timeMs = Math.max(0.4, Number((endTime - startTime).toFixed(1)));

      // Trigger 3D transit visualization
      setInTransit({
        sender,
        recipient: sender === 'Alice' ? 'Bob' : 'Alice',
        text: cleanText,
        ivHex: ivHex.slice(0, 16),
        cipherHex: cipherHex.slice(0, 36) + '...',
        tagHex: tagHex.slice(0, 16),
        timeMs,
      });

      // After transit animation completes (1.2s), deliver to opposite box
      setTimeout(() => {
        const newMsg: ChatItem = {
          id: 'msg-' + Date.now(),
          sender,
          text: cleanText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ivHex: ivHex.slice(0, 16),
          cipherHex: cipherHex.slice(0, 48) + '...',
          tagHex: tagHex.slice(0, 16),
          decrypted: true,
          timeMs,
        };
        setMessages((prev) => [...prev, newMsg]);
        setInspectingMsg(newMsg);
        setInTransit(null);
      }, 1100);
    } catch (err) {
      console.error('Real encryption test failed:', err);
    }
  };

  // Quick preset samples
  const handleSendPreset = (sampleText: string, fromSender: 'Alice' | 'Bob') => {
    handleSendMessage(fromSender, sampleText);
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'm-1',
        sender: 'Alice',
        text: 'Hey Bob! Ready for the secret project briefing?',
        timestamp: '10:14',
        ivHex: '4a81f09e2b1c8d76',
        cipherHex: '89fd3c10a748c2de5619fa20b08e2f89c4...',
        tagHex: '9f2a71d84c3e80b2',
        decrypted: true,
        timeMs: 0.8,
      },
      {
        id: 'm-2',
        sender: 'Bob',
        text: 'Yep, keys derived in RAM on PIN 234. Send coordinates!',
        timestamp: '10:15',
        ivHex: '7c29e1fa04889c12',
        cipherHex: 'a2bb48df920c7891ea55c18903e481ac98...',
        tagHex: '3d18ba90f4c721ea',
        decrypted: true,
        timeMs: 0.7,
      },
    ]);
    setInTransit(null);
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-sm text-slate-900 dark:text-slate-100 transition-colors">
      {/* Interactive Top Toolbar */}
      <div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          {/* Connected Pair Icon with pulse */}
          <div className="flex items-center -space-x-1.5">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900">
              A
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900">
              B
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                Live 2-Device Sandbox
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synchronized RAM</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
              Chat between both browser boxes below to test client-side encryption in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Ephemeral PIN Input */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono">
            <span className="text-slate-400 text-[11px]">PIN:</span>
            <input
              type="text"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-12 bg-transparent text-center font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
              title="Change simulation PIN"
            />
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Reset sandbox chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Wire Representation & Middle Relay Beam */}
      <div className="relative p-3 sm:p-4 bg-slate-100/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative">
          {/* =========================================================================
              DEVICE A: ALICE'S MESSAGING BOX (3D isometric perspective feel)
          ========================================================================= */}
          <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden transform transition-transform hover:-translate-y-0.5">
            {/* Box Header */}
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                  A
                </div>
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                  Alice (Device 1)
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                RAM key synced
              </span>
            </div>

            {/* Message Stream */}
            <div className="p-3 space-y-2 h-44 overflow-y-auto bg-slate-50/40 dark:bg-slate-900/40 font-sans text-xs">
              {messages.map((m) => {
                const isMine = m.sender === 'Alice';
                return (
                  <div
                    key={m.id}
                    onClick={() => setInspectingMsg(m)}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} cursor-pointer group`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-2.5 py-1.5 transition-all ${
                        isMine
                          ? 'bg-emerald-500 text-white rounded-br-xs shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs'
                      }`}
                    >
                      <p className="leading-snug break-words">{m.text}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 font-mono">
                      {m.sender} · {m.timestamp}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Input Composer for Alice */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage('Alice', aliceInput);
              }}
              className="p-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 bg-white dark:bg-slate-900"
            >
              <input
                type="text"
                value={aliceInput}
                onChange={(e) => setAliceInput(e.target.value)}
                placeholder="Type as Alice & tap Send..."
                className="flex-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!aliceInput.trim()}
                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Send</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </form>
          </div>

          {/* =========================================================================
              DEVICE B: BOB'S MESSAGING BOX (3D isometric perspective feel)
          ========================================================================= */}
          <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden transform transition-transform hover:-translate-y-0.5">
            {/* Box Header */}
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-700 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                  B
                </div>
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                  Bob (Device 2)
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                RAM key synced
              </span>
            </div>

            {/* Message Stream */}
            <div className="p-3 space-y-2 h-44 overflow-y-auto bg-slate-50/40 dark:bg-slate-900/40 font-sans text-xs">
              {messages.map((m) => {
                const isMine = m.sender === 'Bob';
                return (
                  <div
                    key={m.id}
                    onClick={() => setInspectingMsg(m)}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} cursor-pointer group`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-2.5 py-1.5 transition-all ${
                        isMine
                          ? 'bg-slate-700 text-white rounded-br-xs shadow-xs'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-slate-800 dark:text-slate-100 rounded-bl-xs'
                      }`}
                    >
                      <p className="leading-snug break-words">{m.text}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 font-mono">
                      {m.sender} · {m.timestamp}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Input Composer for Bob */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage('Bob', bobInput);
              }}
              className="p-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 bg-white dark:bg-slate-900"
            >
              <input
                type="text"
                value={bobInput}
                onChange={(e) => setBobInput(e.target.value)}
                placeholder="Type as Bob & tap Send..."
                className="flex-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!bobInput.trim()}
                className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Send</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

        {/* 3D Flying Envelope Animation Overlay when message is in-flight */}
        {inTransit && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center z-20 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-emerald-500/60 rounded-xl p-4 max-w-sm w-full mx-4 shadow-2xl space-y-2.5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{inTransit.sender} → Relay → {inTransit.recipient}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {inTransit.timeMs}ms
                </span>
              </div>
              <div className="p-2.5 bg-slate-950 text-emerald-300 font-mono text-[11px] rounded-lg break-all space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>Opaque Encrypted Envelope</span>
                  <span className="text-emerald-400">AES-256-GCM</span>
                </div>
                <p className="text-slate-300">iv: {inTransit.ivHex}</p>
                <p className="text-emerald-400 font-semibold">{inTransit.cipherHex}</p>
                <p className="text-slate-400 text-[10px]">tag: {inTransit.tagHex}</p>
              </div>
              <p className="text-[10px] text-slate-500 text-center font-mono">
                Forwarding opaque bytes through relay... server cannot peek plaintext
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Test Prompt Buttons & Interactive Key Inspector */}
      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 text-[11px]">Quick Prompts:</span>
          <button
            type="button"
            onClick={() => handleSendPreset('Keys synced! Meeting spot at 52.5200° N.', 'Alice')}
            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white rounded border border-slate-300 dark:border-slate-700 text-[11px] transition-colors cursor-pointer"
          >
            "Meeting spot" (Alice)
          </button>
          <button
            type="button"
            onClick={() => handleSendPreset('Received and verified against tag.', 'Bob')}
            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 hover:text-white rounded border border-slate-300 dark:border-slate-700 text-[11px] transition-colors cursor-pointer"
          >
            "Verified" (Bob)
          </button>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Real WebCrypto API (PBKDF2 120k + AES-GCM)</span>
        </div>
      </div>

      {/* Click-to-Inspect Message Diagnostic Drawer */}
      {inspectingMsg && (
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-xs font-mono flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Inspecting {inspectingMsg.sender}'s Envelope:
            </span>
            <span className="text-slate-600 dark:text-slate-300 truncate max-w-xs sm:max-w-md">
              "{inspectingMsg.text}"
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>nonce: {inspectingMsg.ivHex}</span>
            <span>tag: {inspectingMsg.tagHex}</span>
            <button
              type="button"
              onClick={() => setInspectingMsg(null)}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline cursor-pointer"
            >
              close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
