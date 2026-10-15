import React from 'react';

interface AgribankLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  subtitle?: string;
}

export const AgribankLogo: React.FC<AgribankLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  subtitle = 'CHI NHÁNH CÀ MAU',
}) => {
  const iconSize = {
    sm: 36,
    md: 46,
    lg: 58,
    xl: 72,
  }[size];

  const textSize = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  const subTextSize = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Authentic Agribank Emblem SVG */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm transition-transform duration-200 hover:scale-105"
      >
        <defs>
          <clipPath id="agri-rounded-rect">
            <rect width="120" height="120" rx="20" fill="white" />
          </clipPath>
          <linearGradient id="gold-rice" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD13B" />
            <stop offset="50%" stopColor="#F5A800" />
            <stop offset="100%" stopColor="#D98A00" />
          </linearGradient>
          <linearGradient id="red-sash" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9B1C2D" />
            <stop offset="100%" stopColor="#7E1220" />
          </linearGradient>
        </defs>

        {/* Outer White Card Frame with Subtle Border */}
        <rect width="120" height="120" rx="20" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />

        <g clipPath="url(#agri-rounded-rect)">
          {/* Deep Green Triangles (Agribank Forest Green #005a2e / #006837) */}
          <rect x="6" y="6" width="108" height="108" rx="16" fill="#005A2E" />

          {/* White Border for the diagonal red stripe */}
          <path
            d="M-20 140 L140 -20 L170 10 L10 170 Z"
            fill="white"
            transform="rotate(-45 60 60)"
          />

          {/* Diagonal Red Bordeaux Sash */}
          <rect
            x="32"
            y="-30"
            width="56"
            height="180"
            fill="url(#red-sash)"
            transform="rotate(-45 60 60)"
          />

          {/* White Outer Separator Stripes */}
          <line x1="0" y1="120" x2="120" y2="0" stroke="white" strokeWidth="5" />
          <line x1="-30" y1="90" x2="90" y2="-30" stroke="white" strokeWidth="4" />
          <line x1="30" y1="150" x2="150" y2="30" stroke="white" strokeWidth="4" />

          {/* Stylized Golden S-Curve Rice Ear / Bông lúa vàng */}
          <g transform="translate(60, 60) scale(0.9) translate(-60, -60)">
            {/* Grain 1 - Top */}
            <path d="M60 16 C68 20 74 27 70 33 C66 39 55 35 60 16Z" fill="url(#gold-rice)" stroke="#9E6400" strokeWidth="1" />
            {/* Grain 2 */}
            <path d="M56 26 C47 30 46 41 53 43 C60 45 63 35 56 26Z" fill="url(#gold-rice)" stroke="#9E6400" strokeWidth="1" />
            {/* Grain 3 */}
            <path d="M58 37 C67 40 68 50 63 53 C57 56 53 46 58 37Z" fill="url(#gold-rice)" stroke="#9E6400" strokeWidth="1" />
            {/* Grain 4 */}
            <path d="M58 48 C50 51 49 61 56 64 C63 67 66 56 58 48Z" fill="url(#gold-rice)" stroke="#9E6400" strokeWidth="1" />
            {/* Grain 5 */}
            <path d="M62 59 C71 62 72 73 66 76 C59 79 56 68 62 59Z" fill="url(#gold-rice)" stroke="#9E6400" strokeWidth="1" />
            {/* Grain 6 */}
            <path d="M63 70 C54 74 53 85 61 88 C69 91 72 80 63 70Z" fill="url(#gold-rice)" stroke="#9E6400" strokeWidth="1" />
            {/* Grain 7 */}
            <path d="M66 82 C75 86 74 97 68 100 C61 103 59 92 66 82Z" fill="url(#gold-rice)" stroke="#9E6400" strokeWidth="1" />
            {/* Grain 8 - Bottom */}
            <path d="M62 93 C52 97 49 108 58 111 C65 113 69 103 62 93Z" fill="url(#gold-rice)" stroke="#9E6400" strokeWidth="1" />

            {/* Central spine braid cord */}
            <path
              d="M60 18 Q50 45 65 65 T58 108"
              fill="none"
              stroke="#D48600"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        </g>
      </svg>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className={`font-serif font-black tracking-wider text-[#8C1D2F] leading-none ${textSize}`}>
          AGRIBANK
        </div>
        {showSubtitle && (
          <div className={`font-sans font-bold tracking-widest text-[#8C1D2F] uppercase mt-1 leading-tight ${subTextSize}`}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
