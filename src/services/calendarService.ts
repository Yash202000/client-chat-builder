import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const BASE = `${API_BASE_URL}/api/v1/calendar`;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

export interface ApiCalEvent {
  id: number;
  title: string;
  event_type: string;
  start_time: string;
  end_time: string;
  description?: string;
  attendees?: string[];
  user_id: number;
  created_at: string;
}

export interface CreateEventDto {
  title: string;
  event_type: string;
  start_time: string;
  end_time: string;
  description?: string;
  attendees?: string[];
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
