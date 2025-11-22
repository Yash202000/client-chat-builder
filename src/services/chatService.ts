
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

// Channel API calls
export const getChannels = async () => {
  const response = await axios.get(`${API_URL}/api/v1/chat/channels/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createChannel = async (channelData: { name: string; description?: string; channel_type: string; team_id?: number }) => {
  const response = await axios.post(`${API_URL}/api/v1/chat/channels/`, channelData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Message API calls
export const getChannelMessages = async (channelId: number) => {
  const response = await axios.get(`${API_URL}/api/v1/chat/channels/${channelId}/messages`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createChannelMessage = async (channelId: number, content: string) => {
  const response = await axios.post(`${API_URL}/api/v1/chat/channels/${channelId}/messages`, { content }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};



// Membership API calls
export const joinChannel = async (channelId: number) => {
  const response = await axios.post(`${API_URL}/api/v1/chat/channels/${channelId}/join`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const leaveChannel = async (channelId: number) => {
  const response = await axios.post(`${API_URL}/api/v1/chat/channels/${channelId}/leave`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getChannelMembers = async (channelId: number) => {
  const response = await axios.get(`${API_URL}/api/v1/chat/channels/${channelId}/members`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const addChannelMember = async (channelId: number, userId: number) => {
  const response = await axios.post(`${API_URL}/api/v1/chat/channels/${channelId}/members`, { user_id: userId }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const removeChannelMember = async (channelId: number, userId: number) => {
  const response = await axios.delete(`${API_URL}/api/v1/chat/channels/${channelId}/members/${userId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// File upload API calls
export const uploadFile = async (file: File, messageId?: number, channelId?: number) => {
  const formData = new FormData();
  formData.append('file', file);
  if (messageId) formData.append('message_id', messageId.toString());
  if (channelId) formData.append('channel_id', channelId.toString());

  const token = localStorage.getItem('accessToken');
  const response = await axios.post(`${API_URL}/api/v1/chat/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// File upload for conversations (broadcasts via WebSocket, doesn't save to S3)
export const uploadConversationFile = async (file: File, sessionId: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('session_id', sessionId);

  const token = localStorage.getItem('accessToken');
  const response = await axios.post(`${API_URL}/api/v1/chat/conversation/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const downloadFile = async (fileKey: string) => {
  const token = localStorage.getItem('accessToken');
  const response = await axios.get(`${API_URL}/api/v1/chat/download/${fileKey}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'blob',
  });
  return response.data;
};

// Thread replies API calls
export const getMessageReplies = async (messageId: number) => {
  const response = await axios.get(`${API_URL}/api/v1/chat/messages/${messageId}/replies`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createMessageReply = async (parentMessageId: number, content: string, channelId: number) => {
  const response = await axios.post(
    `${API_URL}/api/v1/chat/channels/${channelId}/messages`,
    {
      content,
      parent_message_id: parentMessageId,
    },
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

// Reactions API calls
export const addReaction = async (messageId: number, emoji: string) => {
  const response = await axios.post(
    `${API_URL}/api/v1/chat/messages/${messageId}/reactions`,
    null,
    {
      params: { emoji },
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

export const removeReaction = async (messageId: number, emoji: string) => {
  const response = await axios.delete(
    `${API_URL}/api/v1/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};

// Search API calls
export const searchMessages = async (channelId: number, query: string) => {
  const response = await axios.get(
    `${API_URL}/api/v1/chat/channels/${channelId}/search`,
    {
      params: { query },
      headers: getAuthHeaders(),
    }
  );
  return response.data;
};
