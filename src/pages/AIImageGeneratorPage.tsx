
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateImage } from '@/services/aiImageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Loader2, Download, Image as ImageIcon } from 'lucide-react';

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
    if (prompt.trim()) {
      mutation.mutate();
    }
  };

  const handleDownload = () => {
    if (mutation.data?.image_url) {
      const link = document.createElement('a');
      link.href = mutation.data.image_url;
      link.download = `generated-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
          🎨 AI Image Generator
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Create stunning images from text descriptions using AI</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generator Form */}
        <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <CardTitle className="dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              Generate Image
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Describe what you want to create
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="prompt" className="dark:text-gray-300">Your Prompt</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A futuristic city at sunset with flying cars, highly detailed, cyberpunk style"
                  rows={6}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-2"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Be specific and descriptive for better results
                </p>
              </div>
              <Button
                type="submit"
                disabled={mutation.isPending || !prompt.trim()}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Image
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result Display */}
        <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <CardTitle className="dark:text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              Generated Result
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {mutation.isPending && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-pink-200 dark:border-pink-900/50 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-20 h-20 border-4 border-pink-600 dark:border-pink-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-center">Creating your masterpiece...</p>
              </div>
            )}

            {mutation.isSuccess && mutation.data && (
              <div className="space-y-4">
                <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img
                    src={mutation.data.image_url}
                    alt={mutation.data.prompt}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      onClick={handleDownload}
                      variant="secondary"
                      size="sm"
                      className="bg-white/90 hover:bg-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold dark:text-white">Prompt:</span> {mutation.data.prompt}
                  </p>
                </div>
              </div>
            )}

            {!mutation.isPending && !mutation.isSuccess && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/50 dark:to-rose-900/50 rounded-full flex items-center justify-center mb-4">
                  <ImageIcon className="h-10 w-10 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">No image yet</h3>
                <p className="text-gray-500 dark:text-gray-400">Enter a prompt and click generate to create an image</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIImageGeneratorPage;
