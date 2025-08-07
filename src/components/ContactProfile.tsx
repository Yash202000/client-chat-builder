import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Contact } from '@/types';
import { Mail, Phone, User, Edit, Save } from 'lucide-react';
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

  if (isLoading) return <Card><CardContent className="p-4">Loading contact...</CardContent></Card>;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Contact Profile</CardTitle>
          <CardDescription>Details about the user.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <Avatar className="h-24 w-24 text-3xl">
            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
          </Avatar>
        </div>
        
        <div className="space-y-2">
          <div>
            <Label htmlFor="name">Name</Label>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              {isEditing ? (
                <Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} />
              ) : (
                <p className="text-sm">{formData.name || 'N/A'}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              {isEditing ? (
                <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
              ) : (
                <p className="text-sm">{formData.email || 'N/A'}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="phone_number">Phone</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              {isEditing ? (
                <Input id="phone_number" name="phone_number" value={formData.phone_number || ''} onChange={handleInputChange} />
              ) : (
                <p className="text-sm">{formData.phone_number || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <Button className="w-full" onClick={handleSave} disabled={updateContactMutation.isPending}>
            {updateContactMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};