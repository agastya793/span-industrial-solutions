import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
} from 'lucide-react';
import { INQUIRY_SERVICES, type InquiryFormData, type InquiryServiceType } from '../types/inquiry';

interface ContactProps {
  selectedServicePreload?: InquiryServiceType;
}

export const Contact: React.FC<ContactProps> = ({ selectedServicePreload }) => {
  const [formData, setFormData] = useState<InquiryFormData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    service: selectedServicePreload || 'Workforce Management Solutions',
    _hp_website: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync selected service if updated from other section CTAs
  useEffect(() => {
    if (selectedServicePreload) {
      setFormData((prev) => ({ ...prev, service: selectedServicePreload }));
    }
  }, [selectedServicePreload]);

  const validateField = (name: keyof InquiryFormData, val: string = ''): string => {
    const trimmed = (val || '').trim();
    switch (name) {
      case 'name':
        if (!trimmed) return 'Full name is required.';
        if (trimmed.length < 2) return 'Name must be at least 2 characters.';
        return '';
      case 'company':
        if (!trimmed) return 'Company / Industrial Organization name is required.';
        if (trimmed.length < 2) return 'Company name must be at least 2 characters.';
        return '';
      case 'email':
        if (!trimmed) return 'Work email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return 'Please enter a valid corporate email address.';
        }
        return '';
      case 'phone':
        if (!trimmed) return 'Contact telephone or mobile number is required.';
        if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/.test(trimmed.replace(/\s+/g, ''))) {
          return 'Please enter a valid phone number (e.g. +91 9045085537).';
        }
        return '';
      case 'service':
        if (!trimmed) return 'Please select a service vertical.';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const err = validateField(name as keyof InquiryFormData, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name as keyof InquiryFormData, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(null);
    setSubmitError(null);

    // Validate the five required fields
    const newErrors: Record<string, string> = {};
    const fieldKeys: (keyof InquiryFormData)[] = [
      'name',
      'company',
      'email',
      'phone',
      'service',
    ];
    let hasError = false;

    fieldKeys.forEach((key) => {
      const err = validateField(key, formData[key] || '');
      if (err) {
        newErrors[key] = err;
        hasError = true;
      }
    });

    setTouched({
      name: true,
      company: true,
      email: true,
      phone: true,
      service: true,
    });
    setErrors(newErrors);

    if (hasError) {
      setSubmitError('Please address the highlighted fields before submitting.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.errors) {
          setErrors(result.errors);
        }
        throw new Error(result.message || 'Failed to submit inquiry.');
      }

      setSubmitSuccess(
        result.message ||
          'Thank you. Your inquiry has been successfully registered. Our solutions team will review and contact you shortly.'
      );
      // Reset form
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        service: selectedServicePreload || 'Workforce Management Solutions',
        _hp_website: '',
      });
      setTouched({});
      setErrors({});
    } catch (err: any) {
      setSubmitError(
        err.message || 'Network error encountered. Please check your connection or email us directly at INFOSPAN.UKD@gmail.com.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="contact" className="section has-atmosphere" aria-label="Contact SPAN Industrial Solutions">
      {/* Background Visual Atmosphere (Connectivity Waves, Dual Luminous Glows, Pulse Particles) */}
      <div className="contact-atmosphere" aria-hidden="true">
        <div className="contact-radar-wave wave-1" />
        <div className="contact-radar-wave wave-2" />
        <div className="contact-glow-berry" />
        <div className="contact-glow-blue" />
        <div className="contact-light-ray" />
        <div className="contact-bubble cb-1" />
        <div className="contact-bubble cb-2" />
        <div className="contact-particle cp-1" />
        <div className="contact-particle cp-2" />
        <div className="contact-particle cp-3" />
        <div className="grid-crosshair crosshair-tl">+</div>
        <div className="grid-crosshair crosshair-tr">+</div>
        <div className="grid-crosshair crosshair-bl">+</div>
        <div className="grid-crosshair crosshair-br">+</div>
      </div>

      <div className="container section-content-layer">
        <div className="section-header">
          <span className="section-tag">Direct Communication</span>
          <h2 className="section-title">Contact SPAN Industrial Solutions</h2>
          <p className="section-subtitle">
            Connect with our industrial solutions team to discuss workforce placement, manufacturing
            cost-saving assessments, customized training programs, or industrial videography.
          </p>
        </div>

        {/* Centered, balanced form container */}
        <div className="contact-form-wrapper">
          <div className="form-card">
            <h3 className="form-card-title">Submit Corporate Inquiry</h3>
            <p className="form-card-subtitle">
              Fill in your details below and an industry consultant will follow up with you promptly.
            </p>

            {submitSuccess && (
              <div className="form-banner success" role="alert">
                <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Inquiry Received!</strong> {submitSuccess}
                </div>
              </div>
            )}

            {submitError && (
              <div className="form-banner error" role="alert">
                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Notice:</strong> {submitError}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Spam protection honeypot trap (hidden from legitimate visitors) */}
              <div
                style={{
                  position: 'absolute',
                  opacity: 0,
                  pointerEvents: 'none',
                  height: 0,
                  width: 0,
                  overflow: 'hidden',
                  zIndex: -1,
                }}
                aria-hidden="true"
              >
                <label htmlFor="inquiry-verification-website">Website Verification</label>
                <input
                  type="text"
                  id="inquiry-verification-website"
                  name="_hp_website"
                  value={formData._hp_website || ''}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Row 1: Full Name & Company / Organization */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="inquiry-name" className="form-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="inquiry-name"
                    name="name"
                    disabled={isLoading}
                    className={`form-control ${touched.name && errors.name ? 'error' : ''}`}
                    placeholder="e.g. Rajesh Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {touched.name && errors.name && (
                    <span className="field-error-msg">{errors.name}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="inquiry-company" className="form-label">
                    Company / Organization <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="inquiry-company"
                    name="company"
                    disabled={isLoading}
                    className={`form-control ${touched.company && errors.company ? 'error' : ''}`}
                    placeholder="e.g. Bharat Auto Components Ltd"
                    value={formData.company}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {touched.company && errors.company && (
                    <span className="field-error-msg">{errors.company}</span>
                  )}
                </div>
              </div>

              {/* Row 2: Work Email & Contact Phone */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="inquiry-email" className="form-label">
                    Work Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="inquiry-email"
                    name="email"
                    disabled={isLoading}
                    className={`form-control ${touched.email && errors.email ? 'error' : ''}`}
                    placeholder="r.sharma@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {touched.email && errors.email && (
                    <span className="field-error-msg">{errors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="inquiry-phone" className="form-label">
                    Contact Phone <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="inquiry-phone"
                    name="phone"
                    disabled={isLoading}
                    className={`form-control ${touched.phone && errors.phone ? 'error' : ''}`}
                    placeholder="e.g. +91 9045085537"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {touched.phone && errors.phone && (
                    <span className="field-error-msg">{errors.phone}</span>
                  )}
                </div>
              </div>

              {/* Row 3: Service Vertical Required (Full Width) */}
              <div className="form-group">
                <label htmlFor="inquiry-service" className="form-label">
                  Service Vertical Required <span className="required">*</span>
                </label>
                <select
                  id="inquiry-service"
                  name="service"
                  disabled={isLoading}
                  className={`form-control ${touched.service && errors.service ? 'error' : ''}`}
                  value={formData.service}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                >
                  {INQUIRY_SERVICES.map((srv) => (
                    <option key={srv} value={srv}>
                      {srv}
                    </option>
                  ))}
                </select>
                {touched.service && errors.service && (
                  <span className="field-error-msg">{errors.service}</span>
                )}
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Submitting Inquiry...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Submit Corporate Inquiry</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};
