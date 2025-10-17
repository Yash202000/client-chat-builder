import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeaders = (contentType: string = 'application/json') => {
  const token = localStorage.getItem('accessToken');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': contentType,
  };
};

export const uploadForProcessing = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_URL}/api/v1/knowledge-bases/upload-for-processing`, formData, {
    headers: getAuthHeaders('multipart/form-data'),
  });
  return response.data;
};

export const runProcessingCode = async (documentId: string, code: string) => {
  const response = await axios.post(`${API_URL}/api/v1/knowledge-bases/run-processing-code`, {
    document_id: documentId,
    code: code,
  }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const saveKnowledgeBase = async (name: string, content: string) => {
  const response = await axios.post(`${API_URL}/api/v1/knowledge-bases/`, {
    name: name,
    content: content,
  }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getProcessingTemplates = async () => {
    const response = await axios.get(`${API_URL}/api/v1/processing-templates/`, {
        headers: getAuthHeaders(),
    });
    return response.data;
};
