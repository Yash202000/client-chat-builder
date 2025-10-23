import axios from 'axios';
import { User } from '@/types/user';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL;

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
