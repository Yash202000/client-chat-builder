
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAITool, favoriteAITool, unfavoriteAITool, deleteAITool, executeAITool } from '@/services/aiToolService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';

const AIToolDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tool, setTool] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const fetchTool = async () => {
      const data = await getAITool(id);
      setTool(data);
    };
    fetchTool();
  }, [id]);

  const handleFavorite = async () => {
    if (tool.is_favorited) {
      await unfavoriteAITool(tool.id);
    } else {
      await favoriteAITool(tool.id);
    }
    const data = await getAITool(id);
    setTool(data);
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSubmit = async () => {
    const response = await executeAITool(tool.id, answers, language);
    setResult(response.result);
  };

  const handleDelete = async () => {
    await deleteAITool(tool.id);
    navigate('/dashboard/ai-tools');
  };

  if (!tool) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8 grid grid-cols-2 gap-8">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{tool.name}</h1>
          <div className="flex gap-2">
            {user?.is_super_admin && (
              <>
                <Button onClick={() => navigate(`/dashboard/ai-tools/${id}/edit`)}>Edit</Button>
                <Button onClick={handleDelete} variant="destructive">Delete</Button>
              </>
            )}
            <Button onClick={handleFavorite}>
              {tool.is_favorited ? 'Unfavorite' : 'Favorite'}
            </Button>
          </div>
        </div>
        <p className="mb-8">{tool.description}</p>

        <div>
          <h2 className="text-xl font-semibold mb-4">Questions</h2>
          {tool.questions.map((q: any) => (
            <div key={q.id} className="mb-4">
              <label className="block mb-2">{q.question_text}</label>
              <Input
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                placeholder={q.hint}
              />
            </div>
          ))}
          <div className="flex items-center justify-between mt-4">
            <Button onClick={() => setShowAdvanced(!showAdvanced)}>Advanced Settings</Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </div>
          {showAdvanced && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Language</h3>
              <Select onValueChange={setLanguage} defaultValue={language}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4">Result</h2>
        {result && (
          <div
            className="h-full w-full p-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm overflow-auto"
          >
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIToolDetailPage;
