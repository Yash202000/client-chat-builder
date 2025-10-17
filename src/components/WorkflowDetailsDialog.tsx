import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export const WorkflowDetailsDialog = ({ isOpen, onClose, workflow, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerPhrases, setTriggerPhrases] = useState([]);
  const [currentPhrase, setCurrentPhrase] = useState('');

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
      setTriggerPhrases(workflow.trigger_phrases || []);
    }
  }, [workflow]);

  const handleAddPhrase = (e) => {
    if (e.key === 'Enter' && currentPhrase.trim()) {
      e.preventDefault();
      if (!triggerPhrases.includes(currentPhrase.trim())) {
        setTriggerPhrases([...triggerPhrases, currentPhrase.trim()]);
      }
      setCurrentPhrase('');
    }
  };

  const handleRemovePhrase = (phraseToRemove) => {
    setTriggerPhrases(triggerPhrases.filter(phrase => phrase !== phraseToRemove));
  };

  const handleSave = () => {
    onSave({ name, description, trigger_phrases: triggerPhrases });
    onClose();
  };

  if (!workflow) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Workflow Details</DialogTitle>
          <DialogDescription>
            Update the details for your workflow. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="trigger-phrases" className="text-right pt-2">
              Trigger Phrases
            </Label>
            <div className="col-span-3">
              <Input
                id="trigger-phrases"
                placeholder="Type a phrase and press Enter"
                value={currentPhrase}
                onChange={(e) => setCurrentPhrase(e.target.value)}
                onKeyDown={handleAddPhrase}
                className="mb-2"
              />
              <div className="flex flex-wrap gap-1">
                {triggerPhrases.map((phrase, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {phrase}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemovePhrase(phrase)}
                    />
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Add phrases that will directly trigger this workflow.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};