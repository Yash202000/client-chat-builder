import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { FileText, Plus, MoreVertical, Pencil, Trash, Loader2, ArrowLeft, List } from 'lucide-react';
import { useState } from 'react';
import * as cmsService from '@/services/cmsService';
import { ContentType, FIELD_TYPE_INFO } from '@/types/cms';
import { useToast } from '@/hooks/use-toast';

const ContentTypesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: ContentType | null }>({
    open: false,
    type: null,
  });

  const { data: contentTypes, isLoading } = useQuery({
    queryKey: ['cms-content-types'],
    queryFn: () => cmsService.getContentTypes(),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => cmsService.deleteContentType(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-types'] });
      toast({ title: 'Content type deleted' });
      setDeleteDialog({ open: false, type: null });
    },
    onError: () => {
      toast({ title: 'Failed to delete content type', variant: 'destructive' });
    },
  });

  const handleDelete = () => {
    if (deleteDialog.type) {
      deleteMutation.mutate(deleteDialog.type.slug);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/cms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Content Types</h1>
            <p className="text-muted-foreground">Define schemas for your content</p>
          </div>
        </div>
        <Link to="/dashboard/cms/types/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Content Type
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : contentTypes?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contentTypes.map((type: ContentType) => (
            <Card key={type.id} className="group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <CardDescription className="text-xs font-mono">/{type.slug}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/cms/content/${type.slug}`)}>
                        <List className="w-4 h-4 mr-2" />
                        View Items
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/cms/types/${type.slug}`)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Schema
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteDialog({ open: true, type })}
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {type.description || 'No description'}
                </p>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {type.field_schema?.length || 0} fields
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {type.field_schema?.map((field) => (
                      <span
                        key={field.slug}
                        className="text-xs px-2 py-0.5 bg-muted rounded flex items-center gap-1"
                        title={FIELD_TYPE_INFO[field.type]?.description}
                      >
                        {field.name}
                        <span className="text-muted-foreground">({field.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No content types yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first content type to define a schema for your structured content.
            </p>
            <Link to="/dashboard/cms/types/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Content Type
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.type?.name}"? This will also delete all content items
              of this type. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentTypesPage;
