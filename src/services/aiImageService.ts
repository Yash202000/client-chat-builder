
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const generateImage = async (prompt: string, params: any) => {
  const response = await axios.post(`${API_URL}/api/v1/ai-images/`, { prompt, generation_params: params }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getImages = async () => {
  const response = await axios.get(`${API_URL}/api/v1/ai-images/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteImage = async (imageId: number) => {
  const response = await axios.delete(`${API_URL}/api/v1/ai-images/${imageId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
