import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import type { InquiryServiceType } from '../types/inquiry';

export interface SubSectionDetail {
  id: string;
  badge?: string;
  title: string;
  tagline?: string;
  image: string;
  badgePill?: {
    label: string;
    text: string;
    color: string;
  };
  description: string;
  deliverables?: string[];
}

export interface ServiceDetail {
  id: string;
  serviceType: InquiryServiceType;
  title: string;
  tagline: string;
  overview: string;
  keyBenefits: string[];
  scopeAndDeliverables: string[];
  specialties?: string[];
  image?: string;
  subSections?: SubSectionDetail[];
}

interface ServiceModalProps {
  service: ServiceDetail | null;
  onClose: () => void;
  onInquire: (serviceType: InquiryServiceType) => void;
}

const SERVICE_BADGES: Record<string, { label: string; text: string; color: string }> = {
  'guaranteed-saving': {
    label: '● Assured Impact:',
    text: '20%–30% Cost Reduction • Zero Capex',
    color: '#22c55e',
  },
  'workforce-management': {
    label: '● Precision Staffing:',
    text: 'Screened Talent • Role-Matched Candidates',
    color: '#0284c7',
  },
  'experts-training': {
    label: '● Practical Mentorship:',
    text: 'Quality, Safety & Technical Skills • Industry Veterans',
    color: '#f59e0b',
  },
  'video-solutions': {
    label: '● Core Objective: Self-Paced Learning',
    text: 'On-Demand SOP Retention • Safety Compliance Modules',
    color: '#ec4899',
  },
};

export const ServiceModal: React.FC<ServiceModalProps> = ({
  service,
  onClose,
  onInquire,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (service) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      if (dialogRef.current) {
        dialogRef.current.scrollTop = 0;
      }
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [service, onClose]);

  if (!service || typeof document === 'undefined') return null;

  const activeBadge = SERVICE_BADGES[service.id];
  const hasSubSections = Boolean(service.subSections && service.subSections.length > 0);

  return createPortal(
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="modal-dialog"
        style={{
          maxWidth: hasSubSections ? '740px' : '680px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close details dialog"
        >
          <X size={20} />
        </button>

        <span className="section-tag" style={{ marginBottom: '1rem' }}>
          Service Specification
        </span>

        {!hasSubSections && (
          <>
            <h3 id="modal-title" style={{ fontSize: '1.6rem', color: '#0b2545', marginBottom: '0.4rem', fontWeight: 800 }}>
              {service.title}
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#c5221f', fontWeight: 600, marginBottom: '1.25rem' }}>
              {service.tagline}
            </p>
          </>
        )}

        {/* Dual Sections (e.g. Self-Paced Learning + Industrial Video Solutions) */}
        {hasSubSections ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginBottom: '1.5rem' }}>
            {service.subSections!.map((sec, idx) => (
              <div
                key={sec.id || idx}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  boxShadow: '0 4px 14px rgba(11, 37, 69, 0.05)',
                  position: 'relative',
                }}
              >
                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0b2545', marginBottom: '0.25rem' }}>
                  {sec.title}
                </h4>
                {sec.tagline && (
                  <p style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600, marginBottom: '0.9rem' }}>
                    {sec.tagline}
                  </p>
                )}

                {/* Section Image */}
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginBottom: '1rem',
                    boxShadow: '0 2px 10px rgba(11, 37, 69, 0.08)',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <img
                    src={sec.image}
                    alt={sec.title}
                    style={{
                      width: '100%',
                      maxHeight: '230px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    loading="lazy"
                  />
                  {sec.badgePill && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        maxWidth: 'calc(100% - 20px)',
                        boxSizing: 'border-box',
                        backgroundColor: 'rgba(11, 37, 69, 0.92)',
                        backdropFilter: 'blur(6px)',
                        color: '#ffffff',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      <span style={{ color: sec.badgePill.color, fontWeight: 700 }}>
                        {sec.badgePill.label}
                      </span>{' '}
                      <span>{sec.badgePill.text}</span>
                    </div>
                  )}
                </div>

                {/* Section Description */}
                <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.65, marginBottom: '0.9rem' }}>
                  {sec.description}
                </p>

                {/* Section Deliverables / Focus */}
                {sec.deliverables && sec.deliverables.length > 0 && (
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      border: '1px solid #f1f5f9',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#0b2545',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        marginBottom: '0.45rem',
                      }}
                    >
                      Key Focus Deliverables:
                    </div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px', margin: 0, padding: 0 }}>
                      {sec.deliverables.map((item, dIdx) => (
                        <li
                          key={dIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.8rem',
                            color: '#475569',
                          }}
                        >
                          <CheckCircle2 size={13} color={idx === 0 ? '#0284c7' : '#ec4899'} style={{ flexShrink: 0 }} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Standard Single Section Rendering */
          <>
            {service.image && (
              <div
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '1.25rem',
                  boxShadow: '0 4px 16px rgba(11, 37, 69, 0.08)',
                  border: '1px solid #e2e8f0',
                }}
              >
                <img
                  src={service.image}
                  alt={service.title}
                  style={{
                    width: '100%',
                    maxHeight: '260px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  loading="lazy"
                />
                {activeBadge && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      maxWidth: 'calc(100% - 20px)',
                      boxSizing: 'border-box',
                      backgroundColor: 'rgba(11, 37, 69, 0.9)',
                      backdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    <span style={{ color: activeBadge.color, fontWeight: 700 }}>{activeBadge.label}</span>{' '}
                    <span>{activeBadge.text}</span>
                  </div>
                )}
              </div>
            )}

            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.65, marginBottom: '1.5rem' }}>
              {service.overview}
            </p>
          </>
        )}

        {service.specialties && service.specialties.length > 0 && (
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0b2545', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Specialties & Guarantees
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {service.specialties.map((spec, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#1e293b' }}>
                  <ShieldCheck size={14} color="#c5221f" />
                  <span>{spec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', color: '#0b2545', marginBottom: '0.75rem', fontWeight: 700 }}>
            Key Areas & Capabilities:
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '8px' }}>
            {service.scopeAndDeliverables.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.825rem',
                  color: '#334155',
                  backgroundColor: '#f1f5f9',
                  padding: '6px 10px',
                  borderRadius: '6px',
                }}
              >
                <CheckCircle2 size={14} color="#0b2545" style={{ flexShrink: 0 }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '1.25rem',
            borderTop: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Customized proposals tailored to your facility
          </span>
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => {
              onInquire(service.serviceType);
              onClose();
            }}
          >
            <span>Inquire for This Service</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
