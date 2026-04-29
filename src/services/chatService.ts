
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

export const createChannel = async (channelData: { name?: string | null; description?: string; channel_type: string; team_id?: number; member_ids?: number[] }) => {
  const response = await axios.post(`${API_URL}/api/v1/chat/channels/`, channelData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const renameChannel = async (channelId: number, name: string) => {
  const response = await axios.patch(`${API_URL}/api/v1/chat/channels/${channelId}`, { name }, {
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

export const createChannelMessage = async (channelId: number, content: string, isActivity = false) => {
  const response = await axios.post(
    `${API_URL}/api/v1/chat/channels/${channelId}/messages`,
    { content, is_activity: isActivity },
    { headers: getAuthHeaders() },
  );
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
    { params: { query }, headers: getAuthHeaders() }
  );
  return response.data;
};

export const searchAllChannels = async (query: string, limit = 30): Promise<any[]> => {
  const response = await axios.get(
    `${API_URL}/api/v1/chat/search`,
    { params: { query, limit }, headers: getAuthHeaders() }
  );
  return response.data;
};

export const shareDriveFile = async (channelId: number, driveItemId: number, content = '') => {
  const response = await axios.post(
    `${API_URL}/api/v1/chat/channels/${channelId}/share-drive-file`,
    { drive_item_id: driveItemId, content },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Scheduled messages
export const createScheduledMessage = async (channelId: number, content: string, scheduledAt: Date) => {
  const response = await axios.post(
    `${API_URL}/api/v1/chat/channels/${channelId}/messages`,
    { content, scheduled_at: scheduledAt.toISOString() },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const getScheduledMessages = async () => {
  const response = await axios.get(`${API_URL}/api/v1/chat/scheduled`, { headers: getAuthHeaders() });
  return response.data;
};

export const cancelScheduledMessage = async (messageId: number) => {
  const response = await axios.delete(`${API_URL}/api/v1/chat/scheduled/${messageId}`, { headers: getAuthHeaders() });
  return response.data;
};

// Pinned messages
export const getPinnedMessages = async (channelId: number) => {
  const response = await axios.get(`${API_URL}/api/v1/chat/channels/${channelId}/pins`, { headers: getAuthHeaders() });
  return response.data;
};

export const pinMessage = async (channelId: number, messageId: number) => {
  const response = await axios.post(
    `${API_URL}/api/v1/chat/channels/${channelId}/pins`,
    null,
    { params: { message_id: messageId }, headers: getAuthHeaders() }
  );
  return response.data;
};

export const unpinMessage = async (channelId: number, messageId: number) => {
  const response = await axios.delete(`${API_URL}/api/v1/chat/channels/${channelId}/pins/${messageId}`, { headers: getAuthHeaders() });
  return response.data;
};

// Read receipts
export const markChannelRead = async (channelId: number) => {
  const response = await axios.post(`${API_URL}/api/v1/chat/channels/${channelId}/read`, null, { headers: getAuthHeaders() });
  return response.data;
};

export const getChannelReadSummary = async (channelId: number): Promise<Record<string, { id: number; first_name?: string; last_name?: string; email: string; profile_picture_url?: string }[]>> => {
  const response = await axios.get(`${API_URL}/api/v1/chat/channels/${channelId}/read-summary`, { headers: getAuthHeaders() });
  return response.data;
};

// User status / DND
export const updateUserStatus = async (params: {
  presence_status?: string;
  status_message?: string;
  dnd_minutes?: number;
}) => {
  const response = await axios.patch(`${API_URL}/api/v1/chat/status`, params, { headers: getAuthHeaders() });
  return response.data;
};

// Forward a message to another channel (sends new message with attribution)
export const forwardMessage = async (targetChannelId: number, originalContent: string, originalSenderName: string) => {
  const content = `> Forwarded from **${originalSenderName}**:\n> ${originalContent.split('\n').join('\n> ')}`;
  const response = await axios.post(
    `${API_URL}/api/v1/chat/channels/${targetChannelId}/messages`,
    { content },
    { headers: getAuthHeaders() }
  );
  return response.data;
};
