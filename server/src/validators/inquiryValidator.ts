import { INQUIRY_SERVICES, InquiryInput, InquiryServiceType } from '../types/inquiry.js';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData?: InquiryInput;
}

function sanitizeString(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove non-printable control characters
    .trim()
    .replace(/[<>]/g, ''); // Strip angle brackets to guard against HTML/script injection
}

export function validateInquiry(input: any): ValidationResult {
  const errors: Record<string, string> = {};

  // Basic spam protection: Honeypot trap check
  const honeypot = sanitizeString(input?._hp_website || input?.website);
  if (honeypot) {
    errors._hp_website = 'Automated submission rejected.';
  }

  const name = sanitizeString(input?.name);
  const company = sanitizeString(input?.company);
  const email = sanitizeString(input?.email).toLowerCase();
  const phone = sanitizeString(input?.phone);
  const service = sanitizeString(input?.service) as InquiryServiceType;
  const message = sanitizeString(input?.message);

  // Validate Name
  if (!name) {
    errors.name = 'Full name is required.';
  } else if (name.length < 2 || name.length > 100) {
    errors.name = 'Name must be between 2 and 100 characters.';
  }

  // Validate Company
  if (!company) {
    errors.company = 'Company name is required.';
  } else if (company.length < 2 || company.length > 150) {
    errors.company = 'Company name must be between 2 and 150 characters.';
  }

  // Validate Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!emailRegex.test(email) || email.length > 255) {
    errors.email = 'Please provide a valid email address.';
  }

  // Validate Phone
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;
  if (!phone) {
    errors.phone = 'Contact number is required.';
  } else if (!phoneRegex.test(phone.replace(/\s+/g, '')) || phone.length > 30) {
    errors.phone = 'Please provide a valid phone number (e.g. +91 9045085537).';
  }

  // Validate Service
  if (!service) {
    errors.service = 'Please select a service vertical.';
  } else if (!INQUIRY_SERVICES.includes(service)) {
    errors.service = `Invalid service selection. Please choose from: ${INQUIRY_SERVICES.join(', ')}`;
  }

  // Validate Message (optional for simplified form; if provided, must not exceed 3000 chars)
  if (message && message.length > 3000) {
    errors.message = 'Requirement details cannot exceed 3000 characters.';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    sanitizedData: isValid
      ? {
          name,
          company,
          email,
          phone,
          state: sanitizeString(input?.state) || undefined,
          city: sanitizeString(input?.city) || undefined,
          service,
          message: message || undefined,
        }
      : undefined,
  };
}
