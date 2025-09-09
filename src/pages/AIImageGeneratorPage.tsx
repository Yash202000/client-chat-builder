
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateImage } from '@/services/aiImageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const AIImageGeneratorPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => generateImage(prompt, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-images'] });
      toast({ title: 'Image generated successfully!' });
    },
    onError: () => {
      toast({ title: 'Error generating image', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Image Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="prompt">Prompt</label>
              <Input
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a prompt for the image"
              />
            </div>
            <Button type="submit" disabled={mutation.isLoading}>
              {mutation.isLoading ? 'Generating...' : 'Generate Image'}
            </Button>
          </form>
          {mutation.isSuccess && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Generated Image:</h3>
              <img src={mutation.data.image_url} alt={mutation.data.prompt} className="max-w-full h-auto mt-2" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIImageGeneratorPage;
