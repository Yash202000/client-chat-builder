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

interface ContactProfileProps {
  sessionId: string;
}

export const ContactProfile: React.FC<ContactProfileProps> = ({ sessionId }) => {
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
        toast({ title: 'Success', description: 'Contact updated successfully.' });
        setIsEditing(false);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (contact?.id) {
        updateContactMutation.mutate(formData);
    } else {
        toast({ title: 'Error', description: 'Cannot save, contact ID is missing.', variant: 'destructive' });
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
            <p className="text-sm text-muted-foreground">Loading contact...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col card-shadow-lg overflow-hidden bg-white dark:bg-slate-800">
      {/* Header */}
      <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg dark:text-white">Contact Profile</CardTitle>
            <CardDescription className="text-xs dark:text-gray-400">Customer information</CardDescription>
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
                {updateContactMutation.isPending ? 'Saving...' : 'Save'}
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit
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
            {formData.name || 'Unknown Contact'}
          </h3>
          {contact?.created_at && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined {new Date(contact.created_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Contact Details
          </h4>

          {/* Name Field */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3 card-shadow">
            <Label htmlFor="name" className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
              <User className="h-3 w-3" />
              Full Name
            </Label>
            {isEditing ? (
              <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="Enter name"
              />
            ) : (
              <p className="text-sm font-medium mt-1 dark:text-white">{formData.name || 'Not provided'}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3 card-shadow">
            <Label htmlFor="email" className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
              <Mail className="h-3 w-3" />
              Email Address
            </Label>
            {isEditing ? (
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="email@example.com"
              />
            ) : (
              <p className="text-sm font-medium mt-1 break-words dark:text-white">{formData.email || 'Not provided'}</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3 card-shadow">
            <Label htmlFor="phone_number" className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
              <Phone className="h-3 w-3" />
              Phone Number
            </Label>
            {isEditing ? (
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number || ''}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="+1 (555) 000-0000"
              />
            ) : (
              <p className="text-sm font-medium mt-1 dark:text-white">{formData.phone_number || 'Not provided'}</p>
            )}
          </div>
        </div>

        {/* Activity Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-900">
          <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="h-3 w-3" />
            Activity
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Session ID:</span>
              <span className="font-mono text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 dark:text-white">
                {sessionId.slice(0, 8)}...
              </span>
            </div>
            {contact?.id && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Contact ID:</span>
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
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
};