import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CodeEditor from '@/components/CodeEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { uploadForProcessing, runProcessingCode, saveKnowledgeBase, getProcessingTemplates } from '@/services/knowledgeBaseService';

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Knowledge Base Processing</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Editor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
                Upload Document
              </label>
              <Input id="file-upload" type="file" onChange={handleFileChange} />
            </div>
            <div>
              <label htmlFor="template-select" className="block text-sm font-medium text-gray-700">
                Select Template
              </label>
              <Select onValueChange={(value) => setCode(templates.find(t => t.id === value)?.code || '')}>
                <SelectTrigger>
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
              <label htmlFor="code-editor" className="block text-sm font-medium text-gray-700">
                Processing Code
              </label>
              <div style={{ height: '400px', border: '1px solid #ccc' }}>
                <CodeEditor value={code} onChange={setCode} />
              </div>
            </div>
            <div className="flex justify-between">
              <Button>Save as Template</Button>
              <Button onClick={handleRunCode} disabled={isProcessing}>
                {isProcessing ? 'Running...' : 'Run'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                <label htmlFor="knowledge-base-name" className="block text-sm font-medium text-gray-700">
                    Knowledge Base Name
                </label>
                <Input id="knowledge-base-name" value={knowledgeBaseName} onChange={(e) => setKnowledgeBaseName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="processed-text" className="block text-sm font-medium text-gray-700">
                Processed Text
              </label>
              <Textarea id="processed-text" value={processedText} readOnly className="h-96" />
            </div>
            <Button onClick={handleSaveKnowledgeBase} className="w-full">Save Knowledge Base</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KnowledgeBaseProcessing;