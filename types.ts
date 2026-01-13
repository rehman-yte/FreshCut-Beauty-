export type UserRole = 'customer' | 'professional' | 'admin';
export type Category = 'gents' | 'ladies';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  email: string;
  mobile?: string;
  avatar_url?: string;
  status: 'active' | 'suspended' | 'pending' | 'draft';
  otp_verified: boolean;
  email_verified: boolean;
  pan_verified: boolean;
  pan_number?: string;
  pan_url?: string;
  shop_image_url?: string;
}

export interface Professional {
  id: string;
  name: string;
  bio: string;
  image_url: string;
  specialties: string[];
  category: Category;
  is_online: boolean; 
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  location_city?: string;
  trust_score: number;
  owner_id: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration_mins: number;
  category: Category;
  professional_id?: string;
}

export type BookingStatus = 'searching' | 'accepted' | 'locked' | 'booked' | 'in-progress' | 'completed' | 'rejected' | 'cancelled';

export interface Booking {
  id: string;
  customer_id: string;
  professional_id: string | null;
  service_id: string;
  appointment_time: string;
  status: BookingStatus;
  notes?: string;
  created_at: string;
  professional?: Professional;
  service?: Service;
  customer?: Profile;
}

export interface ActivityNotification {
  id: string;
  type: string;
  actor_role: UserRole;
  message: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}