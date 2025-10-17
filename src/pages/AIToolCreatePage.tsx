
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createAITool, getAIToolCategories } from '@/services/aiToolService';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AIToolCreatePage = () => {
  const [toolName, setToolName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [questions, setQuestions] = useState([{ question_text: '', question_type: 'text', hint: '' }]);
  const [result, setResult] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.is_super_admin) {
      navigate('/dashboard/ai-tools');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getAIToolCategories();
      setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleAddQuestion = () => {
    setQuestions([...questions, { question_text: '', question_type: 'text', hint: '' }]);
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async () => {
    const newTool = {
      name: toolName,
      description: toolDescription,
      category_id: parseInt(selectedCategory),
      questions: questions,
    };
    await createAITool(newTool);
    navigate('/dashboard/ai-tools');
  };

  return (
    <div className="p-8 grid grid-cols-2 gap-8">
      <div>
        <h1 className="text-2xl font-bold mb-8">Create AI Tool</h1>
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
              </div>
            ))}
            <Button onClick={handleAddQuestion}>Add Question</Button>
          </div>
          <Button onClick={handleSubmit}>Create Tool</Button>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4">Result</h2>
        <Textarea className="h-full" value={result} onChange={(e) => setResult(e.target.value)} />
      </div>
    </div>
  );
};

export default AIToolCreatePage;
