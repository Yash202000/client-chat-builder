import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  ArrowLeft,
  Upload,
  Search,
  Trash,
  Image,
  Music,
  Video,
  File,
  Loader2,
  X,
  Download,
} from 'lucide-react';
import * as cmsService from '@/services/cmsService';
import { ContentMedia, MediaListResponse, MediaType } from '@/types/cms';
import { useToast } from '@/hooks/use-toast';

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

const MediaLibraryPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
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
      toast({ title: 'File uploaded' });
    },
    onError: (error: any) => {
      toast({
        title: 'Upload failed',
        description: error.response?.data?.detail || 'An error occurred',
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
      toast({ title: 'File deleted' });
      setDeleteDialog({ open: false, media: null });
      setSelectedMedia(null);
    },
    onError: () => {
      toast({ title: 'Failed to delete file', variant: 'destructive' });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      await uploadMutation.mutateAsync(file);
    }

    // Reset file input
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/cms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Media Library</h1>
            <p className="text-muted-foreground">Manage your images, audio, and files</p>
          </div>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Upload
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={mediaType || 'all'} onValueChange={(v) => setMediaType(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="file">Files</SelectItem>
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
          Drag and drop files here, or{' '}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => fileInputRef.current?.click()}
          >
            browse
          </button>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports images, audio, video, and documents
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
            <h3 className="text-lg font-medium mb-2">No media files</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload your first file to get started.
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
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
                    <p>No preview available</p>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Size</p>
                  <p>{formatFileSize(selectedMedia.file_size)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p>{selectedMedia.mime_type}</p>
                </div>
                {selectedMedia.width && selectedMedia.height && (
                  <div>
                    <p className="text-muted-foreground">Dimensions</p>
                    <p>
                      {selectedMedia.width} × {selectedMedia.height}
                    </p>
                  </div>
                )}
                {selectedMedia.duration && (
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p>{Math.round(selectedMedia.duration)}s</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Uploaded</p>
                  <p>{new Date(selectedMedia.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Used in</p>
                  <p>{selectedMedia.usage_count} items</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                {selectedMedia.url && (
                  <Button variant="outline" asChild>
                    <a href={selectedMedia.url} download target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialog({ open: true, media: selectedMedia })}
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
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
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.media?.original_filename}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.media && deleteMutation.mutate(deleteDialog.media.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MediaLibraryPage;
