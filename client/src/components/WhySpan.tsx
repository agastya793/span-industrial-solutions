import React from 'react';
import {
  Video,
  GraduationCap,
  UserCheck,
} from 'lucide-react';

export const WhySpan: React.FC = () => {
  const pillars = [
    {
      icon: <Video size={22} />,
      title: 'Self-Paced Learning Solutions',
      desc: 'With Self-Paced Learning as the primary objective, we convert complex shop-floor procedures, machinery operations, and safety protocols into modular on-demand learning assets for lasting worker mastery.',
    },
    {
      icon: <GraduationCap size={22} />,
      title: 'Practical Shop-Floor Training',
      desc: 'Hands-on curriculum covering continuous improvement, workplace organization, quality tools, and machine drawings to build real discipline in engineering teams.',
    },
    {
      icon: <UserCheck size={22} />,
      title: 'Experienced Industry Professionals',
      desc: 'Our training modules and advisory interventions are led by seasoned veterans who bring decades of real shop-floor problem solving.',
    },
  ];

  return (
    <section id="why-span" className="section section-alt has-atmosphere" aria-label="Why Partner with SPAN">
      {/* Distinct Synergistic Atmosphere (Hexagonal Matrix, Dual Gradient Orbs, Floating Rings & Nodes) */}
      <div className="whyspan-atmosphere" aria-hidden="true">
        <div className="whyspan-mesh" />
        <div className="whyspan-orb-berry" />
        <div className="whyspan-orb-teal" />
        <div className="whyspan-ring" />
        <div className="whyspan-bubble wb-1" />
        <div className="whyspan-bubble wb-2" />
        <div className="whyspan-particle wp-1" />
        <div className="whyspan-particle wp-2" />
        <div className="whyspan-particle wp-3" />
        <div className="whyspan-crosshair wc-tl">+</div>
        <div className="whyspan-crosshair wc-br">+</div>
      </div>
      <div className="container section-content-layer">
        <div className="section-header">
          <span className="section-tag">Synergistic Value</span>
          <h2 className="section-title">Why Partner with SPAN</h2>
          <p className="section-subtitle">
            By integrating workforce management, manufacturing cost optimization, technical training,
            and Self-Paced Learning solutions under one ISO 9001:2015 certified partner, we provide
            cohesive support for long-term operational success.
          </p>
        </div>

        <div className="why-grid">
          {pillars.map((item, idx) => (
            <div key={idx} className="why-card">
              <div className="why-card-icon">{item.icon}</div>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
