
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onSelectDoctor: () => void;
  onSelectCommunity: () => void;
  onSelectSelfcare: () => void;
  onSelectCareConnect?: () => void;
  onSelectNutrition?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToHome?: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToContact?: () => void;
  userHealthData?: any;
}

const B  = '#800000';          // burgundy
const BL = '#fdf0f0';          // burgundy light
const CONTAINER = 1200;        // max-width px
const PAD = '0 2.5rem';        // horizontal padding

const coreServiceDefs = (p: Props) => [
  { title: 'CareConnect', sub: 'AI-assisted doctor-patient guidance system for personalized healthcare support', icon: 'fa-user-md', action: p.onSelectCareConnect || (() => console.log('Navigate to CareConnect')) },
  { title: 'Doctor Connectivity', sub: 'Connect with certified bone health specialists for professional care', icon: 'fa-stethoscope',       action: p.onSelectDoctor   },
  { title: 'Community Forum',     sub: 'Share experiences and learn from others on the same health journey', icon: 'fa-users',     action: p.onSelectCommunity },
];

const specialDefs = (p: Props) => [
  { title: 'Selfcare Tools', sub: 'Personalized meditation, exercise & wellness routines tailored to your risk profile.', icon: 'fa-heartbeat', action: p.onSelectSelfcare, dark: true  },
  { title: 'Nutrition Assistant', sub: 'Get personalized weekly meal plans based on your bone health risk assessment.', icon: 'fa-utensils', action: p.onSelectNutrition, dark: false },
];

