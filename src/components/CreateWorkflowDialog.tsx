import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const CreateWorkflowDialog = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name, description });
      onClose();
      setName('');
      setDescription('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dark:bg-slate-800 dark:border-slate-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Create New Workflow</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Create a new workflow to automate your agent processes
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="workflow-name" className="dark:text-gray-300">Name</Label>
            <Input
              id="workflow-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Customer Onboarding"
              required
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="workflow-desc" className="dark:text-gray-300">Description (Optional)</Label>
            <Textarea
              id="workflow-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="A brief description of what this workflow does..."
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              Create Workflow
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkflowDialog;