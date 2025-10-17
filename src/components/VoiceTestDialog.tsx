import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Play, Volume2 } from 'lucide-react';
import { toast } from './ui/use-toast';

const VOICE_ENGINE_URL = 'http://localhost:8001';

interface VoiceTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voiceId: string | null;
}

const VoiceTestDialog: React.FC<VoiceTestDialogProps> = ({ open, onOpenChange, voiceId }) => {
  const [text, setText] = useState('Hello, this is a test of my new custom voice. I can say anything you type here.');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const synthesizeMutation = useMutation({
    mutationFn: async () => {
      if (!voiceId || !text) throw new Error('Voice ID and text are required.');
      const response = await fetch(`${VOICE_ENGINE_URL}/api/v1/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id: voiceId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to synthesize audio');
      }
      return response.blob();
    },
    onSuccess: (audioBlob) => {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      const audio = new Audio(url);
      audio.play();
    },
    onError: (e: Error) => toast({ title: 'Synthesis Error', description: e.message, variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            Test Voice: <span className="text-violet-600 dark:text-violet-400">{voiceId}</span>
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Type some text below and click synthesize to hear your voice in action.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="message" className="dark:text-gray-300">Your Text</Label>
            <Textarea
              placeholder="Type your message here..."
              id="message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            />
          </div>
          {audioUrl && (
            <div className="mt-2 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900">
                <audio controls src={audioUrl} className="w-full">
                    Your browser does not support the audio element.
                </audio>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => synthesizeMutation.mutate()}
            disabled={synthesizeMutation.isPending}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white"
          >
            {synthesizeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
            Synthesize
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceTestDialog;
