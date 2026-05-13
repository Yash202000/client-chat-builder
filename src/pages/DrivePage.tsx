import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HardDrive, Folder, FolderOpen, File, FileText, FileImage, FileVideo, FileAudio,
  ChevronRight, ChevronDown, LayoutGrid, List, Upload, FolderPlus, Search,
  MoreHorizontal, Download, Pencil, Trash2, X, ArrowUpDown, Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  DriveItem, DriveStats,
  listFolder, createFolder, uploadFile, renameItem, deleteItem,
  getDownloadUrl, getBreadcrumb, searchItems, getStorageStats,
} from '@/services/driveService';

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function FileIcon({ mime, isFolder, size = 'md' }: { mime?: string | null; isFolder: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-12 h-12' : size === 'md' ? 'w-8 h-8' : 'w-5 h-5';
  if (isFolder) return <Folder className={cn(cls, 'text-amber-400')} />;
  if (!mime) return <File className={cn(cls, 'text-muted-foreground')} />;
  if (mime.startsWith('image/')) return <FileImage className={cn(cls, 'text-blue-400')} />;
  if (mime.startsWith('video/')) return <FileVideo className={cn(cls, 'text-purple-400')} />;
  if (mime.startsWith('audio/')) return <FileAudio className={cn(cls, 'text-pink-400')} />;
  if (mime === 'application/pdf') return <FileText className={cn(cls, 'text-red-400')} />;
  return <File className={cn(cls, 'text-muted-foreground')} />;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function DrivePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameTarget, setRenameTarget] = useState<DriveItem | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DriveItem | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const isSearching = debouncedSearch.length > 1;

  const { data: folderData, isLoading } = useQuery({
    queryKey: ['drive-items', currentFolderId, sortBy, sortDir],
    queryFn: () => listFolder(currentFolderId, sortBy, sortDir),
    enabled: !isSearching,
  });

  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: ['drive-search', debouncedSearch],
    queryFn: () => searchItems(debouncedSearch),
    enabled: isSearching,
  });

  const { data: stats } = useQuery({
    queryKey: ['drive-stats'],
    queryFn: getStorageStats,
  });

  const { data: breadcrumb = [] } = useQuery({
    queryKey: ['drive-breadcrumb', currentFolderId],
    queryFn: () => getBreadcrumb(currentFolderId!),
    enabled: currentFolderId !== null,
  });

  const items = isSearching ? (searchData?.items ?? []) : (folderData?.items ?? []);
  const loading = isSearching ? isSearchLoading : isLoading;

  const invalidateFolder = () => {
    queryClient.invalidateQueries({ queryKey: ['drive-items', currentFolderId] });
    queryClient.invalidateQueries({ queryKey: ['drive-stats'] });
  };

  const createFolderMutation = useMutation({
    mutationFn: () => createFolder(newFolderName.trim(), currentFolderId),
    onSuccess: () => { setNewFolderOpen(false); setNewFolderName(''); invalidateFolder(); },
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => renameItem(renameTarget!.id, name),
    onSuccess: () => { setRenameTarget(null); invalidateFolder(); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteItem(deleteTarget!.id),
    onSuccess: () => { setDeleteTarget(null); if (previewItem?.id === deleteTarget?.id) setPreviewItem(null); invalidateFolder(); },
  });

  // Upload handler (shared between button and drop)
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    for (const file of arr) {
      setUploadProgress(p => ({ ...p, [file.name]: 0 }));
      try {
        await uploadFile(file, currentFolderId, (pct) =>
          setUploadProgress(p => ({ ...p, [file.name]: pct })),
        );
        invalidateFolder();
      } finally {
        setUploadProgress(p => { const n = { ...p }; delete n[file.name]; return n; });
      }
    }
  }, [currentFolderId]);

  // Drag-and-drop
  const onDragEnter = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current++; setIsDraggingOver(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDraggingOver(false); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDraggingOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const activeUploads = Object.entries(uploadProgress);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">

      {/* Top Bar */}
      <div className="flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border space-y-2 sm:space-y-0">
        {/* Row 1: Breadcrumb + action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Breadcrumb — scrollable on mobile */}
          <div className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setCurrentFolderId(null)}
              className={cn(
                'flex items-center gap-1 text-sm font-medium transition-colors px-1.5 py-0.5 rounded flex-shrink-0',
                currentFolderId === null
                  ? 'text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t('drive.title')}</span>
            </button>
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                <button
                  onClick={() => setCurrentFolderId(crumb.id)}
                  className={cn(
                    'text-sm font-medium truncate max-w-[100px] sm:max-w-[120px] transition-colors px-1.5 py-0.5 rounded flex-shrink-0',
                    i === breadcrumb.length - 1
                      ? 'text-foreground bg-muted cursor-default'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Search — inline on sm+, hidden here (shown in row 2 on mobile) */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder={t('drive.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 w-44 text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 sm:gap-1.5 text-xs px-2 sm:px-3 flex-shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{sortBy === 'name' ? t('drive.sort.name') : sortBy === 'date' ? t('drive.sort.date') : t('drive.sort.size')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {(['name', 'date', 'size'] as const).map(s => (
                <DropdownMenuItem key={s} onClick={() => { if (sortBy === s) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(s); setSortDir('asc'); } }}
                  className={cn('capitalize', sortBy === s && 'font-semibold text-primary')}>
                  {s} {sortBy === s && (sortDir === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle */}
          <div className="flex rounded-md border border-border overflow-hidden flex-shrink-0">
            <button onClick={() => setViewMode('grid')}
              className={cn('p-1.5 transition-colors', viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={cn('p-1.5 transition-colors', viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button variant="outline" size="sm" className="h-8 gap-1 sm:gap-1.5 text-xs px-2 sm:px-3 flex-shrink-0" onClick={() => setNewFolderOpen(true)}>
            <FolderPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('drive.newFolder')}</span>
          </Button>

          <Button size="sm" className="h-8 gap-1 sm:gap-1.5 text-xs px-2 sm:px-3 flex-shrink-0" onClick={() => uploadInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('drive.upload')}</span>
          </Button>
          <input ref={uploadInputRef} type="file" multiple className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        </div>

        {/* Row 2: Search — mobile only, full width */}
        <div className="relative sm:hidden">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder={t('drive.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 w-full text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Storage Bar */}
      {stats && (
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30">
          <HardDrive className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <Progress value={Math.min((stats.total_bytes / (100 * 1024 * 1024 * 1024)) * 100, 100)} className="h-1.5 w-32" />
          <span className="text-xs text-muted-foreground">
            {formatBytes(stats.total_bytes)} used · {stats.file_count} file{stats.file_count !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Upload Progress */}
      {activeUploads.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-b border-border bg-primary/5 space-y-1">
          {activeUploads.map(([name, pct]) => (
            <div key={name} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">{name}</span>
              <Progress value={pct} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <div
          className={cn('flex-1 overflow-auto p-4 relative transition-colors', isDraggingOver && 'bg-primary/5')}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {isDraggingOver && (
            <div className="absolute inset-4 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 flex items-center justify-center z-10 pointer-events-none">
              <div className="text-center">
                <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-primary">{t('drive.dropToUpload')}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              {isSearching
                ? <><Search className="w-10 h-10 text-muted-foreground/40 mb-3" /><p className="text-sm text-muted-foreground">{t('drive.noSearchResults', { query: debouncedSearch })}</p></>
                : <><FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" /><p className="text-sm font-medium text-foreground">{t('drive.folderEmpty')}</p><p className="text-xs text-muted-foreground mt-1">{t('drive.folderEmptyDesc')}</p></>
              }
            </div>
          ) : viewMode === 'grid' ? (
            <FileGrid items={items} onNavigate={setCurrentFolderId} onPreview={setPreviewItem}
              onRename={(item) => { setRenameTarget(item); setRenameValue(item.name); }}
              onDelete={setDeleteTarget} currentFolderId={currentFolderId} queryClient={queryClient} />
          ) : (
            <FileListView items={items} onNavigate={setCurrentFolderId} onPreview={setPreviewItem}
              onRename={(item) => { setRenameTarget(item); setRenameValue(item.name); }}
              onDelete={setDeleteTarget} />
          )}
        </div>

        {/* Preview Panel */}
        {previewItem && (
          <>
            <div className="fixed inset-0 bg-black/40 z-30 sm:hidden" onClick={() => setPreviewItem(null)} />
            <FilePreviewPanel item={previewItem} onClose={() => setPreviewItem(null)} />
          </>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{t('drive.dialogs.newFolderTitle')}</DialogTitle></DialogHeader>
          <Input
            autoFocus
            placeholder={t('drive.folderNamePlaceholder')}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && newFolderName.trim() && createFolderMutation.mutate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => createFolderMutation.mutate()} disabled={!newFolderName.trim() || createFolderMutation.isPending}>
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{t('drive.rename')}</DialogTitle></DialogHeader>
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && renameValue.trim() && renameMutation.mutate(renameValue.trim())}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>{t('common.cancel')}</Button>
            <Button onClick={() => renameMutation.mutate(renameValue.trim())} disabled={!renameValue.trim() || renameMutation.isPending}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{t('drive.dialogs.deleteTitle', { name: deleteTarget?.name })}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteTarget?.is_folder
              ? t('drive.dialogs.deleteFolderDesc')
              : t('drive.dialogs.deleteFileDesc')}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── File Grid ────────────────────────────────────────────────────────────────

function FileGrid({ items, onNavigate, onPreview, onRename, onDelete, currentFolderId, queryClient }: {
  items: DriveItem[];
  onNavigate: (id: number) => void;
  onPreview: (item: DriveItem) => void;
  onRename: (item: DriveItem) => void;
  onDelete: (item: DriveItem) => void;
  currentFolderId: number | null;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {items.map((item) => (
        <GridCard key={item.id} item={item} onNavigate={onNavigate} onPreview={onPreview} onRename={onRename} onDelete={onDelete} />
      ))}
    </div>
  );
}

function GridCard({ item, onNavigate, onPreview, onRename, onDelete }: {
  item: DriveItem;
  onNavigate: (id: number) => void;
  onPreview: (item: DriveItem) => void;
  onRename: (item: DriveItem) => void;
  onDelete: (item: DriveItem) => void;
}) {
  const handleClick = () => item.is_folder ? onNavigate(item.id) : onPreview(item);

  return (
    <div
      className="group relative flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 cursor-pointer transition-all select-none"
      onClick={handleClick}
    >
      <FileIcon mime={item.mime_type} isFolder={item.is_folder} size="lg" />
      <span className="text-xs font-medium text-foreground text-center line-clamp-2 w-full leading-tight">
        {item.name}
      </span>
      {item.file_size !== null && (
        <span className="text-[10px] text-muted-foreground">{formatBytes(item.file_size)}</span>
      )}

      {/* Three-dot menu — always visible on touch, hover-only on desktop */}
      <div className="absolute top-1.5 right-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <ItemMenu item={item} onRename={onRename} onDelete={onDelete} />
      </div>
    </div>
  );
}

// ── File List ────────────────────────────────────────────────────────────────

function FileListView({ items, onNavigate, onPreview, onRename, onDelete }: {
  items: DriveItem[];
  onNavigate: (id: number) => void;
  onPreview: (item: DriveItem) => void;
  onRename: (item: DriveItem) => void;
  onDelete: (item: DriveItem) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{t('drive.table.name')}</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">{t('drive.table.size')}</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">{t('drive.table.modified')}</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-border/50 last:border-0 hover:bg-muted/40 cursor-pointer transition-colors group"
              onClick={() => item.is_folder ? onNavigate(item.id) : onPreview(item)}
            >
              <td className="px-3 sm:px-4 py-2.5">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <FileIcon mime={item.mime_type} isFolder={item.is_folder} size="sm" />
                  <span className="font-medium text-foreground truncate max-w-[140px] sm:max-w-[240px] text-xs sm:text-sm">{item.name}</span>
                </div>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell text-sm">
                {item.file_size !== null ? formatBytes(item.file_size) : '—'}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell text-sm">
                {formatDate(item.updated_at)}
              </td>
              <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <ItemMenu item={item} onRename={onRename} onDelete={onDelete} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Item context menu ────────────────────────────────────────────────────────

function ItemMenu({ item, onRename, onDelete }: {
  item: DriveItem;
  onRename: (item: DriveItem) => void;
  onDelete: (item: DriveItem) => void;
}) {
  const { t } = useTranslation();
  const handleDownload = async () => {
    const data = await getDownloadUrl(item.id);
    const a = document.createElement('a');
    a.href = data.url;
    a.download = item.name;
    a.click();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 rounded-md hover:bg-muted transition-colors">
          <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {!item.is_folder && (
          <>
            <DropdownMenuItem onClick={handleDownload} className="gap-2">
              <Download className="w-3.5 h-3.5" /> {t('drive.actions.download')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => onRename(item)} className="gap-2">
          <Pencil className="w-3.5 h-3.5" /> {t('drive.actions.rename')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(item)} className="gap-2 text-destructive focus:text-destructive">
          <Trash2 className="w-3.5 h-3.5" /> {t('drive.actions.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Preview Panel ────────────────────────────────────────────────────────────

function FilePreviewPanel({ item, onClose }: { item: DriveItem; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: urlData } = useQuery({
    queryKey: ['drive-url', item.id],
    queryFn: () => getDownloadUrl(item.id, 3600),
    enabled: !item.is_folder,
    staleTime: 50 * 60 * 1000,
  });

  const isImage = item.mime_type?.startsWith('image/');
  const isPdf = item.mime_type === 'application/pdf';

  return (
    <div className={cn(
      'flex flex-col bg-background border-l border-border overflow-hidden',
      'fixed inset-y-0 right-0 w-[85vw] z-40',
      'sm:relative sm:inset-auto sm:w-72 sm:flex-shrink-0 sm:z-auto',
    )}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground truncate">{item.name}</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors ml-2 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {urlData && isImage && (
          <div className="p-3">
            <img src={urlData.url} alt={item.name} className="w-full rounded-lg object-contain max-h-64" />
          </div>
        )}
        {urlData && isPdf && (
          <iframe src={urlData.url} className="w-full h-64 border-0" title={item.name} />
        )}
        {!isImage && !isPdf && (
          <div className="flex flex-col items-center justify-center py-10">
            <FileIcon mime={item.mime_type} isFolder={false} size="lg" />
            <p className="text-xs text-muted-foreground mt-3">{item.mime_type || t('drive.preview.unknownType')}</p>
          </div>
        )}

        <div className="px-4 py-3 space-y-2.5">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{t('drive.preview.fileName')}</p>
            <p className="text-sm text-foreground break-all">{item.name}</p>
          </div>
          {item.file_size !== null && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{t('drive.preview.size')}</p>
              <p className="text-sm text-foreground">{formatBytes(item.file_size)}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{t('drive.preview.modified')}</p>
            <p className="text-sm text-foreground">{formatDate(item.updated_at)}</p>
          </div>
          {item.owner_name && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{t('drive.preview.owner')}</p>
              <p className="text-sm text-foreground">{item.owner_name}</p>
            </div>
          )}
        </div>
      </div>

      {urlData && (
        <div className="px-4 py-3 border-t border-border">
          <a href={urlData.url} download={item.name} className="w-full">
            <Button size="sm" variant="outline" className="w-full gap-1.5">
              <Download className="w-3.5 h-3.5" /> {t('drive.actions.download')}
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
