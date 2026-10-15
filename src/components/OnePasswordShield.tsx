import React from 'react';

interface OnePasswordShieldProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const OnePasswordShield: React.FC<OnePasswordShieldProps> = ({
  className = '',
  size = 'md',
}) => {
  const dimensions = {
    sm: { width: 150, height: 44, shield: 26 },
    md: { width: 210, height: 56, shield: 34 },
    lg: { width: 260, height: 68, shield: 42 },
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-between rounded-lg overflow-hidden select-none border border-[#6B111F] shadow-md ${className}`}
      style={{
        background: 'radial-gradient(ellipse at center, #A31E32 0%, #750F1E 65%, #4C0711 100%)',
        padding: size === 'sm' ? '4px 10px' : '6px 14px',
        minWidth: dimensions.width,
        height: dimensions.height,
      }}
    >
      {/* Subtle Metallic highlights */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/20 pointer-events-none" />

      {/* Text Group */}
      <div className="flex flex-col z-10 mr-3">
        <div className="flex items-center gap-1.5">
          {/* Small Agribank symbol badge */}
          <span className="w-3.5 h-3.5 rounded-[3px] bg-[#005A2E] border border-amber-300/60 inline-flex items-center justify-center text-[7px] font-bold text-amber-300">
            🌾
          </span>
          <span className="text-[11px] sm:text-xs font-bold tracking-wider text-white uppercase drop-shadow-sm">
            AGRIBANK
          </span>
        </div>
        <div className="text-xs sm:text-sm md:text-[15px] font-black tracking-widest text-[#FFDF6D] uppercase drop-shadow">
          ONE PASSWORD
        </div>
      </div>

      {/* Security Shield with Padlock */}
      <div className="relative shrink-0 z-10 flex items-center justify-center">
        <svg
          width={dimensions.shield}
          height={dimensions.shield * 1.15}
          viewBox="0 0 40 46"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          <defs>
            <linearGradient id="shield-rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF1AA" />
              <stop offset="40%" stopColor="#E2A61E" />
              <stop offset="100%" stopColor="#8A5B00" />
            </linearGradient>
            <linearGradient id="shield-body" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A82033" />
              <stop offset="60%" stopColor="#7E1220" />
              <stop offset="100%" stopColor="#4D0711" />
            </linearGradient>
            <linearGradient id="lock-body" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>

          {/* Outer Shield with Gold Rim */}
          <path
            d="M20 2 C29 2 38 6 38 14 C38 28 27 39 20 44 C13 39 2 28 2 14 C2 6 11 2 20 2 Z"
            fill="url(#shield-body)"
            stroke="url(#shield-rim)"
            strokeWidth="2.5"
          />

          {/* Inner Inset Shield Line */}
          <path
            d="M20 6 C26 6 33 9 33 16 C33 26 24 35 20 39 C16 35 7 26 7 16 C7 9 14 6 20 6 Z"
            fill="none"
            stroke="url(#shield-rim)"
            strokeWidth="1"
            strokeOpacity="0.6"
          />

          {/* Padlock Shackle */}
          <path
            d="M15 19 V16 C15 13.2 17.2 11 20 11 C22.8 11 25 13.2 25 16 V19"
            stroke="url(#lock-body)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Padlock Body */}
          <rect
            x="13"
            y="19"
            width="14"
            height="11"
            rx="2.5"
            fill="url(#lock-body)"
            stroke="#64748B"
            strokeWidth="0.8"
          />

          {/* Keyhole */}
          <circle cx="20" cy="23.5" r="1.3" fill="#6B111F" />
          <path d="M19.4 23.5 L19 27 H21 L20.6 23.5 Z" fill="#6B111F" />
        </svg>
      </div>
    </div>
  );
};
