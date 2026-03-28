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

export const getSMSSessions = async () => {
  const response = await axios.get(`${API_URL}/api/v1/conversations/sessions`, {
    headers: getAuthHeaders(),
    params: { channel: 'sms' },
  });
  return response.data;
};

export const sendSMS = async (data: {
  contact_id: number;
  message: string;
  template_id?: number;
}) => {
  const response = await axios.post(`${API_URL}/api/v1/sms/send`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const replySMS = async (sessionId: string, message: string) => {
  const response = await axios.post(
    `${API_URL}/api/v1/sms/reply/${sessionId}`,
    { message },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const getSessionMessages = async (sessionId: string) => {
  const response = await axios.get(
    `${API_URL}/api/v1/conversations/sessions/${sessionId}/messages`,
    { headers: getAuthHeaders() }
  );
  return response.data;
};
