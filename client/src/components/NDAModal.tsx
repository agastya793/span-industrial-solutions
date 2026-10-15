import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Lock } from 'lucide-react';

interface NDAModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NDAModal: React.FC<NDAModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
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
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nda-modal-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="modal-dialog"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close NDA dialog"
        >
          <X size={20} />
        </button>

        {/* Modal Header Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem' }}>
          <ShieldCheck size={16} color="#c5221f" />
          <span className="section-tag" style={{ margin: 0 }}>
            Client IP & Trade Secret Safeguard
          </span>
        </div>

        <h3
          id="nda-modal-title"
          style={{ fontSize: '1.45rem', color: '#0b2545', marginBottom: '0.35rem', fontWeight: 800 }}
        >
          Non-Disclosure Agreement (NDA) Policy
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, marginBottom: '1.25rem' }}>
          Legally binding confidentiality protocols protecting every partner facility, blueprint, and process.
        </p>

        {/* NDA Banner Image */}
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
            src="/nda-confidentiality.jpg"
            alt="SPAN Non-Disclosure Agreement and Client Confidentiality"
            style={{
              width: '100%',
              maxHeight: '220px',
              objectFit: 'cover',
              display: 'block',
            }}
            loading="lazy"
          />
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
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <Lock size={12} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>● 100% Protected:</span>
            <span>Zero Information Leakage Guarantee</span>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          When partnering with SPAN Industrial Solutions, customers share their confidential business information under a mutually executed Non-Disclosure Agreement (NDA). SPAN reviews and signs the agreement to confirm our commitment to keeping your data confidential and secure. Proprietary customer information, engineering drawings, manufacturing processes, pricing, business plans, and operational data are used solely for the agreed business purpose. Access is strictly limited to authorized personnel who require it to perform designated duties, and appropriate security measures are applied to protect your information, subject to the terms of the agreement and applicable legal requirements.
        </p>


        {/* Footer Actions */}
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
            Custom bilateral NDA templates available upon request
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
