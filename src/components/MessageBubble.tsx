import React, { useState, useEffect } from 'react';
import {
  Clock,
  Copy,
  Check,
  Trash2,
  FileText,
  Download,
  ExternalLink,
  Film,
  Eye,
  X,
} from 'lucide-react';
import { ChatMessage } from '../types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  onDeleteMessage?: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onDeleteMessage,
}) => {
  const isSelf = message.sender === 'self';
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  useEffect(() => {
    if (!message.expiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((message.expiresAt! - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [message.expiresAt]);

  const handleCopy = () => {
    const textToCopy = message.plaintext || message.media?.name || '';
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMedia = () => {
    if (!message.media?.dataUrl) return;
    const a = document.createElement('a');
    a.href = message.media.dataUrl;
    a.download = message.media.name || 'cipherlink-file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenPdf = () => {
    if (!message.media?.dataUrl) return;
    setPdfModalOpen(true);
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const media = message.media;
  const isImage = media?.type.startsWith('image/');
  const isVideo = media?.type.startsWith('video/');
  const isPdf =
    media?.type === 'application/pdf' ||
    (media?.name && media.name.toLowerCase().endsWith('.pdf'));

  return (
    <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} group mb-3 w-full`}>
      {/* Sender and timestamp header */}
      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500">
        <span className="font-mono font-medium text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-800">
          {isSelf ? 'You' : message.senderName || 'Peer'}
        </span>
        <span className="text-[#27323F] dark:text-[#27323F] text-slate-300">·</span>
        <span className="text-[11px] text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 tabular-nums font-mono">
          {formattedTime}
        </span>
      </div>

      {/* Bubble Container */}
      <div
        className={`relative rounded-xl text-sm leading-relaxed max-w-[92%] sm:max-w-[78%] break-words shadow-md transition-colors ${
          isSelf
            ? 'bg-[#1B222A] dark:bg-[#1B222A] bg-emerald-50/90 text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900 border border-[#059669]/40 dark:border-[#10B981]/40 border-emerald-300'
            : 'bg-[#151B22] dark:bg-[#151B22] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-200 text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900'
        } ${media ? 'p-2 sm:p-2.5' : 'px-3.5 py-2.5'}`}
      >
        {/* Media: Image Attachment */}
        {media && isImage && (
          <div className="space-y-1.5 mb-1.5">
            <div className="relative group/img rounded-lg overflow-hidden bg-[#0F1419] dark:bg-[#0F1419] bg-slate-100 max-h-72 flex items-center justify-center border border-[#27323F] dark:border-[#27323F] border-slate-200">
              <img
                src={media.dataUrl}
                alt={media.name}
                onClick={() => setLightboxOpen(true)}
                className="max-h-72 w-auto max-w-full rounded-lg object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
                loading="lazy"
              />
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/75 backdrop-blur-xs p-1 rounded-md text-[#E8E6E1]">
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="p-1 hover:text-[#10B981] cursor-pointer"
                  title="Expand image"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMedia}
                  className="p-1 hover:text-[#10B981] cursor-pointer"
                  title="Download image"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 px-1 font-mono">
              <span className="truncate max-w-[180px] sm:max-w-[240px]">{media.name}</span>
              <span>{formatBytes(media.size)}</span>
            </div>
          </div>
        )}

        {/* Media: Video Attachment */}
        {media && isVideo && (
          <div className="space-y-1.5 mb-1.5">
            <div className="rounded-lg overflow-hidden bg-black max-h-72 border border-[#27323F] dark:border-[#27323F] border-slate-200">
              <video
                src={media.dataUrl}
                controls
                playsInline
                className="max-h-72 w-full rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 px-1 font-mono">
              <span className="truncate max-w-[180px] sm:max-w-[240px] flex items-center gap-1">
                <Film className="w-3 h-3 shrink-0" />
                {media.name}
              </span>
              <div className="flex items-center gap-2">
                <span>{formatBytes(media.size)}</span>
                <button
                  type="button"
                  onClick={handleDownloadMedia}
                  className="hover:text-[#10B981] p-0.5 cursor-pointer"
                  title="Download video"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Media: PDF Attachment */}
        {media && isPdf && (
          <div className="p-2.5 rounded-lg border border-[#27323F] dark:border-[#27323F] border-slate-200 bg-[#0F1419] dark:bg-[#0F1419] bg-slate-50 mb-1.5 flex items-center justify-between gap-3 text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded bg-[#059669]/15 dark:bg-[#10B981]/15 border border-[#059669]/30 dark:border-[#10B981]/30 text-[#059669] dark:text-[#10B981] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate font-mono text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">{media.name}</div>
                <div className="text-[10px] text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 font-sans">
                  PDF · {formatBytes(media.size)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 font-mono">
              <button
                type="button"
                onClick={handleOpenPdf}
                className="p-1.5 rounded hover:bg-[#1B222A] dark:hover:bg-[#1B222A] hover:bg-slate-200 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#E8E6E1] transition-colors cursor-pointer"
                title="Preview PDF"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDownloadMedia}
                className="p-1.5 rounded hover:bg-[#1B222A] dark:hover:bg-[#1B222A] hover:bg-slate-200 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#E8E6E1] transition-colors cursor-pointer"
                title="Download PDF"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Media: Other Document / File */}
        {media && !isImage && !isVideo && !isPdf && (
          <div className="p-2.5 rounded-lg border border-[#27323F] dark:border-[#27323F] border-slate-200 bg-[#0F1419] dark:bg-[#0F1419] bg-slate-50 mb-1.5 flex items-center justify-between gap-3 text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded bg-[#059669]/15 dark:bg-[#10B981]/15 border border-[#059669]/30 dark:border-[#10B981]/30 text-[#059669] dark:text-[#10B981] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate font-mono text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">{media.name}</div>
                <div className="text-[10px] text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 font-sans">
                  File · {formatBytes(media.size)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadMedia}
              className="p-1.5 rounded hover:bg-[#1B222A] dark:hover:bg-[#1B222A] hover:bg-slate-200 text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-[#E8E6E1] transition-colors cursor-pointer shrink-0"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Text Plaintext (if any) */}
        {message.plaintext && (
          <p className="whitespace-pre-wrap px-0.5 font-sans leading-relaxed text-[#E8E6E1] dark:text-[#E8E6E1] text-slate-900">{message.plaintext}</p>
        )}

        {/* Action / countdown / delete row */}
        <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 text-[10px] text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-500 border-t border-[#27323F]/80 dark:border-[#27323F]/80 border-slate-200">
          {/* Left: Auto-delete countdown */}
          <div>
            {secondsRemaining !== null && (
              <span className="inline-flex items-center gap-1 text-[#059669] dark:text-[#10B981] font-mono font-medium" title="Self-destruct timer">
                <Clock className="w-2.5 h-2.5" />
                <span>{secondsRemaining}s</span>
              </span>
            )}
          </div>

          {/* Right: Copy & Delete button */}
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 hover:text-[#059669] dark:hover:text-[#10B981] rounded transition-colors cursor-pointer"
              title="Copy message text"
            >
              {copied ? (
                <Check className="w-3 h-3 text-[#10B981]" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>

            {isSelf && onDeleteMessage && (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="p-1 hover:text-[#EF4444] rounded transition-colors cursor-pointer"
                title="Delete this message for everyone"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inline Delete Confirmation */}
      {showConfirmDelete && (
        <div className="mt-1.5 p-2 bg-[#0F1419] dark:bg-[#0F1419] bg-white border border-[#27323F] dark:border-[#27323F] border-slate-300 rounded-lg text-xs font-mono flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <span className="text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 text-[11px]">Delete message for both peers?</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowConfirmDelete(false)}
              className="px-2 py-0.5 text-[10px] text-[#9BA3AF] dark:text-[#9BA3AF] text-slate-600 hover:text-white bg-[#151B22] dark:bg-[#151B22] bg-slate-100 rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setShowConfirmDelete(false);
                onDeleteMessage?.(message.id);
              }}
              className="px-2 py-0.5 text-[10px] font-bold text-white bg-[#EF4444] hover:bg-[#DC2626] rounded cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxOpen && media && isImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between text-[#E8E6E1] pb-2 px-1 text-xs">
              <span className="font-mono truncate max-w-xs">{media.name}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadMedia}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#151B22] hover:bg-[#1B222A] border border-[#27323F] rounded-md transition-colors text-xs font-mono cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  className="p-1 hover:text-[#EF4444] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <img
              src={media.dataUrl}
              alt={media.name}
              className="max-h-[82vh] max-w-full rounded-lg object-contain shadow-2xl border border-[#27323F]"
            />
          </div>
        </div>
      )}

      {/* PDF Modal */}
      {pdfModalOpen && media && isPdf && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setPdfModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl h-[85vh] bg-[#151B22] border border-[#27323F] rounded-xl flex flex-col overflow-hidden text-[#E8E6E1]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-[#27323F] bg-[#11161D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#059669] dark:text-[#10B981]" />
                <span className="font-mono text-xs font-bold truncate max-w-sm">
                  {media.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadMedia}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0F1419] hover:bg-[#1B222A] border border-[#27323F] rounded-md text-xs font-mono cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPdfModalOpen(false)}
                  className="p-1 hover:text-[#EF4444] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <iframe
              src={media.dataUrl}
              title={media.name}
              className="w-full flex-1 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};
