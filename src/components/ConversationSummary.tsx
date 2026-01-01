import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, ArrowLeft, Clock, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface ConversationSummaryProps {
  sessionId: string;
  onBack: () => void;
}

interface SummaryResponse {
  summary: string | null;
  generated_at: string | null;
  exists: boolean;
}

export const ConversationSummary: React.FC<ConversationSummaryProps> = ({ sessionId, onBack }) => {
  const { t } = useTranslation();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  // Fetch existing summary
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery<SummaryResponse>({
    queryKey: ['conversationSummary', sessionId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/conversations/${encodeURIComponent(sessionId)}/summary`);
      if (!response.ok) throw new Error('Failed to fetch summary');
      return response.json();
    },
    enabled: !!sessionId,
  });

  // Generate summary mutation
  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await authFetch(`/api/v1/conversations/${encodeURIComponent(sessionId)}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate summary');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversationSummary', sessionId] });
      toast({
        title: t('conversations.summary.generated', { defaultValue: 'Summary Generated' }),
        description: t('conversations.summary.generatedDesc', { defaultValue: 'AI summary has been created for this conversation.' }),
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('conversations.summary.error', { defaultValue: 'Error' }),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="h-full flex flex-col card-shadow-lg bg-white dark:bg-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 flex-shrink-0 py-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8 hover:bg-white/50 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-base dark:text-white">
                {t('conversations.summary.title', { defaultValue: 'AI Summary' })}
              </CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-5">
        {isLoadingSummary ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">
                {t('conversations.summary.loading', { defaultValue: 'Loading summary...' })}
              </p>
            </div>
          </div>
        ) : summaryData?.exists && summaryData.summary ? (
          <div className="space-y-4">
            {/* Summary Content */}
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    {t('conversations.summary.conversationSummary', { defaultValue: 'Conversation Summary' })}
                  </h3>
                  {summaryData.generated_at && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('conversations.summary.generatedAt', {
                        defaultValue: 'Generated {{time}}',
                        time: formatDate(summaryData.generated_at)
                      })}
                    </p>
                  )}
                </div>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-full">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {summaryData.summary}
                </p>
              </div>
            </div>

            {/* Regenerate Button */}
            <Button
              onClick={() => generateSummaryMutation.mutate()}
              disabled={generateSummaryMutation.isPending}
              variant="outline"
              className="w-full bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300"
            >
              {generateSummaryMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('conversations.summary.regenerating', { defaultValue: 'Regenerating...' })}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('conversations.summary.regenerate', { defaultValue: 'Regenerate Summary' })}
                </>
              )}
            </Button>
          </div>
        ) : (
          /* No Summary - Show Generate Button */
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="text-center max-w-xs">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 mb-4">
                <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">
                {t('conversations.summary.noSummary', { defaultValue: 'No Summary Yet' })}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {t('conversations.summary.noSummaryDesc', {
                  defaultValue: 'Generate an AI-powered summary of this conversation to quickly understand the key points discussed.'
                })}
              </p>
              <Button
                onClick={() => generateSummaryMutation.mutate()}
                disabled={generateSummaryMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
              >
                {generateSummaryMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t('conversations.summary.generating', { defaultValue: 'Generating...' })}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('conversations.summary.generate', { defaultValue: 'Generate Summary' })}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
