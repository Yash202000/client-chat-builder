import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      toast({ title: t('cms.form.created') });
      setDeleteDialog({ open: false, type: null });
    },
    onError: () => {
      toast({ title: t('cms.form.createFailed'), variant: 'destructive' });
    },
  });

  const handleDelete = () => {
    if (deleteDialog.type) {
      deleteMutation.mutate(deleteDialog.type.slug);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/dashboard/cms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{t('cms.quickLinks.contentTypes')}</h1>
            <p className="text-muted-foreground hidden sm:block">{t('cms.quickLinks.contentTypesDesc')}</p>
          </div>
        </div>
        <Link to="/dashboard/cms/types/new">
          <Button>
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('cms.newContentType')}</span>
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
                      <Button variant="ghost" size="icon" className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/cms/content/${type.slug}`)}>
                        <List className="w-4 h-4 mr-2" />
                        {t('common.view')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/cms/types/${type.slug}`)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteDialog({ open: true, type })}
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {type.description || t('cms.noDescription')}
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
            <h3 className="text-lg font-medium mb-2">{t('cms.noContentTypes')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('cms.noContentTypesDesc')}
            </p>
            <Link to="/dashboard/cms/types/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t('cms.createContentType')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cms.editContentType')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentTypesPage;
