
export type UserRole = 'customer' | 'professional' | 'admin';
export type Category = 'gents' | 'ladies';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  email: string;
  is_partner_approved?: boolean;
}

export interface Professional {
  id: string;
  name: string;
  bio: string;
  image_url: string;
  specialties: string[];
  category: Category;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration_mins: number;
  category: Category;
}

export type BookingStatus = 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled';

export interface Booking {
  id: string;
  customer_id: string;
  professional_id: string;
  service_id: string;
  appointment_time: string;
  status: BookingStatus;
  notes?: string;
  // Joined fields
  professional?: Professional;
  service?: Service;
  customer?: Profile;
}
