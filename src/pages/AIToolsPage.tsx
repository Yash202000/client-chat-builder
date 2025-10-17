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
import { Heart, Eye, PlusCircle, Upload, Download, Wrench, Search, Star } from 'lucide-react';

const AIToolsPage = () => {
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
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <Wrench className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Categories
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Browse by category</p>
        </div>

        {user?.is_super_admin && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-teal-50 dark:bg-teal-900/20">
            <p className="text-xs font-semibold text-teal-900 dark:text-teal-100 mb-3">CREATE CATEGORY</p>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white text-sm"
              />
              <Input
                placeholder="Icon class..."
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white text-sm"
              />
              <Button onClick={handleCreateCategory} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                <PlusCircle className="h-3 w-3 mr-1" />
                Create
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 p-4">
          <ul className="space-y-1">
            <li
              onClick={() => setSelectedCategory(null)}
              className={`p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer font-medium transition-colors ${
                selectedCategory === null ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-900 dark:text-teal-100' : 'dark:text-gray-300'
              }`}
            >
              All Tools
            </li>
            {categories.map((category: any) => (
              <li
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer font-medium transition-colors ${
                  selectedCategory === category.id ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-900 dark:text-teal-100' : 'dark:text-gray-300'
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
        <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                🛠️ AI Tools
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Discover and manage AI-powered tools</p>
            </div>
            {user?.is_super_admin && (
              <div className="flex gap-2">
                <Button onClick={handleImport} variant="outline" size="sm" className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </Button>
                <Button onClick={handleExport} variant="outline" size="sm" className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button onClick={handleCreateTool} className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white" size="sm">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Create Tool
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept=".json"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 dark:bg-slate-900 dark:border-slate-600 dark:text-white">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                <SelectItem value="recently_added" className="dark:text-white dark:focus:bg-slate-700">Recently Added</SelectItem>
                <SelectItem value="most_liked" className="dark:text-white dark:focus:bg-slate-700">Most Liked</SelectItem>
                <SelectItem value="most_viewed" className="dark:text-white dark:focus:bg-slate-700">Most Viewed</SelectItem>
                <SelectItem value="favourite_tools" className="dark:text-white dark:focus:bg-slate-700">Favourite Tools</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
              {filteredTools.map((tool: any) => (
                <Card key={tool.id} className="hover:shadow-xl transition-all duration-300 flex flex-col border-slate-200 dark:border-slate-700 dark:bg-slate-800 overflow-hidden group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        {tool.category && <i className={`${tool.category.icon} text-2xl text-teal-600 dark:text-teal-400`}></i>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold dark:text-white leading-tight">{tool.name}</CardTitle>
                        {tool.category && (
                          <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">{tool.category.name}</p>
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-sm dark:text-gray-400 line-clamp-2">{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-700">
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
                        className="h-8 px-3 dark:hover:bg-slate-700"
                      >
                        <Star size={16} className={`${tool.is_favorited ? 'fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400' : 'dark:text-gray-400'}`} />
                      </Button>
                    </div>
                    <NavLink to={`/dashboard/ai-tools/${tool.id}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:bg-gradient-to-r hover:from-teal-600 hover:to-emerald-600 hover:text-white hover:border-transparent transition-all">
                        View Tool
                      </Button>
                    </NavLink>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 rounded-full flex items-center justify-center mb-4">
                <Wrench className="h-10 w-10 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No tools found</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                {searchTerm || selectedCategory ? 'Try adjusting your search or filters' : 'No AI tools available yet'}
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default AIToolsPage;
