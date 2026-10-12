import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Github,
  ArrowRight,
  ArrowLeft,
  Menu,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { ConnectionStatus } from '../types/chat';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  status: ConnectionStatus;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  onNavigateHome: () => void;
  onNavigateAbout?: () => void;
  onNavigateMessages: () => void;
  onScrollToHowItWorks?: () => void;
  activeRoute: 'home' | 'chat' | 'about';
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  soundEnabled,
  onToggleSound,
  isDark,
  onToggleDark,
  onNavigateHome,
  onNavigateAbout,
  onNavigateMessages,
  onScrollToHowItWorks,
  activeRoute,
  isFullScreen = false,
  onToggleFullScreen,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNav = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-[#27323F] dark:border-[#27323F] border-slate-200 bg-[#0F1419]/95 dark:bg-[#0F1419]/95 bg-white/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-[1240px] mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Product Logo & Branding */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none shrink-0"
          title="Return to CipherLink Home"
        >
          <BrandLogo size="sm" />
          <div className="flex flex-col">
            <span className="font-mono text-sm font-bold tracking-tight text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900 group-hover:text-[#059669] dark:group-hover:text-[#10B981] transition-colors leading-tight">
              CipherLink
            </span>
            <span className="font-sans text-[10px] text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 leading-tight font-medium hidden xs:inline">
              Encrypted Messaging for Two
            </span>
          </div>
        </button>

        {/* Desktop Navigation & Actions */}
        <div className="hidden md:flex items-center gap-4">
          {/* Navigation Links */}
          {activeRoute !== 'chat' && (
            <>
              <nav className="flex items-center gap-5 text-xs font-mono font-medium text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600">
                <button
                  type="button"
                  onClick={onScrollToHowItWorks || onNavigateHome}
                  className={`hover:text-[#E8E6E1] dark:hover:text-[#E8E6E1] hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap ${
                    activeRoute === 'home' ? 'text-[#059669] dark:text-[#10B981] font-bold' : ''
                  }`}
                >
                  How it works
                </button>
              </nav>

              <div className="w-px h-3.5 bg-[#27323F] dark:bg-[#27323F] bg-slate-300" aria-hidden="true" />
            </>
          )}

          {/* GitHub Repository Link */}
          <a
            href="https://github.com/Devputta/CipherLink-.git"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#E8E6E1] dark:hover:text-[#E8E6E1] hover:text-slate-900 hover:bg-[#151B22] dark:hover:bg-[#151B22] hover:bg-slate-100 rounded-md border border-[#27323F] dark:border-[#27323F] border-slate-300 transition-colors"
            title="View source on GitHub"
            aria-label="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDark}
            className="p-1.5 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#E8E6E1] dark:hover:text-[#E8E6E1] hover:text-slate-900 hover:bg-[#151B22] dark:hover:bg-[#151B22] hover:bg-slate-100 rounded-md border border-[#27323F] dark:border-[#27323F] border-slate-300 transition-colors cursor-pointer"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#10B981]" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Sound toggle button */}
          <button
            type="button"
            onClick={onToggleSound}
            className="p-1.5 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#E8E6E1] dark:hover:text-[#E8E6E1] hover:text-slate-900 hover:bg-[#151B22] dark:hover:bg-[#151B22] hover:bg-slate-100 rounded-md border border-[#27323F] dark:border-[#27323F] border-slate-300 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}
            aria-label="Toggle sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#059669] dark:text-[#10B981]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500" />
            )}
          </button>

          {/* Full Screen toggle button when in chat */}
          {activeRoute === 'chat' && onToggleFullScreen && (
            <button
              type="button"
              onClick={onToggleFullScreen}
              className={`p-1.5 rounded-md border border-[#27323F] dark:border-[#27323F] border-slate-300 transition-colors cursor-pointer ${
                isFullScreen
                  ? 'text-[#059669] dark:text-[#10B981] bg-[#151B22] dark:bg-[#151B22] bg-emerald-50 border-[#059669] dark:border-[#10B981]'
                  : 'text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#E8E6E1] dark:hover:text-[#E8E6E1] hover:bg-[#151B22] dark:hover:bg-[#151B22] hover:bg-slate-100'
              }`}
              title={isFullScreen ? 'Exit full screen (Esc)' : 'Expand to full screen from web'}
              aria-label="Toggle full screen"
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Primary Action Button: Open Messages / Home */}
          {activeRoute !== 'chat' ? (
            <button
              type="button"
              onClick={onNavigateMessages}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] dark:bg-[#10B981] dark:hover:bg-[#059669] text-white dark:text-[#022c22] font-mono text-xs font-bold rounded-md transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <span>Open Messages</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-xs font-medium text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 hover:bg-[#151B22] dark:hover:bg-[#151B22] hover:bg-slate-100 hover:text-[#059669] dark:hover:text-[#10B981] rounded-md border border-[#27323F] dark:border-[#27323F] border-slate-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          )}
        </div>

        {/* Mobile Header Right */}
        <div className="flex md:hidden items-center gap-1.5">
          {/* Dark / Light Toggle on Mobile Header */}
          <button
            type="button"
            onClick={onToggleDark}
            className="p-1.5 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#E8E6E1] rounded-md border border-[#27323F] dark:border-[#27323F] border-slate-300"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#10B981]" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Mobile Full Screen button when in chat */}
          {activeRoute === 'chat' && onToggleFullScreen && (
            <button
              type="button"
              onClick={onToggleFullScreen}
              className={`p-1.5 rounded-md border border-[#27323F] dark:border-[#27323F] border-slate-300 transition-colors cursor-pointer ${
                isFullScreen
                  ? 'text-[#059669] dark:text-[#10B981] bg-[#151B22] dark:bg-[#151B22] bg-emerald-50 border-[#059669]'
                  : 'text-[#9BA3AF] bg-[#151B22] dark:bg-[#151B22] bg-slate-100'
              }`}
              title={isFullScreen ? 'Exit full screen' : 'Full screen'}
              aria-label="Toggle full screen"
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Quick Route button */}
          {activeRoute !== 'chat' ? (
            <button
              type="button"
              onClick={onNavigateMessages}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#059669] dark:bg-[#10B981] text-white dark:text-[#022c22] font-mono text-xs font-bold rounded-md whitespace-nowrap"
            >
              <span>Messages</span>
              <ArrowRight className="w-3 h-3 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1 px-2 py-1 font-mono text-xs font-medium text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 bg-[#151B22] dark:bg-[#151B22] bg-slate-100 rounded-md border border-[#27323F] dark:border-[#27323F] border-slate-300 whitespace-nowrap"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Home</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="p-1.5 text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 hover:bg-[#151B22] dark:hover:bg-[#151B22] hover:bg-slate-100 rounded-md border border-[#27323F] dark:border-[#27323F] border-slate-300 transition-colors cursor-pointer ml-0.5"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#27323F] dark:border-[#27323F] border-slate-200 bg-[#151B22] dark:bg-[#151B22] bg-white px-4 py-3 shadow-2xl space-y-3 animate-in fade-in duration-150">
          <div className="flex flex-col space-y-1 font-mono text-xs font-medium">
            <button
              type="button"
              onClick={() => handleMobileNav(onNavigateHome)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                activeRoute === 'home'
                  ? 'bg-[#0F1419] dark:bg-[#0F1419] bg-emerald-50 text-[#059669] dark:text-[#10B981] font-bold border border-[#27323F] dark:border-[#27323F] border-emerald-300'
                  : 'text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 hover:bg-[#0F1419] dark:hover:bg-[#0F1419] hover:bg-slate-100'
              }`}
            >
              <span>Home</span>
              {activeRoute === 'home' && <span className="text-[10px] text-[#059669] dark:text-[#10B981]">Active</span>}
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav(onNavigateMessages)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                activeRoute === 'chat'
                  ? 'bg-[#0F1419] dark:bg-[#0F1419] bg-emerald-50 text-[#059669] dark:text-[#10B981] font-bold border border-[#27323F] dark:border-[#27323F] border-emerald-300'
                  : 'text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 hover:bg-[#0F1419] dark:hover:bg-[#0F1419] hover:bg-slate-100'
              }`}
            >
              <span>Messages</span>
              {activeRoute === 'chat' && <span className="text-[10px] text-[#059669] dark:text-[#10B981]">Active</span>}
            </button>

            {activeRoute !== 'chat' && (
              <button
                type="button"
                onClick={() => handleMobileNav(onScrollToHowItWorks || onNavigateHome)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-left text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 hover:bg-[#0F1419] dark:hover:bg-[#0F1419] hover:bg-slate-100"
              >
                <span>How it works</span>
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-[#27323F] dark:border-[#27323F] border-slate-200 grid grid-cols-2 gap-2 text-xs font-mono">
            {/* Toggle Theme */}
            <button
              type="button"
              onClick={onToggleDark}
              className="flex items-center justify-center gap-2 p-2 rounded-md border border-[#27323F] dark:border-[#27323F] border-slate-200 bg-[#0F1419] dark:bg-[#0F1419] bg-slate-100 text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-[#10B981]" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {/* Toggle Sound */}
            <button
              type="button"
              onClick={onToggleSound}
              className="flex items-center justify-center gap-2 p-2 rounded-md border border-[#27323F] dark:border-[#27323F] border-slate-200 bg-[#0F1419] dark:bg-[#0F1419] bg-slate-100 text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-[#059669] dark:text-[#10B981]" />
                  <span>Sound: On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500" />
                  <span>Muted</span>
                </>
              )}
            </button>
          </div>

          {/* GitHub link in mobile drawer */}
          <div className="pt-1 flex items-center justify-between text-xs font-mono text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500">
            <a
              href="https://github.com/Devputta/CipherLink-.git"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-[#059669] dark:hover:text-[#10B981] hover:text-slate-900"
            >
              <Github className="w-4 h-4" />
              <span>GitHub Repo</span>
            </a>
            <span className="text-[11px]">
              {status === 'connected' ? 'Relay online' : 'Connecting…'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
