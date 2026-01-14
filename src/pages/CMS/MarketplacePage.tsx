import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Search,
  Store,
  Download,
  Star,
  Copy,
  Loader2,
  TrendingUp,
  FileText,
} from 'lucide-react';
import * as cmsService from '@/services/cmsService';
import { MarketplaceItem, MarketplaceListResponse } from '@/types/cms';
import { useToast } from '@/hooks/use-toast';

const MarketplacePage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [contentTypeSlug, setContentTypeSlug] = useState<string>('');
  const [copyDialog, setCopyDialog] = useState<{
    open: boolean;
    item: MarketplaceItem | null;
  }>({ open: false, item: null });

  // Fetch marketplace items
  const { data: marketplaceData, isLoading } = useQuery<MarketplaceListResponse>({
    queryKey: ['cms-marketplace', { search, contentTypeSlug }],
    queryFn: () =>
      cmsService.getMarketplaceItems(
        contentTypeSlug || undefined,
        search || undefined
      ),
  });

  // Fetch featured items
  const { data: featuredItems } = useQuery<MarketplaceItem[]>({
    queryKey: ['cms-marketplace-featured'],
    queryFn: () => cmsService.getFeaturedMarketplaceItems(6),
  });

  // Copy mutation
  const copyMutation = useMutation({
    mutationFn: (originalItemId: number) => cmsService.copyFromMarketplace(originalItemId),
    onSuccess: () => {
      toast({ title: 'Content copied to your library' });
      setCopyDialog({ open: false, item: null });
      queryClient.invalidateQueries({ queryKey: ['cms-content-items'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to copy content',
        description: error.response?.data?.detail || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const getItemTitle = (item: MarketplaceItem): string => {
    const data = item.data || {};
    return data.title || data.name || data.verse_text?.substring(0, 50) || `Item #${item.id}`;
  };

  const getItemDescription = (item: MarketplaceItem): string => {
    const data = item.data || {};
    return data.description || data.summary || data.meaning?.substring(0, 100) || '';
  };

  const items = marketplaceData?.items || [];

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
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground">Browse and copy shared content from other users</p>
        </div>
      </div>

      {/* Featured Section */}
      {featuredItems && featuredItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Featured</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredItems.map((item) => (
              <Card key={item.id} className="group hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <Badge variant="secondary">{item.content_type_name}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {item.download_count}
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-2">{getItemTitle(item)}</CardTitle>
                  {item.company_name && (
                    <CardDescription className="text-xs">by {item.company_name}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {getItemDescription(item) || 'No description'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setCopyDialog({ open: true, item })}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to My Library
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search marketplace..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={contentTypeSlug || 'all'}
          onValueChange={(v) => setContentTypeSlug(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Content Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {/* Content type options would be populated dynamically */}
          </SelectContent>
        </Select>
      </div>

      {/* All Items */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-xs">
                    {item.content_type_name}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {item.download_count}
                  </span>
                </div>
                <CardTitle className="text-base mt-2 line-clamp-1">{getItemTitle(item)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {getItemDescription(item) || 'No description'}
                </p>
                {item.company_name && (
                  <p className="text-xs text-muted-foreground mb-3">by {item.company_name}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setCopyDialog({ open: true, item })}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No items in marketplace</h3>
            <p className="text-muted-foreground text-center">
              {search
                ? 'No items match your search. Try different keywords.'
                : 'The marketplace is empty. Check back later!'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Copy Confirmation Dialog */}
      <Dialog
        open={copyDialog.open}
        onOpenChange={(open) => setCopyDialog({ ...copyDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy to Your Library</DialogTitle>
            <DialogDescription>
              This will create a copy of "{copyDialog.item && getItemTitle(copyDialog.item)}" in
              your content library. The copy will start as a private draft.
            </DialogDescription>
          </DialogHeader>

          {copyDialog.item && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">{getItemTitle(copyDialog.item)}</p>
                  <p className="text-sm text-muted-foreground">
                    {copyDialog.item.content_type_name}
                    {copyDialog.item.company_name && ` • by ${copyDialog.item.company_name}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCopyDialog({ open: false, item: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={() => copyDialog.item && copyMutation.mutate(copyDialog.item.id)}
              disabled={copyMutation.isPending}
            >
              {copyMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Copy to Library
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketplacePage;
