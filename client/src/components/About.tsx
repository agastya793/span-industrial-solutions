import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export const About: React.FC = () => {
  const pillars = [
    'Engineering Services',
    'Business Outsourcing',
    'Workforce Solutions',
    'Technical Support',
    'Industrial Training',
    'Manufacturing Cost Optimization',
  ];

  return (
    <section id="about" className="section section-alt has-atmosphere" aria-label="About SPAN Industrial Solutions">
      {/* Distinct Corporate Engineering Atmosphere (Blueprint Grid, Dual Orbs, ISO Standard Rings, Luminous Shimmer) */}
      <div className="about-atmosphere" aria-hidden="true">
        <div className="about-tech-grid" />
        <div className="about-orb-teal" />
        <div className="about-orb-amber" />
        <div className="about-geo-ring ring-1" />
        <div className="about-geo-ring ring-2" />
        <div className="about-bubble ab-1" />
        <div className="about-bubble ab-2" />
        <div className="about-particle ap-1" />
        <div className="about-particle ap-2" />
        <div className="about-particle ap-3" />
        <div className="about-crosshair ac-tl">+</div>
        <div className="about-crosshair ac-br">+</div>
      </div>
      <div className="container section-content-layer">
        <div className="section-header">
          <span className="section-tag">Corporate Profile</span>
          <h2 className="section-title">About SPAN Industrial Solutions</h2>
          <p className="section-subtitle">
            Founded in 2021 as an ISO 9001:2015 certified organization committed to driving operational
            excellence, technical enablement, and meaningful balance across industrial ecosystems.
          </p>
        </div>

        <div className="about-content">
          {/* Company Story & Positioning */}
          <div className="about-story">
            <h3>Bridging Industrial Expertise & Operational Needs</h3>
            <p>
              SPAN Industrial Solutions Pvt Ltd was established with a clear mandate: to make engineering
              services an engaging, innovative, and outcome-oriented domain. We combine strategic business
              outsourcing, operational consulting, and technical mentorship to support both seasoned manufacturing
              enterprises and emerging professionals seeking essential industrial exposure.
            </p>
            <p>
              As an ISO 9001:2015 certified company, we hold ourselves to rigorous quality benchmarks. Our
              methodology focuses on zero-capex interventions, practical shop-floor diagnostics, and
              customized workforce alignments that translate directly into reduced operational friction and
              enhanced productivity.
            </p>

            <div className="about-pillars-section">
              <h4 className="about-pillars-heading">
                Core Focus Verticals:
              </h4>
              <div className="about-pillars-grid">
                {pillars.map((pillar, idx) => (
                  <div key={idx} className="pillar-item">
                    <CheckCircle2 size={16} className="pillar-check" />
                    <span>{pillar}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="about-iso-banner">
              <ShieldCheck size={28} className="about-iso-icon" />
              <div className="about-iso-body">
                <strong className="about-iso-title">ISO 9001:2015 Certified Standards</strong>
                <span>Every engagement follows systematic protocols, transparent documentation, and verified milestones.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

