import React from 'react';

interface MxLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
}

/**
 * Pure SVG vector emblem matching the exact MX geometric monogram
 */
export const MxEmblem: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg
      viewBox="0 0 96 75"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Left stem & M gradient */}
        <linearGradient id="mxMainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EB212B" />
          <stop offset="35%" stopColor="#CE141D" />
          <stop offset="75%" stopColor="#B00E16" />
          <stop offset="100%" stopColor="#8C0910" />
        </linearGradient>

        {/* Lower X arm gradient (with realistic shadow tucked under main diagonal) */}
        <linearGradient id="mxLowerXGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9C0C14" />
          <stop offset="60%" stopColor="#C7121B" />
          <stop offset="88%" stopColor="#7A090F" />
          <stop offset="100%" stopColor="#300305" />
        </linearGradient>

        {/* Upper X arm gradient (darkens toward top right) */}
        <linearGradient id="mxUpperXGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C4121B" />
          <stop offset="50%" stopColor="#960D14" />
          <stop offset="100%" stopColor="#4A0509" />
        </linearGradient>

        {/* Overlap shadow casting onto the lower leg of the X */}
        <filter id="mxRibbonShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="-1.2" dy="1.2" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.85" />
        </filter>
      </defs>

      {/* 1. Lower left leg of X (tucks under main diagonal) */}
      <polygon
        points="38,65 51,65 64.5,44 51.5,42"
        fill="url(#mxLowerXGradient)"
      />

      {/* 2. Upper right arm of X (emerges from main diagonal) */}
      <polygon
        points="63.8,28 75.8,10 88,10 69,36"
        fill="url(#mxUpperXGradient)"
      />

      {/* 3. Main M character + continuous long diagonal of X with overlap shadow */}
      <path
        d="M 8 10 L 21 10 L 34 38 L 52 10 L 88 65 L 75 65 L 52 29 L 34 57 L 21 40 L 21 65 L 8 65 Z"
        fill="url(#mxMainGradient)"
        filter="url(#mxRibbonShadow)"
      />
    </svg>
  );
};

export const MxLogo: React.FC<MxLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  subtitle = 'CREATOR MARKETPLACE',
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  }[size];

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl sm:text-[22px]',
    lg: 'text-2xl sm:text-[28px]',
    xl: 'text-3xl sm:text-4xl',
  }[size];

  const subtitleSizes = {
    sm: 'text-[8px] tracking-[0.15em]',
    md: 'text-[9px] sm:text-[10px] tracking-[0.18em]',
    lg: 'text-[11px] sm:text-[12px] tracking-[0.2em]',
    xl: 'text-[13px] sm:text-[14px] tracking-[0.2em]',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Dark rounded container with exact red geometric MX emblem */}
      <div
        className={`${iconDimensions} rounded-[12px] sm:rounded-xl bg-[#000000] border border-slate-800 p-1 flex items-center justify-center shadow-md relative overflow-hidden shrink-0 group-hover:border-red-600/50 transition-colors`}
      >
        <MxEmblem className="w-full h-full" />
      </div>

      {showText && (
        <div className="flex flex-col justify-center">
          {/* Logo brand wordmark: 'mx' in crisp white, 'gallery' in vibrant red */}
          <div className={`font-black ${titleSizes} tracking-[-0.03em] text-white leading-none flex items-center`}>
            <span>mx</span>
            <span className="text-[#EB212B] ml-1">gallery</span>
          </div>

          {/* Subtitle: 'CREATOR MARKETPLACE' uppercase with gold accent */}
          {subtitle && (
            <span className={`${subtitleSizes} font-bold text-[#dfb15b] uppercase mt-1 leading-none`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

