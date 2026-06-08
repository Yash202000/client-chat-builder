
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getImages, deleteImage } from '@/services/aiImageService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Download, Maximize2, Image as ImageIcon, Images, Loader2 } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AIImageGalleryPage: React.FC = () => {
  const { t, isRTL } = useI18n();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: images, isLoading } = useQuery({ queryKey: ['ai-images'], queryFn: getImages });

  const deleteMutation = useMutation({
    mutationFn: deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-images'] });
      toast({ title: t('aiImageGallery.toasts.imageDeletedSuccess') });
    },
    onError: () => {
      toast({ title: t('aiImageGallery.toasts.imageDeletedError'), variant: 'destructive' });
    },
  });

  const handleDelete = (imageId: number) => {
    deleteMutation.mutate(imageId);
  };

  const handlePreview = (image: any) => {
    setSelectedImage(image);
    setIsPreviewOpen(true);
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-image-${Date.now()}.png`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-full app-surface" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header bar */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="px-6 py-6">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-600 flex items-center justify-center flex-shrink-0">
                <Images className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 bg-clip-text text-transparent leading-tight">
                  {t('aiImageGallery.title')}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('aiImageGallery.subtitle')}</p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
              {t('aiImageGallery.imagesCount', { count: images?.length || 0 })}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {images && images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image: any) => (
              <div
                key={image.id}
                className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-pink-200 dark:hover:border-pink-700/50 hover:shadow-md transition-all duration-200"
              >
                <div className="aspect-square relative overflow-hidden cursor-pointer" onClick={() => handlePreview(image)}>
                  <img
                    src={image.image_url}
                    alt={image.prompt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-xs line-clamp-2">{image.prompt}</p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="bg-white/90 hover:bg-white shadow h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(image);
                      }}
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="p-2.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(image.image_url)}
                    className="h-7 px-2 text-xs text-slate-600 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400"
                  >
                    <Download className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t('common.download')}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-white">
                          {t('aiImageGallery.deleteDialogTitle')}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-slate-400">
                          {t('aiImageGallery.deleteDialogDescription')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="dark:border-slate-700 dark:text-white dark:hover:bg-slate-800">{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(image.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Trash2 className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                          {t('common.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-4">
              <Images className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">{t('aiImageGallery.noImagesYet')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">{t('aiImageGallery.generateToSee')}</p>
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className={`dark:text-white flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <ImageIcon className="h-4 w-4 text-pink-500" />
              {t('aiImageGallery.imagePreview')}
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4 pt-4">
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.prompt}
                  className="w-full h-auto"
                />
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{t('aiImageGallery.prompt')}:</span> {selectedImage.prompt}
                </p>
              </div>
              <Button
                onClick={() => handleDownload(selectedImage.image_url)}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white h-9 text-sm"
              >
                <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('aiImageGallery.downloadImage')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIImageGalleryPage;
