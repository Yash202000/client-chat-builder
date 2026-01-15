
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
import { useI18n } from '@/hooks/useI18n';

const AIImageGeneratorPage: React.FC = () => {
  const { t, isRTL } = useI18n();
  const [prompt, setPrompt] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => generateImage(prompt, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-images'] });
      toast({ title: t('aiImageGenerator.toasts.imageGeneratedSuccess') });
    },
    onError: () => {
      toast({ title: t('aiImageGenerator.toasts.imageGeneratedError'), variant: 'destructive' });
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
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-all" />
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-xl shadow-pink-500/25">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            {t('aiImageGenerator.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('aiImageGenerator.subtitle')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generator Form */}
        <Card className="rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800/90 overflow-hidden">
          <CardHeader className="border-b border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800 dark:to-slate-900/80">
            <CardTitle className={`dark:text-white flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40">
                <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              {t('aiImageGenerator.generateImage')}
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              {t('aiImageGenerator.describeWhatYouWant')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-sm font-medium dark:text-gray-300">{t('aiImageGenerator.yourPrompt')}</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('aiImageGenerator.promptPlaceholder')}
                  rows={6}
                  className="rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('aiImageGenerator.beSpecific')}
                </p>
              </div>
              <Button
                type="submit"
                disabled={mutation.isPending || !prompt.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 transition-all"
                size="lg"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className={`h-5 w-5 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('aiImageGenerator.generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('aiImageGenerator.generateImage')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result Display */}
        <Card className="rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800/90 overflow-hidden">
          <CardHeader className="border-b border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800 dark:to-slate-900/80">
            <CardTitle className={`dark:text-white flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40">
                <ImageIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              {t('aiImageGenerator.generatedResult')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {mutation.isPending && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full blur-xl opacity-30 animate-pulse" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-pink-500/25">
                    <Loader2 className="h-10 w-10 text-white animate-spin" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-center font-medium">{t('aiImageGenerator.creatingMasterpiece')}</p>
              </div>
            )}

            {mutation.isSuccess && mutation.data && (
              <div className="space-y-4">
                <div className="relative group rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700/60 shadow-lg">
                  <img
                    src={mutation.data.image_url}
                    alt={mutation.data.prompt}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                    <Button
                      onClick={handleDownload}
                      className="rounded-xl bg-white/90 hover:bg-white text-gray-900 shadow-lg"
                      size="sm"
                    >
                      <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('common.download')}
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl border border-pink-200/50 dark:border-pink-700/30">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-pink-700 dark:text-pink-300">{t('aiImageGenerator.prompt')}:</span> {mutation.data.prompt}
                  </p>
                </div>
              </div>
            )}

            {!mutation.isPending && !mutation.isSuccess && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full blur-xl opacity-30" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-pink-500/25">
                    <ImageIcon className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{t('aiImageGenerator.noImageYet')}</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs">{t('aiImageGenerator.enterPromptToGenerate')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIImageGeneratorPage;
