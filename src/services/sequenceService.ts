import axios from 'axios';

const BASE = '/api/v1/sequences';
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

export interface SequenceStep {
  id?: number;
  sequence_id?: number;
  step_order: number;
  step_type: 'email' | 'sms' | 'whatsapp' | 'task' | 'wait';
  template_id?: number | null;
  delay_days: number;
  delay_hours: number;
  subject?: string;
  body?: string;
  condition: 'always' | 'if_not_opened' | 'if_not_clicked' | 'if_not_replied';
  task_note?: string;
  template?: { id: number; name: string; template_type: string };
}

export interface SequenceStats {
  total_enrollments: number;
  active: number;
  completed: number;
  paused: number;
  failed: number;
}

export interface Sequence {
  id: number;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  goal?: string;
  tags: string[];
  company_id: number;
  created_by_user_id?: number;
  created_at: string;
  updated_at: string;
  steps: SequenceStep[];
  stats?: SequenceStats;
}

export interface SequenceListItem {
  id: number;
  name: string;
  description?: string;
  status: string;
  goal?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  step_count: number;
  stats?: SequenceStats;
}

export interface SequenceCreate {
  name: string;
  description?: string;
  status?: string;
  goal?: string;
  tags?: string[];
  steps?: Omit<SequenceStep, 'id' | 'sequence_id' | 'template'>[];
}

export interface SequenceUpdate {
  name?: string;
  description?: string;
  status?: string;
  goal?: string;
  tags?: string[];
  steps?: Omit<SequenceStep, 'id' | 'sequence_id' | 'template'>[];
}

export interface SequenceEnrollment {
  id: number;
  sequence_id: number;
  contact_id: number;
  status: string;
  current_step: number;
  enrolled_at: string;
  next_send_at?: string;
  completed_at?: string;
  contact?: { id: number; first_name?: string; last_name?: string; email?: string };
}

const h = () => ({ headers: getAuthHeaders() });

export const getSequences = (status?: string) =>
  axios.get<SequenceListItem[]>(BASE + '/', { ...h(), params: status ? { status } : {} }).then(r => r.data);

export const getSequence = (id: number) =>
  axios.get<Sequence>(`${BASE}/${id}`, h()).then(r => r.data);

export const createSequence = (data: SequenceCreate) =>
  axios.post<Sequence>(BASE + '/', data, h()).then(r => r.data);

export const updateSequence = (id: number, data: SequenceUpdate) =>
  axios.put<Sequence>(`${BASE}/${id}`, data, h()).then(r => r.data);

export const deleteSequence = (id: number) =>
  axios.delete(`${BASE}/${id}`, h()).then(r => r.data);

export const getEnrollments = (sequenceId: number, status?: string) =>
  axios.get<SequenceEnrollment[]>(`${BASE}/${sequenceId}/enrollments`, { ...h(), params: status ? { status } : {} }).then(r => r.data);

export const enrollContacts = (sequenceId: number, contactIds: number[]) =>
  axios.post<SequenceEnrollment[]>(`${BASE}/${sequenceId}/enroll`, { contact_ids: contactIds }, h()).then(r => r.data);

export const updateEnrollmentStatus = (sequenceId: number, enrollmentId: number, status: string) =>
  axios.patch(`${BASE}/${sequenceId}/enrollments/${enrollmentId}`, null, { ...h(), params: { status } }).then(r => r.data);

export const unenrollContact = (sequenceId: number, enrollmentId: number) =>
  axios.delete(`${BASE}/${sequenceId}/enrollments/${enrollmentId}`, h()).then(r => r.data);
