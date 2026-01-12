
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
  is_online: boolean; // Uber-style online/offline status
  location_city?: string;
  rating?: number;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration_mins: number;
  category: Category;
}

// Uber-style granular statuses
export type BookingStatus = 'searching' | 'accepted' | 'in-progress' | 'completed' | 'rejected' | 'cancelled';

export interface Booking {
  id: string;
  customer_id: string;
  professional_id: string;
  service_id: string;
  appointment_time: string;
  status: BookingStatus;
  notes?: string;
  created_at: string;
  // Joined fields
  professional?: Professional;
  service?: Service;
  customer?: Profile;
}

export interface PartnerRequest {
  id: string;
  shop_name: string;
  owner_name: string;
  phone: string;
  city: string;
  services: string;
  category: Category;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface ActivityNotification {
  id: string;
  type: string;
  message: string;
  reference_id: string;
  is_read: boolean;
  created_at: string;
}
