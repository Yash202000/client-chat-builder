import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export interface ImageGenerationParams {
  prompt: string;
  provider: 'openai' | 'gemini';
  size?: string;
  quality?: string;
  style?: string;
}

export const generateImage = async (params: ImageGenerationParams) => {
  const response = await axios.post(`${API_URL}/api/v1/ai-images/`, params, {
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
