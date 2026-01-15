
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getImages, deleteImage } from '@/services/aiImageService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-pink-500/25">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          </div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">{t('aiImageGallery.loadingGallery')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-all" />
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-xl shadow-pink-500/25">
            <Images className="h-8 w-8 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            {t('aiImageGallery.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('aiImageGallery.subtitle')}</p>
        </div>
      </header>

      <Card className="rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800/90 overflow-hidden">
        <CardHeader className="border-b border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800 dark:to-slate-900/80">
          <CardTitle className={`dark:text-white flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40">
              <ImageIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            {t('aiImageGallery.yourCollection')}
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300">
              {t('aiImageGallery.imagesCount', { count: images?.length || 0 })}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {images && images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((image: any) => (
                <div
                  key={image.id}
                  className="group relative rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50 hover:shadow-xl hover:shadow-pink-500/10 hover:border-pink-200 dark:hover:border-pink-700/50 transition-all duration-300"
                >
                  <div className="aspect-square relative overflow-hidden cursor-pointer" onClick={() => handlePreview(image)}>
                    <img
                      src={image.image_url}
                      alt={image.prompt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm line-clamp-2">{image.prompt}</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-lg bg-white/90 hover:bg-white shadow-lg h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(image);
                        }}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-700/60 bg-white/50 dark:bg-slate-900/30">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(image.image_url)}
                      className="rounded-lg dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:border-pink-300 hover:bg-pink-50 dark:hover:border-pink-700 dark:hover:bg-pink-900/30 transition-colors"
                    >
                      <Download className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t('common.download')}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className={`dark:text-white flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            {t('aiImageGallery.deleteDialogTitle')}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="dark:text-gray-400">
                            {t('aiImageGallery.deleteDialogDescription')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className={`pt-4 border-t border-slate-200/80 dark:border-slate-700/60 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <AlertDialogCancel className="rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(image.id)}
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
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
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full blur-xl opacity-30" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-pink-500/25">
                  <Images className="h-12 w-12 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('aiImageGallery.noImagesYet')}</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">{t('aiImageGallery.generateToSee')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
          <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
            <DialogTitle className={`dark:text-white flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40">
                <ImageIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                {t('aiImageGallery.imagePreview')}
              </span>
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4 pt-4">
              <div className="rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700/60 shadow-lg">
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.prompt}
                  className="w-full h-auto"
                />
              </div>
              <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl border border-pink-200/50 dark:border-pink-700/30">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-pink-700 dark:text-pink-300">{t('aiImageGallery.prompt')}:</span> {selectedImage.prompt}
                </p>
              </div>
              <Button
                onClick={() => handleDownload(selectedImage.image_url)}
                className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg shadow-pink-500/25"
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
