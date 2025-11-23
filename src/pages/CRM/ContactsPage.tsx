import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Download,
  Upload,
  MoreVertical,
  Mail,
  Phone,
  Building2,
  ArrowRight,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  company?: string;
  company_id: number;
  lead_source?: string;
  lifecycle_stage?: string;
  has_lead?: boolean;
}

interface ContactStats {
  total_contacts: number;
  contacts_with_leads: number;
  contacts_without_leads: number;
}

export default function ContactsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with_lead' | 'without_lead'>('all');
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertingContact, setConvertingContact] = useState<Contact | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone_number: '',
    company: '',
  });
  const [leadData, setLeadData] = useState({
    deal_value: '',
    source: '',
    notes: '',
  });

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, []);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get('/api/v1/contacts/', { headers });

      // Fetch leads to determine which contacts have leads
      const leadsResponse = await axios.get('/api/v1/leads/', { headers });
      const leadContactIds = new Set(leadsResponse.data.map((lead: any) => lead.contact_id));

      const contactsWithLeadStatus = response.data.map((contact: Contact) => ({
        ...contact,
        has_lead: leadContactIds.has(contact.id),
      }));

      setContacts(contactsWithLeadStatus);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch contacts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [contactsRes, leadsRes] = await Promise.all([
        axios.get('/api/v1/contacts/', { headers }),
        axios.get('/api/v1/leads/', { headers }),
      ]);

      const leadContactIds = new Set(leadsRes.data.map((lead: any) => lead.contact_id));
      const totalContacts = contactsRes.data.length;
      const contactsWithLeads = leadContactIds.size;

      setStats({
        total_contacts: totalContacts,
        contacts_with_leads: contactsWithLeads,
        contacts_without_leads: totalContacts - contactsWithLeads,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewDetails = (contact: Contact) => {
    setViewingContact(contact);
    setViewDialogOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setEditData({
      name: contact.name,
      email: contact.email,
      phone_number: contact.phone_number || '',
      company: contact.company || '',
    });
    setEditDialogOpen(true);
  };

  const submitEditContact = async () => {
    if (!editingContact) return;

    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const payload = {
        name: editData.name,
        email: editData.email,
        phone_number: editData.phone_number || null,
        company: editData.company || null,
      };

      await axios.put(`/api/v1/contacts/${editingContact.id}`, payload, { headers });

      toast({
        title: 'Success',
        description: `Contact ${editData.name} updated successfully`,
      });

      setEditDialogOpen(false);
      setEditData({ name: '', email: '', phone_number: '', company: '' });
      setEditingContact(null);
      fetchContacts();
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update contact',
        variant: 'destructive',
      });
    }
  };

  const handleConvertToLead = async (contact: Contact) => {
    setConvertingContact(contact);
    setConvertDialogOpen(true);
  };

  const handleBulkConvert = () => {
    if (selectedContacts.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select contacts to convert',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Coming Soon',
      description: 'Bulk conversion will be available soon',
    });
  };

  const submitConversion = async () => {
    if (!convertingContact) return;

    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const payload = {
        contact_id: convertingContact.id,
        deal_value: leadData.deal_value ? parseFloat(leadData.deal_value) : null,
        source: leadData.source || null,
        notes: leadData.notes || null,
      };

      await axios.post('/api/v1/leads/', payload, { headers });

      toast({
        title: 'Success',
        description: `${convertingContact.name} converted to lead successfully`,
      });

      setConvertDialogOpen(false);
      setLeadData({ deal_value: '', source: '', notes: '' });
      setConvertingContact(null);
      fetchContacts();
      fetchStats();
    } catch (error: any) {
      console.error('Error converting to lead:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to convert to lead',
        variant: 'destructive',
      });
    }
  };

  const toggleSelectContact = (contactId: number) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map((c) => c.id));
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'with_lead' && contact.has_lead) ||
      (filterStatus === 'without_lead' && !contact.has_lead);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Contacts Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your contacts and convert them to leads
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate('/dashboard/crm/contacts/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Contact
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_contacts}</div>
              <p className="text-xs text-muted-foreground">All contacts in database</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Leads</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contacts_with_leads}</div>
              <p className="text-xs text-muted-foreground">Already converted</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Without Leads</CardTitle>
              <ArrowRight className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contacts_without_leads}</div>
              <p className="text-xs text-muted-foreground">Ready to convert</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Contacts</SelectItem>
            <SelectItem value="without_lead">Without Leads</SelectItem>
            <SelectItem value="with_lead">With Leads</SelectItem>
          </SelectContent>
        </Select>
        {selectedContacts.length > 0 && (
          <Button onClick={handleBulkConvert} variant="secondary">
            Convert {selectedContacts.length} to Leads
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={() => toggleSelectContact(contact.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    {contact.email}
                  </div>
                </TableCell>
                <TableCell>
                  {contact.phone_number ? (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {contact.phone_number}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {contact.company ? (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      {contact.company}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {contact.has_lead ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Has Lead
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      No Lead
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(contact);
                        }}
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditContact(contact);
                        }}
                      >
                        Edit Contact
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {!contact.has_lead && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConvertToLead(contact);
                          }}
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Convert to Lead
                        </DropdownMenuItem>
                      )}
                      {contact.has_lead && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/dashboard/crm/leads');
                          }}
                        >
                          View Lead
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast({
                            title: 'Coming Soon',
                            description: 'Contact deletion will be available soon',
                          });
                        }}
                      >
                        Delete Contact
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Convert to Lead Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convert to Lead</DialogTitle>
            <DialogDescription>
              Converting {convertingContact?.name} to a lead
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deal_value">Deal Value ($)</Label>
              <Input
                id="deal_value"
                type="number"
                placeholder="10000"
                value={leadData.deal_value}
                onChange={(e) => setLeadData({ ...leadData, deal_value: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select
                value={leadData.source}
                onValueChange={(value) => setLeadData({ ...leadData, source: value })}
              >
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="email_campaign">Email Campaign</SelectItem>
                  <SelectItem value="cold_call">Cold Call</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this lead..."
                value={leadData.notes}
                onChange={(e) => setLeadData({ ...leadData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setConvertDialogOpen(false);
                  setLeadData({ deal_value: '', source: '', notes: '' });
                  setConvertingContact(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={submitConversion}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Convert to Lead
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Contact Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
            <DialogDescription>
              Detailed information about {viewingContact?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium text-muted-foreground">Name:</div>
              <div className="col-span-2 text-sm">{viewingContact?.name}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium text-muted-foreground">Email:</div>
              <div className="col-span-2 text-sm flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {viewingContact?.email}
              </div>
            </div>
            {viewingContact?.phone_number && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm font-medium text-muted-foreground">Phone:</div>
                <div className="col-span-2 text-sm flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {viewingContact.phone_number}
                </div>
              </div>
            )}
            {viewingContact?.company && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm font-medium text-muted-foreground">Company:</div>
                <div className="col-span-2 text-sm flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {viewingContact.company}
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium text-muted-foreground">Status:</div>
              <div className="col-span-2 text-sm">
                {viewingContact?.has_lead ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Has Lead
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    No Lead
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
              {!viewingContact?.has_lead && (
                <Button
                  onClick={() => {
                    setViewDialogOpen(false);
                    if (viewingContact) {
                      handleConvertToLead(viewingContact);
                    }
                  }}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Convert to Lead
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information for {editingContact?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit_name"
                placeholder="John Doe"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit_email"
                type="email"
                placeholder="john@example.com"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_phone">Phone Number</Label>
              <Input
                id="edit_phone"
                placeholder="+1 234 567 8900"
                value={editData.phone_number}
                onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_company">Company</Label>
              <Input
                id="edit_company"
                placeholder="Acme Inc."
                value={editData.company}
                onChange={(e) => setEditData({ ...editData, company: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditData({ name: '', email: '', phone_number: '', company: '' });
                  setEditingContact(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={submitEditContact}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
