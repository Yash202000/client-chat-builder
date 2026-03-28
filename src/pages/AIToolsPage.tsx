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
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white">{t('aiToolsPage.categories')}</h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{t('aiToolsPage.browseByCategory')}</p>
            </div>
          </div>
        </div>

        <Permission permission="ai-tool-category:create">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <PlusCircle className="h-3 w-3" />
              {t('aiToolsPage.createCategory')}
            </p>
            <div className="flex flex-col gap-1.5">
              <Input
                placeholder={t('aiToolsPage.categoryNamePlaceholder')}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-8 text-xs dark:bg-slate-800 dark:border-slate-700"
              />
              <Input
                placeholder={t('aiToolsPage.iconClassPlaceholder')}
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                className="h-8 text-xs dark:bg-slate-800 dark:border-slate-700"
              />
              <Button onClick={handleCreateCategory} size="sm" className="h-7 text-xs bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white">
                <PlusCircle className="h-3 w-3 mr-1" />
                {t('common.create')}
              </Button>
            </div>
          </div>
        </Permission>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="flex-1 text-left truncate">{t('aiToolsPage.allTools')}</span>
              <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">{tools.length}</span>
            </button>
            {categories.map((category: any) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {category.icon ? <i className={`${category.icon} text-xs flex-shrink-0`}></i> : <Wrench className="h-3.5 w-3.5 flex-shrink-0" />}
                <span className="flex-1 text-left truncate">{category.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                  {t('aiToolsPage.title')}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('aiToolsPage.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Permission permission="ai-tool:import">
                <Button onClick={handleImport} variant="outline" className="h-9 px-4 text-sm border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Upload className="h-4 w-4 mr-1.5" />
                  {t('aiToolsPage.import')}
                </Button>
              </Permission>
              <Permission permission="ai-tool:export">
                <Button onClick={handleExport} variant="outline" className="h-9 px-4 text-sm border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Download className="h-4 w-4 mr-1.5" />
                  {t('aiToolsPage.export')}
                </Button>
              </Permission>
              <Permission permission="ai-tool:create">
                <Button onClick={handleCreateTool} className="h-9 px-4 text-sm bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md">
                  <PlusCircle className="h-4 w-4 mr-1.5" />
                  {t('aiToolsPage.createTool')}
                </Button>
              </Permission>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept=".json" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none`} />
              <Input
                placeholder={t('aiToolsPage.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isRTL ? 'pr-9' : 'pl-9'} h-9 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700`}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 h-9 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder={t('aiToolsPage.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recently_added">{t('aiToolsPage.recentlyAdded')}</SelectItem>
                <SelectItem value="most_liked">{t('aiToolsPage.mostLiked')}</SelectItem>
                <SelectItem value="most_viewed">{t('aiToolsPage.mostViewed')}</SelectItem>
                <SelectItem value="favourite_tools">{t('aiToolsPage.favouriteTools')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tool grid */}
        <ScrollArea className="flex-1 bg-slate-50 dark:bg-slate-950">
          <div className="p-6">
            {filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTools.map((tool: any) => (
                  <div
                    key={tool.id}
                    onClick={() => navigate(`/dashboard/ai-tools/${tool.id}`)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 cursor-pointer hover:border-violet-200 dark:hover:border-violet-800/60 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        {tool.category?.icon ? <i className={`${tool.category.icon} text-sm text-white`}></i> : <Wrench className="h-4 w-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{tool.name}</h3>
                        {tool.category && (
                          <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50">
                            {tool.category.name}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleFavorite(tool); }}
                        className="flex-shrink-0 p-1 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                      >
                        <Star size={13} className={tool.is_favorited ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600'} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">{tool.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                      <span className="flex items-center gap-1">
                        <Heart size={11} className={tool.is_favorited ? 'fill-red-400 text-red-400' : ''} />
                        {tool.likes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={11} />
                        {tool.views || 0}
                      </span>
                      {tool.questions?.length > 0 && (
                        <span className="flex items-center gap-1 ml-auto">
                          <Sparkles size={11} className="text-violet-400" />
                          {tool.questions.length} params
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-md">
                  <Wrench className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('aiToolsPage.noToolsFound')}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mb-5">
                  {searchTerm || selectedCategory ? t('aiToolsPage.adjustFilters') : t('aiToolsPage.noToolsYet')}
                </p>
                {!searchTerm && !selectedCategory && (
                  <Permission permission="ai-tool:create">
                    <Button onClick={handleCreateTool} className="h-9 px-4 text-sm bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md">
                      <PlusCircle className="h-4 w-4 mr-1.5" />
                      {t('aiToolsPage.createTool')}
                    </Button>
                  </Permission>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AIToolsPage;
