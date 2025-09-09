import axios from 'axios';
import { User } from '@/types/user';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const getUsers = async (): Promise<User[]> => {
  const response = await axios.get(`${API_URL}/api/v1/users/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
