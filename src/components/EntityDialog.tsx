import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Entity {
  name: string;
  type: string;
  extraction_method: string;
  validation_regex?: string;
  required: boolean;
  prompt_if_missing?: string;
  description?: string;
  example_values?: string[];
}

interface EntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: Entity | null;
  onSave: (entity: Entity) => void;
}

export const EntityDialog: React.FC<EntityDialogProps> = ({
  open,
  onOpenChange,
  entity,
  onSave,
}) => {
  const [formData, setFormData] = useState<Entity>({
    name: '',
    type: 'text',
    extraction_method: 'llm',
    required: false,
    example_values: [],
  });
  const [exampleInput, setExampleInput] = useState('');

  useEffect(() => {
    if (entity) {
      setFormData(entity);
    } else {
      setFormData({
        name: '',
        type: 'text',
        extraction_method: 'llm',
        required: false,
        example_values: [],
      });
    }
  }, [entity, open]);

  const handleAddExample = () => {
    if (exampleInput.trim()) {
      setFormData({
        ...formData,
        example_values: [...(formData.example_values || []), exampleInput.trim()],
      });
      setExampleInput('');
    }
  };

  const handleRemoveExample = (index: number) => {
    setFormData({
      ...formData,
      example_values: (formData.example_values || []).filter((_, i) => i !== index),
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
            {entity ? 'Edit Entity' : 'Add New Entity'}
          </DialogTitle>
          <DialogDescription>
            Configure what information to extract from user messages
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Entity Name */}
          <div className="space-y-2">
            <Label htmlFor="entity-name">
              Entity Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="entity-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., order_number, email, phone"
              className="font-mono"
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Use snake_case format. This will be available as {`{{context.${formData.name || 'entity_name'}}}`}
            </p>
          </div>

          {/* Entity Type */}
          <div className="space-y-2">
            <Label htmlFor="entity-type">Entity Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="entity-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="url">URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Extraction Method */}
          <div className="space-y-2">
            <Label htmlFor="extraction-method">Extraction Method</Label>
            <Select
              value={formData.extraction_method}
              onValueChange={(value) =>
                setFormData({ ...formData, extraction_method: value })
              }
            >
              <SelectTrigger id="extraction-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="llm">LLM (AI-powered)</SelectItem>
                <SelectItem value="regex">Regex Pattern</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {formData.extraction_method === 'llm'
                ? 'AI will intelligently extract the value from context'
                : 'Use a regex pattern for precise matching'}
            </p>
          </div>

          {/* Validation Regex */}
          {formData.extraction_method === 'regex' && (
            <div className="space-y-2">
              <Label htmlFor="validation-regex">Regex Pattern</Label>
              <Input
                id="validation-regex"
                value={formData.validation_regex || ''}
                onChange={(e) =>
                  setFormData({ ...formData, validation_regex: e.target.value })
                }
                placeholder="e.g., ^ORD-[0-9]{6}$"
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Regular expression pattern to match and extract the value
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this entity represents..."
              rows={2}
            />
          </div>

          {/* Example Values */}
          <div className="space-y-2">
            <Label>Example Values (Optional)</Label>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              Provide examples to help the AI understand what to extract
            </p>
            <div className="flex gap-2">
              <Input
                value={exampleInput}
                onChange={(e) => setExampleInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), handleAddExample())
                }
                placeholder="e.g., ORD-123456, john@email.com"
              />
              <Button onClick={handleAddExample} type="button" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {(formData.example_values?.length || 0) > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                {formData.example_values?.map((example, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="pl-3 pr-1 py-1 gap-1"
                  >
                    {example}
                    <button
                      onClick={() => handleRemoveExample(idx)}
                      className="ml-1 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Required Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div>
              <Label htmlFor="required" className="cursor-pointer">
                Required Entity
              </Label>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Workflow will prompt user if this entity is missing
              </p>
            </div>
            <Switch
              id="required"
              checked={formData.required}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, required: checked })
              }
            />
          </div>

          {/* Prompt if Missing */}
          {formData.required && (
            <div className="space-y-2">
              <Label htmlFor="prompt-text">Prompt if Missing</Label>
              <Input
                id="prompt-text"
                value={formData.prompt_if_missing || ''}
                onChange={(e) =>
                  setFormData({ ...formData, prompt_if_missing: e.target.value })
                }
                placeholder="e.g., What is your order number?"
              />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Message to ask the user if this entity is not found
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            Save Entity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
