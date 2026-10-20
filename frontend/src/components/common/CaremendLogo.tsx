
import React from 'react';

interface Props {
  className?: string;
  light?: boolean;
}

const CaremendLogo: React.FC<Props> = ({ className = "w-48", light = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className} select-none`}>
      <div className="relative w-full aspect-square flex items-center justify-center p-2">
        {/* SVG Re-creation focused on high fidelity to the reference image */}
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            {/* Path for the circular text to wrap perfectly */}
            <path id="textCirclePath" d="M 100, 100 m -78, 0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
            
            {/* Gradient for the yellow inner heart glow */}
            <radialGradient id="innerYellow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffeb3b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fbc02d" stopOpacity="0.6" />
            </radialGradient>

            {/* Subtle red glow for the entire circular container */}
            <filter id="redAura" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#a32626" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Outer circle — no filter to avoid bleed into other pages */}
          <circle cx="100" cy="100" r="90" fill="white" />
          
          {/* The Heart: Maroon outline with Yellow fill */}
          <path 
            d="M100 150 C100 150 45 115 45 75 C45 50 65 40 80 40 C95 40 100 50 100 50 C100 50 105 40 120 40 C135 40 155 50 155 75 C155 115 100 150 100 150" 
            fill="url(#innerYellow)" 
            stroke="#a32626" 
            strokeWidth="8"
            strokeLinejoin="round"
          />

          {/* The Hand: White stylized palm inside the heart */}
          <g transform="translate(100, 95) scale(0.9)">
            {/* Main palm shape */}
            <path 
              d="M-5 45 C-20 30 -50 0 -45 -25 C-40 -45 -20 -50 -10 -40 C0 -30 10 -10 10 -10 C10 -10 20 -30 30 -40 C40 -50 60 -45 65 -25 C70 0 40 35 25 50 L10 60 Z" 
              fill="white" 
              stroke="#a32626" 
              strokeWidth="4"
              transform="translate(-10, -10)"
            />
            {/* Finger articulation lines as seen in reference */}
            <path d="M-5 -10 Q5 -30 25 -20" fill="none" stroke="#a32626" strokeWidth="4" strokeLinecap="round" />
            <path d="M-5 0 Q10 -20 30 -10" fill="none" stroke="#a32626" strokeWidth="4" strokeLinecap="round" />
            <path d="M-5 10 Q15 -10 35 0" fill="none" stroke="#a32626" strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* Wrapped Text: Bold maroon, exactly following the curve */}
          <text fill="#a32626" fontSize="10.5" fontWeight="900" letterSpacing="0.5">
            <textPath xlinkHref="#textCirclePath" startOffset="0%">
              FIND SUPPORT, FIND BALANCE, FIND YOU
            </textPath>
          </text>
        </svg>
      </div>
      
      {/* CAREMEND Text: Recreating the 3D-ish, outlined look from the reference image */}
      <div 
        className="mt-2 text-4xl md:text-5xl font-black tracking-[0.15em]" 
        style={{ 
          color: light ? '#FFFFFF' : '#a32626',
          textShadow: light ? '0px 4px 10px rgba(0, 0, 0, 0.3)' : `
            1.5px 1.5px 0px #fff,
            -1.5px -1.5px 0px #fff,
            1.5px -1.5px 0px #fff,
            -1.5px 1.5px 0px #fff,
            0px 4px 10px rgba(163, 38, 38, 0.5)
          `,
          WebkitTextStroke: light ? 'none' : '0.8px #a32626',
        }}
      >
        CAREMEND
      </div>
    </div>
  );
};

export default CaremendLogo;
