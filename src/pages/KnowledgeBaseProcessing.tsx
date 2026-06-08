import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CodeEditor from '@/components/CodeEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { uploadForProcessing, runProcessingCode, saveKnowledgeBase, getProcessingTemplates } from '@/services/knowledgeBaseService';
import { Cpu, Play, Save } from 'lucide-react';

const defaultCode = `
# Use 'raw_text' variable to access the document's content.
# Assign the processed text to the 'processed_text' variable.

processed_text = raw_text.upper()
`.trim();

const KnowledgeBaseProcessing: React.FC = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [code, setCode] = useState<string>(defaultCode);
  const [processedText, setProcessedText] = useState<string>('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [knowledgeBaseName, setKnowledgeBaseName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const response = await apiClient.post('/knowledge-bases/upload-for-processing', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setDocumentId(response.data.document_id);
        setRawText(response.data.text_content);
        setProcessedText('');
      } catch (error) {
        toast({ title: "Error uploading file", description: "Please try again.", variant: "destructive" });
      }
    }
  };

  const handleRunCode = async () => {
    if (!documentId) {
      toast({ title: "No document uploaded", description: "Please upload a document first.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const response = await apiClient.post('/knowledge-bases/run-processing-code', { document_id: documentId, code });
      setProcessedText(response.data.processed_text);
    } catch (error) {
      toast({ title: "Error running code", description: "Please check your code and try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveKnowledgeBase = async () => {
    if (!processedText) {
      toast({ title: "No processed text", description: "Please run the processing script first.", variant: "destructive" });
      return;
    }
    if (!knowledgeBaseName) {
        toast({ title: "Name is required", description: "Please provide a name for the knowledge base.", variant: "destructive" });
        return;
    }
    try {
      await apiClient.post('/knowledge-bases/', { name: knowledgeBaseName, content: processedText });
      toast({ title: "Knowledge base saved successfully" });
    } catch (error) {
      toast({ title: "Error saving knowledge base", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-full app-surface">
      {/* Header bar */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/25">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 bg-clip-text text-transparent leading-tight">
                Knowledge Base Processing
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Upload a document and apply custom Python processing before saving</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Panel - Editor */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-800 dark:text-white">Editor</span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label htmlFor="file-upload" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Upload Document
                </label>
                <Input id="file-upload" type="file" onChange={handleFileChange} className="dark:bg-slate-800 dark:border-slate-700" />
              </div>
              <div>
                <label htmlFor="template-select" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Select Template
                </label>
                <Select onValueChange={(value) => setCode(templates.find(t => t.id === value)?.code || '')}>
                  <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="code-editor" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Processing Code
                </label>
                <div style={{ height: '360px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <CodeEditor value={code} onChange={setCode} />
                </div>
              </div>
              <div className="flex justify-between pt-1">
                <Button variant="outline" className="text-sm dark:border-slate-700">
                  Save as Template
                </Button>
                <Button
                  onClick={handleRunCode}
                  disabled={isProcessing}
                  className="text-sm bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-md shadow-indigo-500/25"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  {isProcessing ? 'Running...' : 'Run Code'}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-800 dark:text-white">Preview & Save</span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label htmlFor="knowledge-base-name" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Knowledge Base Name
                </label>
                <Input
                  id="knowledge-base-name"
                  value={knowledgeBaseName}
                  onChange={(e) => setKnowledgeBaseName(e.target.value)}
                  placeholder="Enter a name for this knowledge base"
                  className="dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
              <div>
                <label htmlFor="processed-text" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Processed Text
                </label>
                <Textarea id="processed-text" value={processedText} readOnly className="h-80 font-mono text-xs dark:bg-slate-800 dark:border-slate-700 resize-none" />
              </div>
              <Button
                onClick={handleSaveKnowledgeBase}
                className="w-full text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/25"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save Knowledge Base
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseProcessing;