import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Contact } from '@/types';
import { Mail, Phone, User, Edit, Save, MapPin, Calendar, Tag, Activity, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';
import { TagSelector, TagDisplay } from '@/components/TagSelector';
import { EntityNotes } from '@/components/EntityNotes';
import axios from 'axios';

interface ContactProfileProps {
  sessionId: string;
}

export const ContactProfile: React.FC<ContactProfileProps> = ({ sessionId }) => {
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
        // If session not found, throw error
        if (response.status === 404) {
          throw new Error('Session not found');
        }
        // For other errors, throw
        throw new Error('Failed to fetch contact');
      }
      const data = await response.json();
      // API returns null for sessions without contact
      return data;
    },
    enabled: !!sessionId,
    retry: false, // Don't retry on failure
  });

  // When contact data is fetched or changes, update the form data and tags
  useEffect(() => {
    if (contact) {
      setFormData(contact);
      // Initialize tag IDs from contact.tags
      const contactTagIds = contact.tags?.map((t: any) => t.id) || [];
      setTagIds(contactTagIds);
    } else {
      setFormData({}); // Reset form if no contact
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

  // Handle tag changes - assign/unassign tags via API
  const handleTagsChange = async (newTagIds: number[]) => {
    if (!contact?.id) return;

    const previousTagIds = [...tagIds];
    setTagIds(newTagIds); // Optimistic update

    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };

      // Determine which tags to add/remove
      const tagsToAdd = newTagIds.filter(id => !previousTagIds.includes(id));
      const tagsToRemove = previousTagIds.filter(id => !newTagIds.includes(id));

      // Add new tags
      for (const tagId of tagsToAdd) {
        await axios.post(`/api/v1/tags/${tagId}/assign`, {
          contact_ids: [contact.id]
        }, { headers });
      }

      // Remove tags
      for (const tagId of tagsToRemove) {
        await axios.post(`/api/v1/tags/${tagId}/unassign`, {
          contact_ids: [contact.id]
        }, { headers });
      }

      // Refresh contact data to get updated tags
      queryClient.invalidateQueries({ queryKey: ['contact', sessionId] });
      toast({
        title: t('conversations.contact.toasts.success'),
        description: t('crm.tags.updated'),
        variant: 'success'
      });
    } catch (error) {
      console.error('Error updating tags:', error);
      setTagIds(previousTagIds); // Revert on error
      toast({
        title: t('conversations.contact.toasts.error'),
        description: t('crm.tags.saveError'),
        variant: 'destructive'
      });
    }
  };

  const getAvatarFallback = () => {
    const nameInitial = formData.name ? formData.name.charAt(0).toUpperCase() : '';
    const emailInitial = formData.email ? formData.email.charAt(0).toUpperCase() : '';
    return nameInitial || emailInitial || 'U';
  }

  if (isLoading) {
    return (
      <Card className="h-full rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800/90">
        <CardContent className="flex items-center justify-center h-full py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/25">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            </div>
            <span className="text-gray-600 dark:text-gray-400 font-medium">{t('conversations.loadingContact')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800/90 overflow-hidden">
      {/* Header */}
      <CardHeader className="border-b border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800 dark:to-slate-900/80 flex-shrink-0 pb-4">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-all" />
              <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{t('conversations.contact.title')}</CardTitle>
              <CardDescription className="text-xs dark:text-gray-400">{t('conversations.contact.subtitle')}</CardDescription>
            </div>
          </div>
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isEditing && updateContactMutation.isPending}
            className={isEditing
              ? "rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25"
              : "rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:border-green-300 hover:bg-green-50 dark:hover:border-green-700 dark:hover:bg-green-900/30"}
          >
            {isEditing ? (
              <>
                <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {updateContactMutation.isPending ? t('conversations.contact.saving') : t('conversations.contact.save')}
              </>
            ) : (
              <>
                <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('conversations.contact.edit')}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {/* Scrollable Content */}
      <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Show info banner when no contact exists yet */}
        {!contact && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200/80 dark:border-blue-800/50 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-semibold">Anonymous User:</span> The AI will collect contact information during the conversation.
            </p>
          </div>
        )}

        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-all" />
            <Avatar className="relative h-24 w-24 text-3xl ring-4 ring-white dark:ring-slate-700 shadow-xl shadow-green-500/20">
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-2xl">
                {getAvatarFallback()}
              </AvatarFallback>
            </Avatar>
          </div>
          <h3 className="mt-4 text-lg font-bold text-center bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
            {formData.name || t('conversations.contact.unknownContact')}
          </h3>
          {contact?.created_at && (
            <p className={`text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-full ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="h-3 w-3 text-green-600 dark:text-green-400" />
              {t('conversations.contact.joined', { date: new Date(contact.created_at).toLocaleDateString() })}
            </p>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className={`text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {t('conversations.contact.details')}
          </h4>

          {/* Name Field */}
          <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-4 hover:shadow-md hover:border-green-200 dark:hover:border-green-800/50 transition-all">
            <Label htmlFor="name" className={`text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-1 rounded bg-green-100 dark:bg-green-900/30">
                <User className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              {t('conversations.contact.fullName')}
            </Label>
            {isEditing ? (
              <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                className="mt-2 rounded-lg dark:bg-slate-800 dark:border-slate-600"
                placeholder={t('conversations.contact.namePlaceholder')}
              />
            ) : (
              <p className="text-sm font-medium mt-2 dark:text-white">{formData.name || t('conversations.contact.notProvided')}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-4 hover:shadow-md hover:border-green-200 dark:hover:border-green-800/50 transition-all">
            <Label htmlFor="email" className={`text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30">
                <Mail className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              {t('conversations.contact.emailAddress')}
            </Label>
            {isEditing ? (
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                className="mt-2 rounded-lg dark:bg-slate-800 dark:border-slate-600"
                placeholder={t('conversations.contact.emailPlaceholder')}
              />
            ) : (
              <p className="text-sm font-medium mt-2 break-words dark:text-white">{formData.email || t('conversations.contact.notProvided')}</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-4 hover:shadow-md hover:border-green-200 dark:hover:border-green-800/50 transition-all">
            <Label htmlFor="phone_number" className={`text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-1 rounded bg-purple-100 dark:bg-purple-900/30">
                <Phone className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </div>
              {t('conversations.contact.phoneNumber')}
            </Label>
            {isEditing ? (
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number || ''}
                onChange={handleInputChange}
                className="mt-2 rounded-lg dark:bg-slate-800 dark:border-slate-600"
                placeholder={t('conversations.contact.phonePlaceholder')}
              />
            ) : (
              <p className="text-sm font-medium mt-2 dark:text-white">{formData.phone_number || t('conversations.contact.notProvided')}</p>
            )}
          </div>

          {/* Tags Field */}
          {contact && (
            <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-4 hover:shadow-md hover:border-green-200 dark:hover:border-green-800/50 transition-all">
              <Label className={`text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-1 rounded bg-amber-100 dark:bg-amber-900/30">
                  <Tag className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                </div>
                {t('crm.tags.title')}
              </Label>
              <div className="mt-2">
                {isEditing ? (
                  <TagSelector
                    entityType="contact"
                    selectedTagIds={tagIds}
                    onTagsChange={handleTagsChange}
                  />
                ) : (
                  tagIds.length > 0 ? (
                    <TagSelector
                      entityType="contact"
                      selectedTagIds={tagIds}
                      onTagsChange={handleTagsChange}
                      disabled={false}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('crm.tags.noTags')}</p>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Activity Section */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-xl p-4 border border-cyan-200/80 dark:border-cyan-800/50">
          <h4 className={`text-xs font-semibold text-cyan-800 dark:text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-1 rounded bg-cyan-200/50 dark:bg-cyan-800/30">
              <Activity className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
            </div>
            {t('conversations.contact.activity')}
          </h4>
          <div className="space-y-2">
            <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600 dark:text-gray-400">{t('conversations.contact.sessionIdLabel')}</span>
              <span className="font-mono text-xs bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 dark:text-white shadow-sm">
                {sessionId.slice(0, 8)}...
              </span>
            </div>
            {contact?.id && (
              <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-600 dark:text-gray-400">{t('conversations.contact.contactIdLabel')}</span>
                <span className="font-mono text-xs bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-lg border border-green-200/80 dark:border-green-700/50">
                  #{contact.id}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes Section */}
        {contact?.id && (
          <EntityNotes contactId={contact.id} compact />
        )}

        {/* Cancel Button when Editing */}
        {isEditing && (
          <Button
            variant="outline"
            className="w-full rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:border-red-300 hover:bg-red-50 dark:hover:border-red-700 dark:hover:bg-red-900/30 transition-colors"
            onClick={() => {
              setIsEditing(false);
              setFormData(contact || {});
            }}
          >
            {t('conversations.contact.cancel')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};