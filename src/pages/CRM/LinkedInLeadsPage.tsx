import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Linkedin,
  Upload,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Building2,
  MapPin,
  Briefcase,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, {
    ...options,
    headers: { 'Authorization': `Bearer ${token}`, ...options.headers },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
};

interface Lead {
  lead_id: number;
  contact_id: number;
  name: string;
  email: string;
  job_title: string;
  company_name: string;
  industry: string;
  location: string;
  linkedin_url: string;
  enrichment_source: string;
  lead_stage: string;
  created_at: string;
}

interface ImportResult {
  url: string;
  status: 'success' | 'failed';
  contact_id?: number;
  lead_id?: number;
  name?: string;
  job_title?: string;
  company_name?: string;
  error?: string;
}

export default function LinkedInLeadsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [urlInput, setUrlInput] = useState('');
  const [importResults, setImportResults] = useState<ImportResult[]>([]);

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['linkedin-leads'],
    queryFn: () => authFetch(`/api/v1/linkedin-leads/leads?limit=50`),
  });

  const leads: Lead[] = leadsData?.leads ?? [];

  const bulkImportMutation = useMutation({
    mutationFn: async (urls: string[]) => {
      return authFetch(`/api/v1/linkedin-leads/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedin_urls: urls }),
      });
    },
    onSuccess: (data) => {
      setImportResults(data.results ?? []);
      queryClient.invalidateQueries({ queryKey: ['linkedin-leads'] });
      toast({
        title: t('linkedinLeads.toastImportComplete', { successful: data.successful, total: data.total }),
        description: data.failed > 0 ? t('linkedinLeads.toastImportPartialDesc', { failed: data.failed }) : undefined,
      });
    },
    onError: () => toast({ title: t('linkedinLeads.toastImportFailed'), variant: 'destructive' }),
  });

  const csvImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/v1/linkedin-leads/bulk-import-csv`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('CSV import failed');
      return res.json();
    },
    onSuccess: (data) => {
      setImportResults(data.results ?? []);
      queryClient.invalidateQueries({ queryKey: ['linkedin-leads'] });
      toast({ title: t('linkedinLeads.toastCsvImportComplete', { successful: data.successful, total: data.total }) });
    },
    onError: () => toast({ title: t('linkedinLeads.toastCsvImportFailed'), variant: 'destructive' }),
  });

  const handleImport = () => {
    const urls = urlInput.split('\n').map(u => u.trim()).filter(u => u.includes('linkedin.com'));
    if (urls.length === 0) {
      toast({ title: t('linkedinLeads.toastNoValidUrls'), variant: 'destructive' });
      return;
    }
    if (urls.length > 100) {
      toast({ title: t('linkedinLeads.toastMaxUrls'), variant: 'destructive' });
      return;
    }
    bulkImportMutation.mutate(urls);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) csvImportMutation.mutate(file);
    e.target.value = '';
  };

  const isImporting = bulkImportMutation.isPending || csvImportMutation.isPending;

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Linkedin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            {t('linkedinLeads.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
            {t('linkedinLeads.subtitle')}
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/crm/campaigns/new')} className="gap-2 flex-shrink-0">
          <Plus className="h-4 w-4" /><span className="hidden sm:inline">{t('linkedinLeads.startOutreach')}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('linkedinLeads.importProfilesTitle')}</CardTitle>
              <CardDescription>{t('linkedinLeads.importProfilesDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="urls">{t('linkedinLeads.labelLinkedInUrls')}</Label>
                <Textarea
                  id="urls"
                  placeholder={t('linkedinLeads.urlsPlaceholder')}
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  rows={8}
                  className="mt-1.5 font-mono text-xs"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {t('linkedinLeads.validUrlCount', { count: urlInput.split('\n').filter(u => u.trim().includes('linkedin.com')).length })}
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={isImporting} className="flex-1 gap-2">
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Linkedin className="h-4 w-4" />}
                  {isImporting ? t('linkedinLeads.importing') : t('linkedinLeads.importEnrich')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={isImporting}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {t('linkedinLeads.csvButton')}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCsvUpload}
                />
              </div>
            </CardContent>
          </Card>

          {/* Import Results */}
          {importResults.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('linkedinLeads.importResultsTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {importResults.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-md bg-slate-50 dark:bg-slate-800">
                    {r.status === 'success'
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      : <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <p className="truncate text-xs text-slate-500">{r.url}</p>
                      {r.status === 'success' && r.name && (
                        <p className="font-medium text-slate-900 dark:text-white">
                          {r.name}{r.job_title ? ` · ${r.job_title}` : ''}{r.company_name ? ` @ ${r.company_name}` : ''}
                        </p>
                      )}
                      {r.status === 'failed' && (
                        <p className="text-red-500 text-xs">{r.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('linkedinLeads.importedLeadsTitle')}
                </CardTitle>
                <CardDescription>{t('linkedinLeads.totalLeads', { count: leads.length })}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['linkedin-leads'] })}
              >
                <RefreshCw className={`h-4 w-4 ${leadsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {leadsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Linkedin className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">{t('linkedinLeads.noLeadsYet')}</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-slate-700 max-h-[520px] overflow-y-auto">
                {leads.map(lead => (
                  <div key={lead.lead_id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                          {lead.name || t('linkedinLeads.unknown')}
                        </p>
                        {lead.job_title && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Briefcase className="h-3 w-3 shrink-0" />
                            {lead.job_title}
                            {lead.company_name && ` @ ${lead.company_name}`}
                          </p>
                        )}
                        {lead.location && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {lead.location}
                          </p>
                        )}
                        {lead.industry && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3 shrink-0" />
                            {lead.industry}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {lead.lead_stage ?? 'lead'}
                        </Badge>
                        {lead.linkedin_url && (
                          <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 text-blue-500 hover:text-blue-600" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
