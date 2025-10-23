
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

export const postChatMessage = async (message: string, conversationId?: string, agentId?: number) => {
  const response = await axios.post(`${API_URL}/api/v1/ai-chat/`, { message, conversation_id: conversationId, agent_id: agentId }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
