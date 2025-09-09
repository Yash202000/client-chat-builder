export interface User {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  presence_status: string;
  profile_picture_url?: string;
}