const Dashboard: React.FC<Props> = (props) => {
  const coreServices = coreServiceDefs(props);
  const featuredCards = specialDefs(props);

  return (
    <div className="w-full min-h-screen flex flex-col dashboard-container" style={{ background: '#faf8f6' }}>

      {/* ════════════════════════════════════════
          HEADER — single horizontal bar
          brand-unit LEFT · nav+avatar RIGHT
      ════════════════════════════════════════ */}
      <header
        className="w-full sticky top-0 z-[100]"
        style={{
          background: 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(128,0,0,0.07)',
        }}
      >
        <div className="mx-auto flex items-center justify-between"
          style={{ maxWidth: CONTAINER, padding: PAD, height: 60 }}
        >
          {/* LEFT — CAREMEND brand */}
          <div className="flex items-center">
            <button
              className="text-2xl font-black tracking-[0.12em] select-none transition-all duration-300 hover:scale-105"
              style={{ color: B, cursor: 'pointer' }}
              onClick={() => {
                console.log('Navigate to home');
              }}
            >
              CAREMEND
            </button>
          </div>

          {/* RIGHT — Navigation links + profile */}
          <div className="flex items-center gap-8">
            <nav className="hidden md:flex items-center gap-8">
              {[
              { name: 'HOME',    action: props.onNavigateToHome    ?? (() => {}) },
              { name: 'ABOUT',   action: props.onNavigateToAbout   ?? (() => {}) },
              { name: 'CONTACT', action: props.onNavigateToContact ?? (() => {}) }
              ].map(item => (
                <button
                  key={item.name}
                  onClick={item.action}
                  className="relative text-xl font-bold uppercase tracking-[0.1em] pb-1 group transition-all duration-300 hover:scale-105"
                  style={{ color: B, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#a32626')}
                  onMouseLeave={e => (e.currentTarget.style.color = B)}
                >
                  {item.name}
                  {/* smooth slide-in underline on hover */}
                  <span
                    className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-300 ease-out group-hover:w-full"
                    style={{ background: '#a32626' }}
                  />
                </button>
              ))}
            </nav>

            {/* Profile icon - REMOVED */}
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════
          MAIN CONTENT - Perfect single-screen fit
      ════════════════════════════════════════ */}
      <main
        className="flex-1 max-w-6xl mx-auto px-4 w-full flex flex-col"
        style={{ padding: '2rem 1rem 4rem 1rem' }}
      >

        {/* ── HERO ── */}
        <section className="flex flex-col lg:flex-row items-center gap-4 mb-8">

          {/* LEFT — Enhanced typography and spacing */}
          <div className="flex-1 flex flex-col gap-3">
            <motion.p 
              className="text-sm font-bold uppercase tracking-[0.2em]" 
              style={{ color: `${B}99` }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Dashboard
            </motion.p>
            <motion.h1
              className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-[0.9]"
              style={{ color: B }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Welcome<br />Back
            </motion.h1>
            <motion.p 
              className="text-base md:text-lg font-medium tracking-wide leading-relaxed max-w-[420px]" 
              style={{ color: '#6b7280' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Your bone health journey continues here. Track progress, connect with specialists, and stay informed.
            </motion.p>
            {/* decorative accent line */}
            <motion.div 
              className="flex items-center gap-3 mt-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="w-8 h-[3px] rounded-full" style={{ background: B }}></div>
              <div className="w-5 h-[3px] rounded-full" style={{ background: `${B}70` }}></div>
              <div className="w-3 h-[3px] rounded-full" style={{ background: `${B}40` }}></div>
            </motion.div>
          </div>

          {/* RIGHT — Enhanced Bone Density graphic */}
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <motion.div
              className="relative w-[200px] h-[200px] rounded-[24px] flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${BL} 0%, #fff8f8 100%)`,
                border: '1px solid rgba(128,0,0,0.08)',
                boxShadow: '0 8px 25px rgba(128,0,0,0.06)',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: [0, -3, 0]
              }}
              transition={{ 
                opacity: { duration: 1, delay: 0.8 },
                scale: { duration: 1, delay: 0.8 },
                y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
              }}
            >
              {/* concentric rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-40 rounded-full border opacity-[0.12]" style={{ borderColor: B }}></div>
                <div className="absolute w-28 h-28 rounded-full border opacity-[0.08]" style={{ borderColor: B }}></div>
              </div>

              {/* bone / spine SVG */}
              <svg viewBox="0 0 200 200" className="w-28 h-28 relative z-10" fill="none">
                {/* spine shaft */}
                <rect x="93" y="18" width="14" height="164" rx="7" fill={B} opacity="0.12"/>
                {/* vertebrae discs */}
                {[28, 52, 76, 100, 124, 148].map((y, i) => (
                  <rect key={i} x="79" y={y} width="42" height="13" rx="6.5" fill={B} opacity="0.25"/>
                ))}
                {/* hip ellipses */}
                <ellipse cx="71" cy="118" rx="21" ry="28" fill={B} opacity="0.16" transform="rotate(-14 71 118)"/>
                <ellipse cx="129" cy="118" rx="21" ry="28" fill={B} opacity="0.16" transform="rotate(14 129 118)"/>
                {/* ECG pulse */}
                <polyline
                  points="22,172 48,172 60,150 72,188 84,158 96,172 178,172"
                  stroke={B} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"
                />
                {/* center dot */}
                <circle cx="100" cy="100" r="5" fill={B} opacity="0.4"/>
              </svg>

              {/* stat chips */}
              <div
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                style={{ background: '#fff', color: B, border: '1px solid rgba(128,0,0,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              >
                Bone Density ↑
              </div>
              <div
                className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                style={{ background: B, color: '#fff', boxShadow: '0 4px 12px rgba(128,0,0,0.25)' }}
              >
                Risk: Monitored
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CORE SERVICES ── */}
        <section className="mt-16 mb-16 dashboard-section">
          {/* section label */}
          <motion.div 
            className="flex items-center gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <span className="text-2xl font-bold uppercase tracking-wide" style={{ color: B }}>
              Core Services
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(128,0,0,0.2)' }}></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {coreServices.map((svc, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: 1.2 + (i * 0.1), 
                  duration: 0.6,
                  type: "spring",
                  stiffness: 120
                }}
                onClick={svc.action}
                className="bg-white rounded-xl p-8 flex flex-col items-center text-center gap-6 border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-visible"
                style={{ 
                  minHeight: '280px',
                  boxShadow: '0 4px 16px rgba(128,0,0,0.06)',
                  position: 'relative'
                }}
                whileHover={{ 
                  y: -4,
                  boxShadow: '0 12px 32px rgba(128,0,0,0.12)'
                }}
              >
                {/* Icon container */}
                <div className="card-icon-box">
                  <i className={`fas ${svc.icon} icon-lg`}></i>
                </div>
                
                {/* Content below icon with enhanced spacing */}
                <div className="flex flex-col items-center text-center gap-4 flex-1 px-2">
                  <h4 className="text-xl font-bold uppercase tracking-tight leading-tight" style={{ color: B }}>
                    {svc.title}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed max-w-[200px]">
                    {svc.sub}
                  </p>
                </div>

                {/* Arrow button */}
                <div className="btn-icon">
                  <i className="fas fa-arrow-right icon-md"></i>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ── SPECIALIZED CARE ── */}
        <section className="mt-20 mb-24 dashboard-section">
          <motion.div 
            className="flex items-center gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
          >
            <span className="text-2xl font-bold uppercase tracking-wide" style={{ color: B }}>
              Specialized Care
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(128,0,0,0.2)' }}></div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {featuredCards.map((card, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: 1.7 + (i * 0.15), 
                  duration: 0.6,
                  type: "spring",
                  stiffness: 120
                }}
                onClick={card.action}
                className="rounded-xl p-8 flex flex-col items-center text-center gap-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-visible"
                style={{
                  ...(card.dark
                    ? { 
                        background: `linear-gradient(135deg, ${B} 0%, #5a0000 100%)`, 
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 8px 24px rgba(128,0,0,0.2)'
                      }
                    : { 
                        background: '#fff', 
                        border: '1px solid rgba(128,0,0,0.1)',
                        boxShadow: '0 4px 16px rgba(128,0,0,0.06)'
                      }
                  ),
                  minHeight: '280px',
                  position: 'relative'
                }}
                whileHover={{ 
                  y: -4,
                  boxShadow: card.dark 
                    ? '0 16px 40px rgba(128,0,0,0.3)' 
                    : '0 12px 32px rgba(128,0,0,0.12)'
                }}
              >
                {/* Icon container */}
                <div className={card.dark ? 'card-icon-box-dark' : 'card-icon-box'}>
                  <i className={`fas ${card.icon} icon-lg`}></i>
                </div>
                
                {/* Content below icon with enhanced spacing */}
                <div className="flex flex-col items-center text-center gap-4 flex-1 px-2">
                  <h4 className="text-xl font-bold uppercase tracking-tight leading-tight"
                    style={{ color: card.dark ? '#fff' : B }}>
                    {card.title}
                  </h4>
                  <p className="text-sm leading-relaxed max-w-[240px]"
                    style={{ color: card.dark ? 'rgba(255,255,255,0.85)' : '#6b7280' }}>
                    {card.sub}
                  </p>
                </div>
                
                {/* Explore button */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold uppercase tracking-wide"
                    style={{ color: card.dark ? '#fff' : B }}>
                    Explore
                  </span>
                  <div className={card.dark ? 'btn-icon' : 'btn-icon'}
                    style={card.dark ? { background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.28)' } : {}}>
                    <i className="fas fa-arrow-right icon-md"></i>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

      </main>

    </div>
  );
};

export default Dashboard;
