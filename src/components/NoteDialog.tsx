import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  EntityNote,
  EntityNoteCreate,
  EntityNoteUpdate,
  NoteType,
  NOTE_TYPE_CONFIG,
} from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import { FileText, Phone, Calendar, Mail, CheckSquare, Loader2, StickyNote, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId?: number;
  leadId?: number;
  editNote?: EntityNote | null;
  onSuccess: () => void;
}

const NoteTypeIcon: React.FC<{ type: NoteType; className?: string }> = ({ type, className }) => {
  const icons: Record<NoteType, React.ReactNode> = {
    note: <FileText className={className} />,
    call: <Phone className={className} />,
    meeting: <Calendar className={className} />,
    email: <Mail className={className} />,
    task: <CheckSquare className={className} />,
  };
  return <>{icons[type]}</>;
};

export const NoteDialog: React.FC<NoteDialogProps> = ({
  open,
  onOpenChange,
  contactId,
  leadId,
  editNote,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { authFetch } = useAuth();
  const isEditing = !!editNote;

  const [noteType, setNoteType] = useState<NoteType>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [participants, setParticipants] = useState('');
  const [outcome, setOutcome] = useState('');

  // Reset form when dialog opens or editNote changes
  useEffect(() => {
    if (open) {
      if (editNote) {
        setNoteType(editNote.note_type);
        setTitle(editNote.title || '');
        setContent(editNote.content);
        setActivityDate(
          editNote.activity_date
            ? new Date(editNote.activity_date).toISOString().slice(0, 16)
            : ''
        );
        setDurationMinutes(editNote.duration_minutes?.toString() || '');
        setParticipants(editNote.participants?.join(', ') || '');
        setOutcome(editNote.outcome || '');
      } else {
        setNoteType('note');
        setTitle('');
        setContent('');
        setActivityDate('');
        setDurationMinutes('');
        setParticipants('');
        setOutcome('');
      }
    }
  }, [open, editNote]);

  const createMutation = useMutation({
    mutationFn: async (data: EntityNoteCreate) => {
      const response = await authFetch('/api/v1/notes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create note');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('notes.created'),
        variant: 'success',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: t('notes.createError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EntityNoteUpdate) => {
      const response = await authFetch(`/api/v1/notes/${editNote!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update note');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('notes.updated'),
        variant: 'success',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: t('notes.updateError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast({
        title: t('notes.validation.contentRequired'),
        variant: 'destructive',
      });
      return;
    }

    const participantsArray = participants
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (isEditing) {
      const updateData: EntityNoteUpdate = {
        note_type: noteType,
        title: title || undefined,
        content: content.trim(),
        activity_date: activityDate ? new Date(activityDate).toISOString() : undefined,
        duration_minutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        participants: participantsArray.length > 0 ? participantsArray : undefined,
        outcome: outcome || undefined,
      };
      updateMutation.mutate(updateData);
    } else {
      const createData: EntityNoteCreate = {
        contact_id: contactId,
        lead_id: leadId,
        note_type: noteType,
        title: title || undefined,
        content: content.trim(),
        activity_date: activityDate ? new Date(activityDate).toISOString() : undefined,
        duration_minutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        participants: participantsArray.length > 0 ? participantsArray : undefined,
        outcome: outcome || undefined,
      };
      createMutation.mutate(createData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const showActivityFields = noteType === 'call' || noteType === 'meeting';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] dark:bg-slate-800 dark:border-slate-700 rounded-2xl sm:rounded-2xl">
        <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
          <DialogTitle className="dark:text-white flex items-center gap-3 text-xl">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
              <StickyNote className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {isEditing ? t('notes.editTitle') : t('notes.addTitle')}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Note Type Selector */}
          <div>
            <Label className="text-sm font-medium mb-2 block dark:text-gray-300">{t('notes.type')}</Label>
            <Tabs
              value={noteType}
              onValueChange={(value) => setNoteType(value as NoteType)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-5 w-full h-auto p-1 rounded-xl bg-slate-100 dark:bg-slate-900">
                {(Object.keys(NOTE_TYPE_CONFIG) as NoteType[]).map((type) => {
                  const config = NOTE_TYPE_CONFIG[type];
                  return (
                    <TabsTrigger
                      key={type}
                      value={type}
                      className="flex items-center gap-1 text-xs py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all"
                    >
                      <NoteTypeIcon type={type} className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{t(`notes.types.${type}`)}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>

          {/* Title (optional) */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium dark:text-gray-300">
              {t('notes.titleField')} <span className="text-muted-foreground">({t('common.optional')})</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('notes.titlePlaceholder')}
              className="mt-1.5 rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content" className="text-sm font-medium dark:text-gray-300">
              {t('notes.content')} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('notes.contentPlaceholder')}
              className="mt-1.5 min-h-[100px] rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white resize-none"
              required
            />
          </div>

          {/* Activity Fields for Calls/Meetings */}
          {showActivityFields && (
            <div className="border-t border-slate-200/80 dark:border-slate-700/60 pt-4 space-y-4">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {t('notes.activityDetails')}
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="activityDate" className="text-sm dark:text-gray-300">
                    {t('notes.activityDate')}
                  </Label>
                  <Input
                    id="activityDate"
                    type="datetime-local"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className="mt-1.5 rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="duration" className="text-sm dark:text-gray-300">
                    {t('notes.duration')}
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder={t('notes.durationPlaceholder')}
                    className="mt-1.5 rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="participants" className="text-sm dark:text-gray-300">
                  {t('notes.participants')}
                </Label>
                <Input
                  id="participants"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder={t('notes.participantsPlaceholder')}
                  className="mt-1.5 rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="outcome" className="text-sm dark:text-gray-300">
                  {t('notes.outcome')}
                </Label>
                <Input
                  id="outcome"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder={t('notes.outcomePlaceholder')}
                  className="mt-1.5 rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.saving')}
                </>
              ) : isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('notes.saveChanges')}
                </>
              ) : (
                <>
                  <StickyNote className="h-4 w-4 mr-2" />
                  {t('notes.addNote')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NoteDialog;
