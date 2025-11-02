import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Contact } from '@/types';
import { Mail, Phone, User, Edit, Save, MapPin, Calendar, Tag, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';

interface ContactProfileProps {
  sessionId: string;
}

export const ContactProfile: React.FC<ContactProfileProps> = ({ sessionId }) => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const queryClient = useQueryClient();
  const companyId = 1; // Hardcoded company ID
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Contact>>({});
  const { authFetch } = useAuth();

  const { data: contact, isLoading } = useQuery<Contact>({
    queryKey: ['contact', sessionId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/contacts/by_session/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch contact');
      return response.json();
    },
    enabled: !!sessionId,
  });

  // When contact data is fetched or changes, update the form data
  useEffect(() => {
    if (contact) {
      setFormData(contact);
    } else {
      setFormData({}); // Reset form if no contact
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

  const getAvatarFallback = () => {
    const nameInitial = formData.name ? formData.name.charAt(0).toUpperCase() : '';
    const emailInitial = formData.email ? formData.email.charAt(0).toUpperCase() : '';
    return nameInitial || emailInitial || 'U';
  }

  if (isLoading) {
    return (
      <Card className="h-full card-shadow-lg">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">{t('conversations.loadingContact')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col card-shadow-lg overflow-hidden bg-white dark:bg-slate-800">
      {/* Header */}
      <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 flex-shrink-0 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold dark:text-white">{t('conversations.contact.title')}</CardTitle>
              <CardDescription className="text-xs dark:text-gray-400">{t('conversations.contact.subtitle')}</CardDescription>
            </div>
          </div>
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isEditing && updateContactMutation.isPending}
            className={isEditing ? "bg-blue-600 hover:bg-blue-700 btn-hover-lift" : "btn-hover-lift"}
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                {updateContactMutation.isPending ? t('conversations.contact.saving') : t('conversations.contact.save')}
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                {t('conversations.contact.edit')}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {/* Scrollable Content */}
      <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-800">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <Avatar className="h-24 w-24 text-3xl ring-4 ring-slate-200 dark:ring-slate-700 shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
              {getAvatarFallback()}
            </AvatarFallback>
          </Avatar>
          <h3 className="mt-3 text-lg font-semibold text-center dark:text-white">
            {formData.name || t('conversations.contact.unknownContact')}
          </h3>
          {contact?.created_at && (
            <p className={`text-xs text-muted-foreground mt-1 flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="h-3 w-3" />
              {t('conversations.contact.joined', { date: new Date(contact.created_at).toLocaleDateString() })}
            </p>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('conversations.contact.details')}
          </h4>

          {/* Name Field */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3 card-shadow">
            <Label htmlFor="name" className={`text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <User className="h-3 w-3" />
              {t('conversations.contact.fullName')}
            </Label>
            {isEditing ? (
              <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                className="mt-1"
                placeholder={t('conversations.contact.namePlaceholder')}
              />
            ) : (
              <p className="text-sm font-medium mt-1 dark:text-white">{formData.name || t('conversations.contact.notProvided')}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3 card-shadow">
            <Label htmlFor="email" className={`text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Mail className="h-3 w-3" />
              {t('conversations.contact.emailAddress')}
            </Label>
            {isEditing ? (
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                className="mt-1"
                placeholder={t('conversations.contact.emailPlaceholder')}
              />
            ) : (
              <p className="text-sm font-medium mt-1 break-words dark:text-white">{formData.email || t('conversations.contact.notProvided')}</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3 card-shadow">
            <Label htmlFor="phone_number" className={`text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Phone className="h-3 w-3" />
              {t('conversations.contact.phoneNumber')}
            </Label>
            {isEditing ? (
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number || ''}
                onChange={handleInputChange}
                className="mt-1"
                placeholder={t('conversations.contact.phonePlaceholder')}
              />
            ) : (
              <p className="text-sm font-medium mt-1 dark:text-white">{formData.phone_number || t('conversations.contact.notProvided')}</p>
            )}
          </div>
        </div>

        {/* Activity Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-900">
          <h4 className={`text-xs font-semibold text-blue-900 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Activity className="h-3 w-3" />
            {t('conversations.contact.activity')}
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('conversations.contact.sessionIdLabel')}</span>
              <span className="font-mono text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 dark:text-white">
                {sessionId.slice(0, 8)}...
              </span>
            </div>
            {contact?.id && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t('conversations.contact.contactIdLabel')}</span>
                <span className="font-mono text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 dark:text-white">
                  #{contact.id}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cancel Button when Editing */}
        {isEditing && (
          <Button
            variant="outline"
            className="w-full"
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