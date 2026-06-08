import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateImage, ImageGenerationParams } from '@/services/aiImageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Loader2, Download, Image as ImageIcon } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

const AIImageGeneratorPage: React.FC = () => {
  const { t, isRTL } = useI18n();
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'openai' | 'gemini'>('openai');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('standard');
  const [style, setStyle] = useState('vivid');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      const params: ImageGenerationParams = {
        prompt,
        provider,
        ...(provider === 'openai' && { size, quality, style }),
      };
      return generateImage(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-images'] });
      toast({ title: t('aiImageGenerator.toasts.imageGeneratedSuccess') });
    },
    onError: (error: any) => {
      toast({
        title: t('aiImageGenerator.toasts.imageGeneratedError'),
        description: error?.response?.data?.detail || 'Failed to generate image',
        variant: 'destructive'
      });
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
    <div className="min-h-full app-surface" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header bar */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="px-6 py-6">
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 bg-clip-text text-transparent leading-tight">
                {t('aiImageGenerator.title')}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('aiImageGenerator.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generator Form */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className={`flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Sparkles className="h-4 w-4 text-pink-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-white">{t('aiImageGenerator.generateImage')}</span>
            </div>
            <div className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Provider Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">AI Provider</Label>
                  <Select value={provider} onValueChange={(v: 'openai' | 'gemini') => setProvider(v)}>
                    <SelectTrigger className="h-9 dark:bg-slate-800 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">OpenAI DALL-E 3</span>
                          <span className="text-xs text-slate-500">(Recommended)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="gemini">
                        <span className="font-medium">Google Imagen 3</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* OpenAI Options */}
                {provider === 'openai' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Size</Label>
                      <Select value={size} onValueChange={setSize}>
                        <SelectTrigger className="h-9 dark:bg-slate-800 dark:border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1024x1024">Square</SelectItem>
                          <SelectItem value="1792x1024">Landscape</SelectItem>
                          <SelectItem value="1024x1792">Portrait</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Quality</Label>
                      <Select value={quality} onValueChange={setQuality}>
                        <SelectTrigger className="h-9 dark:bg-slate-800 dark:border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="hd">HD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Style</Label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger className="h-9 dark:bg-slate-800 dark:border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vivid">Vivid</SelectItem>
                          <SelectItem value="natural">Natural</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Prompt Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="prompt" className="text-xs font-medium text-slate-600 dark:text-slate-400">{t('aiImageGenerator.yourPrompt')}</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('aiImageGenerator.promptPlaceholder')}
                    rows={6}
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none text-sm"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('aiImageGenerator.beSpecific')}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={mutation.isPending || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white h-9 text-sm"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('aiImageGenerator.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('aiImageGenerator.generateImage')}
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Result Display */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className={`flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <ImageIcon className="h-4 w-4 text-pink-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-white">{t('aiImageGenerator.generatedResult')}</span>
            </div>
            <div className="p-5">
              {mutation.isPending && (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center">{t('aiImageGenerator.creatingMasterpiece')}</p>
                </div>
              )}

              {mutation.isSuccess && mutation.data && (
                <div className="space-y-3">
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img
                      src={mutation.data.image_url}
                      alt={mutation.data.prompt}
                      className="w-full h-auto"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                      <Button
                        onClick={handleDownload}
                        className="bg-white/90 hover:bg-white text-gray-900 shadow h-8 text-xs px-3"
                      >
                        <Download className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                        {t('common.download')}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{t('aiImageGenerator.prompt')}:</span> {mutation.data.prompt}
                    </p>
                  </div>
                </div>
              )}

              {!mutation.isPending && !mutation.isSuccess && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-4">
                    <ImageIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">{t('aiImageGenerator.noImageYet')}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{t('aiImageGenerator.enterPromptToGenerate')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIImageGeneratorPage;
