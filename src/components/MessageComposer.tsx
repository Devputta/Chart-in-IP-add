import React, { useState, useRef } from 'react';
import {
  ArrowUp,
  Paperclip,
  X,
  FileText,
  Film,
  Loader2,
} from 'lucide-react';
import { MediaAttachment } from '../types/chat';

interface MessageComposerProps {
  onSendMessage: (
    text: string,
    ephemeralSeconds?: number,
    media?: MediaAttachment
  ) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  disabled: boolean;
  peerPresent: boolean;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onTyping,
  disabled,
}) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [autoDeleteSeconds, setAutoDeleteSeconds] = useState<number | undefined>(undefined);
  const [attachment, setAttachment] = useState<MediaAttachment | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1500);
  };

  const handleFileSelected = (file: File) => {
    setFileError(null);
    if (file.size > 25 * 1024 * 1024) {
      setFileError('File exceeds 25 MB limit for browser RAM encryption.');
      setTimeout(() => setFileError(null), 5000);
      return;
    }

    setIsReadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachment({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: reader.result,
        });
      }
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setFileError('Could not read file from storage.');
      setIsReadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleFileSelected(file);
          break;
        }
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = text.trim();
    if ((!cleanText && !attachment) || isSending || disabled) return;

    setIsSending(true);
    onTyping(false);
    try {
      await onSendMessage(cleanText, autoDeleteSeconds, attachment || undefined);
      setText('');
      setAttachment(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = !disabled && !isSending && (text.trim().length > 0 || attachment !== null);

  return (
    <div className="border-t border-[#27323F] dark:border-[#27323F] border-slate-200 bg-[#151B22] dark:bg-[#151B22] bg-white p-2.5 sm:p-3 transition-colors shrink-0 text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800">
      {fileError && (
        <div className="mb-2 p-2 bg-[#0F1419] dark:bg-[#0F1419] bg-rose-50 border border-[#EF4444] rounded-lg text-xs font-mono text-[#EF4444] flex items-center justify-between animate-in fade-in">
          <span>{fileError}</span>
          <button
            type="button"
            onClick={() => setFileError(null)}
            className="p-0.5 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="border border-[#27323F] dark:border-[#27323F] border-slate-300 rounded-xl bg-[#0F1419] dark:bg-[#0F1419] bg-slate-50 focus-within:border-[#059669] dark:focus-within:border-[#10B981] transition-colors shadow-inner overflow-hidden">
          {/* Attachment Preview Chip */}
          {attachment && (
            <div className="mx-2.5 mt-2 p-2 bg-[#151B22] dark:bg-[#151B22] bg-white rounded-lg border border-[#27323F] dark:border-[#27323F] border-slate-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {attachment.type.startsWith('image/') ? (
                  <img
                    src={attachment.dataUrl}
                    alt={attachment.name}
                    className="w-8 h-8 rounded object-cover border border-[#27323F] dark:border-[#27323F] border-slate-200 shrink-0"
                  />
                ) : attachment.type.startsWith('video/') ? (
                  <div className="w-8 h-8 rounded bg-[#059669]/15 dark:bg-[#10B981]/15 text-[#059669] dark:text-[#10B981] flex items-center justify-center shrink-0">
                    <Film className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded bg-[#059669]/15 dark:bg-[#10B981]/15 text-[#059669] dark:text-[#10B981] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0 font-mono">
                  <div className="font-semibold text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 truncate text-[11px]">
                    {attachment.name}
                  </div>
                  <div className="text-[10px] text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500">
                    {formatBytes(attachment.size)} · AES-256-GCM encrypted
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="p-1 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-400 hover:text-[#EF4444] rounded transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Reading file indicator */}
          {isReadingFile && (
            <div className="mx-2.5 mt-2 p-2 text-xs font-mono text-[#059669] dark:text-[#10B981] flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#059669] dark:text-[#10B981]" />
              <span>Reading file into memory buffer…</span>
            </div>
          )}

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={2}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled}
            placeholder={
              disabled
                ? 'Connect to a channel above to start talking.'
                : attachment
                ? 'Add an encrypted caption (or hit Enter to ship it)...'
                : 'Type a message... (Enter to send, Shift+Enter for newline)'
            }
            className="w-full px-3.5 pt-2.5 pb-1.5 text-xs sm:text-sm font-sans text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800 placeholder-[#6E7681] dark:placeholder-[#6E7681] placeholder-slate-400 focus:outline-none resize-none bg-transparent"
          />

          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between px-2.5 sm:px-3 pb-2 pt-1.5 border-t border-[#27323F] dark:border-[#27323F] border-slate-200 gap-2">
            {/* Left: Attachment button and auto-delete settings */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Media File Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,application/pdf,.pdf,.doc,.docx,.txt,.zip"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#E8E6E1] dark:hover:text-[#E8E6E1] hover:text-slate-900 hover:bg-[#151B22] dark:hover:bg-[#151B22] hover:bg-slate-200 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-mono"
                title="Attach photo, video, PDF or document (max 25MB)"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span className="hidden xs:inline text-[11px]">Attach file</span>
              </button>

              <div className="w-px h-3 bg-[#27323F] dark:bg-[#27323F] bg-slate-300 hidden xs:block" />

              {/* Auto-delete setting */}
              <div className="flex items-center gap-1 text-xs text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 font-mono">
                <span className="text-[10px] sm:text-[11px]">Self-destruct:</span>
                <div className="inline-flex items-center gap-0.5 sm:gap-1">
                  {[
                    { label: 'Off', val: undefined },
                    { label: '30s', val: 30 },
                    { label: '5m', val: 300 },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setAutoDeleteSeconds(opt.val)}
                      className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] rounded transition-colors cursor-pointer font-mono ${
                        autoDeleteSeconds === opt.val
                          ? 'bg-[#059669] dark:bg-[#10B981] text-white dark:text-[#022c22] font-bold shadow-xs'
                          : 'text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#E8E6E1] hover:bg-[#151B22] dark:hover:bg-[#151B22] hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Send button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#059669] hover:bg-[#047857] dark:bg-[#10B981] dark:hover:bg-[#059669] disabled:opacity-40 disabled:cursor-not-allowed text-white dark:text-[#022c22] font-mono text-xs font-bold rounded-md transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sealing…</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
