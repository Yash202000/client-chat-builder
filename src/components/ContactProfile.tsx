import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Contact } from '@/types';
import { Mail, Phone, User, Edit, Save, Calendar, Tag, Loader2, X, PanelLeftClose } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';
import { TagSelector } from '@/components/TagSelector';
import { EntityNotes } from '@/components/EntityNotes';
import axios from 'axios';

interface ContactProfileProps {
  sessionId: string;
  onToggle?: () => void;
}


export const ContactProfile: React.FC<ContactProfileProps> = ({ sessionId, onToggle }) => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const queryClient = useQueryClient();
  const { playSuccessSound } = useNotifications();
  const companyId = 1; // Hardcoded company ID
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Contact>>({});
  const [tagIds, setTagIds] = useState<number[]>([]);
  const { authFetch } = useAuth();

  const { data: contact, isLoading } = useQuery<Contact | null>({
    queryKey: ['contact', sessionId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/contacts/by_session/${sessionId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Session not found');
        throw new Error('Failed to fetch contact');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!sessionId,
    retry: false,
  });

  useEffect(() => {
    if (contact) {
      setFormData(contact);
      const contactTagIds = contact.tags?.map((t: any) => t.id) || [];
      setTagIds(contactTagIds);
    } else {
      setFormData({});
      setTagIds([]);
    }
  }, [contact]);

  const updateContactMutation = useMutation({
    mutationFn: (updatedContact: Partial<Contact>) => authFetch(`/api/v1/contacts/${contact!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedContact),
    }).then(res => { if (!res.ok) throw new Error('Failed to update contact'); return res.json() }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['contact', sessionId] });
        toast({ title: t('conversations.contact.toasts.success'), variant: 'success', description: t('conversations.contact.toasts.contactUpdated') });
        playSuccessSound();
        setIsEditing(false);
    },
    onError: (e: Error) => toast({ title: t('conversations.contact.toasts.error'), description: e.message, variant: 'destructive' }),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (contact?.id) {
        updateContactMutation.mutate(formData);
    } else {
        toast({ title: t('conversations.contact.toasts.error'), description: t('conversations.contact.toasts.missingContactId'), variant: 'destructive' });
    }
  };

  const handleTagsChange = async (newTagIds: number[]) => {
    if (!contact?.id) return;

    const previousTagIds = [...tagIds];
    setTagIds(newTagIds);

    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };

      const tagsToAdd = newTagIds.filter(id => !previousTagIds.includes(id));
      const tagsToRemove = previousTagIds.filter(id => !newTagIds.includes(id));

      for (const tagId of tagsToAdd) {
        await axios.post(`/api/v1/tags/${tagId}/assign`, { contact_ids: [contact.id] }, { headers });
      }
      for (const tagId of tagsToRemove) {
        await axios.post(`/api/v1/tags/${tagId}/unassign`, { contact_ids: [contact.id] }, { headers });
      }

      queryClient.invalidateQueries({ queryKey: ['contact', sessionId] });
      toast({ title: t('conversations.contact.toasts.success'), description: t('crm.tags.updated'), variant: 'success' });
    } catch (error) {
      console.error('Error updating tags:', error);
      setTagIds(previousTagIds);
      toast({ title: t('conversations.contact.toasts.error'), description: t('crm.tags.saveError'), variant: 'destructive' });
    }
  };

  const getAvatarFallback = () => {
    const nameInitial = formData.name ? formData.name.charAt(0).toUpperCase() : '';
    const emailInitial = formData.email ? formData.email.charAt(0).toUpperCase() : '';
    return nameInitial || emailInitial || 'U';
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-card border border-border rounded-xl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Loading contact…</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-border">
        <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-2">
            {onToggle && (
              <button
                onClick={onToggle}
                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </button>
            )}
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('conversations.contact.title')}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="edit-actions"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1.5"
                >
                  <button
                    onClick={() => { setIsEditing(false); setFormData(contact || {}); }}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateContactMutation.isPending}
                    className="h-7 px-2.5 rounded-md flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {updateContactMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    {updateContactMutation.isPending ? t('conversations.contact.saving') : t('conversations.contact.save')}
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="edit-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsEditing(true)}
                  className="h-7 px-2.5 rounded-md flex items-center gap-1.5 border border-border text-muted-foreground text-xs hover:text-foreground hover:border-border/80 hover:bg-muted transition-colors"
                >
                  <Edit className="h-3 w-3" />
                  {t('conversations.contact.edit')}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Avatar + name block */}
        <div className="flex flex-col items-center text-center pt-1 pb-2">
          <div className="relative">
            <Avatar className="h-16 w-16 ring-2 ring-border ring-offset-2 ring-offset-card">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                {getAvatarFallback()}
              </AvatarFallback>
            </Avatar>
          </div>
          <h3 className="mt-3 text-[15px] font-semibold text-foreground leading-tight">
            {formData.name || t('conversations.contact.unknownContact')}
          </h3>
          {/* Contact quick-info row */}
          <div className={`mt-1.5 flex flex-col items-center gap-0.5 w-full px-2`}>
            {formData.email && (
              <div className={`flex items-center gap-1.5 text-[11px] text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate max-w-[180px]">{formData.email}</span>
              </div>
            )}
            {formData.phone_number && (
              <div className={`flex items-center gap-1.5 text-[11px] text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span>{formData.phone_number}</span>
              </div>
            )}
          </div>
          {contact?.created_at && (
            <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-full text-[10px] text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="h-2.5 w-2.5" />
              {t('conversations.contact.joined', { date: new Date(contact.created_at).toLocaleDateString() })}
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Anonymous user notice */}
        <AnimatePresence>
          {!contact && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mx-4 mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg"
            >
              <p className="text-xs text-foreground/80 leading-relaxed">
                <span className="font-semibold text-foreground">Anonymous visitor</span> — the AI will collect contact details during the conversation.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Edit form — only visible while editing ───────────────────────── */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              key="edit-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pt-3 pb-2 border-b border-border/50 space-y-2.5">
                <p className={`text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                  {t('conversations.contact.details')}
                </p>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1.5">
                    <User className="h-3 w-3" />{t('conversations.contact.fullName')}
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    className="h-7 text-xs rounded-md bg-background border-border"
                    placeholder={t('conversations.contact.namePlaceholder')}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />{t('conversations.contact.emailAddress')}
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className="h-7 text-xs rounded-md bg-background border-border"
                    placeholder={t('conversations.contact.emailPlaceholder')}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />{t('conversations.contact.phoneNumber')}
                  </label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number || ''}
                    onChange={handleInputChange}
                    className="h-7 text-xs rounded-md bg-background border-border"
                    placeholder={t('conversations.contact.phonePlaceholder')}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tags section ────────────────────────────────────────────────── */}
        {contact && (
          <div className="px-4 pt-2 pb-3 border-t border-border/50">
            <p className={`text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2 mt-1 flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Tag className="h-3 w-3" />
              {t('crm.tags.title')}
            </p>
            <TagSelector
              entityType="contact"
              selectedTagIds={tagIds}
              onTagsChange={handleTagsChange}
              disabled={!isEditing && tagIds.length === 0}
            />
            {!isEditing && tagIds.length === 0 && (
              <p className="text-xs text-muted-foreground/50">{t('crm.tags.noTags')}</p>
            )}
          </div>
        )}


        {/* ── Notes section ────────────────────────────────────────────────── */}
        {contact?.id && (
          <div className="border-t border-border/50">
            <EntityNotes contactId={contact.id} compact />
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </motion.div>
  );
};
