import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  MoreVertical,
  Star,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  ArrowUpDown,
  Check,
  ChevronsUpDown,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: number;
  contact_id: number;
  contact?: {
    name: string;
    email: string;
    phone_number?: string;
  };
  stage: string;
  score: number;
  deal_value?: number;
  qualification_status: string;
  source?: string;
  assignee_id?: number;
  created_at: string;
  stage_changed_at?: string;
}

interface LeadStats {
  total_leads: number;
  lead_count: number;
  mql_count: number;
  sql_count: number;
  opportunity_count: number;
  customer_count: number;
  lost_count: number;
  avg_score: number;
  total_pipeline_value: number;
  qualified_count: number;
  unqualified_count: number;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  company?: string;
}

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  mql: 'MQL',
  sql: 'SQL',
  opportunity: 'Opportunity',
  customer: 'Customer',
  lost: 'Lost',
};

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-800',
  mql: 'bg-blue-100 text-blue-800',
  sql: 'bg-purple-100 text-purple-800',
  opportunity: 'bg-yellow-100 text-yellow-800',
  customer: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
};

export default function LeadsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'existing' | 'new'>('existing');
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [openCombobox, setOpenCombobox] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [contactsWithoutLeads, setContactsWithoutLeads] = useState(0);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone_number: '',
    company: '',
    deal_value: '',
    source: '',
    notes: '',
  });

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [selectedStage]);

  useEffect(() => {
    if (createDialogOpen) {
      fetchAvailableContacts();
    }
  }, [createDialogOpen]);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const params: any = {};
      if (selectedStage !== 'all') {
        params.stage = selectedStage;
      }
      const response = await axios.get('/api/v1/leads/', { params, headers });
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leads',
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

      const response = await axios.get('/api/v1/leads/stats', { headers });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAvailableContacts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get('/api/v1/leads/available-contacts', { headers });
      setAvailableContacts(response.data);
      setContactsWithoutLeads(response.data.length);
    } catch (error) {
      console.error('Error fetching available contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch available contacts',
        variant: 'destructive',
      });
    }
  };

  const handleQualifyLead = async (leadId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      await axios.post(`/api/v1/leads/${leadId}/qualify`, {}, { headers });
      toast({
        title: 'Success',
        description: 'Lead qualified successfully',
      });
      fetchLeads();
      fetchStats();
    } catch (error) {
      console.error('Error qualifying lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to qualify lead',
        variant: 'destructive',
      });
    }
  };

  const handleCreateLead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      if (createMode === 'existing') {
        // Create lead from existing contact
        if (!selectedContactId) {
          toast({
            title: 'Validation Error',
            description: 'Please select a contact',
            variant: 'destructive',
          });
          return;
        }

        const leadData = {
          contact_id: parseInt(selectedContactId),
          deal_value: newLead.deal_value ? parseFloat(newLead.deal_value) : null,
          source: newLead.source || null,
          notes: newLead.notes || null,
        };

        await axios.post('/api/v1/leads/', leadData, { headers });
      } else {
        // Create new contact + lead
        if (!newLead.name || !newLead.email) {
          toast({
            title: 'Validation Error',
            description: 'Name and email are required',
            variant: 'destructive',
          });
          return;
        }

        const leadData = {
          contact: {
            name: newLead.name,
            email: newLead.email,
            phone_number: newLead.phone_number || null,
            company: newLead.company || null,
          },
          deal_value: newLead.deal_value ? parseFloat(newLead.deal_value) : null,
          source: newLead.source || null,
          notes: newLead.notes || null,
        };

        await axios.post('/api/v1/leads/with-contact', leadData, { headers });
      }

      toast({
        title: 'Success',
        description: 'Lead created successfully',
      });

      // Reset form
      setSelectedContactId('');
      setNewLead({
        name: '',
        email: '',
        phone_number: '',
        company: '',
        deal_value: '',
        source: '',
        notes: '',
      });

      // Close dialog and refresh
      setCreateDialogOpen(false);
      fetchLeads();
      fetchStats();
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create lead',
        variant: 'destructive',
      });
    }
  };

  const filteredLeads = leads.filter((lead) =>
    lead.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.contact?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const leadsByStage = Object.keys(STAGE_LABELS).reduce((acc, stage) => {
    acc[stage] = filteredLeads.filter((lead) => lead.stage === stage);
    return acc;
  }, {} as Record<string, Lead[]>);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Leads Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and qualify your leads through the sales pipeline
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
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Banner for Contacts Without Leads */}
      {showBanner && contactsWithoutLeads > 0 && (
        <Alert className="bg-orange-50 border-orange-200">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-orange-900">
              You have <strong>{contactsWithoutLeads} contact{contactsWithoutLeads !== 1 ? 's' : ''}</strong> without leads.
              Convert them to leads to start tracking opportunities.
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
                onClick={() => navigate('/dashboard/crm/contacts')}
              >
                View Contacts
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBanner(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_leads || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.qualified_count || 0} qualified
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(stats.total_pipeline_value || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.opportunity_count || 0} opportunities
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avg_score ? stats.avg_score.toFixed(0) : 0}/100</div>
              <p className="text-xs text-muted-foreground">Lead quality score</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_leads > 0
                  ? (((stats.customer_count || 0) / stats.total_leads) * 100).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.customer_count || 0} customers
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStage} onValueChange={setSelectedStage}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(STAGE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(STAGE_LABELS).map(([stage, label]) => (
            <div key={stage} className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-semibold text-sm">{label}</h3>
                <Badge variant="secondary">{leadsByStage[stage]?.length || 0}</Badge>
              </div>
              <div className="space-y-2 min-h-[200px] bg-muted/20 rounded-lg p-2">
                {leadsByStage[stage]?.map((lead) => (
                  <Card
                    key={lead.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/dashboard/crm/leads/${lead.id}`)}
                  >
                    <CardHeader className="p-3 space-y-1">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm">{lead.contact?.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {lead.score}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {lead.contact?.email}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      {lead.deal_value && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ${lead.deal_value.toLocaleString()}
                        </div>
                      )}
                      {lead.source && (
                        <Badge variant="secondary" className="text-xs">
                          {lead.source}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Deal Value</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/dashboard/crm/leads/${lead.id}`)}
                >
                  <TableCell className="font-medium">{lead.contact?.name}</TableCell>
                  <TableCell>{lead.contact?.email}</TableCell>
                  <TableCell>
                    <Badge className={STAGE_COLORS[lead.stage]}>
                      {STAGE_LABELS[lead.stage]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {lead.score}/100
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.deal_value ? `$${lead.deal_value.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell>{lead.source || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        lead.qualification_status === 'qualified' ? 'default' : 'secondary'
                      }
                    >
                      {lead.qualification_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/crm/leads/${lead.id}`);
                          }}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQualifyLead(lead.id);
                          }}
                        >
                          Auto-Qualify
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Delete Lead
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Lead Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Lead</DialogTitle>
            <DialogDescription>
              Create a lead from an existing contact or add a new contact with lead information.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as 'existing' | 'new')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">From Existing Contact</TabsTrigger>
              <TabsTrigger value="new">New Contact</TabsTrigger>
            </TabsList>

            {/* From Existing Contact Tab */}
            <TabsContent value="existing" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contact">
                  Select Contact <span className="text-red-500">*</span>
                </Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between"
                    >
                      {selectedContactId
                        ? availableContacts.find((c) => c.id.toString() === selectedContactId)?.name
                        : 'Search contacts...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search by name or email..." />
                      <CommandList>
                        <CommandEmpty>
                          {availableContacts.length === 0
                            ? 'No available contacts. All contacts have leads.'
                            : 'No contacts found.'}
                        </CommandEmpty>
                        <CommandGroup>
                          {availableContacts.map((contact) => (
                            <CommandItem
                              key={contact.id}
                              value={`${contact.name} ${contact.email}`}
                              onSelect={() => {
                                setSelectedContactId(contact.id.toString());
                                setOpenCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedContactId === contact.id.toString()
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{contact.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {contact.email}
                                  {contact.company && ` • ${contact.company}`}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {availableContacts.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    All contacts already have leads. Create a new contact instead.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deal_value_existing">Deal Value ($)</Label>
                  <Input
                    id="deal_value_existing"
                    type="number"
                    placeholder="10000"
                    value={newLead.deal_value}
                    onChange={(e) => setNewLead({ ...newLead, deal_value: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source_existing">Source</Label>
                  <Select
                    value={newLead.source}
                    onValueChange={(value) => setNewLead({ ...newLead, source: value })}
                  >
                    <SelectTrigger id="source_existing">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes_existing">Notes</Label>
                <Textarea
                  id="notes_existing"
                  placeholder="Additional notes about this lead..."
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setSelectedContactId('');
                    setNewLead({
                      name: '',
                      email: '',
                      phone_number: '',
                      company: '',
                      deal_value: '',
                      source: '',
                      notes: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateLead} disabled={!selectedContactId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lead
                </Button>
              </div>
            </TabsContent>

            {/* New Contact Tab */}
            <TabsContent value="new" className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Information */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 234 567 8900"
                    value={newLead.phone_number}
                    onChange={(e) => setNewLead({ ...newLead, phone_number: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Acme Inc."
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                  />
                </div>

                {/* Lead Information */}
                <div className="space-y-2">
                  <Label htmlFor="deal_value">Deal Value ($)</Label>
                  <Input
                    id="deal_value"
                    type="number"
                    placeholder="10000"
                    value={newLead.deal_value}
                    onChange={(e) => setNewLead({ ...newLead, deal_value: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select
                    value={newLead.source}
                    onValueChange={(value) => setNewLead({ ...newLead, source: value })}
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
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this lead..."
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    setNewLead({
                      name: '',
                      email: '',
                      phone_number: '',
                      company: '',
                      deal_value: '',
                      source: '',
                      notes: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateLead}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lead
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
