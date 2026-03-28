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

export const getEmailSessions = async () => {
  const response = await axios.get(`${API_URL}/api/v1/conversations/sessions`, {
    headers: getAuthHeaders(),
    params: { channel: 'gmail' },
  });
  return response.data;
};

export const composeEmail = async (data: {
  to: string[];
  subject: string;
  body: string;
  contact_id?: number;
  cc?: string[];
  bcc?: string[];
}) => {
  const response = await axios.post(`${API_URL}/api/v1/email/compose`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const replyEmail = async (sessionId: string, body: string) => {
  const response = await axios.post(
    `${API_URL}/api/v1/email/reply/${sessionId}`,
    { body },
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
