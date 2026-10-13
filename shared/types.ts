export type InquiryServiceType =
  | 'Workforce Management Solutions'
  | 'Guaranteed Saving Program'
  | 'Experts Training for Industries'
  | 'Self-Paced Learning & Video Solutions';

export const INQUIRY_SERVICES: readonly InquiryServiceType[] = [
  'Workforce Management Solutions',
  'Guaranteed Saving Program',
  'Experts Training for Industries',
  'Self-Paced Learning & Video Solutions',
] as const;

export interface InquiryInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  state?: string;
  city?: string;
  service: InquiryServiceType;
  message?: string;
  _hp_website?: string;
}

export interface InquiryRecord extends InquiryInput {
  id: number;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
}
