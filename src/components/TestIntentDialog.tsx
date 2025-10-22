import React, { useState } from 'react';
import { Send, Sparkles, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TestIntentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId?: number;
}

export const TestIntentDialog: React.FC<TestIntentDialogProps> = ({
  open,
  onOpenChange,
  workflowId,
}) => {
  const [testMessage, setTestMessage] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { authFetch } = useAuth();

  const handleTest = async () => {
    if (!testMessage.trim() || !workflowId) return;

    setTesting(true);
    setResult(null);

    try {
      const response = await authFetch(`/api/v1/workflows/${workflowId}/test-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage }),
      });

      if (!response.ok) throw new Error('Failed to test intent');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error testing intent:', error);
      toast.error('Failed to test intent detection');
    } finally {
      setTesting(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Test Intent Detection
          </DialogTitle>
          <DialogDescription>
            Test how your workflow detects intents with sample messages
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Message</label>
            <Textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Type a message to test intent detection..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Test Button */}
          <Button
            onClick={handleTest}
            disabled={!testMessage.trim() || testing || !workflowId}
            className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Testing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Test Intent
              </>
            )}
          </Button>

          {/* Results */}
          {result && (
            <div className="mt-6 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2 mb-4">
                {result.intent_detected ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {result.intent_detected ? 'Intent Detected!' : 'No Intent Detected'}
                </h3>
              </div>

              {result.intent_detected ? (
                <div className="space-y-3">
                  {/* Intent Name */}
                  <div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Intent:
                    </span>
                    <Badge variant="default" className="bg-violet-500 hover:bg-violet-600">
                      {result.intent_name}
                    </Badge>
                  </div>

                  {/* Confidence */}
                  <div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Confidence:
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                          style={{ width: `${(result.confidence * 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${getConfidenceColor(result.confidence)}`}>
                        {Math.round(result.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Matched Method */}
                  <div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Detection Method:
                    </span>
                    <Badge variant="secondary">
                      {result.matched_method === 'keyword' && '⚡ Keyword Match'}
                      {result.matched_method === 'similarity' && '🎯 Similarity Match'}
                      {result.matched_method === 'llm' && '🤖 AI Classification'}
                    </Badge>
                  </div>

                  {/* Entities */}
                  {result.entities && Object.keys(result.entities).length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-2">
                        Extracted Entities:
                      </span>
                      <div className="space-y-2">
                        {Object.entries(result.entities).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
                          >
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {key}
                            </span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Auto-trigger Status */}
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    result.should_auto_trigger
                      ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                      : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'
                  }`}>
                    {result.should_auto_trigger ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                          Workflow will auto-trigger
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                          Confidence below auto-trigger threshold
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <p className="mb-2">The message didn't match any configured intents.</p>
                  <p>Try adding more keywords or training phrases to improve detection.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
