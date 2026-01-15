import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAIToolCategories, createAIToolCategory, getAITools, favoriteAITool, unfavoriteAITool, importAITools, exportAITools } from '@/services/aiToolService';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, Eye, PlusCircle, Upload, Download, Wrench, Search, Star, Loader2, Sparkles } from 'lucide-react';
import { Permission } from '@/components/Permission';
import { useI18n } from '@/hooks/useI18n';

const AIToolsPage = () => {
  const { t, isRTL } = useI18n();
  const [categories, setCategories] = useState([]);
  const [tools, setTools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recently_added');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = async () => {
    const data = await getAIToolCategories();
    setCategories(data);
  };

  const fetchTools = async () => {
    const data = await getAITools();
    setTools(data);
    setFilteredTools(data);
  };

  useEffect(() => {
    fetchCategories();
    fetchTools();
  }, []);

  useEffect(() => {
    let sortedTools = [...tools];
    if (sortBy === 'most_liked') {
      sortedTools.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'most_viewed') {
      sortedTools.sort((a, b) => b.views - a.views);
    } else if (sortBy === 'favourite_tools') {
      sortedTools.sort((a, b) => (a.is_favorited === b.is_favorited)? 0 : a.is_favorited? -1 : 1);
    }

    const filtered = sortedTools.filter(tool =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === null || tool.category_id === selectedCategory)
    );
    setFilteredTools(filtered);
  }, [searchTerm, sortBy, tools, selectedCategory]);

  const handleCreateTool = () => {
    navigate('/dashboard/ai-tools/new');
  };

  const handleFavorite = async (tool: any) => {
    if (tool.is_favorited) {
      await unfavoriteAITool(tool.id);
    } else {
      await favoriteAITool(tool.id);
    }
    fetchTools();
  };

  const handleCreateCategory = async () => {
    await createAIToolCategory({ name: newCategoryName, icon: newCategoryIcon });
    setNewCategoryName('');
    setNewCategoryIcon('');
    fetchCategories();
  };

  const handleExport = async () => {
    await exportAITools();
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await importAITools(file);
      fetchTools();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-slate-200/80 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl flex flex-col shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
        <div className="p-6 border-b border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800 dark:to-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                {t('aiToolsPage.categories')}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('aiToolsPage.browseByCategory')}</p>
            </div>
          </div>
        </div>

        <Permission permission="ai-tool-category:create">
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20">
            <p className="text-xs font-semibold text-teal-900 dark:text-teal-100 mb-3 flex items-center gap-2">
              <PlusCircle className="h-3.5 w-3.5" />
              {t('aiToolsPage.createCategory')}
            </p>
            <div className="flex flex-col gap-2">
              <Input
                placeholder={t('aiToolsPage.categoryNamePlaceholder')}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="rounded-xl h-10 dark:bg-slate-900 dark:border-slate-600 dark:text-white text-sm"
              />
              <Input
                placeholder={t('aiToolsPage.iconClassPlaceholder')}
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                className="rounded-xl h-10 dark:bg-slate-900 dark:border-slate-600 dark:text-white text-sm"
              />
              <Button onClick={handleCreateCategory} size="sm" className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25">
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                {t('common.create')}
              </Button>
            </div>
          </div>
        </Permission>

        <ScrollArea className="flex-1 p-4">
          <ul className="space-y-1.5">
            <li
              onClick={() => setSelectedCategory(null)}
              className={`p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer font-medium transition-all ${
                selectedCategory === null ? 'bg-gradient-to-r from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 text-teal-900 dark:text-teal-100 shadow-md shadow-teal-500/10' : 'dark:text-gray-300'
              }`}
            >
              <Sparkles className="h-4 w-4 inline mr-2 text-teal-600 dark:text-teal-400" />
              {t('aiToolsPage.allTools')}
            </li>
            {categories.map((category: any) => (
              <li
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer font-medium transition-all ${
                  selectedCategory === category.id ? 'bg-gradient-to-r from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 text-teal-900 dark:text-teal-100 shadow-md shadow-teal-500/10' : 'dark:text-gray-300'
                }`}
              >
                {category.icon && <i className={`mr-3 ${category.icon}`}></i>}
                {category.name}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-200/80 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-all" />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-xl shadow-teal-500/25">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  {t('aiToolsPage.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{t('aiToolsPage.subtitle')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Permission permission="ai-tool:import">
                <Button onClick={handleImport} variant="outline" size="sm" className="rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:border-teal-300 hover:bg-teal-50 dark:hover:border-teal-700 dark:hover:bg-teal-900/30 transition-colors">
                  <Upload className="h-4 w-4 mr-1.5" />
                  {t('aiToolsPage.import')}
                </Button>
              </Permission>
              <Permission permission="ai-tool:export">
                <Button onClick={handleExport} variant="outline" size="sm" className="rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:border-teal-300 hover:bg-teal-50 dark:hover:border-teal-700 dark:hover:bg-teal-900/30 transition-colors">
                  <Download className="h-4 w-4 mr-1.5" />
                  {t('aiToolsPage.export')}
                </Button>
              </Permission>
              <Permission permission="ai-tool:create">
                <Button onClick={handleCreateTool} className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 transition-all" size="sm">
                  <PlusCircle className="h-4 w-4 mr-1.5" />
                  {t('aiToolsPage.createTool')}
                </Button>
              </Permission>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".json"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500`} />
              <Input
                placeholder={t('aiToolsPage.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isRTL ? 'pr-10' : 'pl-10'} rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white`}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white">
                <SelectValue placeholder={t('aiToolsPage.sortBy')} />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700 rounded-xl">
                <SelectItem value="recently_added" className="dark:text-white dark:focus:bg-slate-700 rounded-lg">{t('aiToolsPage.recentlyAdded')}</SelectItem>
                <SelectItem value="most_liked" className="dark:text-white dark:focus:bg-slate-700 rounded-lg">{t('aiToolsPage.mostLiked')}</SelectItem>
                <SelectItem value="most_viewed" className="dark:text-white dark:focus:bg-slate-700 rounded-lg">{t('aiToolsPage.mostViewed')}</SelectItem>
                <SelectItem value="favourite_tools" className="dark:text-white dark:focus:bg-slate-700 rounded-lg">{t('aiToolsPage.favouriteTools')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6 bg-slate-50/50 dark:bg-slate-900/50">
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
              {filteredTools.map((tool: any) => (
                <Card key={tool.id} className="group hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 flex flex-col border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800/90 overflow-hidden rounded-2xl hover:border-teal-200 dark:hover:border-teal-700/50">
                  <CardHeader className="pb-3">
                    <div className={`flex items-start gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-all" />
                        <div className="relative w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/25">
                          {tool.category && <i className={`${tool.category.icon} text-xl text-white`}></i>}
                          {!tool.category && <Wrench className="h-5 w-5 text-white" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold dark:text-white leading-tight group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">{tool.name}</CardTitle>
                        {tool.category && (
                          <span className="inline-flex items-center text-xs bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full mt-1.5 font-medium">
                            {tool.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-sm dark:text-gray-400 line-clamp-2">{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3 bg-slate-50/80 dark:bg-slate-900/50 p-4 border-t border-slate-200/80 dark:border-slate-700/60">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <Heart size={16} className={tool.is_favorited ? 'fill-red-500 text-red-500 dark:fill-red-400 dark:text-red-400' : ''} />
                          <span className="text-sm font-medium">{tool.likes}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <Eye size={16} />
                          <span className="text-sm font-medium">{tool.views}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleFavorite(tool)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                      >
                        <Star size={16} className={`${tool.is_favorited ? 'fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400' : 'dark:text-gray-400 hover:text-yellow-500'}`} />
                      </Button>
                    </div>
                    <NavLink to={`/dashboard/ai-tools/${tool.id}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:bg-gradient-to-r hover:from-teal-500 hover:to-emerald-600 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-teal-500/25 transition-all">
                        <Eye className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                        {t('aiToolsPage.viewTool')}
                      </Button>
                    </NavLink>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full blur-xl opacity-30" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-teal-500/25">
                  <Wrench className="h-12 w-12 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('aiToolsPage.noToolsFound')}</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                {searchTerm || selectedCategory ? t('aiToolsPage.adjustFilters') : t('aiToolsPage.noToolsYet')}
              </p>
              {!searchTerm && !selectedCategory && (
                <Permission permission="ai-tool:create">
                  <Button onClick={handleCreateTool} className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25">
                    <PlusCircle className="h-4 w-4 mr-1.5" />
                    {t('aiToolsPage.createTool')}
                  </Button>
                </Permission>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default AIToolsPage;
