
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
