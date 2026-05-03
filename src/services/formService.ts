import axios from 'axios';

const BASE = '/api/v1/forms';
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};
const h = () => ({ headers: getAuthHeaders() });

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'name';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  width: 'full' | 'half';
}

export interface FormSettings {
  submit_label: string;
  submit_message: string;
  redirect_url?: string;
  notify_email?: string;
  create_contact: boolean;
  create_lead: boolean;
  primary_color: string;
  bg_color: string;
  font_family: string;
}

export interface CaptureForm {
  id: number;
  name: string;
  description?: string;
  slug: string;
  status: string;
  fields: FormField[];
  settings: Partial<FormSettings>;
  company_id: number;
  created_at: string;
  updated_at: string;
  submission_count: number;
}

export interface FormSubmission {
  id: number;
  form_id: number;
  data: Record<string, any>;
  contact_id?: number;
  submitted_at: string;
}

export const getForms = () =>
  axios.get<CaptureForm[]>(BASE + '/', h()).then(r => r.data);

export const getForm = (id: number) =>
  axios.get<CaptureForm>(`${BASE}/${id}`, h()).then(r => r.data);

export const createForm = (data: Partial<CaptureForm>) =>
  axios.post<CaptureForm>(BASE + '/', data, h()).then(r => r.data);

export const updateForm = (id: number, data: Partial<CaptureForm>) =>
  axios.put<CaptureForm>(`${BASE}/${id}`, data, h()).then(r => r.data);

export const deleteForm = (id: number) =>
  axios.delete(`${BASE}/${id}`, h()).then(r => r.data);

export const getSubmissions = (id: number) =>
  axios.get<FormSubmission[]>(`${BASE}/${id}/submissions`, h()).then(r => r.data);

export const getPublicForm = (slug: string) =>
  axios.get<CaptureForm>(`${BASE}/public/${slug}`).then(r => r.data);

export const submitPublicForm = (slug: string, data: Record<string, any>) =>
  axios.post(`${BASE}/public/${slug}/submit`, data).then(r => r.data);
