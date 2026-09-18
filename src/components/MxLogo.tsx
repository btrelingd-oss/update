import React from 'react';

interface MxLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
}

export const MxLogo: React.FC<MxLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  subtitle = 'Creator Marketplace',
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  }[size];

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Dark rounded squircle with stylized red MX emblem matching user brand */}
      <div
        className={`${iconDimensions} rounded-xl bg-gradient-to-br from-[#161926] via-[#0f111a] to-[#090a10] border border-slate-700/60 p-1 flex items-center justify-center shadow-md relative overflow-hidden shrink-0 group-hover:border-red-500/50 transition-colors`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_2px_4px_rgba(220,38,38,0.4)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="mxRedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF334B" />
              <stop offset="50%" stopColor="#E60026" />
              <stop offset="100%" stopColor="#B3001B" />
            </linearGradient>
            <linearGradient id="mxRedHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFA0AB" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#E60026" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Letter M */}
          <path
            d="M 16 75 L 16 25 L 29 25 L 42 50 L 55 25 L 68 25 L 68 75 L 56 75 L 56 46 L 46 65 L 38 65 L 28 46 L 28 75 Z"
            fill="url(#mxRedGradient)"
          />

          {/* Letter X overlapping seamlessly on the right */}
          <path
            d="M 52 75 L 64 54 L 54 25 L 67 25 L 73 42 L 79 25 L 92 25 L 82 54 L 94 75 L 81 75 L 73 59 L 65 75 Z"
            fill="url(#mxRedGradient)"
          />

          {/* Subtle glossy top highlight sheen */}
          <path
            d="M 16 25 L 68 25 L 65 30 L 19 30 Z"
            fill="url(#mxRedHighlight)"
          />
          <path
            d="M 54 25 L 92 25 L 88 30 L 58 30 Z"
            fill="url(#mxRedHighlight)"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-black ${titleSizes} tracking-tight text-slate-900 leading-none`}>
            mx <span className="text-red-600">gallery</span>
          </span>
          {subtitle && (
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
