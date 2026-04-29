import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const BASE = `${API_BASE_URL}/api/v1/calendar`;
const USERS_BASE = `${API_BASE_URL}/api/v1/users`;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

export interface ApiCalEvent {
  id: number;
  title: string;
  event_type: string;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
  location?: string;
  description?: string;
  attendees?: string[];
  livekit_room_name?: string;
  recurrence_rule?: string;
  recurrence_interval?: number;
  recurrence_end_date?: string;
  parent_event_id?: number;
  user_id: number;
  company_id: number;
  created_at: string;
}

export interface CreateEventDto {
  title: string;
  event_type: string;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
  location?: string;
  description?: string;
  attendees?: string[];
  livekit_room_name?: string;
  recurrence_rule?: string;
  recurrence_interval?: number;
  recurrence_end_date?: string;
}

export interface CompanyUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  job_title?: string;
  presence_status?: string;
}

export const listCalendarEvents = async (start: Date, end: Date): Promise<ApiCalEvent[]> => {
  const r = await axios.get(`${BASE}/events`, {
    headers: headers(),
    params: { start: start.toISOString(), end: end.toISOString() },
  });
  return r.data;
};

export const createCalendarEvent = async (data: CreateEventDto): Promise<ApiCalEvent> => {
  const r = await axios.post(`${BASE}/events`, data, { headers: headers() });
  return r.data;
};

export const updateCalendarEvent = async (id: number, data: Partial<CreateEventDto>): Promise<ApiCalEvent> => {
  const r = await axios.put(`${BASE}/events/${id}`, data, { headers: headers() });
  return r.data;
};

export const deleteCalendarEvent = async (id: number): Promise<void> => {
  await axios.delete(`${BASE}/events/${id}`, { headers: headers() });
};

export const getAvailability = async (
  userIds: number[],
  start: Date,
  end: Date,
): Promise<Record<string, ApiCalEvent[]>> => {
  const r = await axios.get(`${BASE}/availability`, {
    headers: headers(),
    params: {
      user_ids: userIds.join(','),
      start: start.toISOString(),
      end: end.toISOString(),
    },
  });
  return r.data;
};

export const getCompanyUsers = async (): Promise<CompanyUser[]> => {
  const r = await axios.get(`${USERS_BASE}/`, { headers: headers() });
  return r.data;
};

export const joinMeeting = async (eventId: number): Promise<{ token: string; room_name: string; livekit_url: string; channel_id: number }> => {
  const r = await axios.post(`${BASE}/events/${eventId}/join-meeting`, {}, { headers: headers() });
  return r.data;
};

export const inviteToMeeting = async (eventId: number, userIds: number[]): Promise<{ notified: number }> => {
  const r = await axios.post(`${BASE}/events/${eventId}/invite`, { user_ids: userIds }, { headers: headers() });
  return r.data;
};
