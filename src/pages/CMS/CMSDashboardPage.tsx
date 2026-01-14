import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Image, FolderTree, Store, Settings, Plus, Loader2 } from 'lucide-react';
import * as cmsService from '@/services/cmsService';
import { ContentType, FIELD_TYPE_INFO } from '@/types/cms';

const CMSDashboardPage = () => {
  const { data: contentTypes, isLoading } = useQuery({
    queryKey: ['cms-content-types'],
    queryFn: () => cmsService.getContentTypes(),
  });

  const quickLinks = [
    { title: 'Content Types', description: 'Define content schemas', icon: FileText, href: '/dashboard/cms/types' },
    { title: 'Media Library', description: 'Manage files & images', icon: Image, href: '/dashboard/cms/media' },
    { title: 'Categories', description: 'Organize content', icon: FolderTree, href: '/dashboard/cms/categories' },
    { title: 'Marketplace', description: 'Browse shared content', icon: Store, href: '/dashboard/cms/marketplace' },
    { title: 'Settings', description: 'API tokens & export', icon: Settings, href: '/dashboard/cms/settings' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">Manage your dynamic content with flexible schemas</p>
        </div>
        <Link to="/dashboard/cms/types/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Content Type
          </Button>
        </Link>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.href} to={link.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <link.icon className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">{link.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{link.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Content Types */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Content Types</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : contentTypes?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentTypes.map((type: ContentType) => (
              <Link key={type.id} to={`/dashboard/cms/content/${type.slug}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{type.name}</CardTitle>
                        <CardDescription className="text-xs">/{type.slug}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {type.description || 'No description'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {type.field_schema?.slice(0, 4).map((field) => (
                        <span
                          key={field.slug}
                          className="text-xs px-2 py-0.5 bg-muted rounded"
                        >
                          {field.name}
                        </span>
                      ))}
                      {type.field_schema?.length > 4 && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded">
                          +{type.field_schema.length - 4} more
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No content types yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first content type to start managing structured content.
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
      </div>
    </div>
  );
};

export default CMSDashboardPage;
