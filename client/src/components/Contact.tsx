import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
} from 'lucide-react';
import { INQUIRY_SERVICES, type InquiryFormData, type InquiryServiceType } from '../types/inquiry';
import { INDIAN_STATES, INDIA_STATES_AND_CITIES } from '../data/indiaLocations';

interface ContactProps {
  selectedServicePreload?: InquiryServiceType;
}

export const Contact: React.FC<ContactProps> = ({ selectedServicePreload }) => {
  const [formData, setFormData] = useState<InquiryFormData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    state: '',
    city: '',
    service: selectedServicePreload || 'Workforce Management Solutions',
    message: '',
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

  const availableCities = formData.state ? INDIA_STATES_AND_CITIES[formData.state] || [] : [];

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedState = e.target.value;
    setFormData((prev) => ({
      ...prev,
      state: selectedState,
      city: '', // Reset city when state changes
    }));

    if (touched.state) {
      const err = validateField('state', selectedState);
      setErrors((prev) => ({
        ...prev,
        state: err,
        city: '',
      }));
    }
  };

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
        if (!trimmed) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return 'Please enter a valid corporate email address.';
        }
        return '';
      case 'phone':
        if (!trimmed) return 'Contact telephone or mobile number is required.';
        if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/.test(trimmed.replace(/\s+/g, ''))) {
          return 'Please enter a valid phone number (e.g. 9045085537).';
        }
        return '';
      case 'state':
        if (!trimmed) return 'Please select your organization state / UT.';
        return '';
      case 'city':
        if (!trimmed) return 'Please select your organization city / industrial hub.';
        return '';
      case 'service':
        if (!trimmed) return 'Please select a service vertical.';
        return '';
      case 'message':
        if (!trimmed) return 'Requirement details are required.';
        if (trimmed.length < 10) return 'Please provide at least 10 characters describing your requirement.';
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

    // Validate all fields
    const newErrors: Record<string, string> = {};
    const fieldKeys: (keyof InquiryFormData)[] = [
      'name',
      'company',
      'email',
      'phone',
      'state',
      'city',
      'service',
      'message',
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
      state: true,
      city: true,
      service: true,
      message: true,
    });
    setErrors(newErrors);

    if (hasError) {
      setSubmitError('Please address the highlighted fields before submitting.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        message:
          formData.state && formData.city
            ? `[Organization Location: ${formData.city}, ${formData.state}]\n\n${formData.message}`
            : formData.message,
      };

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
        state: '',
        city: '',
        service: selectedServicePreload || 'Workforce Management Solutions',
        message: '',
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

        <div className="contact-grid">
          {/* Contact Details & Office Addresses */}
          <div className="contact-info-wrap">
            <div className="contact-highlight-card">
              <h3>Get In Touch With Our Team</h3>
              <p>
                Whether you operate a discrete manufacturing plant, engineering workshop, or process facility,
                our specialists are available to conduct an initial requirement discovery.
              </p>

              <div className="contact-channels-list">
                {/* Email */}
                <div className="contact-channel-item">
                  <div className="contact-channel-icon">
                    <Mail size={18} />
                  </div>
                  <div className="contact-channel-content">
                    <span className="channel-label">Official Corporate Email</span>
                    <span className="channel-val">
                      <a href="mailto:INFOSPAN.UKD@gmail.com">INFOSPAN.UKD@gmail.com</a>
                    </span>
                  </div>
                </div>

                {/* Telephone & Mobile */}
                <div className="contact-channel-item">
                  <div className="contact-channel-icon">
                    <Phone size={18} />
                  </div>
                  <div className="contact-channel-content">
                    <span className="channel-label">Direct Contact Lines</span>
                    <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '4px 8px' }}>
                      <a href="tel:+919045085537" style={{ color: '#0b2545', fontWeight: 600 }}>+91 90450 85537</a>
                      <span>&bull;</span>
                      <a href="tel:+918449368000" style={{ color: '#0b2545', fontWeight: 600 }}>+91 84493 68000</a>
                      <span>&bull;</span>
                      <a href="tel:+919568799107" style={{ color: '#0b2545', fontWeight: 600 }}>+91 95687 99107</a>
                    </div>
                  </div>
                </div>

                {/* Uttarakhand Location */}
                <div className="contact-channel-item">
                  <div className="contact-channel-icon">
                    <Building2 size={18} />
                  </div>
                  <div className="contact-channel-content">
                    <span className="channel-label">Uttarakhand Operations</span>
                    <span className="channel-val" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      C5 Rampur Road, Preet Vihar, Rudrapur, US Nagar, Uttarakhand - 263153
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Working Inquiry Form */}
          <div className="form-card">
            <h3 className="form-card-title">Submit Corporate Inquiry</h3>
            <p className="form-card-subtitle">
              Fill in your details below and an industry consultant will follow up with you.
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
              <div className="form-row">
                {/* Name */}
                <div className="form-group">
                  <label htmlFor="inquiry-name" className="form-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="inquiry-name"
                    name="name"
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

                {/* Company */}
                <div className="form-group">
                  <label htmlFor="inquiry-company" className="form-label">
                    Company / Organization <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="inquiry-company"
                    name="company"
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

              <div className="form-row">
                {/* Email */}
                <div className="form-group">
                  <label htmlFor="inquiry-email" className="form-label">
                    Work Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="inquiry-email"
                    name="email"
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

                {/* Phone */}
                <div className="form-group">
                  <label htmlFor="inquiry-phone" className="form-label">
                    Contact Phone <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="inquiry-phone"
                    name="phone"
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

              {/* Organization State & City (2 Blocks in One Row) */}
              <div className="form-row">
                {/* State / UT */}
                <div className="form-group">
                  <label htmlFor="inquiry-state" className="form-label">
                    Organization State / UT <span className="required">*</span>
                  </label>
                  <select
                    id="inquiry-state"
                    name="state"
                    className={`form-control ${touched.state && errors.state ? 'error' : ''}`}
                    value={formData.state || ''}
                    onChange={handleStateChange}
                    onBlur={handleBlur}
                    required
                  >
                    <option value="">-- Select State / UT --</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  {touched.state && errors.state && (
                    <span className="field-error-msg">{errors.state}</span>
                  )}
                </div>

                {/* City / Industrial Hub */}
                <div className="form-group">
                  <label htmlFor="inquiry-city" className="form-label">
                    City / Industrial Hub <span className="required">*</span>
                  </label>
                  <select
                    id="inquiry-city"
                    name="city"
                    disabled={!formData.state}
                    className={`form-control ${touched.city && errors.city ? 'error' : ''}`}
                    value={formData.city || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    style={{
                      cursor: !formData.state ? 'not-allowed' : 'pointer',
                      backgroundColor: !formData.state ? '#f8fafc' : undefined,
                    }}
                  >
                    <option value="">
                      {formData.state
                        ? '-- Select City / Industrial Hub --'
                        : '-- Select State First --'}
                    </option>
                    {availableCities.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                  {touched.city && errors.city && (
                    <span className="field-error-msg">{errors.city}</span>
                  )}
                </div>
              </div>

              {/* Service Required Dropdown */}
              <div className="form-group">
                <label htmlFor="inquiry-service" className="form-label">
                  Service Vertical Required <span className="required">*</span>
                </label>
                <select
                  id="inquiry-service"
                  name="service"
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

              {/* Message */}
              <div className="form-group">
                <label htmlFor="inquiry-message" className="form-label">
                  Requirement Details <span className="required">*</span>
                </label>
                <textarea
                  id="inquiry-message"
                  name="message"
                  rows={4}
                  className={`form-control ${touched.message && errors.message ? 'error' : ''}`}
                  placeholder="Please describe your operational requirements, plant location, or staffing scope..."
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.message && errors.message && (
                  <span className="field-error-msg">{errors.message}</span>
                )}
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.875rem' }}
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
                    <span>Submit Inquiry</span>
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
