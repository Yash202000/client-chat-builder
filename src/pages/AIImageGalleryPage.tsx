
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getImages, deleteImage } from '@/services/aiImageService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Download, Maximize2, Image as ImageIcon } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: images, isLoading } = useQuery({ queryKey: ['ai-images'], queryFn: getImages });

  const deleteMutation = useMutation({
    mutationFn: deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-images'] });
      toast({ title: 'Image deleted successfully!' });
    },
    onError: () => {
      toast({ title: 'Error deleting image', variant: 'destructive' });
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
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600 dark:border-pink-400"></div>
          <span>Loading gallery...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
          🖼️ AI Image Gallery
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Browse and manage your AI-generated images</p>
      </header>

      <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <CardTitle className="dark:text-white flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            Your Collection
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            {images?.length || 0} images in your gallery
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {images && images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((image: any) => (
                <div
                  key={image.id}
                  className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-square relative overflow-hidden cursor-pointer" onClick={() => handlePreview(image)}>
                    <img
                      src={image.image_url}
                      alt={image.prompt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm line-clamp-2">{image.prompt}</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="bg-white/90 hover:bg-white shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(image);
                        }}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(image.image_url)}
                      className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="dark:text-white">Delete this image?</AlertDialogTitle>
                          <AlertDialogDescription className="dark:text-gray-400">
                            This action cannot be undone. This will permanently delete the image from your gallery.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(image.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/50 dark:to-rose-900/50 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="h-10 w-10 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">No images yet</h3>
              <p className="text-gray-500 dark:text-gray-400">Generate some images to see them here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Image Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.prompt}
                  className="w-full h-auto"
                />
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold dark:text-white">Prompt:</span> {selectedImage.prompt}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownload(selectedImage.image_url)}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Image
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIImageGalleryPage;
