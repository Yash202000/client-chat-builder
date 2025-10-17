

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getAITool, updateAITool, getAIToolCategories, deleteAIToolQuestion } from '@/services/aiToolService';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';

const AIToolEditPage = () => {
  const { id } = useParams();
  const [tool, setTool] = useState(null);
  const [toolName, setToolName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.is_super_admin) {
      navigate('/dashboard/ai-tools');
    }
  }, [user, navigate]);

  const fetchTool = async () => {
    const data = await getAITool(id);
    setTool(data);
    setToolName(data.name);
    setToolDescription(data.description);
    setQuestions(data.questions);
    setSelectedCategory(data.category_id);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getAIToolCategories();
      setCategories(data);
    };
    fetchTool();
    fetchCategories();
  }, [id]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { question_text: '', question_type: 'text', hint: '' }]);
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleDeleteQuestion = async (questionId: number) => {
    await deleteAIToolQuestion(questionId);
    fetchTool();
  };

  const handleSubmit = async () => {
    const updatedTool = {
      name: toolName,
      description: toolDescription,
      category_id: parseInt(selectedCategory),
      questions: questions,
    };
    await updateAITool(id, updatedTool);
    navigate(`/dashboard/ai-tools/${id}`);
  };

  if (!tool) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Edit AI Tool</h1>
      <div className="space-y-4">
        <Input placeholder="Tool Name" value={toolName} onChange={(e) => setToolName(e.target.value)} />
        <Textarea placeholder="Tool Description" value={toolDescription} onChange={(e) => setToolDescription(e.target.value)} />
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">Select a category</option>
          {categories.map((category: any) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <div>
          <h2 className="text-xl font-semibold mb-4">Questions</h2>
          {questions.map((q, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <Input
                placeholder="Question Text"
                value={q.question_text}
                onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
              />
              <Input
                placeholder="Question Type"
                value={q.question_type}
                onChange={(e) => handleQuestionChange(index, 'question_type', e.target.value)}
              />
              <Input
                placeholder="Hint"
                value={q.hint}
                onChange={(e) => handleQuestionChange(index, 'hint', e.target.value)}
              />
              <Button onClick={() => handleDeleteQuestion(q.id)} variant="destructive">Delete</Button>
            </div>
          ))}
          <Button onClick={handleAddQuestion}>Add Question</Button>
        </div>
        <Button onClick={handleSubmit}>Save Changes</Button>
      </div>
    </div>
  );
};

export default AIToolEditPage;
