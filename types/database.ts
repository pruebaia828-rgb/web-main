export type UserRole = 'admin' | 'scanner';

export type TicketStatus = 'pending' | 'approved';

export type PaymentMethod = 'Yape' | 'Efectivo';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  price: number;
  flyer_url: string | null;
  images?: string[] | null;
  event_date: string;
  capacity: number;
  created_at: string;
}

export interface Ticket {
  id: string;
  event_id: string;
  name: string;
  email: string;
  phone: string | null;
  payment_method: PaymentMethod;
  operation_number: string | null;
  status: TicketStatus;
  qr_code: string | null;
  is_used: boolean;
  created_at: string;
}

export interface Settings {
  id: string;
  yape_number: string | null;
  updated_at: string;
}

export interface TicketWithEvent extends Ticket {
  events: Pick<Event, 'id' | 'title' | 'event_date' | 'price'>;
}

export type EventInsert = Omit<Event, 'id' | 'created_at' | 'images'>;
export type TicketInsert = Omit<Ticket, 'id' | 'created_at' | 'is_used'> & {
  is_used?: boolean;
};
export type ProfileInsert = Omit<Profile, 'created_at'>;
export type SettingsUpdate = Partial<Pick<Settings, 'yape_number'>>;
