export type InquiryServiceType =
  | 'Workforce Management Solutions'
  | 'Guaranteed Saving Program'
  | 'Experts Training for Industries'
  | 'Self-Paced Learning & Video Solutions'
  | 'Industrial / Corporate Video Solutions';

export const INQUIRY_SERVICES: readonly InquiryServiceType[] = [
  'Workforce Management Solutions',
  'Guaranteed Saving Program',
  'Experts Training for Industries',
  'Self-Paced Learning & Video Solutions',
  'Industrial / Corporate Video Solutions',
] as const;

export interface InquiryFormData {
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
}
