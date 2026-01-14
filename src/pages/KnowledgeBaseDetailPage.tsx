import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  FileText,
  Database,
  Plus,
  Upload,
  Link as LinkIcon,
  Eye,
  Trash2,
  MoreVertical,
  Pencil,
  List,
  Loader2,
  FolderOpen,
  Settings,
  Image,
  Music,
  Video,
  File,
  Search,
  Download,
  X,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Trash,
  Key,
  RefreshCw,
  Copy,
  FileJson,
  FileSpreadsheet,
  Check,
  Store,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { KnowledgeBase } from '@/types';
import * as cmsService from '@/services/cmsService';
import {
  ContentType,
  FIELD_TYPE_INFO,
  ContentMedia,
  MediaType,
  MediaListResponse,
  ContentCategory,
  CategoryCreate,
  ApiToken,
  ContentExport,
  ExportFormat,
  MarketplaceItem,
  MarketplaceListResponse,
} from '@/types/cms';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Permission } from '@/components/Permission';

// Helper functions
const MediaIcon = ({ type }: { type: MediaType }) => {
  switch (type) {
    case 'image':
      return <Image className="w-6 h-6" />;
    case 'audio':
      return <Music className="w-6 h-6" />;
    case 'video':
      return <Video className="w-6 h-6" />;
    default:
      return <File className="w-6 h-6" />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Documents Tab Component - handles document uploads and listing
const DocumentsTab = ({ kb, authFetch }: { kb: KnowledgeBase; authFetch: any }) => {
  const { toast } = useToast();
  const { t, isRTL } = useI18n();
  const queryClient = useQueryClient();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isImportUrlDialogOpen, setIsImportUrlDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  const { data: previewContent, isLoading: isLoadingPreview } = useQuery<{ content: string }>({
    queryKey: ['knowledgeBaseContent', kb.id],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/knowledge-bases/${kb.id}/content`);
      if (!response.ok) {
        throw new Error('Failed to fetch knowledge base content');
      }
      return response.json();
    },
    enabled: isPreviewDialogOpen,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await authFetch(`/api/v1/knowledge-bases/${kb.id}/upload-document`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to upload document');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base', kb.id] });
      toast({ title: t('knowledgeBase.detailPage.documents.uploadSuccess') });
      setIsUploadDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: t('knowledgeBase.detailPage.documents.uploadFailed'), description: error.message, variant: 'destructive' });
    },
  });

  const importUrlMutation = useMutation({
    mutationFn: async (data: { url: string; name: string }) => {
      const response = await authFetch(`/api/v1/knowledge-bases/from-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, knowledge_base_id: kb.id }),
      });
      if (!response.ok) {
        throw new Error('Failed to import from URL');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base', kb.id] });
      toast({ title: t('knowledgeBase.detailPage.documents.importSuccess') });
      setIsImportUrlDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: t('knowledgeBase.detailPage.documents.importFailed'), description: error.message, variant: 'destructive' });
    },
  });

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    uploadMutation.mutate(formData);
  };

  const handleImportUrl = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    importUrlMutation.mutate({
      url: formData.get('url') as string,
      name: formData.get('name') as string,
    });
  };

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className="text-start">
          <h3 className="text-lg font-medium">{t('knowledgeBase.detailPage.documents.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('knowledgeBase.detailPage.documents.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportUrlDialogOpen} onOpenChange={setIsImportUrlDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <LinkIcon className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                {t('knowledgeBase.detailPage.documents.importFromUrl')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('knowledgeBase.detailPage.documents.importFromUrl')}</DialogTitle>
                <DialogDescription>{t('knowledgeBase.detailPage.documents.importDescription')}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleImportUrl} className="space-y-4">
                <div>
                  <Label htmlFor="url">{t('knowledgeBase.detailPage.documents.urlLabel')}</Label>
                  <Input id="url" name="url" type="url" placeholder="https://example.com/article" required />
                </div>
                <div>
                  <Label htmlFor="name">{t('knowledgeBase.detailPage.documents.nameLabel')}</Label>
                  <Input id="name" name="name" placeholder={t('knowledgeBase.detailPage.documents.namePlaceholder')} required />
                </div>
                <Button type="submit" disabled={importUrlMutation.isPending}>
                  {importUrlMutation.isPending ? <Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" /> : null}
                  {t('knowledgeBase.detailPage.documents.import')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                {t('knowledgeBase.detailPage.documents.uploadDocument')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('knowledgeBase.detailPage.documents.uploadDocument')}</DialogTitle>
                <DialogDescription>{t('knowledgeBase.detailPage.documents.supportedFormats')}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <Label htmlFor="file">{t('knowledgeBase.detailPage.documents.fileLabel')}</Label>
                  <Input id="file" name="file" type="file" accept=".pdf,.docx,.txt" required />
                </div>
                <Button type="submit" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? <Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" /> : null}
                  {t('knowledgeBase.detailPage.documents.upload')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Document Preview Card */}
      {kb.storage_type === 's3' && kb.storage_details ? (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">{kb.storage_details.key?.split('/').pop() || t('knowledgeBase.detailPage.documents.document')}</p>
                  <p className="text-sm text-muted-foreground">{t('knowledgeBase.detailPage.documents.indexedInChromaDB')}</p>
                </div>
              </div>
              <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                    {t('knowledgeBase.detailPage.documents.preview')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('knowledgeBase.detailPage.documents.documentPreview')}</DialogTitle>
                    <DialogDescription>{t('knowledgeBase.detailPage.documents.contentExtracted')}</DialogDescription>
                  </DialogHeader>
                  {isLoadingPreview ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <SyntaxHighlighter
                      language="text"
                      style={solarizedlight}
                      customStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
                    >
                      {previewContent?.content || ''}
                    </SyntaxHighlighter>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ) : kb.content ? (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">{t('knowledgeBase.detailPage.documents.textContent')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('knowledgeBase.detailPage.documents.charactersIndexed', { count: kb.content.length.toLocaleString() })}
                  </p>
                </div>
              </div>
              <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                    {t('knowledgeBase.detailPage.documents.preview')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('knowledgeBase.detailPage.documents.contentPreview')}</DialogTitle>
                  </DialogHeader>
                  <SyntaxHighlighter
                    language="text"
                    style={solarizedlight}
                    customStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
                  >
                    {kb.content || ''}
                  </SyntaxHighlighter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('knowledgeBase.detailPage.documents.noDocuments')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('knowledgeBase.detailPage.documents.uploadFirst')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Content Tab Component - CMS content types and items scoped to this KB
const ContentTab = ({ kb }: { kb: KnowledgeBase }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, isRTL } = useI18n();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: ContentType | null }>({
    open: false,
    type: null,
  });

  const { data: contentTypes, isLoading } = useQuery({
    queryKey: ['cms-content-types', kb.id],
    queryFn: () => cmsService.getContentTypes(kb.id),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => cmsService.deleteContentType(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-types', kb.id] });
      toast({ title: 'Content type deleted' });
      setDeleteDialog({ open: false, type: null });
    },
    onError: () => {
      toast({ title: 'Failed to delete content type', variant: 'destructive' });
    },
  });

  const handleDelete = () => {
    if (deleteDialog.type) {
      deleteMutation.mutate(deleteDialog.type.slug);
    }
  };

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className="text-start">
          <h3 className="text-lg font-medium">{t('knowledgeBase.detailPage.contentTypes.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('knowledgeBase.detailPage.contentTypes.subtitle')}
          </p>
        </div>
        <Link to={`/dashboard/knowledge-base/${kb.id}/content/types/new`}>
          <Button>
            <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
            {t('knowledgeBase.detailPage.contentTypes.newContentType')}
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : contentTypes?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contentTypes.map((type: ContentType) => (
            <Card key={type.id} className="group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <CardDescription className="text-xs font-mono">/{type.slug}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => navigate(`/dashboard/knowledge-base/${kb.id}/content/${type.slug}`)}
                      >
                        <List className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                        {t('knowledgeBase.detailPage.contentTypes.viewItems')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(`/dashboard/knowledge-base/${kb.id}/content/types/${type.slug}`)}
                      >
                        <Pencil className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                        {t('knowledgeBase.detailPage.contentTypes.editSchema')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteDialog({ open: true, type })}
                      >
                        <Trash2 className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{type.description || t('knowledgeBase.detailPage.noDescription')}</p>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {type.field_schema?.length || 0} {t('knowledgeBase.detailPage.contentTypes.fields')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {type.field_schema?.slice(0, 5).map((field) => (
                      <span
                        key={field.slug}
                        className="text-xs px-2 py-0.5 bg-muted rounded flex items-center gap-1"
                        title={FIELD_TYPE_INFO[field.type]?.description}
                      >
                        {field.name}
                        <span className="text-muted-foreground">({field.type})</span>
                      </span>
                    ))}
                    {(type.field_schema?.length || 0) > 5 && (
                      <span className="text-xs px-2 py-0.5 text-muted-foreground">
                        +{type.field_schema!.length - 5} {t('knowledgeBase.detailPage.contentTypes.more')}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('knowledgeBase.detailPage.contentTypes.noContentTypes')}</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {t('knowledgeBase.detailPage.contentTypes.createFirst')}
            </p>
            <Link to={`/dashboard/knowledge-base/${kb.id}/content/types/new`}>
              <Button>
                <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                {t('knowledgeBase.detailPage.contentTypes.createContentType')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('knowledgeBase.detailPage.contentTypes.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('knowledgeBase.detailPage.contentTypes.deleteDescription', { name: deleteDialog.type?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Media Tab Component - manages media files (company-wide, shared across all KBs)
const MediaTab = ({ kb: _kb }: { kb: KnowledgeBase }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, isRTL } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [mediaType, setMediaType] = useState<string>('');
  const [selectedMedia, setSelectedMedia] = useState<ContentMedia | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; media: ContentMedia | null }>({
    open: false,
    media: null,
  });
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery<MediaListResponse>({
    queryKey: ['cms-media', { search, mediaType }],
    queryFn: () =>
      cmsService.getMediaList({
        search: search || undefined,
        media_type: mediaType || undefined,
      }),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => cmsService.uploadMedia(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-media'] });
      toast({ title: t('knowledgeBase.detailPage.media.fileUploaded') });
    },
    onError: (error: any) => {
      toast({
        title: t('knowledgeBase.detailPage.media.uploadFailed'),
        description: error.response?.data?.detail || t('common.errorOccurred'),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (mediaId: number) => cmsService.deleteMedia(mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-media'] });
      toast({ title: t('knowledgeBase.detailPage.media.fileDeleted') });
      setDeleteDialog({ open: false, media: null });
      setSelectedMedia(null);
    },
    onError: () => {
      toast({ title: t('knowledgeBase.detailPage.media.deleteFailed'), variant: 'destructive' });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      await uploadMutation.mutateAsync(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      await uploadMutation.mutateAsync(file);
    }
  };

  const items = data?.items || [];

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className="text-start">
          <h3 className="text-lg font-medium">{t('knowledgeBase.detailPage.media.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('knowledgeBase.detailPage.media.subtitle')}</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? (
            <Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
          )}
          {t('knowledgeBase.detailPage.media.upload')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('knowledgeBase.detailPage.media.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ltr:pl-9 rtl:pr-9"
          />
        </div>
        <Select value={mediaType || 'all'} onValueChange={(v) => setMediaType(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('knowledgeBase.detailPage.media.type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('knowledgeBase.detailPage.media.allTypes')}</SelectItem>
            <SelectItem value="image">{t('knowledgeBase.detailPage.media.images')}</SelectItem>
            <SelectItem value="audio">{t('knowledgeBase.detailPage.media.audio')}</SelectItem>
            <SelectItem value="video">{t('knowledgeBase.detailPage.media.video')}</SelectItem>
            <SelectItem value="file">{t('knowledgeBase.detailPage.media.files')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Upload Zone */}
      <div
        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">
          {t('knowledgeBase.detailPage.media.dragDrop')}{' '}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => fileInputRef.current?.click()}
          >
            {t('knowledgeBase.detailPage.media.browse')}
          </button>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('knowledgeBase.detailPage.media.supportedFormats')}
        </p>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((media) => (
            <Card
              key={media.id}
              className="group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => setSelectedMedia(media)}
            >
              <CardContent className="p-2">
                <div className="aspect-square rounded bg-muted flex items-center justify-center overflow-hidden">
                  {media.media_type === 'image' && media.url ? (
                    <img
                      src={media.thumbnail_url || media.url}
                      alt={media.alt_text || media.original_filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground">
                      <MediaIcon type={media.media_type} />
                    </div>
                  )}
                </div>
                <p className="text-xs truncate mt-2">{media.original_filename}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(media.file_size)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Image className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('knowledgeBase.detailPage.media.noMedia')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('knowledgeBase.detailPage.media.uploadFirst')}
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {t('knowledgeBase.detailPage.media.upload')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Media Detail Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MediaIcon type={selectedMedia?.media_type || 'file'} />
              {selectedMedia?.original_filename}
            </DialogTitle>
          </DialogHeader>

          {selectedMedia && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {selectedMedia.media_type === 'image' && selectedMedia.url ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.alt_text || selectedMedia.original_filename}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : selectedMedia.media_type === 'audio' && selectedMedia.url ? (
                  <audio controls className="w-full max-w-md">
                    <source src={selectedMedia.url} type={selectedMedia.mime_type} />
                  </audio>
                ) : selectedMedia.media_type === 'video' && selectedMedia.url ? (
                  <video controls className="max-w-full max-h-full">
                    <source src={selectedMedia.url} type={selectedMedia.mime_type} />
                  </video>
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center">
                    <File className="w-16 h-16 mb-2" />
                    <p>{t('knowledgeBase.detailPage.media.noPreview')}</p>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('knowledgeBase.detailPage.media.size')}</p>
                  <p>{formatFileSize(selectedMedia.file_size)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('knowledgeBase.detailPage.media.type')}</p>
                  <p>{selectedMedia.mime_type}</p>
                </div>
                {selectedMedia.width && selectedMedia.height && (
                  <div>
                    <p className="text-muted-foreground">{t('knowledgeBase.detailPage.media.dimensions')}</p>
                    <p>{selectedMedia.width} x {selectedMedia.height}</p>
                  </div>
                )}
                {selectedMedia.duration && (
                  <div>
                    <p className="text-muted-foreground">{t('knowledgeBase.detailPage.media.duration')}</p>
                    <p>{Math.round(selectedMedia.duration)}s</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">{t('knowledgeBase.detailPage.media.uploaded')}</p>
                  <p>{new Date(selectedMedia.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('knowledgeBase.detailPage.media.usedIn')}</p>
                  <p>{selectedMedia.usage_count} {t('knowledgeBase.detailPage.contentTypes.items')}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                {selectedMedia.url && (
                  <Button variant="outline" asChild>
                    <a href={selectedMedia.url} download target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                      {t('knowledgeBase.detailPage.media.download')}
                    </a>
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialog({ open: true, media: selectedMedia })}
                >
                  <Trash className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('knowledgeBase.detailPage.media.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('knowledgeBase.detailPage.media.deleteDescription', { name: deleteDialog.media?.original_filename })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.media && deleteMutation.mutate(deleteDialog.media.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Category Item Component for tree rendering
interface CategoryItemProps {
  category: ContentCategory;
  level: number;
  onEdit: (category: ContentCategory) => void;
  onDelete: (category: ContentCategory) => void;
  onAddChild: (parentId: number) => void;
}

const CategoryItem = ({ category, level, onEdit, onDelete, onAddChild }: CategoryItemProps) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded hover:bg-muted group"
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        <button
          type="button"
          className="w-5 h-5 flex items-center justify-center"
          onClick={() => hasChildren && setExpanded(!expanded)}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <span className="w-4" />
          )}
        </button>

        <FolderTree className="w-4 h-4 text-muted-foreground" />
        <span className="flex-1 font-medium">{category.name}</span>
        <span className="text-xs text-muted-foreground font-mono">/{category.slug}</span>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddChild(category.id)}>
            <Plus className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(category)}>
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => onDelete(category)}
          >
            <Trash className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {category.children!.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Categories Tab Component - manages categories scoped to this KB
const CategoriesTab = ({ kb }: { kb: KnowledgeBase }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, isRTL } = useI18n();

  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    parentId?: number;
    category?: ContentCategory;
  }>({ open: false, mode: 'create' });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    category: ContentCategory | null;
  }>({ open: false, category: null });

  const [formData, setFormData] = useState<CategoryCreate>({
    name: '',
    description: '',
    slug: '',
  });

  const { data: categories, isLoading } = useQuery<ContentCategory[]>({
    queryKey: ['cms-categories-tree', kb.id],
    queryFn: () => cmsService.getCategoryTree(kb.id),
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryCreate) => cmsService.createCategory({ ...data, knowledge_base_id: kb.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-categories-tree', kb.id] });
      toast({ title: t('knowledgeBase.detailPage.categories.categoryCreated') });
      setFormDialog({ open: false, mode: 'create' });
    },
    onError: (error: any) => {
      toast({
        title: t('knowledgeBase.detailPage.categories.createFailed'),
        description: error.response?.data?.detail || t('common.errorOccurred'),
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => cmsService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-categories-tree', kb.id] });
      toast({ title: t('knowledgeBase.detailPage.categories.categoryUpdated') });
      setFormDialog({ open: false, mode: 'create' });
    },
    onError: (error: any) => {
      toast({
        title: t('knowledgeBase.detailPage.categories.updateFailed'),
        description: error.response?.data?.detail || t('common.errorOccurred'),
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId: number) => cmsService.deleteCategory(categoryId, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-categories-tree', kb.id] });
      toast({ title: t('knowledgeBase.detailPage.categories.categoryDeleted') });
      setDeleteDialog({ open: false, category: null });
    },
    onError: (error: any) => {
      toast({
        title: t('knowledgeBase.detailPage.categories.deleteFailed'),
        description: error.response?.data?.detail || t('common.errorOccurred'),
        variant: 'destructive',
      });
    },
  });

  const openCreateDialog = (parentId?: number) => {
    setFormData({ name: '', description: '', slug: '', parent_id: parentId });
    setFormDialog({ open: true, mode: 'create', parentId });
  };

  const openEditDialog = (category: ContentCategory) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      slug: category.slug,
    });
    setFormDialog({ open: true, mode: 'edit', category });
  };

  const handleSubmit = () => {
    if (formDialog.mode === 'create') {
      createMutation.mutate({
        ...formData,
        parent_id: formDialog.parentId,
      });
    } else if (formDialog.category) {
      updateMutation.mutate({
        id: formDialog.category.id,
        data: {
          name: formData.name,
          description: formData.description,
        },
      });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className="text-start">
          <h3 className="text-lg font-medium">{t('knowledgeBase.detailPage.categories.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('knowledgeBase.detailPage.categories.subtitle')}</p>
        </div>
        <Button onClick={() => openCreateDialog()}>
          <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
          {t('knowledgeBase.detailPage.categories.addCategory')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : categories && categories.length > 0 ? (
        <Card>
          <CardContent className="pt-4">
            {categories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                level={0}
                onEdit={openEditDialog}
                onDelete={(cat) => setDeleteDialog({ open: true, category: cat })}
                onAddChild={(parentId) => openCreateDialog(parentId)}
              />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderTree className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('knowledgeBase.detailPage.categories.noCategories')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('knowledgeBase.detailPage.categories.createFirst')}
            </p>
            <Button onClick={() => openCreateDialog()}>
              <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {t('knowledgeBase.detailPage.categories.addCategory')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formDialog.open} onOpenChange={(open) => setFormDialog({ ...formDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formDialog.mode === 'create' ? t('knowledgeBase.detailPage.categories.createCategory') : t('knowledgeBase.detailPage.categories.editCategory')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('knowledgeBase.detailPage.categories.nameLabel')}</Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({
                    ...formData,
                    name,
                    slug: formDialog.mode === 'create' ? generateSlug(name) : formData.slug,
                  });
                }}
                placeholder={t('knowledgeBase.detailPage.categories.namePlaceholder')}
              />
            </div>

            {formDialog.mode === 'create' && (
              <div className="space-y-2">
                <Label>{t('knowledgeBase.detailPage.categories.slugLabel')}</Label>
                <Input
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder={t('knowledgeBase.detailPage.categories.slugPlaceholder')}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('knowledgeBase.detailPage.categories.descriptionLabel')}</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('knowledgeBase.detailPage.categories.descriptionPlaceholder')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormDialog({ open: false, mode: 'create' })}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : formDialog.mode === 'create' ? (
                t('common.create')
              ) : (
                t('common.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('knowledgeBase.detailPage.categories.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('knowledgeBase.detailPage.categories.deleteDescription', { name: deleteDialog.category?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.category && deleteMutation.mutate(deleteDialog.category.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Marketplace Tab Component - browse and copy shared content
const MarketplaceTab = ({ kb }: { kb: KnowledgeBase }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, isRTL } = useI18n();

  const [search, setSearch] = useState('');
  const [contentTypeSlug, setContentTypeSlug] = useState<string>('');
  const [copyDialog, setCopyDialog] = useState<{
    open: boolean;
    item: MarketplaceItem | null;
  }>({ open: false, item: null });

  // Fetch marketplace items
  const { data: marketplaceData, isLoading } = useQuery<MarketplaceListResponse>({
    queryKey: ['cms-marketplace', { search, contentTypeSlug }],
    queryFn: () =>
      cmsService.getMarketplaceItems(
        contentTypeSlug || undefined,
        search || undefined
      ),
  });

  // Fetch featured items
  const { data: featuredItems } = useQuery<MarketplaceItem[]>({
    queryKey: ['cms-marketplace-featured'],
    queryFn: () => cmsService.getFeaturedMarketplaceItems(6),
  });

  // Copy mutation - copies to this KB
  const copyMutation = useMutation({
    mutationFn: (originalItemId: number) => cmsService.copyFromMarketplace(originalItemId, kb.id),
    onSuccess: () => {
      toast({ title: t('knowledgeBase.detailPage.marketplace.contentCopied') });
      setCopyDialog({ open: false, item: null });
      queryClient.invalidateQueries({ queryKey: ['cms-content-items'] });
      queryClient.invalidateQueries({ queryKey: ['cms-content-types', kb.id] });
    },
    onError: (error: any) => {
      toast({
        title: t('knowledgeBase.detailPage.marketplace.copyFailed'),
        description: error.response?.data?.detail || t('common.errorOccurred'),
        variant: 'destructive',
      });
    },
  });

  const getItemTitle = (item: MarketplaceItem): string => {
    const data = item.data || {};
    return data.title || data.name || data.verse_text?.substring(0, 50) || `Item #${item.id}`;
  };

  const getItemDescription = (item: MarketplaceItem): string => {
    const data = item.data || {};
    return data.description || data.summary || data.meaning?.substring(0, 100) || '';
  };

  const items = marketplaceData?.items || [];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className="text-start">
          <h3 className="text-lg font-medium">{t('knowledgeBase.detailPage.marketplace.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('knowledgeBase.detailPage.marketplace.subtitle')}
          </p>
        </div>
      </div>

      {/* Featured Section */}
      {featuredItems && featuredItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t('knowledgeBase.detailPage.marketplace.featured')}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredItems.map((item) => (
              <Card key={item.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <Badge variant="secondary" className="text-xs">{item.content_type_name}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {item.download_count}
                    </span>
                  </div>
                  <CardTitle className="text-base mt-2">{getItemTitle(item)}</CardTitle>
                  {item.company_name && (
                    <CardDescription className="text-xs">{t('knowledgeBase.detailPage.marketplace.by')} {item.company_name}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {getItemDescription(item) || t('knowledgeBase.detailPage.noDescription')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setCopyDialog({ open: true, item })}
                  >
                    <Copy className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                    {t('knowledgeBase.detailPage.marketplace.copyToKb')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('knowledgeBase.detailPage.marketplace.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ltr:pl-9 rtl:pr-9"
          />
        </div>

        <Select
          value={contentTypeSlug || 'all'}
          onValueChange={(v) => setContentTypeSlug(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('knowledgeBase.detailPage.marketplace.contentType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('knowledgeBase.detailPage.marketplace.allTypes')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* All Items */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-xs">
                    {item.content_type_name}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {item.download_count}
                  </span>
                </div>
                <CardTitle className="text-sm mt-2 line-clamp-1">{getItemTitle(item)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {getItemDescription(item) || t('knowledgeBase.detailPage.noDescription')}
                </p>
                {item.company_name && (
                  <p className="text-xs text-muted-foreground mb-3">{t('knowledgeBase.detailPage.marketplace.by')} {item.company_name}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setCopyDialog({ open: true, item })}
                >
                  <Copy className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                  {t('knowledgeBase.detailPage.marketplace.copy')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('knowledgeBase.detailPage.marketplace.noItems')}</h3>
            <p className="text-muted-foreground text-center">
              {search
                ? t('knowledgeBase.detailPage.marketplace.noSearchResults')
                : t('knowledgeBase.detailPage.marketplace.emptyMarketplace')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Copy Confirmation Dialog */}
      <Dialog
        open={copyDialog.open}
        onOpenChange={(open) => setCopyDialog({ ...copyDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('knowledgeBase.detailPage.marketplace.copyDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('knowledgeBase.detailPage.marketplace.copyDialog.description')}
            </DialogDescription>
          </DialogHeader>

          {copyDialog.item && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">{getItemTitle(copyDialog.item)}</p>
                  <p className="text-sm text-muted-foreground">
                    {copyDialog.item.content_type_name}
                    {copyDialog.item.company_name && ` • ${t('knowledgeBase.detailPage.marketplace.by')} ${copyDialog.item.company_name}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCopyDialog({ open: false, item: null })}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => copyDialog.item && copyMutation.mutate(copyDialog.item.id)}
              disabled={copyMutation.isPending}
            >
              {copyMutation.isPending ? (
                <Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" />
              ) : (
                <Copy className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              )}
              {t('knowledgeBase.detailPage.marketplace.copyDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Settings Tab Component - includes KB settings, API tokens, and export
const SettingsTab = ({ kb, authFetch }: { kb: KnowledgeBase; authFetch: any }) => {
  const { toast } = useToast();
  const { t, isRTL } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // KB Settings state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(kb.name);
  const [description, setDescription] = useState(kb.description || '');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // API Token state
  const [tokenDialog, setTokenDialog] = useState(false);
  const [newToken, setNewToken] = useState<ApiToken | null>(null);
  const [tokenForm, setTokenForm] = useState({
    name: '',
    can_read: true,
    can_search: true,
    rate_limit: 100,
  });
  const [deleteTokenDialog, setDeleteTokenDialog] = useState<{
    open: boolean;
    token: ApiToken | null;
  }>({ open: false, token: null });

  // Export state
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exporting, setExporting] = useState(false);

  // Fetch API tokens for this KB
  const { data: tokens, isLoading: isLoadingTokens } = useQuery<ApiToken[]>({
    queryKey: ['cms-api-tokens', kb.id],
    queryFn: () => cmsService.getApiTokens(kb.id),
  });

  // Fetch exports for this KB
  const { data: exports, isLoading: isLoadingExports } = useQuery<ContentExport[]>({
    queryKey: ['cms-exports', kb.id],
    queryFn: () => cmsService.getExports(kb.id),
  });

  // KB mutations
  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await authFetch(`/api/v1/knowledge-bases/${kb.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update knowledge base');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base', kb.id] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] });
      toast({ title: 'Knowledge base updated' });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await authFetch(`/api/v1/knowledge-bases/${kb.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete knowledge base');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] });
      toast({ title: 'Knowledge base deleted' });
      navigate('/dashboard/knowledge-base/manage');
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete', description: error.message, variant: 'destructive' });
    },
  });

  // Token mutations
  const createTokenMutation = useMutation({
    mutationFn: () => cmsService.createApiToken({ ...tokenForm, knowledge_base_id: kb.id }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cms-api-tokens', kb.id] });
      setNewToken(data);
      setTokenForm({ name: '', can_read: true, can_search: true, rate_limit: 100 });
      setTokenDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create token',
        description: error.response?.data?.detail || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const deleteTokenMutation = useMutation({
    mutationFn: (tokenId: number) => cmsService.deleteApiToken(tokenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-api-tokens', kb.id] });
      toast({ title: 'Token revoked' });
      setDeleteTokenDialog({ open: false, token: null });
    },
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: (tokenId: number) => cmsService.regenerateApiToken(tokenId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cms-api-tokens', kb.id] });
      setNewToken(data);
      toast({ title: 'Token regenerated' });
    },
  });

  // Export mutations
  const createExportMutation = useMutation({
    mutationFn: (format: ExportFormat) => cmsService.createExport({ format, knowledge_base_id: kb.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-exports', kb.id] });
      toast({ title: 'Export started' });
      setExporting(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to start export',
        description: error.response?.data?.detail || 'An error occurred',
        variant: 'destructive',
      });
      setExporting(false);
    },
  });

  const downloadExportMutation = useMutation({
    mutationFn: (exportId: number) => cmsService.downloadExport(exportId),
    onSuccess: (data) => {
      window.open(data.download_url, '_blank');
    },
    onError: () => {
      toast({ title: 'Failed to get download link', variant: 'destructive' });
    },
  });

  const deleteExportMutation = useMutation({
    mutationFn: (exportId: number) => cmsService.deleteExport(exportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-exports', kb.id] });
      toast({ title: 'Export deleted' });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ name, description });
  };

  const handleExport = () => {
    setExporting(true);
    createExportMutation.mutate(exportFormat);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t('common.copiedToClipboard') });
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">{t('knowledgeBase.detailPage.settings.general')}</TabsTrigger>
          <TabsTrigger value="api-tokens" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            {t('knowledgeBase.detailPage.settings.apiTokens')}
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            {t('knowledgeBase.detailPage.settings.export')}
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6 max-w-2xl">
          <div>
            <h3 className="text-lg font-medium mb-4">{t('knowledgeBase.detailPage.settings.kbSettings')}</h3>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('knowledgeBase.detailPage.settings.nameLabel')}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('knowledgeBase.detailPage.settings.namePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="description">{t('knowledgeBase.detailPage.settings.descriptionLabel')}</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('knowledgeBase.detailPage.settings.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" /> : null}
                    {t('common.saveChanges')}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('knowledgeBase.detailPage.settings.nameLabel')}</p>
                      <p className="text-lg">{kb.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('knowledgeBase.detailPage.settings.descriptionLabel')}</p>
                      <p>{kb.description || t('knowledgeBase.detailPage.noDescription')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('knowledgeBase.detailPage.settings.type')}</p>
                      <p className="capitalize">{kb.type}</p>
                    </div>
                    {kb.chroma_collection_name && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{t('knowledgeBase.detailPage.settings.chromaCollection')}</p>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{kb.chroma_collection_name}</code>
                      </div>
                    )}
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Pencil className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                      {t('knowledgeBase.detailPage.settings.editSettings')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-2 text-destructive">{t('knowledgeBase.detailPage.settings.dangerZone.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('knowledgeBase.detailPage.settings.dangerZone.description')}
            </p>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                {t('knowledgeBase.detailPage.settings.dangerZone.deleteKb')}
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('knowledgeBase.detailPage.settings.dangerZone.deleteConfirm.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('knowledgeBase.detailPage.settings.dangerZone.deleteConfirm.description')}
                    <ul className="list-disc list-inside mt-2 ltr:pl-2 rtl:pr-2">
                      <li>{t('knowledgeBase.detailPage.settings.dangerZone.deleteConfirm.items.documents')}</li>
                      <li>{t('knowledgeBase.detailPage.settings.dangerZone.deleteConfirm.items.contentTypes')}</li>
                      <li>{t('knowledgeBase.detailPage.settings.dangerZone.deleteConfirm.items.categories')}</li>
                      <li>{t('knowledgeBase.detailPage.settings.dangerZone.deleteConfirm.items.collection')}</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>

        {/* API Tokens Tab */}
        <TabsContent value="api-tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('knowledgeBase.detailPage.settings.tokens.title')}</CardTitle>
                  <CardDescription>
                    {t('knowledgeBase.detailPage.settings.tokens.description')}
                  </CardDescription>
                </div>
                <Button onClick={() => setTokenDialog(true)}>
                  <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                  {t('knowledgeBase.detailPage.settings.tokens.createToken')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTokens ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : tokens && tokens.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('knowledgeBase.detailPage.settings.tokens.name')}</TableHead>
                      <TableHead>{t('knowledgeBase.detailPage.settings.tokens.token')}</TableHead>
                      <TableHead>{t('knowledgeBase.detailPage.settings.tokens.permissions')}</TableHead>
                      <TableHead>{t('knowledgeBase.detailPage.settings.tokens.rateLimit')}</TableHead>
                      <TableHead>{t('knowledgeBase.detailPage.settings.tokens.status')}</TableHead>
                      <TableHead>{t('knowledgeBase.detailPage.settings.tokens.usage')}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map((token) => (
                      <TableRow key={token.id}>
                        <TableCell className="font-medium">{token.name || t('common.unnamed')}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {token.token}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {token.can_read && <Badge variant="secondary">{t('knowledgeBase.detailPage.settings.tokens.read')}</Badge>}
                            {token.can_search && <Badge variant="secondary">{t('knowledgeBase.detailPage.settings.tokens.search')}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{token.rate_limit}/{t('common.min')}</TableCell>
                        <TableCell>
                          <Badge variant={token.is_active ? 'default' : 'secondary'}>
                            {token.is_active ? t('knowledgeBase.detailPage.settings.tokens.active') : t('knowledgeBase.detailPage.settings.tokens.inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {token.request_count} {t('knowledgeBase.detailPage.settings.tokens.requests')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => regenerateTokenMutation.mutate(token.id)}
                              title={t('knowledgeBase.detailPage.settings.tokens.regenerate')}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => setDeleteTokenDialog({ open: true, token })}
                              title={t('knowledgeBase.detailPage.settings.tokens.revoke')}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>{t('knowledgeBase.detailPage.settings.tokens.noTokens')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('knowledgeBase.detailPage.settings.exportSection.title')}</CardTitle>
              <CardDescription>{t('knowledgeBase.detailPage.settings.exportSection.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label>{t('knowledgeBase.detailPage.settings.exportSection.format')}</Label>
                  <Select
                    value={exportFormat}
                    onValueChange={(v: ExportFormat) => setExportFormat(v)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileJson className="w-4 h-4" />
                          JSON
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4" />
                          CSV
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleExport} disabled={exporting}>
                  {exporting ? (
                    <Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                  )}
                  {t('knowledgeBase.detailPage.settings.exportSection.startExport')}
                </Button>
              </div>

              {/* Export History */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">{t('knowledgeBase.detailPage.settings.exportSection.history')}</h4>
                {isLoadingExports ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : exports && exports.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('knowledgeBase.detailPage.settings.exportSection.format')}</TableHead>
                        <TableHead>{t('knowledgeBase.detailPage.settings.tokens.status')}</TableHead>
                        <TableHead>{t('knowledgeBase.detailPage.settings.exportSection.items')}</TableHead>
                        <TableHead>{t('knowledgeBase.detailPage.media.size')}</TableHead>
                        <TableHead>{t('common.date')}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exports.map((exp) => (
                        <TableRow key={exp.id}>
                          <TableCell>
                            {exp.format === 'json' ? (
                              <FileJson className="w-4 h-4" />
                            ) : (
                              <FileSpreadsheet className="w-4 h-4" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                exp.status === 'completed'
                                  ? 'default'
                                  : exp.status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {t(`knowledgeBase.detailPage.settings.exportSection.status.${exp.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>{exp.item_count || '-'}</TableCell>
                          <TableCell>
                            {exp.file_size
                              ? `${(exp.file_size / 1024).toFixed(1)} KB`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(exp.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {exp.status === 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => downloadExportMutation.mutate(exp.id)}
                                  title={t('knowledgeBase.detailPage.settings.exportSection.download')}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => deleteExportMutation.mutate(exp.id)}
                                title={t('knowledgeBase.detailPage.settings.exportSection.delete')}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Download className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{t('knowledgeBase.detailPage.settings.exportSection.noExports')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Token Dialog */}
      <Dialog open={tokenDialog} onOpenChange={setTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('knowledgeBase.detailPage.settings.tokens.createDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('knowledgeBase.detailPage.settings.tokens.createDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('knowledgeBase.detailPage.settings.tokens.name')}</Label>
              <Input
                value={tokenForm.name}
                onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })}
                placeholder={t('knowledgeBase.detailPage.settings.tokens.createDialog.namePlaceholder')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t('knowledgeBase.detailPage.settings.tokens.createDialog.readPermission')}</Label>
                <p className="text-sm text-muted-foreground">{t('knowledgeBase.detailPage.settings.tokens.createDialog.readDescription')}</p>
              </div>
              <Switch
                checked={tokenForm.can_read}
                onCheckedChange={(v) => setTokenForm({ ...tokenForm, can_read: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t('knowledgeBase.detailPage.settings.tokens.createDialog.searchPermission')}</Label>
                <p className="text-sm text-muted-foreground">{t('knowledgeBase.detailPage.settings.tokens.createDialog.searchDescription')}</p>
              </div>
              <Switch
                checked={tokenForm.can_search}
                onCheckedChange={(v) => setTokenForm({ ...tokenForm, can_search: v })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('knowledgeBase.detailPage.settings.tokens.createDialog.rateLimitLabel')}</Label>
              <Input
                type="number"
                value={tokenForm.rate_limit}
                onChange={(e) =>
                  setTokenForm({ ...tokenForm, rate_limit: parseInt(e.target.value) || 100 })
                }
                min={1}
                max={1000}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTokenDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => createTokenMutation.mutate()}
              disabled={!tokenForm.name || createTokenMutation.isPending}
            >
              {createTokenMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('knowledgeBase.detailPage.settings.tokens.createDialog.create')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Token Display Dialog */}
      <Dialog open={!!newToken} onOpenChange={(open) => !open && setNewToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              {t('knowledgeBase.detailPage.settings.tokens.tokenCreated.title')}
            </DialogTitle>
            <DialogDescription>
              {t('knowledgeBase.detailPage.settings.tokens.tokenCreated.description')}
            </DialogDescription>
          </DialogHeader>

          {newToken && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <code className="text-sm break-all">{newToken.token}</code>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => copyToClipboard(newToken.token)}
              >
                <Copy className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                {t('knowledgeBase.detailPage.settings.tokens.tokenCreated.copy')}
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setNewToken(null)}>{t('knowledgeBase.detailPage.settings.tokens.tokenCreated.done')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Token Dialog */}
      <AlertDialog
        open={deleteTokenDialog.open}
        onOpenChange={(open) => setDeleteTokenDialog({ ...deleteTokenDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('knowledgeBase.detailPage.settings.tokens.revokeDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('knowledgeBase.detailPage.settings.tokens.revokeDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteTokenDialog.token && deleteTokenMutation.mutate(deleteTokenDialog.token.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTokenMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('knowledgeBase.detailPage.settings.tokens.revoke')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Main Knowledge Base Detail Page
const KnowledgeBaseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { authFetch } = useAuth();
  const { t, isRTL } = useI18n();
  const navigate = useNavigate();

  const { data: kb, isLoading, error } = useQuery<KnowledgeBase>({
    queryKey: ['knowledge-base', id],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/knowledge-bases/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch knowledge base');
      }
      return response.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !kb) {
    return (
      <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">{t('knowledgeBase.detailPage.notFound')}</h3>
            <p className="text-muted-foreground mb-4">{t('knowledgeBase.detailPage.notFoundDescription')}</p>
            <Link to="/dashboard/knowledge-base/manage">
              <Button>
                <ArrowLeft className="w-4 h-4 ltr:mr-2 rtl:ml-2 rtl:rotate-180" />
                {t('knowledgeBase.detailPage.backToList')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard/knowledge-base/manage">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {kb.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{kb.name}</h1>
            <p className="text-muted-foreground">{kb.description || t('knowledgeBase.detailPage.noDescription')}</p>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList className="flex flex-wrap gap-2 h-auto bg-transparent p-0">
          <TabsTrigger
            value="documents"
            className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-border data-[state=active]:border-primary hover:bg-muted transition-colors"
          >
            <FileText className="w-4 h-4" />
            {t('knowledgeBase.detailPage.tabs.documents')}
          </TabsTrigger>
          <TabsTrigger
            value="content"
            className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-border data-[state=active]:border-primary hover:bg-muted transition-colors"
          >
            <Database className="w-4 h-4" />
            {t('knowledgeBase.detailPage.tabs.contentTypes')}
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-border data-[state=active]:border-primary hover:bg-muted transition-colors"
          >
            <Image className="w-4 h-4" />
            {t('knowledgeBase.detailPage.tabs.media')}
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-border data-[state=active]:border-primary hover:bg-muted transition-colors"
          >
            <FolderTree className="w-4 h-4" />
            {t('knowledgeBase.detailPage.tabs.categories')}
          </TabsTrigger>
          <TabsTrigger
            value="marketplace"
            className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-border data-[state=active]:border-primary hover:bg-muted transition-colors"
          >
            <Store className="w-4 h-4" />
            {t('knowledgeBase.detailPage.tabs.marketplace')}
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-border data-[state=active]:border-primary hover:bg-muted transition-colors"
          >
            <Settings className="w-4 h-4" />
            {t('knowledgeBase.detailPage.tabs.settings')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <DocumentsTab kb={kb} authFetch={authFetch} />
        </TabsContent>

        <TabsContent value="content">
          <ContentTab kb={kb} />
        </TabsContent>

        <TabsContent value="media">
          <MediaTab kb={kb} />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTab kb={kb} />
        </TabsContent>

        <TabsContent value="marketplace">
          <MarketplaceTab kb={kb} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab kb={kb} authFetch={authFetch} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgeBaseDetailPage;
