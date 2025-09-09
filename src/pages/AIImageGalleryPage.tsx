
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getImages, deleteImage } from '@/services/aiImageService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const AIImageGalleryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Image Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images?.map((image: any) => (
              <div key={image.id} className="relative group">
                <img src={image.image_url} alt={image.prompt} className="w-full h-auto rounded-lg" />
                <div className="absolute top-2 right-2">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(image.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIImageGalleryPage;
