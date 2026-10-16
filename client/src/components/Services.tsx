import React, { useState } from 'react';
import {
  Users,
  TrendingDown,
  GraduationCap,
  Video,
  CheckCircle2,
  ArrowRight,
  Car,
  Cog,
  Boxes,
  Cpu,
  Wrench,
  Layers,
} from 'lucide-react';
import type { InquiryServiceType } from '../types/inquiry';
import { ServiceModal, type ServiceDetail } from './ServiceModal';

interface SectorItem {
  name: string;
  subtext: string;
  icon: React.ReactNode;
}

const SECTORS: SectorItem[] = [
  {
    name: 'Automotive & Tier-1 OEMs',
    subtext: 'Press shop, chassis, powertrain & assembly',
    icon: <Car size={20} />,
  },
  {
    name: 'Precision & Heavy Engineering',
    subtext: 'CNC/VMC machining, forging & tool rooms',
    icon: <Cog size={20} />,
  },
  {
    name: 'Packaging, Plastics & Polymers',
    subtext: 'Injection molding, blow molding & corrugation',
    icon: <Boxes size={20} />,
  },
  {
    name: 'Electrical & Electronics Assembly',
    subtext: 'SMT lines, wiring harnesses & panels',
    icon: <Cpu size={20} />,
  },
  {
    name: 'Fabrication, Fasteners & Metalwork',
    subtext: 'Sheet metal, welding & cold forging',
    icon: <Wrench size={20} />,
  },
  {
    name: 'FMCG & Consumer Manufacturing',
    subtext: 'High-speed bottling, packaging & warehousing',
    icon: <Layers size={20} />,
  },
];

interface ServicesProps {
  onSelectService: (serviceType: InquiryServiceType) => void;
}

