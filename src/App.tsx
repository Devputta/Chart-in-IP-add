/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { AboutPage } from './components/AboutPage';
import { ChannelSetup } from './components/ChannelSetup';
import { MessageBubble } from './components/MessageBubble';
import { MessageComposer } from './components/MessageComposer';
import { BrandLogo } from './components/BrandLogo';
import {
  deriveChannelKey,
  encryptMessage,
  decryptMessage,
  EncryptedPayload,
} from './crypto/cipher';
import {
  ChatMessage,
  ChannelInfo,
  ConnectionStatus,
  MediaAttachment,
} from './types/chat';
import { sounds } from './utils/sound';
import { AlertCircle, ShieldCheck, Minimize2 } from 'lucide-react';

interface WireEnvelope {
  text: string;
  media?: MediaAttachment;
}

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);
  const [myUserName, setMyUserName] = useState<string>('You');
  const [isChatFullScreen, setIsChatFullScreen] = useState(false);

  const channelInfoRef = useRef<ChannelInfo | null>(null);
  channelInfoRef.current = channelInfo;

  const myUserNameRef = useRef<string>('You');
  myUserNameRef.current = myUserName;

  // Client Routing: 'home' | 'chat' | 'about'
  const [currentRoute, setCurrentRoute] = useState<'home' | 'chat' | 'about'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('channel')) {
        return 'chat';
      }
      const p = window.location.pathname;
      if (p === '/chat') return 'chat';
      if (p === '/about') return 'about';
    }
    return 'home';
  });

  const navigateTo = (route: 'home' | 'chat' | 'about') => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      const newPath = route === 'home' ? '/' : route === 'chat' ? '/chat' : '/about';
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/chat') {
        setCurrentRoute('chat');
      } else if (path === '/about') {
        setCurrentRoute('about');
      } else {
        setCurrentRoute('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Dark mode state with persistence
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cipherlink_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cipherlink_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cipherlink_theme', 'light');
    }
  }, [isDark]);

  // Active Cryptographic Key in RAM
  const activeCryptoKey = useRef<CryptoKey | null>(null);

  // Messages & Presence
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peerIsTyping, setPeerIsTyping] = useState(false);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, peerIsTyping]);

  // Ephemeral message cleanup timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => {
        const remaining = prev.filter((msg) => !msg.expiresAt || msg.expiresAt > now);
        return remaining.length === prev.length ? prev : remaining;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      sounds.setEnabled(!prev);
      return !prev;
    });
  };

  // Web Full Screen Mode Handler
  const toggleChatFullScreen = useCallback(() => {
    setIsChatFullScreen((prev) => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        if (next) {
          if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        } else {
          if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
        }
      }
      return next;
    });
  }, []);

  // Listen for Escape key and browser fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isChatFullScreen) {
        setIsChatFullScreen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChatFullScreen) {
        setIsChatFullScreen(false);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isChatFullScreen]);

  // Safe WebSocket sender
  const sendWs = useCallback((payload: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  // WebSocket setup
  useEffect(() => {
    let active = true;

    const connectSocket = () => {
      if (!active) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!active) return;
        setConnectionStatus('connected');
        setErrorMessage(null);

        // Keep-alive heartbeat
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);

        // Auto-rejoin if reconnected while in an active channel
        if (channelInfoRef.current?.code) {
          ws.send(
            JSON.stringify({
              type: 'join',
              code: channelInfoRef.current.code,
              name: myUserNameRef.current,
            })
          );
        }
      };

      ws.onclose = () => {
        if (!active) return;
        setConnectionStatus('disconnected');
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        setTimeout(connectSocket, 2500);
      };

      ws.onerror = () => {
        if (!active) return;
        setConnectionStatus('error');
      };

      ws.onmessage = async (event) => {
        if (!active) return;
        let data: any;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data.type === 'error') {
          setErrorMessage(data.message);
          setIsJoining(false);
          sounds.playError();
          return;
        }

        if (data.type === 'joined') {
          setIsJoining(false);
          setErrorMessage(null);
          return;
        }

        if (data.type === 'peer-joined') {
          setChannelInfo((prev) =>
            prev
              ? {
                  ...prev,
                  participants: 2,
                  peerPresent: true,
                  peerName: data.peerName || 'Peer',
                }
              : null
          );
          sounds.playPeerConnected();
          return;
        }

        if (data.type === 'peer-present') {
          setChannelInfo((prev) =>
            prev
              ? {
                  ...prev,
                  participants: 2,
                  peerPresent: true,
                  peerName: data.peerName || 'Peer',
                }
              : null
          );
          return;
        }

        if (data.type === 'peer-left') {
          setChannelInfo((prev) =>
            prev
              ? {
                  ...prev,
                  participants: 1,
                  peerPresent: false,
                }
              : null
          );
          setPeerIsTyping(false);
          return;
        }

        if (data.type === 'peer-typing') {
          setPeerIsTyping(Boolean(data.isTyping));
          return;
        }

        // Real-time peer message deletion
        if (data.type === 'message-deleted') {
          setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
          return;
        }

        // Inbound ciphertext
        if (data.type === 'ciphertext') {
          const payload: EncryptedPayload = data.payload;
          if (!activeCryptoKey.current) return;

          try {
            const rawDecrypted = await decryptMessage(payload, activeCryptoKey.current);
            let plaintext = rawDecrypted;
            let media: MediaAttachment | undefined = undefined;

            // Try parsing JSON payload if media was attached
            try {
              const parsed = JSON.parse(rawDecrypted);
              if (parsed && typeof parsed === 'object' && ('text' in parsed || 'media' in parsed)) {
                plaintext = parsed.text || '';
                media = parsed.media;
              }
            } catch {
              // Standard text string
              plaintext = rawDecrypted;
            }

            const newMsg: ChatMessage = {
              id: payload.messageId || Math.random().toString(),
              sender: 'peer',
              senderName: channelInfoRef.current?.peerName || 'Peer',
              plaintext,
              media,
              payload,
              timestamp: payload.timestamp || Date.now(),
              status: 'decrypted',
              ephemeralSeconds: payload.ephemeralSeconds,
              expiresAt: payload.ephemeralSeconds
                ? Date.now() + payload.ephemeralSeconds * 1000
                : undefined,
            };

            setMessages((prev) => [...prev, newMsg]);
            sounds.playReceived();
          } catch (decryptErr) {
            console.error('Decryption failed / possible tampering:', decryptErr);
            setSecurityNotice(
              'Security Notice: Inbound ciphertext failed AES-GCM authentication tag verification. Corrupted or tampered packet was discarded.'
            );
            setTimeout(() => setSecurityNotice(null), 8000);
          }
        }
      };
    };

    connectSocket();

    return () => {
      active = false;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Join Channel
  const handleJoinChannel = async (code: string, _passphrase?: string, name?: string) => {
    setIsJoining(true);
    setErrorMessage(null);
    const chosenName = name && name.trim() ? name.trim() : 'You';
    setMyUserName(chosenName);

    try {
      const keyDetails = await deriveChannelKey(code);
      activeCryptoKey.current = keyDetails.key;

      setChannelInfo({
        code,
        participants: 1,
        peerPresent: false,
        safetyNumber: keyDetails.safetyNumber,
        fingerprintHex: keyDetails.fingerprintHex,
        joinedAt: Date.now(),
      });

      setMessages([]);

      sendWs({
        type: 'join',
        code,
        name: chosenName,
      });
    } catch (err: any) {
      console.error('Join error:', err);
      setErrorMessage(err.message || 'Couldn’t join channel. Check the code and try again.');
      setIsJoining(false);
    }
  };

  const handleLeaveChannel = () => {
    sendWs({ type: 'leave' });
    activeCryptoKey.current = null;
    setChannelInfo(null);
    setMessages([]);
    setPeerIsTyping(false);
  };

  // Anti-Hacker Panic Shredder: Instantly zeroes memory & burns session
  const handlePanicBurn = () => {
    sendWs({ type: 'leave' });
    activeCryptoKey.current = null;
    setChannelInfo(null);
    setMessages([]);
    setPeerIsTyping(false);
    setSecurityNotice('Memory Incinerated: All symmetric keys and session state purged from RAM.');
    setTimeout(() => setSecurityNotice(null), 5000);
    navigateTo('home');
  };

  // Send Message (Text + Media Attachments)
  const handleSendMessage = async (
    text: string,
    ephemeralSeconds?: number,
    media?: MediaAttachment
  ) => {
    if (!activeCryptoKey.current || !channelInfo) return;

    try {
      const envelope: WireEnvelope = {
        text,
        media,
      };
      const serialized = JSON.stringify(envelope);

      const payload = await encryptMessage(serialized, activeCryptoKey.current, {
        ephemeralSeconds,
      });

      const selfMessage: ChatMessage = {
        id: payload.messageId,
        sender: 'self',
        plaintext: text,
        media,
        payload,
        timestamp: payload.timestamp,
        status: channelInfo.peerPresent ? 'delivered' : 'sent',
        ephemeralSeconds,
        expiresAt: ephemeralSeconds ? Date.now() + ephemeralSeconds * 1000 : undefined,
      };

      setMessages((prev) => [...prev, selfMessage]);
      sounds.playSent();

      sendWs({
        type: 'ciphertext',
        payload,
      });
    } catch (err) {
      console.error('Encryption or send error:', err);
      setErrorMessage('Failed to encrypt and send message.');
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    sendWs({
      type: 'delete-message',
      messageId,
    });
  };

  const handleTyping = (isTyping: boolean) => {
    if (!channelInfo) return;
    sendWs({
      type: 'typing',
      isTyping,
    });
  };

  const handleOpenChat = (code?: string) => {
    if (code) {
      handleJoinChannel(code);
    }
    navigateTo('chat');
  };

  const handleScrollToHowItWorks = () => {
    if (currentRoute === 'home') {
      const el = document.getElementById('how-it-works');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigateTo('home');
      setTimeout(() => {
        const el = document.getElementById('how-it-works');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // URL query channel (?channel=234)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const channelParam = params.get('channel');
    if (channelParam && /^\d{3,6}$/.test(channelParam)) {
      handleJoinChannel(channelParam);
      setCurrentRoute('chat');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0F1419] flex flex-col font-sans text-[#E8E6E1] transition-colors selection:bg-[#10B981]/25 selection:text-[#10B981] overflow-x-hidden">
      {/* Product Toolbar Header */}
      {!isChatFullScreen && (
        <Header
          status={connectionStatus}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          isDark={isDark}
          onToggleDark={() => setIsDark((d) => !d)}
          onNavigateHome={() => navigateTo('home')}
          onNavigateAbout={() => navigateTo('about')}
          onNavigateMessages={() => navigateTo('chat')}
          onScrollToHowItWorks={handleScrollToHowItWorks}
          activeRoute={currentRoute}
          isFullScreen={isChatFullScreen}
          onToggleFullScreen={toggleChatFullScreen}
        />
      )}

      {/* Main Workspace Router */}
      <main className="flex-1 flex flex-col min-h-0 bg-[#0F1419] dark:bg-[#0F1419] bg-[#F8F9FA] transition-colors">
        {/* Security Notification Banner */}
        {securityNotice && (
          <div className="bg-[#059669] text-white px-4 py-2.5 text-xs font-mono flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{securityNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSecurityNotice(null)}
              className="text-white hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {currentRoute === 'home' && (
          <HomePage
            onOpenChat={handleOpenChat}
            onOpenAbout={() => navigateTo('about')}
          />
        )}

        {currentRoute === 'about' && (
          <AboutPage
            onStartMessaging={() => navigateTo('chat')}
            onBackHome={() => navigateTo('home')}
          />
        )}

        {/* Message Workspace */}
        {currentRoute === 'chat' && (
          <div
            className={
              isChatFullScreen
                ? 'fixed inset-0 z-50 h-screen w-screen p-2 sm:p-3 md:p-4 bg-[#0F1419] dark:bg-[#0F1419] bg-[#F8F9FA] flex flex-col overflow-hidden animate-in fade-in duration-150'
                : 'h-[calc(100dvh-3.5rem)] max-w-[1400px] w-full mx-auto p-2 sm:p-3 flex flex-col overflow-hidden transition-all duration-150'
            }
          >
            {/* Top Bar when in Full Screen mode: Single Exit Control */}
            {isChatFullScreen && (
              <div className="mb-2 px-3 py-2 bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 rounded-xl flex items-center justify-between shrink-0 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-2 select-none">
                    <BrandLogo size="xs" />
                    <span className="font-mono text-xs font-bold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
                      CipherLink Full Screen
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className="p-1.5 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#E8E6E1] hover:bg-[#1B222A] dark:hover:bg-[#1B222A] hover:bg-slate-100 rounded-md border border-[#27323F] dark:border-[#27323F] border-slate-200 transition-colors cursor-pointer"
                    title={soundEnabled ? 'Mute' : 'Unmute'}
                  >
                    {soundEnabled ? '🔔 Sound on' : '🔕 Muted'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDark((d) => !d)}
                    className="p-1.5 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#E8E6E1] hover:bg-[#1B222A] dark:hover:bg-[#1B222A] hover:bg-slate-100 rounded-md border border-[#27323F] dark:border-[#27323F] border-slate-200 transition-colors cursor-pointer"
                    title="Toggle theme"
                  >
                    {isDark ? '☀️ Light' : '🌙 Dark'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleChatFullScreen}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#059669] hover:bg-[#047857] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white dark:text-[#022c22] font-mono text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer"
                    title="Exit Full Screen (Esc)"
                    aria-label="Exit Full Screen"
                  >
                    <Minimize2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Exit Full Screen (Esc)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error banner if something fails */}
            {errorMessage && (
              <div className="mb-2 bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#EF4444] text-[#EF4444] px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between gap-2 shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-xs text-[#EF4444] hover:text-white font-medium cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Channel Setup Panel */}
            <div className="mb-2 shrink-0">
              <ChannelSetup
                channelInfo={channelInfo}
                onJoin={handleJoinChannel}
                onLeave={handleLeaveChannel}
                isLoading={isJoining}
                myUserName={myUserName}
                onPanicBurn={handlePanicBurn}
              />
            </div>

            {/* Messages Container */}
            <section className="bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 rounded-xl flex-1 flex flex-col min-h-0 shadow-lg overflow-hidden transition-colors">
              {/* Section Header */}
              <div className="px-3.5 py-1.5 sm:py-2 border-b border-[#27323F] dark:border-[#27323F] border-slate-200 bg-[#11161D] dark:bg-[#11161D] bg-slate-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <BrandLogo size="xs" withBorder={false} />
                  <h2 className="font-mono text-xs font-bold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800">
                    CipherLink Encrypted Session
                  </h2>
                </div>

                <div className="flex items-center gap-2.5">
                  {channelInfo ? (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          channelInfo.peerPresent ? 'bg-[#10B981]' : 'bg-[#6E7681]'
                        }`}
                      />
                      <span className="text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500">
                        {channelInfo.peerPresent ? 'online · peer connected' : 'waiting for partner'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6E7681]" />
                      <span>offline</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Timeline */}
              <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-1 bg-[#0F1419] dark:bg-[#0F1419] bg-slate-50/50">
                {!channelInfo ? null : messages.length === 0 ? (
                  <div className="h-full min-h-[220px] flex flex-col items-center justify-center p-4 sm:p-6 text-[#9BA3AF]">
                    <div className="max-w-md w-full p-4 sm:p-5 rounded-xl bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 text-left space-y-2.5 shadow-md">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
                          Channel PIN: {channelInfo.code}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${
                            channelInfo.peerPresent ? 'text-[#10B981]' : 'text-[#059669] dark:text-[#10B981]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              channelInfo.peerPresent
                                ? 'bg-[#10B981]'
                                : 'bg-[#059669] dark:bg-[#10B981] animate-pulse'
                            }`}
                          />
                          {channelInfo.peerPresent ? 'partner connected' : 'waiting for partner'}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 leading-relaxed">
                        {channelInfo.peerPresent
                          ? 'Your partner connected! Send a message or attach a file below to start chatting.'
                          : `Share PIN ${channelInfo.code} with your partner. Once they connect, type below to begin.`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        onDeleteMessage={handleDeleteMessage}
                      />
                    ))}

                    {/* Peer typing indicator */}
                    {peerIsTyping && (
                      <div className="flex items-center gap-1.5 text-xs text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 py-1 px-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        <span className="text-[11px]">Partner is typing…</span>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Composer (Fixed at bottom) */}
              <MessageComposer
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                disabled={!channelInfo}
                peerPresent={Boolean(channelInfo?.peerPresent)}
              />
            </section>

            {/* Quiet Footer */}
            <div className="text-center py-1 text-[10px] sm:text-[11px] font-mono text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 shrink-0">
              © 2026 CipherLink · In-browser AES-256-GCM · Closing tab purges keys
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
