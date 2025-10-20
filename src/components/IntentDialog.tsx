import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Intent {
  id: string;
  name: string;
  keywords: string[];
  training_phrases: string[];
  confidence_threshold: number;
}

interface IntentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent: Intent | null;
  onSave: (intent: Intent) => void;
}

export const IntentDialog: React.FC<IntentDialogProps> = ({
  open,
  onOpenChange,
  intent,
  onSave,
}) => {
  const [formData, setFormData] = useState<Intent>({
    id: '',
    name: '',
    keywords: [],
    training_phrases: [],
    confidence_threshold: 0.7,
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [phraseInput, setPhraseInput] = useState('');

  useEffect(() => {
    if (intent) {
      setFormData(intent);
    } else {
      setFormData({
        id: `intent_${Date.now()}`,
        name: '',
        keywords: [],
        training_phrases: [],
        confidence_threshold: 0.7,
      });
    }
  }, [intent, open]);

  const handleAddKeyword = () => {
    if (keywordInput.trim()) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput.trim()],
      });
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((_, i) => i !== index),
    });
  };

  const handleAddPhrase = () => {
    if (phraseInput.trim()) {
      setFormData({
        ...formData,
        training_phrases: [...formData.training_phrases, phraseInput.trim()],
      });
      setPhraseInput('');
    }
  };

  const handleRemovePhrase = (index: number) => {
    setFormData({
      ...formData,
      training_phrases: formData.training_phrases.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      return;
    }
    onSave(formData);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {intent ? 'Edit Intent' : 'Add New Intent'}
          </DialogTitle>
          <DialogDescription>
            Configure how users can trigger this workflow with natural language
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Intent Name */}
          <div className="space-y-2">
            <Label htmlFor="intent-name">
              Intent Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="intent-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., request_refund, book_appointment"
              className="font-mono"
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Use snake_case format for consistency
            </p>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label>Keywords</Label>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              Single words that indicate this intent (fast matching)
            </p>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                placeholder="e.g., refund, return, money"
              />
              <Button onClick={handleAddKeyword} type="button">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                {formData.keywords.map((keyword, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="pl-3 pr-1 py-1 gap-1"
                  >
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(idx)}
                      className="ml-1 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Training Phrases */}
          <div className="space-y-2">
            <Label>Training Phrases</Label>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              Example sentences users might say (for similarity matching)
            </p>
            <div className="flex gap-2">
              <Input
                value={phraseInput}
                onChange={(e) => setPhraseInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPhrase())}
                placeholder="e.g., I want a refund for my order"
              />
              <Button onClick={handleAddPhrase} type="button">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.training_phrases.length > 0 && (
              <div className="space-y-2 mt-3">
                {formData.training_phrases.map((phrase, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-sm text-slate-900 dark:text-white">
                      "{phrase}"
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePhrase(idx)}
                      className="h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confidence Threshold */}
          <div className="space-y-2">
            <Label htmlFor="confidence">
              Confidence Threshold ({Math.round(formData.confidence_threshold * 100)}%)
            </Label>
            <input
              id="confidence"
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={formData.confidence_threshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  confidence_threshold: parseFloat(e.target.value),
                })
              }
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Minimum confidence required to match this intent
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            Save Intent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