const SERVICES_DATA: ServiceDetail[] = [
  {
    id: 'workforce-management',
    serviceType: 'Workforce Management Solutions',
    title: 'Workforce Management Solutions',
    tagline: 'Precision industrial staffing & role-matched candidate recruitment',
    image: '/workforce-management.jpg',
    overview:
      'SPAN bridges the gap between industrial employers and qualified candidates. We pick the most suitable personnel to fit the exact operational requirements, qualifications, and experience demanded by plant and corporate positions. Leveraging our established background in structured screening approaches, we deploy innovative evaluation techniques that align candidate competencies with employer expectations.',
    keyBenefits: [
      'Tailored role matching by technical qualifications and experience',
      'Rigorous multi-stage candidate screening methodology',
      'Best-practice recruitment workflows bringing structured candidate evaluation',
      'Rapid turnaround for plant, technical, and operational vacancies',
    ],
    scopeAndDeliverables: [
      'Industrial Plant Staffing',
      'Technical Screening & Skill Checks',
      'Engineering Role Placement',
      'Operational Workforce Onboarding',
    ],
    specialties: [
      'Customized candidate qualification verification',
      'Structured screening aligned with employer requirements',
      'End-to-end recruitment lifecycle coordination',
    ],
  },
  {
    id: 'guaranteed-saving',
    serviceType: 'Guaranteed Saving Program',
    title: 'Guaranteed Saving Program (GET SHRINK)',
    tagline: '5 Proven tools to reduce manufacturing cost by 20% to 30%',
    image: '/guaranteed-saving.jpg',
    overview:
      'The GET SHRINK program focuses on identifying and cutting hidden wastes across manufacturing operations without capital expenditure. By applying five targeted operational tools, SPAN works alongside plant managers to uncover systemic inefficiencies and drive assured cost reductions within committed timeframes.',
    keyBenefits: [
      '20% to 30% manufacturing cost reduction (as stated by company)',
      'Zero Capex involved — optimizing existing equipment and workflows',
      'Assured results delivered within a committed, specific timeframe',
      'Maintenance-focused and process-driven waste reduction',
    ],
    scopeAndDeliverables: [
      'Raw Material Optimization',
      'Manpower Productivity & Allocation',
      'Electricity & Energy Conservation',
      'Overheads Streamlining',
      'Cost of Poor Quality (COPQ) Elimination',
      'Shop-Floor Process Fine-Tuning',
    ],
    specialties: [
      'No Capex Involved',
      'Assured results in specific time frame',
      'Process, operations & maintenance fine-tuning',
      'Uncovering hidden manufacturing wastes',
    ],
  },
  {
    id: 'experts-training',
    serviceType: 'Experts Training for Industries',
    title: 'Experts Training for Industries',
    tagline: 'Managed shop-floor & engineering programs led by industry veterans',
    image: '/experts-training.jpg',
    overview:
      'We manage continuous learning programs for engineering professionals and factory employees, taught directly by leading experts who have spent decades serving across core industries. Because real operational growth comes from practicing proven manufacturing methodologies, our modules focus on tangible shop-floor application rather than mere classroom theory.',
    keyBenefits: [
      'Mentorship by seasoned veterans with decades of hands-on industry experience',
      'Practical engineering drawing and blueprint reading skills',
      'Proven quality frameworks for continuous workplace improvement',
      'Measurable improvement in shop-floor discipline and defect reduction',
    ],
    scopeAndDeliverables: [
      'Continuous Improvement & Waste Reduction (Kaizen)',
      'Quality Control & Problem Solving (7QC Tools)',
      'Workplace Organization & Safety (5S)',
      'Engineering Drawing & Blueprint Reading',
      'Precision Measurement & Tolerancing (GD&T)',
      'Inventory Control & Store Management',
      'Process & Functional Workflow Planning',
      'Quality Management Systems',
      'Production Management & Line Balancing',
      'Advanced Quality Planning & Defect Prevention',
    ],
    specialties: [
      'Direct instruction by seasoned industry experts',
      '10 specialized operational & engineering modules',
      'Applicable across automotive, fabrication, and manufacturing sectors',
    ],
  },
  {
    id: 'video-solutions',
    serviceType: 'Self-Paced Learning & Video Solutions',
    title: 'Self-Paced Learning & Industrial Video Solutions',
    tagline: 'Self-Paced Learning as core objective — modular visual training for operators, safety & plants',
    image: '/video-solutions.jpg',
    overview:
      'With Self-Paced Learning as the core objective, SPAN transforms complex industrial operations, machine procedures, and safety compliance protocols into modular, on-demand visual learning content. Rather than generic corporate videos or static text manuals, operators and workforce personnel learn, review, and master standard operating procedures (SOPs) at their own speed. This self-paced methodology ensures continuous shop-floor skill development, standardizes safety protocols, and accelerates onboarding with zero plant disruption.',
    keyBenefits: [
      'Self-Paced Learning modules empowering operators to master workflows at their own speed',
      'Standardizes safety compliance protocols and SOP guidelines for repeatable retention',
      'Transforms complex plant operations into modular, easy-to-follow visual training',
      'Complete production lifecycle: instructional design, on-site shooting, and LMS-ready modules',
    ],
    scopeAndDeliverables: [
      'Self-Paced Operator Learning Modules',
      'Process & Machine SOP Explainer Modules',
      'Mandatory Safety & Compliance Learning',
      'Worker & Visitor Safety Guideline Videos',
      'Interactive Training & Explainer Modules',
      'Industrial Plant Walkthroughs & Facility Profiles',
      'Animated & AI-assisted Explainer Modules',
      'On-site Video Shooting & Field Production',
      'Digital Learning Asset Management & Post-Production',
    ],
    specialties: [
      'Self-Paced Learning as the primary operational objective',
      'High-retention standard operating procedure (SOP) visual modules',
      'Engineered specifically for manufacturing and industrial shop floors',
    ],
    subSections: [
      {
        id: 'self-paced-learning-sec',
        title: 'Self-Paced Learning',
        image: '/self-paced-learning.jpg',
        badgePill: {
          label: '● Core Objective:',
          text: 'Self-Paced Learning • Digital Shop-Floor Modules',
          color: '#0284c7',
        },
        description:
          'With Self-Paced Learning as the primary operational objective, SPAN transforms dense machinery manuals and complex engineering workflows into modular, interactive visual learning content. Operators, assembly technicians, and new recruits learn and review standard operating procedures (SOPs) at their own pace directly on rugged shop-floor tablets or training stations. This eliminates the pressure of fast one-time lectures, enables unlimited step-by-step replay for difficult operations, and guarantees uniform retention without pulling experienced engineers off running production lines.',
        deliverables: [
          '**L1 - Basic:** PPT to click-next, images, voiceover, no interactivity',
          '**L2 - Interactive:** Tabs, process flows, 5-6 drag-drop, quizzes, animations',
          '**L3 - Scenario-Based:** Branching scenarios, characters, real-life decisions, feedback',
          '**L4 - Simulation / VR:** Software sim, try-me-do-me, gamified, VR/AR',
        ],
      },
      {
        id: 'industrial-video-solutions-sec',
        title: 'Industrial Video Solutions',
        image: '/video-solutions.jpg',
        badgePill: {
          label: '● Production Capability:',
          text: 'On-Site 4K Filming • Safety Hazard Overlays • ISO/OSHA Induction',
          color: '#ec4899',
        },
        description:
          'SPAN delivers specialized on-site video filming and media production tailored explicitly for discrete manufacturing plants, industrial workshops, and process facilities. Our dedicated media crew and industrial storyboard engineers deploy with professional camera rigs directly to your shop floor to record high-definition equipment operations, worker orientation films, plant walkthroughs, and hazard safety protocols. We manage the complete media lifecycle from technical scriptwriting and storyboard design to high-definition post-production.',
        deliverables: [
          'Full-scale on-site filming: precision machine close-ups and plant floor walkthroughs',
          '2D/3D animated motion graphics and hazard alert overlays highlighting danger zones',
          'Visitor, contractor & worker safety induction videos complying with ISO/OSHA standards',
          'Digital learning asset management and LMS-ready export optimization for plant displays',
        ],
      },
    ],
  },
];

