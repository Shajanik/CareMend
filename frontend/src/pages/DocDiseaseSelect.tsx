
import React from 'react';
import CaremendLogo from '../components/CaremendLogo';

interface Props {
  onBack: () => void;
  onSelect: (disease: 'Osteoporosis') => void;
}

const DocDiseaseSelect: React.FC<Props> = ({ onBack, onSelect }) => {
  return (
    <div className="w-full flex flex-col lg:flex-row h-screen bg-white overflow-hidden">
      {/* Left Side - Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#a32626] flex-col items-center justify-center relative overflow-hidden px-10 py-12">
        <div className="relative z-10 flex flex-col items-center w-full max-w-xs gap-4 text-center">
          {/* Logo */}
          <CaremendLogo className="w-16 mb-1" light />
          {/* Brand name */}
          <p className="text-white/70 text-xs font-black uppercase tracking-[0.28em]">
            Care Mend
          </p>
          {/* Main heading */}
          <h1 className="text-white text-4xl font-black leading-[1.05] uppercase tracking-tight">
            Expert<br />Connectivity
          </h1>
          {/* Subtitle */}
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider leading-relaxed max-w-[220px]">
            Find the right specialist for your specific bone health needs.
          </p>
          {/* Footer tag */}
          <div className="flex items-center justify-center gap-3 text-white/35 text-[10px] font-bold uppercase tracking-widest pt-2">
            <div className="w-6 h-[2px] bg-white/30"></div>
            <span>Specialized Care Network</span>
            <div className="w-6 h-[2px] bg-white/30"></div>
          </div>
        </div>
        {/* Background decorations */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 -left-16 w-56 h-56 bg-black/10 rounded-full blur-2xl"></div>
      </div>

      {/* Right Side - Selection Form */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="w-full bg-white border-b border-gray-50 flex-shrink-0">
          <div className="px-8 py-4 flex items-center justify-between">
            <button onClick={onBack} className="btn-back" aria-label="Go back">
              <i className="fas fa-arrow-left icon-md"></i>
            </button>
            <div className="text-[#a32626] text-lg font-black uppercase tracking-wide">
              CAREMEND
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 overflow-hidden">
          <div className="w-full max-w-md flex flex-col gap-8">
            {/* Title */}
            <div className="text-center">
              <h2 className="text-[#a32626] text-4xl font-black uppercase tracking-tighter leading-none">
                Select Disease
              </h2>
              <p className="text-neutral-400 font-bold text-xs uppercase tracking-widest mt-2">
                Choose the condition you need a specialist for
              </p>
            </div>

            {/* Disease Card */}
            <div className="flex justify-center">
              <button
                onClick={() => onSelect('Osteoporosis')}
                className="group w-full p-8 bg-white rounded-[2.5rem] text-center shadow-xl border-2 border-neutral-50 hover:border-[#a32626] active:scale-95 transition-all flex flex-col items-center gap-5"
              >
                <div className="w-20 h-20 bg-[#fdf2f2] rounded-[1.5rem] flex items-center justify-center text-[#a32626] text-4xl group-hover:scale-110 transition-transform">
                  <i className="fas fa-bone"></i>
                </div>
                <div className="flex flex-col items-center">
                  <h3 className="text-[#a32626] text-2xl font-black uppercase tracking-tighter leading-none mb-1">
                    Osteoporosis
                  </h3>
                  <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">
                    Find specialized osteoporosis doctors
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#fdf2f2] flex items-center justify-center text-[#a32626] group-hover:translate-y-1 transition-transform">
                  <i className="fas fa-arrow-down text-sm"></i>
                </div>
              </button>
            </div>

            {/* Quote */}
            <div className="bg-neutral-50 px-6 py-5 rounded-[1.5rem] border border-neutral-100">
              <p className="text-neutral-400 font-semibold text-xs leading-relaxed italic text-center">
                "Our network includes top-tier specialists dedicated to providing personalised care for bone health conditions."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocDiseaseSelect;




