import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileText, CheckCircle2, AlertCircle, X, ChevronRight,
  Loader2, Download,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import axios from 'axios';
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

type ImportMode = 'contacts' | 'leads';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ImportMode;
  onImported?: () => void;
}

const CONTACT_FIELDS = [
  { value: 'skip',         label: '— Skip column —' },
  { value: 'name',         label: 'Full Name' },
  { value: 'first_name',   label: 'First Name' },
  { value: 'last_name',    label: 'Last Name' },
  { value: 'email',        label: 'Email' },
  { value: 'phone_number', label: 'Phone' },
  { value: 'company_name', label: 'Company' },
  { value: 'job_title',    label: 'Job Title' },
  { value: 'lead_source',  label: 'Lead Source' },
];

function guessField(header: string): string {
  const h = header.toLowerCase().replace(/[\s_-]/g, '');
  if (h === 'email' || h === 'emailaddress') return 'email';
  if (h === 'name' || h === 'fullname' || h === 'contactname') return 'name';
  if (h === 'firstname' || h === 'first') return 'first_name';
  if (h === 'lastname' || h === 'last' || h === 'surname') return 'last_name';
  if (h === 'phone' || h === 'phonenumber' || h === 'mobile' || h === 'tel') return 'phone_number';
  if (h === 'company' || h === 'companyname' || h === 'organization' || h === 'org') return 'company_name';
  if (h === 'jobtitle' || h === 'title' || h === 'position' || h === 'role') return 'job_title';
  if (h === 'leadsource' || h === 'source') return 'lead_source';
  return 'skip';
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

type Step = 'upload' | 'map' | 'result';

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export default function CsvImportDialog({ open, onOpenChange, mode, onImported }: CsvImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [createLeads, setCreateLeads] = useState(mode === 'leads');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setPreview([]);
    setMapping({});
    setResult(null);
    setImporting(false);
  };

  const handleFileSelect = (f: File) => {
    if (!f.name.endsWith('.csv')) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? '';
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length === 0) return;
      const hdrs = parseCsvLine(lines[0]);
      const rows = lines.slice(1, 6).map(l => parseCsvLine(l));
      setHeaders(hdrs);
      setPreview(rows);
      const auto: Record<string, string> = {};
      hdrs.forEach(h => { auto[h] = guessField(h); });
      setMapping(auto);
      setStep('map');
    };
    reader.readAsText(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, []);

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post<ImportResult>(
        `/api/v1/contacts/import?create_leads=${createLeads}`,
        formData,
        { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } }
      );
      setResult(res.data);
      setStep('result');
      onImported?.();
    } catch (err: any) {
      setResult({
        created: 0, updated: 0, skipped: 0,
        errors: [{ row: 0, reason: err?.response?.data?.detail ?? 'Import failed' }],
      });
      setStep('result');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'first_name,last_name,email,phone_number,company_name,job_title,lead_source\nJohn,Doe,john@example.com,+1234567890,Acme Inc,CEO,website\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'contacts_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const mappedCount = Object.values(mapping).filter(v => v !== 'skip').length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-violet-500" />
            Import {mode === 'leads' ? 'Leads' : 'Contacts'} from CSV
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          {(['upload', 'map', 'result'] as Step[]).map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              <span className={cn('capitalize', step === s && 'text-violet-600 font-medium')}>{s}</span>
            </span>
          ))}
        </div>

        {/* ── Step 1: Upload ── */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className={cn(
                'border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 text-center cursor-pointer transition-colors',
                dragOver ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20' : 'border-border hover:border-violet-300 hover:bg-muted/30'
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <FileText className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Drop your CSV file here</p>
                <p className="text-xs text-muted-foreground mt-0.5">or click to browse — .csv files only</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Supported columns: name, email, phone, company, job title, lead source…</span>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={downloadTemplate}>
                <Download className="h-3 w-3" /> Download template
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Map columns ── */}
        {step === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{file?.name}</p>
              <Badge variant="secondary" className="text-xs">{headers.length} columns detected</Badge>
            </div>

            {/* Column mapping table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-2 gap-0 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                <span>CSV Column</span>
                <span>Maps to field</span>
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-border">
                {headers.map((h) => (
                  <div key={h} className="grid grid-cols-2 gap-3 items-center px-4 py-2">
                    <div>
                      <p className="text-xs font-medium font-mono text-foreground">{h}</p>
                      {preview[0]?.[headers.indexOf(h)] && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          e.g. {preview[0][headers.indexOf(h)]}
                        </p>
                      )}
                    </div>
                    <Select
                      value={mapping[h] ?? 'skip'}
                      onValueChange={v => setMapping(prev => ({ ...prev, [h]: v }))}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_FIELDS.map(f => (
                          <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview rows */}
            {preview.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Preview (first {preview.length} rows)</p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="text-[11px] w-full">
                    <thead className="bg-muted/50">
                      <tr>{headers.map(h => <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {preview.map((row, i) => (
                        <tr key={i}>{row.map((cell, j) => <td key={j} className="px-2 py-1.5 text-foreground/80 whitespace-nowrap max-w-[120px] truncate">{cell}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {mode === 'contacts' && (
              <div className="flex items-center gap-2">
                <Switch id="create-leads" checked={createLeads} onCheckedChange={setCreateLeads} />
                <Label htmlFor="create-leads" className="text-sm cursor-pointer">
                  Also create Leads for each imported contact
                </Label>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {mappedCount} field{mappedCount !== 1 ? 's' : ''} mapped · existing contacts matched by email will be updated
            </p>
          </div>
        )}

        {/* ── Step 3: Result ── */}
        {step === 'result' && result && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Created', value: result.created, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                { label: 'Updated', value: result.updated, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { label: 'Skipped', value: result.skipped, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {result.errors.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} had errors
                </p>
                <div className="max-h-40 overflow-y-auto border border-destructive/20 rounded-lg divide-y divide-border">
                  {result.errors.map((e, i) => (
                    <div key={i} className="px-3 py-2 text-xs">
                      <span className="font-medium text-muted-foreground">Row {e.row}:</span>{' '}
                      <span className="text-foreground">{e.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                All rows imported successfully
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          )}
          {step === 'map' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button
                onClick={handleImport}
                disabled={importing || mappedCount === 0}
                className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
              >
                {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {importing ? 'Importing…' : 'Import'}
              </Button>
            </>
          )}
          {step === 'result' && (
            <>
              <Button variant="outline" onClick={reset}>Import Another</Button>
              <Button onClick={() => { reset(); onOpenChange(false); }}>Done</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