export const Services: React.FC<ServicesProps> = ({ onSelectService }) => {
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);

  return (
    <section id="services" className="section has-atmosphere" aria-label="SPAN Core Services">
      {/* Background Visual Atmosphere (4-Spectrum Quadrant Glows, Dual Rotating Rings, Floating Bubbles & Particles) */}
      <div className="services-atmosphere" aria-hidden="true">
        <div className="services-radial-glow" />
        <div className="services-quad-glow sq-cyan" />
        <div className="services-quad-glow sq-berry" />
        <div className="services-quad-glow sq-amber" />
        <div className="services-quad-glow sq-sky" />
        <div className="services-ring-1" />
        <div className="services-ring-2" />
        <div className="services-bubble sb-1" />
        <div className="services-bubble sb-2" />
        <div className="services-particle sp-1" />
        <div className="services-particle sp-2" />
        <div className="services-particle sp-3" />
        <div className="services-particle sp-4" />
        <div className="grid-crosshair crosshair-tl">+</div>
        <div className="grid-crosshair crosshair-tr">+</div>
        <div className="grid-crosshair crosshair-bl">+</div>
        <div className="grid-crosshair crosshair-br">+</div>
      </div>

      <div className="container section-content-layer">
        <div className="section-header">
          <span className="section-tag">Four Core Verticals</span>
          <h2 className="section-title">Our Industrial & Business Services</h2>
          <p className="section-subtitle">
            SPAN provides four specialized service offerings designed to optimize manufacturing
            operations, upskill personnel, source top talent, and communicate complex processes visually.
          </p>
        </div>

        <div className="services-grid">
          {/* SERVICE 1: Workforce Management */}
          <div className="service-card">
            <div className="service-card-top">
              <span className="service-card-tag">Vertical 01 &bull; Staffing</span>
              <div className="service-card-icon-wrap">
                <Users size={28} />
              </div>
              <h3 className="service-card-title">Workforce Management Solutions</h3>
              <p className="service-card-desc">
                Matching industrial employers with suitable candidates based on technical qualifications,
                verified experience, and precise job requirements. Built on proven recruitment and
                screening methodologies.
              </p>

              <ul className="service-features-list">
                <li className="service-feature-item">
                  <CheckCircle2 size={15} className="feature-check" />
                  <span>Custom employer-candidate requirement alignment</span>
                </li>
                <li className="service-feature-item">
                  <CheckCircle2 size={15} className="feature-check" />
                  <span>Rigorous multi-tier screening & qualification checks</span>
                </li>
                <li className="service-feature-item">
                  <CheckCircle2 size={15} className="feature-check" />
                  <span>Structured screening with creative hiring modes</span>
                </li>
              </ul>

              <div className="service-pills-row">
                <span className="service-sub-pill">Role Matching</span>
                <span className="service-sub-pill">Technical Staffing</span>
                <span className="service-sub-pill">Structured Staffing</span>
              </div>
            </div>

            <div className="service-card-footer">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedService(SERVICES_DATA[0])}
              >
                <span>Learn More</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onSelectService('Workforce Management Solutions')}
              >
                <span>Inquire</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* SERVICE 2: Guaranteed Saving Program */}
          <div className="service-card highlight">
            <div className="service-card-top">
              <span className="service-card-tag" style={{ color: '#c5221f' }}>
                Vertical 02 &bull; GET SHRINK
              </span>
              <div className="service-card-icon-wrap">
                <TrendingDown size={28} />
              </div>
              <h3 className="service-card-title">Guaranteed Saving Program</h3>
              <p className="service-card-desc">
                <strong>GET SHRINK:</strong> 5 Tools to reduce manufacturing costs by 20% to 30% (as stated by
                company). Identifies hidden wastes and optimizes operations with zero capital expenditure.
              </p>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  marginBottom: '1rem',
                  fontSize: '0.8rem',
                  color: '#991b1b',
                  fontWeight: 600,
                }}
              >
                Specialty: No Capex Involved &bull; Assured results in specific timeframe
              </div>

              <div className="service-pills-row">
                <span className="service-sub-pill">Raw Material</span>
                <span className="service-sub-pill">Manpower</span>
                <span className="service-sub-pill">Electricity</span>
                <span className="service-sub-pill">Overheads</span>
                <span className="service-sub-pill">Cost of Poor Quality</span>
              </div>
            </div>

            <div className="service-card-footer">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedService(SERVICES_DATA[1])}
              >
                <span>Learn More</span>
              </button>
              <button
                type="button"
                className="btn btn-accent btn-sm"
                onClick={() => onSelectService('Guaranteed Saving Program')}
              >
                <span>Inquire</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* SERVICE 3: Experts Training for Industries */}
          <div className="service-card">
            <div className="service-card-top">
              <span className="service-card-tag">Vertical 03 &bull; Upskilling</span>
              <div className="service-card-icon-wrap">
                <GraduationCap size={28} />
              </div>
              <h3 className="service-card-title">Experts Training for Industries</h3>
              <p className="service-card-desc">
                Comprehensive training programs for engineering professionals and shop-floor employees,
                mentored directly by industry veterans with decades of hands-on manufacturing expertise.
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0b2545', textTransform: 'uppercase', marginBottom: '6px' }}>
                  10 Core Training Modules:
                </div>
                <div className="service-pills-row">
                  <span className="service-sub-pill">Continuous Improvement</span>
                  <span className="service-sub-pill">Quality Control Tools</span>
                  <span className="service-sub-pill">Workplace Organization (5S)</span>
                  <span className="service-sub-pill">Engineering Drawings</span>
                  <span className="service-sub-pill">Precision Measurements</span>
                  <span className="service-sub-pill">Inventory & Store Control</span>
                  <span className="service-sub-pill">Process Planning</span>
                  <span className="service-sub-pill">Quality Management</span>
                  <span className="service-sub-pill">Production Management</span>
                  <span className="service-sub-pill">Defect Prevention</span>
                </div>
              </div>
            </div>

            <div className="service-card-footer">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedService(SERVICES_DATA[2])}
              >
                <span>Learn More</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onSelectService('Experts Training for Industries')}
              >
                <span>Inquire</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* SERVICE 4: Self-Paced Learning & Video Solutions */}
          <div className="service-card">
            <div className="service-card-top">
              <span className="service-card-tag" style={{ color: '#0284c7' }}>
                Vertical 04 &bull; Self-Paced Learning & Visual Media
              </span>
              <div className="service-card-icon-wrap">
                <Video size={28} />
              </div>
              <h3 className="service-card-title">Self-Paced Learning & Industrial Video Solutions</h3>
              <p className="service-card-desc">
                Self-Paced Learning is our primary objective. We transform complex industrial machinery
                workflows, safety compliance guidelines, and plant SOPs into modular, on-demand visual
                learning content that operators and staff can master at their own speed.
              </p>

              <ul className="service-features-list">
                <li className="service-feature-item">
                  <CheckCircle2 size={15} className="feature-check" />
                  <span>Self-Paced Learning modules for operator onboarding & SOP retention</span>
                </li>
                <li className="service-feature-item">
                  <CheckCircle2 size={15} className="feature-check" />
                  <span>Mandatory safety awareness & worker compliance training</span>
                </li>
                <li className="service-feature-item">
                  <CheckCircle2 size={15} className="feature-check" />
                  <span>Industrial plant walkthroughs, animated explainers & on-site shooting</span>
                </li>
              </ul>

              <div className="service-pills-row">
                <span className="service-sub-pill">Self-Paced Learning</span>
                <span className="service-sub-pill">Safety SOP Modules</span>
                <span className="service-sub-pill">Process Explanation</span>
                <span className="service-sub-pill">Plant Walkthroughs</span>
              </div>
            </div>

            <div className="service-card-footer">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedService(SERVICES_DATA[3])}
              >
                <span>Learn More</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onSelectService('Self-Paced Learning & Video Solutions')}
              >
                <span>Inquire</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Specialized Experience Across Core Manufacturing Sectors */}
        <div className="sectors-wrapper" style={{ marginTop: '3rem' }}>
          <div className="sectors-banner-title">
            <span>Specialized Experience Across Core Manufacturing Sectors:</span>
          </div>

          <div className="sectors-grid">
            {SECTORS.map((sector, idx) => (
              <div key={idx} className="sector-chip">
                <div className="sector-chip-icon">{sector.icon}</div>
                <div className="sector-chip-text">
                  <span className="sector-chip-name">{sector.name}</span>
                  <span className="sector-chip-sub">{sector.subtext}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Detail Modal */}
      <ServiceModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onInquire={(type) => {
          setSelectedService(null);
          onSelectService(type);
        }}
      />
    </section>
  );
};
