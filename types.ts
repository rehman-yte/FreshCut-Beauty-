
export type UserRole = 'customer' | 'barber' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  email: string;
}

export interface Barber {
  id: string;
  name: string;
  bio: string;
  image_url: string;
  specialties: string[];
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration_mins: number;
}

export type BookingStatus = 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled';

export interface Booking {
  id: string;
  customer_id: string;
  barber_id: string;
  service_id: string;
  appointment_time: string;
  status: BookingStatus;
  notes?: string;
  // Joined fields
  barber?: Barber;
  service?: Service;
  customer?: Profile;
}
