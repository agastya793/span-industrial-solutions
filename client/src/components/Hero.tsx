import React from 'react';
import { ArrowRight, PhoneCall, Award, Factory, Users, TrendingDown, Video, Building2 } from 'lucide-react';

interface HeroProps {
  onExploreServices: () => void;
  onContact: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreServices, onContact }) => {
  return (
    <section id="home" className="hero-section has-atmosphere" aria-label="SPAN Industrial Solutions Overview">
      {/* Background Visual Atmosphere (Architectural Grid, Luminous Orbs, Light Beams, Flowing Curves, Floating Rings & Particles) */}
      <div className="hero-atmosphere" aria-hidden="true">
        {/* Architectural Precision Engineering Grid */}
        <div className="hero-grid-mesh" />

        {/* Luminous Ambient Glowing Orbs */}
        <div className="hero-orb-primary" />
        <div className="hero-orb-accent" />
        <div className="hero-orb-amber" />

        {/* Diagonal Atmospheric Light Beams */}
        <div className="hero-light-beam-1" />
        <div className="hero-light-beam-2" />



        {/* Floating Geometric Rings / Bubbles */}
        <div className="floating-bubble bubble-1" />
        <div className="floating-bubble bubble-2" />
        <div className="floating-bubble bubble-3" />

        {/* Luminous Floating Particles */}
        <div className="glowing-particle gp-1" />
        <div className="glowing-particle gp-2" />
        <div className="glowing-particle gp-3" />
        <div className="glowing-particle gp-4" />
        <div className="glowing-particle gp-5" />
      </div>

      <div className="container section-content-layer">
        <div className="hero-grid">
          {/* Left Column: Headline and Value Proposition */}
          <div className="hero-content">
            <div className="hero-badge-pill">
              <Award size={15} color="#c5221f" />
              <span>ISO 9001:2015 Certified Industrial Partner</span>
            </div>

            <h1 className="hero-title">
              Engineering Solutions, Workforce Support, <span>Cost Optimization</span> & Industrial Training
            </h1>

            <p className="hero-lead">
              SPAN Industrial Solutions Pvt Ltd delivers practical, results-driven industrial and business
              services. We empower manufacturing and corporate enterprises through strategic workforce
              management, proven manufacturing cost reduction (GET SHRINK), shop-floor expert training,
              and Self-Paced Learning through industrial visual solutions.
            </p>

            <div className="hero-cta-group">
              <button
                type="button"
                className="btn btn-accent"
                onClick={onExploreServices}
              >
                <span>Explore Our Services</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={onContact}
              >
                <PhoneCall size={16} />
                <span>Contact SPAN</span>
              </button>
            </div>

            {/* Credibility & Footprint Indicators */}
            <div className="hero-meta-grid">
              <div className="hero-meta-item">
                <h4>Founded 2021</h4>
                <p>Incorporated with a mission to innovate engineering services</p>
              </div>
              <div className="hero-meta-item">
                <h4>ISO 9001:2015</h4>
                <p>Standardized quality management & operational discipline</p>
              </div>
              <div className="hero-meta-item">
                <h4>Industrial Hub</h4>
                <p>Operating from Rudrapur (Uttarakhand)</p>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Industrial Capability Graphic */}
          <div className="hero-visual">
            <div className="hero-card-preview" role="region" aria-label="Core Services Summary">
              <div className="preview-header">
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Industrial Capabilities
                  </span>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0b2545' }}>
                    SPAN Integrated Verticals
                  </div>
                </div>
                <div className="preview-status">
                  <span className="status-dot"></span>
                  <span>Active Delivery</span>
                </div>
              </div>

              <div className="preview-grid">
                {/* 1. Workforce */}
                <div className="preview-tile">
                  <div className="preview-tile-icon">
                    <Users size={24} />
                  </div>
                  <div className="preview-tile-title">Workforce Management</div>
                  <p className="preview-tile-desc">
                    Targeted industrial staffing, precision role matching & candidate screening.
                  </p>
                </div>

                {/* 2. Guaranteed Saving */}
                <div className="preview-tile">
                  <div className="preview-tile-icon">
                    <TrendingDown size={24} />
                  </div>
                  <div className="preview-tile-title">Guaranteed Savings</div>
                  <p className="preview-tile-desc">
                    GET SHRINK model targeting 20% to 30% reduction in hidden manufacturing waste.
                  </p>
                </div>

                {/* 3. Expert Training */}
                <div className="preview-tile">
                  <div className="preview-tile-icon">
                    <Factory size={24} />
                  </div>
                  <div className="preview-tile-title">Industrial Training</div>
                  <p className="preview-tile-desc">
                    Practical training in plant productivity, workplace organization, quality tools, and machine operations by seasoned experts.
                  </p>
                </div>

                {/* 4. Self-Paced Learning & Video Solutions */}
                <div className="preview-tile">
                  <div className="preview-tile-icon">
                    <Video size={24} />
                  </div>
                  <div className="preview-tile-title">Self-Paced Learning</div>
                  <p className="preview-tile-desc">
                    Modular visual learning, safety compliance guidelines & plant walkthroughs for on-demand workforce mastery.
                  </p>
                </div>
              </div>

              <div
                style={{
                  marginTop: '1.25rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: '#eff6ff',
                      color: '#0284c7',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '5px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    <Building2 size={13} />
                    Proven Across 1,000+ Organizations
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '0.825rem',
                    color: '#475569',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  SPAN has delivered these specialized operational, workforce, cost-saving, and technical training solutions across <strong>1,000+ manufacturing plants and corporate organizations</strong>. From discrete automotive workshops to heavy engineering facilities, our proven methodologies ensure measurable productivity, structured compliance, and lasting shop-floor excellence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
