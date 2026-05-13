import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileIcon, ImageIcon, FileText, Download, Eye, Film, Music,
  FileCode, FileArchive, X, ZoomIn, ZoomOut, RotateCw, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadFile } from '@/services/chatService';

interface Attachment {
  id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface FileAttachmentProps {
  attachment: Attachment;
  onDownload?: (attachment: Attachment) => void;
  className?: string;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getFileKey(url: string): string {
  if (url.startsWith('s3://')) return url.replace('s3://', '').split('/').slice(1).join('/');
  return url;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type FileCategory = 'image' | 'pdf' | 'video' | 'audio' | 'code' | 'archive' | 'other';

function getCategory(mime: string): FileCategory {
  if (mime.startsWith('image/')) return 'image';
  if (mime.includes('pdf')) return 'pdf';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('text/') || mime.includes('json') || mime.includes('xml')) return 'code';
  if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar')) return 'archive';
  return 'other';
}

function TypeIcon({ mime, size = 18 }: { mime: string; size?: number }) {
  const cat = getCategory(mime);
  const cls = `flex-shrink-0`;
  const s = { width: size, height: size };
  if (cat === 'image')   return <ImageIcon   style={s} className={cn(cls, 'text-violet-500')} />;
  if (cat === 'pdf')     return <FileText    style={s} className={cn(cls, 'text-red-500')} />;
  if (cat === 'video')   return <Film        style={s} className={cn(cls, 'text-blue-500')} />;
  if (cat === 'audio')   return <Music       style={s} className={cn(cls, 'text-green-500')} />;
  if (cat === 'code')    return <FileCode    style={s} className={cn(cls, 'text-yellow-500')} />;
  if (cat === 'archive') return <FileArchive style={s} className={cn(cls, 'text-orange-500')} />;
  return <FileIcon style={s} className={cn(cls, 'text-muted-foreground')} />;
}

function typeLabel(mime: string): string {
  if (mime.startsWith('image/')) return mime.split('/')[1].toUpperCase() + ' Image';
  if (mime.includes('pdf')) return 'PDF Document';
  if (mime.startsWith('video/')) return mime.split('/')[1].toUpperCase() + ' Video';
  if (mime.startsWith('audio/')) return mime.split('/')[1].toUpperCase() + ' Audio';
  return mime.split('/').pop()?.toUpperCase() ?? 'File';
}

// ─── blob URL hook ────────────────────────────────────────────────────────────

function useBlobUrl(fileUrl: string, eager = false) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);

  const load = useCallback(async () => {
    if (loaded.current || loading) return;
    loaded.current = true;
    setLoading(true);
    try {
      const key = getFileKey(fileUrl);
      const blob = await downloadFile(key);
      setBlobUrl(URL.createObjectURL(blob));
    } catch { loaded.current = false; }
    finally { setLoading(false); }
  }, [fileUrl]);

  useEffect(() => {
    if (eager) load();
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [eager]);

  return { blobUrl, loading, load };
}

// ─── Preview modal ────────────────────────────────────────────────────────────

function PreviewModal({
  attachment,
  onClose,
  onDownload,
}: {
  attachment: Attachment;
  onClose: () => void;
  onDownload: () => void;
}) {
  const cat = getCategory(attachment.file_type);
  const { blobUrl, loading, load } = useBlobUrl(attachment.file_url, true);
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);

  return (
    <div
      className="fixed inset-0 z-[9995] bg-black/80 backdrop-blur-sm flex flex-col"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-black/60 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <TypeIcon mime={attachment.file_type} size={18} />
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate max-w-sm">{attachment.file_name}</p>
            <p className="text-white/50 text-xs">{typeLabel(attachment.file_type)} · {formatSize(attachment.file_size)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {cat === 'image' && (
            <>
              <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-white/60 text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <ZoomIn className="h-4 w-4" />
              </button>
              <button onClick={() => setRotate(r => (r + 90) % 360)} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <RotateCw className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-white/20 mx-1" />
            </>
          )}
          <button onClick={onDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
          <button onClick={onClose} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-6 min-h-0">
        {loading && (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">Loading preview…</span>
          </div>
        )}

        {!loading && blobUrl && cat === 'image' && (
          <img
            src={blobUrl}
            alt={attachment.file_name}
            style={{ transform: `scale(${zoom}) rotate(${rotate}deg)`, transition: 'transform 0.2s' }}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        )}

        {!loading && blobUrl && cat === 'pdf' && (
          <iframe
            src={blobUrl}
            title={attachment.file_name}
            className="w-full h-full rounded-lg bg-white"
            style={{ minHeight: '70vh' }}
          />
        )}

        {!loading && blobUrl && cat === 'video' && (
          <video
            src={blobUrl}
            controls
            autoPlay={false}
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
        )}

        {!loading && blobUrl && cat === 'audio' && (
          <div className="bg-card rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Music className="h-16 w-16 text-violet-500" />
            <p className="text-foreground font-semibold text-lg">{attachment.file_name}</p>
            <audio src={blobUrl} controls className="w-80" />
          </div>
        )}

        {!loading && (cat === 'archive' || cat === 'other' || cat === 'code') && (
          <div className="bg-card rounded-2xl p-10 flex flex-col items-center gap-4 shadow-2xl">
            <TypeIcon mime={attachment.file_type} size={48} />
            <div className="text-center">
              <p className="text-foreground font-semibold text-lg">{attachment.file_name}</p>
              <p className="text-muted-foreground text-sm mt-1">{typeLabel(attachment.file_type)} · {formatSize(attachment.file_size)}</p>
            </div>
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium text-sm transition-colors"
            >
              <Download className="h-4 w-4" />
              Download File
            </button>
          </div>
        )}

        {!loading && !blobUrl && (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <TypeIcon mime={attachment.file_type} size={48} />
            <span className="text-sm">Preview unavailable</span>
            <button onClick={onDownload} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors">
              <Download className="h-4 w-4" /> Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

const FileAttachment: React.FC<FileAttachmentProps> = ({ attachment, onDownload, className }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const cat = getCategory(attachment.file_type);
  const isImage = cat === 'image';

  // Eager-load thumbnail only for images
  const { blobUrl: thumbUrl } = useBlobUrl(attachment.file_url, isImage);

  const handleDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onDownload) onDownload(attachment);
  };

  const canPreview = cat === 'image' || cat === 'pdf' || cat === 'video' || cat === 'audio';

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer select-none',
          className
        )}
        onClick={() => canPreview ? setPreviewOpen(true) : handleDownload()}
      >
        {/* Thumbnail / icon */}
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {isImage && thumbUrl
            ? <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
            : <TypeIcon mime={attachment.file_type} size={20} />
          }
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate leading-tight">{attachment.file_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{typeLabel(attachment.file_type)} · {formatSize(attachment.file_size)}</p>
        </div>

        {/* Actions — always visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {canPreview && (
            <button
              onClick={(e) => { e.stopPropagation(); setPreviewOpen(true); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Preview"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {previewOpen && (
        <PreviewModal
          attachment={attachment}
          onClose={() => setPreviewOpen(false)}
          onDownload={handleDownload}
        />
      )}
    </>
  );
};

export default FileAttachment;
