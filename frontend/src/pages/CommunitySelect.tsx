
import React from 'react';

interface Props {
  onBack: () => void;
  onSelect: (disease: 'Osteoporosis') => void;
}

const CommunitySelect: React.FC<Props> = ({ onBack, onSelect }) => {
  return (
    <div className="w-full h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#a32626] relative items-center justify-center px-10 py-12 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-64 h-64 bg-black/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 text-center flex flex-col items-center gap-5 max-w-xs">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/20 shadow-2xl rotate-12">
            <i className="fas fa-users text-white text-3xl"></i>
          </div>
          <h1 className="text-white text-4xl font-black uppercase tracking-tighter leading-none">
            Shared<br />Strength
          </h1>
          <p className="text-white/60 font-bold text-xs uppercase tracking-[0.22em] leading-relaxed max-w-[220px]">
            Connect with others, share experiences, and find support in our specialized communities.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white/30 rounded-full"></div>
            <div className="w-2 h-2 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 w-full bg-white border-b border-gray-50 px-8 py-4 flex items-center justify-between">
          <button onClick={onBack} className="btn-back" aria-label="Go back">
            <i className="fas fa-arrow-left icon-md"></i>
          </button>
          <div className="text-[#a32626] text-lg font-black uppercase tracking-wide">CAREMEND</div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 py-8 overflow-hidden">
          <div className="max-w-md w-full mx-auto flex flex-col gap-8">

            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 bg-[#fdf2f2] rounded-xl flex items-center justify-center text-[#a32626]">
                <i className="fas fa-door-open icon-md"></i>
              </div>
              <h2 className="text-[#a32626] text-4xl font-black uppercase tracking-tighter leading-none">
                Choose Your<br />Community
              </h2>
              <p className="text-neutral-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
                Select the forum that matches your needs to start engaging with peers and specialists.
              </p>
            </div>

            <button
              onClick={() => onSelect('Osteoporosis')}
              className="group relative w-full p-7 bg-white rounded-2xl text-left border-2 border-transparent hover:border-[#a32626] transition-all duration-300 overflow-hidden"
              style={{ boxShadow: '0 8px 32px rgba(163,38,38,0.1)' }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#fdf2f2] rounded-bl-[3rem] -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-[#a32626] text-2xl font-black uppercase tracking-tighter mb-1">Osteoporosis</h3>
                  <p className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest">Bone Health & Recovery</p>
                </div>
                <div className="w-12 h-12 bg-[#a32626] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
                  <i className="fas fa-bone icon-md"></i>
                </div>
              </div>
            </button>

            <p className="text-center text-neutral-300 text-[10px] font-bold uppercase tracking-widest">
              Join over 5,000 active members today
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunitySelect;



