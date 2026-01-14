import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Key,
  Download,
  Plus,
  Copy,
  Trash,
  RefreshCw,
  Loader2,
  FileJson,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import * as cmsService from '@/services/cmsService';
import { ApiToken, ContentExport, ExportFormat } from '@/types/cms';
import { useToast } from '@/hooks/use-toast';

const CMSSettingsPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // API Token state
  const [tokenDialog, setTokenDialog] = useState(false);
  const [newToken, setNewToken] = useState<ApiToken | null>(null);
  const [tokenForm, setTokenForm] = useState({
    name: '',
    can_read: true,
    can_search: true,
    rate_limit: 100,
  });
  const [deleteTokenDialog, setDeleteTokenDialog] = useState<{
    open: boolean;
    token: ApiToken | null;
  }>({ open: false, token: null });

  // Export state
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exporting, setExporting] = useState(false);

  // Fetch API tokens
  const { data: tokens, isLoading: isLoadingTokens } = useQuery<ApiToken[]>({
    queryKey: ['cms-api-tokens'],
    queryFn: () => cmsService.getApiTokens(),
  });

  // Fetch exports
  const { data: exports, isLoading: isLoadingExports } = useQuery<ContentExport[]>({
    queryKey: ['cms-exports'],
    queryFn: () => cmsService.getExports(),
  });

  // Token mutations
  const createTokenMutation = useMutation({
    mutationFn: () => cmsService.createApiToken(tokenForm),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cms-api-tokens'] });
      setNewToken(data);
      setTokenForm({ name: '', can_read: true, can_search: true, rate_limit: 100 });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create token',
        description: error.response?.data?.detail || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const deleteTokenMutation = useMutation({
    mutationFn: (tokenId: number) => cmsService.deleteApiToken(tokenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-api-tokens'] });
      toast({ title: 'Token revoked' });
      setDeleteTokenDialog({ open: false, token: null });
    },
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: (tokenId: number) => cmsService.regenerateApiToken(tokenId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cms-api-tokens'] });
      setNewToken(data);
      toast({ title: 'Token regenerated' });
    },
  });

  // Export mutations
  const createExportMutation = useMutation({
    mutationFn: (format: ExportFormat) => cmsService.createExport({ format }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-exports'] });
      toast({ title: 'Export started' });
      setExporting(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to start export',
        description: error.response?.data?.detail || 'An error occurred',
        variant: 'destructive',
      });
      setExporting(false);
    },
  });

  const downloadExportMutation = useMutation({
    mutationFn: (exportId: number) => cmsService.downloadExport(exportId),
    onSuccess: (data) => {
      window.open(data.download_url, '_blank');
    },
    onError: () => {
      toast({ title: 'Failed to get download link', variant: 'destructive' });
    },
  });

  const deleteExportMutation = useMutation({
    mutationFn: (exportId: number) => cmsService.deleteExport(exportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-exports'] });
      toast({ title: 'Export deleted' });
    },
  });

  const handleCreateToken = () => {
    createTokenMutation.mutate();
  };

  const handleExport = () => {
    setExporting(true);
    createExportMutation.mutate(exportFormat);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard/cms">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">CMS Settings</h1>
          <p className="text-muted-foreground">Manage API access and data exports</p>
        </div>
      </div>

      <Tabs defaultValue="tokens" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tokens" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Tokens
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </TabsTrigger>
        </TabsList>

        {/* API Tokens Tab */}
        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Tokens</CardTitle>
                  <CardDescription>
                    Generate tokens for external access to your public content
                  </CardDescription>
                </div>
                <Button onClick={() => setTokenDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Token
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTokens ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : tokens && tokens.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Rate Limit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map((token) => (
                      <TableRow key={token.id}>
                        <TableCell className="font-medium">{token.name || 'Unnamed'}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {token.token}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {token.can_read && <Badge variant="secondary">Read</Badge>}
                            {token.can_search && <Badge variant="secondary">Search</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{token.rate_limit}/min</TableCell>
                        <TableCell>
                          <Badge variant={token.is_active ? 'default' : 'secondary'}>
                            {token.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {token.request_count} requests
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => regenerateTokenMutation.mutate(token.id)}
                              title="Regenerate"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => setDeleteTokenDialog({ open: true, token })}
                              title="Delete"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No API tokens yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Content</CardTitle>
              <CardDescription>Download your content as JSON or CSV</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    value={exportFormat}
                    onValueChange={(v: ExportFormat) => setExportFormat(v)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileJson className="w-4 h-4" />
                          JSON
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4" />
                          CSV
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleExport} disabled={exporting}>
                  {exporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Start Export
                </Button>
              </div>

              {/* Export History */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Export History</h4>
                {isLoadingExports ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : exports && exports.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Format</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exports.map((exp) => (
                        <TableRow key={exp.id}>
                          <TableCell>
                            {exp.format === 'json' ? (
                              <FileJson className="w-4 h-4" />
                            ) : (
                              <FileSpreadsheet className="w-4 h-4" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                exp.status === 'completed'
                                  ? 'default'
                                  : exp.status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {exp.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{exp.item_count || '-'}</TableCell>
                          <TableCell>
                            {exp.file_size
                              ? `${(exp.file_size / 1024).toFixed(1)} KB`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(exp.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {exp.status === 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => downloadExportMutation.mutate(exp.id)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => deleteExportMutation.mutate(exp.id)}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Download className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No exports yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Token Dialog */}
      <Dialog open={tokenDialog} onOpenChange={setTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Token</DialogTitle>
            <DialogDescription>
              Generate a new token for accessing your public content via API.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={tokenForm.name}
                onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })}
                placeholder="e.g., Mobile App"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Read Permission</Label>
                <p className="text-sm text-muted-foreground">Access public content</p>
              </div>
              <Switch
                checked={tokenForm.can_read}
                onCheckedChange={(v) => setTokenForm({ ...tokenForm, can_read: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Search Permission</Label>
                <p className="text-sm text-muted-foreground">Use semantic search</p>
              </div>
              <Switch
                checked={tokenForm.can_search}
                onCheckedChange={(v) => setTokenForm({ ...tokenForm, can_search: v })}
              />
            </div>

            <div className="space-y-2">
              <Label>Rate Limit (requests/min)</Label>
              <Input
                type="number"
                value={tokenForm.rate_limit}
                onChange={(e) =>
                  setTokenForm({ ...tokenForm, rate_limit: parseInt(e.target.value) || 100 })
                }
                min={1}
                max={1000}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTokenDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateToken}
              disabled={!tokenForm.name || createTokenMutation.isPending}
            >
              {createTokenMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Create Token'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Token Display Dialog */}
      <Dialog open={!!newToken} onOpenChange={(open) => !open && setNewToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Token Created
            </DialogTitle>
            <DialogDescription>
              Copy this token now. It won't be shown again!
            </DialogDescription>
          </DialogHeader>

          {newToken && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <code className="text-sm break-all">{newToken.token}</code>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => copyToClipboard(newToken.token)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Token
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setNewToken(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Token Dialog */}
      <AlertDialog
        open={deleteTokenDialog.open}
        onOpenChange={(open) => setDeleteTokenDialog({ ...deleteTokenDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Token</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke "{deleteTokenDialog.token?.name}"? Applications using
              this token will immediately lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteTokenDialog.token && deleteTokenMutation.mutate(deleteTokenDialog.token.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTokenMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Revoke'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CMSSettingsPage;
