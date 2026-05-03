import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAITool, favoriteAITool, unfavoriteAITool, deleteAITool, executeAITool } from '@/services/aiToolService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import { Permission } from '@/components/Permission';
import {
  ArrowLeft, Heart, Eye, Star, Trash2, Edit, Settings, Sparkles,
  Play, Copy, CheckCircle, Loader2, AlertCircle, ChevronDown, ChevronUp,
  Wrench, Globe, Info
} from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { toast } from 'sonner';

const AIToolDetailPage = () => {
  const { t, isRTL } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tool, setTool] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchTool = async () => {
      try {
        const data = await getAITool(id);
        setTool(data);
      } catch (error) {
        toast.error('Failed to load tool');
        navigate('/dashboard/ai-tools');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTool();
  }, [id]);

  const handleFavorite = async () => {
    try {
      if (tool.is_favorited) {
        await unfavoriteAITool(tool.id);
        toast.success('Removed from favorites');
      } else {
        await favoriteAITool(tool.id);
        toast.success('Added to favorites');
      }
      const data = await getAITool(id);
      setTool(data);
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSubmit = async () => {
    try {
      setIsExecuting(true);
      setResult('');
      const response = await executeAITool(tool.id, answers, language);
      setResult(response.result);
      toast.success('Tool executed successfully!');
    } catch (error) {
      toast.error('Failed to execute tool');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this tool? This action cannot be undone.')) {
      try {
        await deleteAITool(tool.id);
        toast.success('Tool deleted successfully');
        navigate('/dashboard/ai-tools');
      } catch (error) {
        toast.error('Failed to delete tool');
      }
    }
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Result copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!tool) {
    return null;
  }

  const canExecute = tool.questions?.every((q: any) => answers[q.id]?.trim());

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/ai-tools')} className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                {tool.category?.icon ? <i className={`${tool.category.icon} text-base text-white`}></i> : <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">{tool.name}</h1>
                  {tool.category && (
                    <Badge variant="secondary" className="bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50 flex-shrink-0 hidden sm:inline-flex">
                      {tool.category.name}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1"><Heart size={11} className={tool.is_favorited ? 'fill-red-400 text-red-400' : ''} />{tool.likes || 0}</span>
                  <span className="flex items-center gap-1"><Eye size={11} />{tool.views || 0}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleFavorite} className="h-8 px-2 sm:px-3 text-xs border-slate-200 dark:border-slate-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
                <Star size={13} className={`${tool.is_favorited ? 'fill-yellow-400 text-yellow-400' : ''} sm:mr-1`} />
                <span className="hidden sm:inline">{tool.is_favorited ? 'Favorited' : 'Favorite'}</span>
              </Button>
              <Permission permission="ai-tool:update">
                <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/ai-tools/${id}/edit`)} className="h-8 px-2 sm:px-3 text-xs border-slate-200 dark:border-slate-700 hover:bg-violet-50 dark:hover:bg-violet-900/20">
                  <Edit size={13} className="sm:mr-1" /><span className="hidden sm:inline">Edit</span>
                </Button>
              </Permission>
              <Permission permission="ai-tool:delete">
                <Button variant="outline" size="sm" onClick={handleDelete} className="h-8 px-2 sm:px-3 text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 size={13} className="sm:mr-1" /><span className="hidden sm:inline">Delete</span>
                </Button>
              </Permission>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* About card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                  <Info className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">About This Tool</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{tool.description}</p>
                </div>
              </div>
            </div>

            {/* Input Parameters card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">Input Parameters</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Fill in the required information to generate results</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {tool.questions && tool.questions.length > 0 ? (
                  tool.questions.map((q: any, index: number) => (
                    <div key={q.id} className="space-y-1.5">
                      <Label htmlFor={`question-${q.id}`} className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        {q.question_text}
                      </Label>
                      {q.hint && <p className="text-xs text-slate-400 dark:text-slate-500 ml-7">{q.hint}</p>}
                      <Textarea
                        id={`question-${q.id}`}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder={q.hint || `Enter answer for question ${index + 1}...`}
                        className="ml-7 dark:bg-slate-800 dark:border-slate-700 min-h-[90px] resize-y text-sm"
                      />
                    </div>
                  ))
                ) : (
                  <Alert className="border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-900/10">
                    <Info className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <AlertDescription className="text-violet-800 dark:text-violet-300 text-sm">
                      This tool doesn't require any input parameters.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full justify-between h-8 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className="flex items-center gap-2"><Settings size={13} /><span>Advanced Settings</span></div>
                    {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </Button>
                  {showAdvanced && (
                    <div className="mt-3 space-y-2">
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Globe size={12} />Output Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="h-8 text-sm dark:bg-slate-800 dark:border-slate-700"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                          <SelectItem value="ar">Arabic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <Button onClick={handleSubmit} disabled={!canExecute || isExecuting} className="w-full h-9 text-sm bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md disabled:opacity-50">
                  {isExecuting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Play className="h-4 w-4 mr-2" />Execute Tool</>}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden lg:sticky lg:top-6">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Generated Result</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{result ? 'Your AI-generated output' : 'Results will appear here'}</p>
                  </div>
                </div>
                {result && (
                  <Button variant="outline" size="sm" onClick={handleCopyResult} className="h-7 text-xs border-slate-200 dark:border-slate-700">
                    {copied ? <><CheckCircle size={12} className="mr-1 text-green-600" />Copied!</> : <><Copy size={12} className="mr-1" />Copy</>}
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[300px] sm:h-[500px] lg:h-[600px]">
                {result ? (
                  <div className="p-5">
                    <div className="prose prose-slate dark:prose-invert max-w-none text-sm">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-3 dark:text-white" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 dark:text-white" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-base font-semibold mb-2 dark:text-white" {...props} />,
                          p: ({node, ...props}) => <p className="mb-3 text-slate-700 dark:text-slate-300 leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 dark:text-slate-300" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1 dark:text-slate-300" {...props} />,
                          code: ({node, inline, ...props}) =>
                            inline ? (
                              <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 text-xs font-mono" {...props} />
                            ) : (
                              <code className="block p-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono overflow-x-auto" {...props} />
                            ),
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-violet-500 pl-4 italic my-3 text-slate-600 dark:text-slate-400" {...props} />,
                        }}
                      >
                        {result}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                      <Sparkles className="h-7 w-7 text-violet-500 dark:text-violet-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">No Results Yet</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">Fill in the parameters and click "Execute Tool" to generate AI-powered results</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIToolDetailPage;