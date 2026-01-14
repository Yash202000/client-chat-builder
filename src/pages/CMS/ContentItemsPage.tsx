import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash,
  Eye,
  Send,
  Archive,
  Loader2,
  FileText,
} from 'lucide-react';
import * as cmsService from '@/services/cmsService';
import { ContentItem, ContentItemsResponse, STATUS_INFO, VISIBILITY_INFO } from '@/types/cms';
import { useToast } from '@/hooks/use-toast';

const ContentItemsPage = () => {
  const { typeSlug } = useParams<{ typeSlug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: ContentItem | null }>({
    open: false,
    item: null,
  });

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const visibility = searchParams.get('visibility') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;

  const { data, isLoading } = useQuery<ContentItemsResponse>({
    queryKey: ['cms-content-items', typeSlug, { search, status, visibility, page }],
    queryFn: () =>
      cmsService.getContentItems(typeSlug!, {
        search: search || undefined,
        status: status || undefined,
        visibility: visibility || undefined,
        skip: (page - 1) * limit,
        limit,
      }),
    enabled: !!typeSlug,
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: number) => cmsService.deleteContentItem(typeSlug!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-items', typeSlug] });
      toast({ title: 'Item deleted' });
      setDeleteDialog({ open: false, item: null });
    },
    onError: () => {
      toast({ title: 'Failed to delete item', variant: 'destructive' });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (itemId: number) => cmsService.publishContentItem(typeSlug!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-items', typeSlug] });
      toast({ title: 'Item published' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (itemId: number) => cmsService.archiveContentItem(typeSlug!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-items', typeSlug] });
      toast({ title: 'Item archived' });
    },
  });

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const getItemTitle = (item: ContentItem): string => {
    const data = item.data || {};
    return data.title || data.name || data.verse_text?.substring(0, 50) || `Item #${item.id}`;
  };

  const contentType = data?.content_type;
  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/cms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{contentType?.name || 'Content'}</h1>
            <p className="text-muted-foreground">
              {contentType?.description || `Manage ${typeSlug} items`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/dashboard/cms/types/${typeSlug}`}>
            <Button variant="outline">Edit Schema</Button>
          </Link>
          <Link to={`/dashboard/cms/content/${typeSlug}/new`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={status || 'all'} onValueChange={(v) => handleFilterChange('status', v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={visibility || 'all'} onValueChange={(v) => handleFilterChange('visibility', v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Visibility</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="marketplace">Marketplace</SelectItem>
            <SelectItem value="public">Public</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      to={`/dashboard/cms/content/${typeSlug}/${item.id}`}
                      className="font-medium hover:underline"
                    >
                      {getItemTitle(item)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={STATUS_INFO[item.status]?.color}
                    >
                      {STATUS_INFO[item.status]?.label || item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {VISIBILITY_INFO[item.visibility]?.label || item.visibility}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(item.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigate(`/dashboard/cms/content/${typeSlug}/${item.id}`)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {item.status === 'draft' && (
                          <DropdownMenuItem onClick={() => publishMutation.mutate(item.id)}>
                            <Send className="w-4 h-4 mr-2" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        {item.status === 'published' && (
                          <DropdownMenuItem onClick={() => archiveMutation.mutate(item.id)}>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteDialog({ open: true, item })}
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No items yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first {contentType?.name?.toLowerCase() || 'content'} item.
            </p>
            <Link to={`/dashboard/cms/content/${typeSlug}/new`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} items
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(page - 1));
                setSearchParams(params);
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(page + 1));
                setSearchParams(params);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.item && deleteMutation.mutate(deleteDialog.item.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentItemsPage;
