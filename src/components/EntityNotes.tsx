import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EntityNote, EntityNoteList, NoteType, NOTE_TYPE_CONFIG } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import { NoteDialog } from './NoteDialog';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Phone,
  Calendar,
  Mail,
  CheckSquare,
  Clock,
  User,
  Loader2,
  StickyNote,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface EntityNotesProps {
  contactId?: number;
  leadId?: number;
  compact?: boolean;
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

export const EntityNotes: React.FC<EntityNotesProps> = ({ contactId, leadId, compact = false }) => {
  const { t } = useTranslation();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<EntityNote | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);

  const queryKey = contactId
    ? ['entity-notes', 'contact', contactId]
    : ['entity-notes', 'lead', leadId];

  const endpoint = contactId
    ? `/api/v1/notes/contact/${contactId}`
    : `/api/v1/notes/lead/${leadId}`;

  const { data, isLoading } = useQuery<EntityNoteList>({
    queryKey,
    queryFn: async () => {
      const response = await authFetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch notes');
      return response.json();
    },
    enabled: !!(contactId || leadId),
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await authFetch(`/api/v1/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: t('notes.deleted'),
        variant: 'success',
      });
      setDeleteNoteId(null);
    },
    onError: () => {
      toast({
        title: t('notes.deleteError'),
        variant: 'destructive',
      });
    },
  });

  const handleAddNote = () => {
    setEditingNote(null);
    setIsDialogOpen(true);
  };

  const handleEditNote = (note: EntityNote) => {
    setEditingNote(note);
    setIsDialogOpen(true);
  };

  const handleDeleteNote = (noteId: number) => {
    setDeleteNoteId(noteId);
  };

  const confirmDelete = () => {
    if (deleteNoteId) {
      deleteMutation.mutate(deleteNoteId);
    }
  };

  const groupNotesByDate = (notes: EntityNote[]) => {
    const groups: Record<string, EntityNote[]> = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    notes.forEach((note) => {
      const noteDate = new Date(note.created_at).toDateString();
      let groupKey: string;

      if (noteDate === today) {
        groupKey = t('notes.today');
      } else if (noteDate === yesterday) {
        groupKey = t('notes.yesterday');
      } else {
        groupKey = new Date(note.created_at).toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(note);
    });

    return groups;
  };

  const notes = data?.notes || [];
  const groupedNotes = groupNotesByDate(notes);

  return (
    <>
      <Card className={cn('h-full flex flex-col rounded-xl', compact ? 'border-0 shadow-none bg-transparent' : 'shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800/90')}>
        <CardHeader className={cn('flex flex-row items-center justify-between pb-3', compact ? 'px-0 pt-2' : 'border-b border-slate-200/80 dark:border-slate-700/60')}>
          <CardTitle className="text-sm font-semibold flex items-center gap-2.5 dark:text-white">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40">
              <StickyNote className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="bg-gradient-to-r from-amber-700 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent font-bold">
              {t('notes.title')}
            </span>
            {data?.total ? (
              <span className="text-xs bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-medium">
                {data.total}
              </span>
            ) : null}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddNote}
            className="rounded-lg dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:border-amber-300 hover:bg-amber-50 dark:hover:border-amber-700 dark:hover:bg-amber-900/30 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('notes.add')}
          </Button>
        </CardHeader>

        <CardContent className={cn('flex-1 overflow-y-auto pt-4', compact ? 'px-0 pb-0' : '')}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full blur-lg opacity-30 animate-pulse" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              </div>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full blur-lg opacity-30" />
                <div className="relative w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <StickyNote className="h-7 w-7 text-white" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-800 dark:text-white">{t('notes.empty')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('notes.emptySubtitle')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedNotes).map(([date, dateNotes]) => (
                <div key={date}>
                  <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-amber-500" />
                    {date}
                  </h4>
                  <div className="space-y-2">
                    {dateNotes.map((note) => {
                      const config = NOTE_TYPE_CONFIG[note.note_type];
                      return (
                        <div
                          key={note.id}
                          className={cn(
                            'border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3.5 transition-all hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800/50',
                            'bg-white dark:bg-slate-900/50'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <div
                                className={cn(
                                  'p-1.5 rounded-lg',
                                  config.bgColor
                                )}
                              >
                                <NoteTypeIcon
                                  type={note.note_type}
                                  className={cn('h-3.5 w-3.5', config.color)}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={cn('text-xs font-semibold', config.color)}>
                                    {t(`notes.types.${note.note_type}`)}
                                  </span>
                                  {note.title && (
                                    <span className="text-sm font-medium truncate dark:text-white">
                                      {note.title}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl dark:bg-slate-800 dark:border-slate-700">
                                <DropdownMenuItem onClick={() => handleEditNote(note)} className="rounded-lg">
                                  <Edit className="h-4 w-4 mr-2" />
                                  {t('notes.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-red-600 dark:text-red-400 rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('notes.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <p className="text-sm mt-2.5 whitespace-pre-wrap line-clamp-3 dark:text-gray-300">
                            {note.content}
                          </p>

                          {/* Activity metadata for calls/meetings */}
                          {(note.note_type === 'call' || note.note_type === 'meeting') && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                              {note.duration_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-blue-500" />
                                  {note.duration_minutes} {t('notes.minutes')}
                                </span>
                              )}
                              {note.participants && note.participants.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-green-500" />
                                  {note.participants.join(', ')}
                                </span>
                              )}
                              {note.outcome && (
                                <span className="italic text-purple-600 dark:text-purple-400">{note.outcome}</span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2.5 text-xs text-muted-foreground pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <span className="font-medium">
                              {note.creator_email || t('notes.unknownUser')}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span>
                              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <NoteDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        contactId={contactId}
        leadId={leadId}
        editNote={editingNote}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey });
          setIsDialogOpen(false);
          setEditingNote(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              {t('notes.deleteConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              {t('notes.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
            <AlertDialogCancel className="rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EntityNotes;
