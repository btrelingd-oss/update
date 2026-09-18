import React from 'react';
import { ProductCategory, ProductColor } from '../types';

interface MockupRendererProps {
  productType: ProductCategory;
  color: ProductColor;
  artworkUrl: string;
  className?: string;
  scale?: number; // 0.5 to 1.5
  offsetX?: number; // -50 to 50
  offsetY?: number; // -50 to 50
  viewMode?: 'front' | 'lifestyle' | 'detail';
}

export const MockupRenderer: React.FC<MockupRendererProps> = ({
  productType,
  color,
  artworkUrl,
  className = '',
  scale = 1.0,
  offsetX = 0,
  offsetY = 0,
  viewMode = 'front',
}) => {
  const isDarkGarment = color.isDark;

  // Render T-Shirt Mockup
  if (productType === 't-shirt') {
    return (
      <div
        id="mockup-container-t-shirt"
        className={`relative w-full aspect-square flex items-center justify-center overflow-hidden select-none ${className}`}
        style={{ backgroundColor: '#F8FAFC' }}
      >
        {/* Subtle fabric studio background */}
        <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />

        {/* Garment Silhouette SVG */}
        <svg
          viewBox="0 0 500 500"
          className="w-[90%] h-[90%] drop-shadow-xl transition-all duration-300"
        >
          <defs>
            {/* Shading filter for fabric folds */}
            <radialGradient id="tshirtShade" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={isDarkGarment ? '0.08' : '0.2'} />
              <stop offset="70%" stopColor="#000000" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#000000" stopOpacity={isDarkGarment ? '0.35' : '0.15'} />
            </radialGradient>
            <linearGradient id="creaseShadow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Shirt Body Silhouette */}
          <path
            d="M175 75 
               C195 95 305 95 325 75 
               L395 115 
               L460 190 
               L405 235 
               L370 195 
               L375 440 
               C375 450 365 455 355 455 
               L145 455 
               C135 455 125 450 125 440 
               L130 195 
               L95 235 
               L40 190 
               L105 115 Z"
            fill={color.hex}
            stroke={isDarkGarment ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}
            strokeWidth="1.5"
          />

          {/* Sleeve seams */}
          <path
            d="M130 195 C 145 150 160 125 175 75"
            fill="none"
            stroke={isDarkGarment ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
            strokeWidth="2"
          />
          <path
            d="M370 195 C 355 150 340 125 325 75"
            fill="none"
            stroke={isDarkGarment ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
            strokeWidth="2"
          />

          {/* Ribbed Collar */}
          <path
            d="M175 75 C 190 115 310 115 325 75 C 305 95 195 95 175 75 Z"
            fill={color.hex}
            stroke={isDarkGarment ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
            strokeWidth="2"
          />
          <path
            d="M190 85 C 215 105 285 105 310 85"
            fill="none"
            stroke={isDarkGarment ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'}
            strokeWidth="1.5"
            strokeDasharray="2 3"
          />

          {/* Realistic Fabric Lighting Overlay */}
          <path
            d="M175 75 C195 95 305 95 325 75 L395 115 L460 190 L405 235 L370 195 L375 440 C375 450 365 455 355 455 L145 455 C135 455 125 450 125 440 L130 195 L95 235 L40 190 L105 115 Z"
            fill="url(#tshirtShade)"
            pointerEvents="none"
          />
        </svg>

        {/* Chest Print Printable Area */}
        <div
          className="absolute pointer-events-none flex items-center justify-center transition-all duration-300"
          style={{
            top: viewMode === 'detail' ? '25%' : '32%',
            left: '30%',
            width: '40%',
            height: '42%',
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${viewMode === 'detail' ? scale * 1.35 : scale})`,
          }}
        >
          <img
            src={artworkUrl}
            alt="Artwork on garment"
            className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.18)]"
            style={{
              mixBlendMode: isDarkGarment ? 'normal' : 'multiply',
              filter: isDarkGarment ? 'contrast(1.04) brightness(0.98)' : 'contrast(1.02)',
            }}
          />
        </div>

        {/* Redbubble style apparel tag */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 shadow-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color.hex, border: '1px solid rgba(0,0,0,0.2)' }} />
          <span>{color.name}</span>
        </div>
      </div>
    );
  }

  // Render Hoodie Mockup
  if (productType === 'hoodie') {
    return (
      <div
        id="mockup-container-hoodie"
        className={`relative w-full aspect-square flex items-center justify-center overflow-hidden select-none ${className}`}
        style={{ backgroundColor: '#F8FAFC' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />

        <svg viewBox="0 0 500 500" className="w-[90%] h-[90%] drop-shadow-xl">
          <defs>
            <radialGradient id="hoodieShade" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={isDarkGarment ? '0.06' : '0.22'} />
              <stop offset="100%" stopColor="#000000" stopOpacity={isDarkGarment ? '0.4' : '0.2'} />
            </radialGradient>
          </defs>

          {/* Hoodie Body & Sleeves */}
          <path
            d="M160 90 L85 140 L30 260 L95 285 L125 210 L130 450 L370 450 L375 210 L405 285 L470 260 L415 140 L340 90 Z"
            fill={color.hex}
            stroke={isDarkGarment ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="1.5"
          />
          {/* Hood Silhouette */}
          <path
            d="M160 90 C 160 20 340 20 340 90 C 310 135 190 135 160 90 Z"
            fill={color.hex}
            stroke={isDarkGarment ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
            strokeWidth="2"
          />
          {/* Hood inner shadow */}
          <ellipse cx="250" cy="85" rx="55" ry="30" fill="#000000" opacity="0.3" />

          {/* Drawstrings */}
          <path d="M225 105 Q 220 180 230 210" fill="none" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" />
          <circle cx="230" cy="214" r="3" fill="#94A3B8" />
          <path d="M275 105 Q 280 180 270 210" fill="none" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" />
          <circle cx="270" cy="214" r="3" fill="#94A3B8" />

          {/* Kangaroo Pouch Pocket */}
          <path
            d="M170 330 L330 330 L345 420 L155 420 Z"
            fill={color.hex}
            stroke={isDarkGarment ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}
            strokeWidth="2"
          />

          {/* Shading */}
          <path
            d="M160 90 L85 140 L30 260 L95 285 L125 210 L130 450 L370 450 L375 210 L405 285 L470 260 L415 140 L340 90 Z"
            fill="url(#hoodieShade)"
            pointerEvents="none"
          />
        </svg>

        {/* Chest Artwork */}
        <div
          className="absolute pointer-events-none flex items-center justify-center"
          style={{
            top: '29%',
            left: '32%',
            width: '36%',
            height: '32%',
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale * 0.95})`,
          }}
        >
          <img
            src={artworkUrl}
            alt="Artwork on hoodie"
            className="w-full h-full object-contain"
            style={{
              mixBlendMode: isDarkGarment ? 'normal' : 'multiply',
            }}
          />
        </div>
      </div>
    );
  }

  // Render Sticker Mockup
  if (productType === 'sticker') {
    return (
      <div
        id="mockup-container-sticker"
        className={`relative w-full aspect-square flex items-center justify-center p-8 overflow-hidden select-none ${className}`}
        style={{ backgroundColor: '#F1F5F9' }}
      >
        {/* Subtle grid background to highlight die-cut sticker edge */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:24px_24px] opacity-70" />

        {/* Die Cut White Contour Container with Depth Shadow */}
        <div
          className="relative max-w-[75%] max-h-[75%] p-4 bg-white rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.06)] transform transition-transform duration-300 hover:rotate-1 hover:scale-105"
          style={{
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          }}
        >
          {/* Glossy Vinyl Reflection Sheen */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-white/30 to-white/60 pointer-events-none" />

          {/* Sticker Peel Corner Indicator */}
          <div className="absolute bottom-1 right-1 w-6 h-6 border-b-2 border-r-2 border-slate-200 rounded-br-2xl pointer-events-none opacity-40" />

          <img
            src={artworkUrl}
            alt="Artwork on sticker"
            className="w-full h-full object-contain rounded-2xl drop-shadow-sm"
          />
        </div>

        {/* Redbubble Die-cut badge */}
        <div className="absolute bottom-4 right-4 px-2.5 py-1 bg-white/90 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 shadow-xs">
          White Die-Cut Contour
        </div>
      </div>
    );
  }

  // Render Phone Case Mockup
  if (productType === 'phone-case') {
    return (
      <div
        id="mockup-container-phone-case"
        className={`relative w-full aspect-square flex items-center justify-center overflow-hidden select-none ${className}`}
        style={{ backgroundColor: '#F8FAFC' }}
      >
        {/* Phone Case Shell */}
        <div
          className="relative w-56 h-[440px] rounded-[48px] p-2.5 shadow-2xl transition-transform duration-300"
          style={{
            backgroundColor: color.hex,
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale * 0.95})`,
          }}
        >
          {/* Camera Bump Cutout */}
          <div className="absolute top-6 left-6 w-22 h-24 rounded-3xl bg-slate-950 p-2.5 z-20 shadow-md flex flex-wrap gap-2 items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-slate-700 shadow-inner flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-950 border border-blue-400/40" />
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-slate-700 shadow-inner flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-950 border border-blue-400/40" />
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-slate-700 shadow-inner flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-950 border border-blue-400/40" />
            </div>
            <div className="w-3.5 h-3.5 rounded-full bg-amber-100/80 border border-slate-600" />
          </div>

          {/* Edge Bevel Highlight */}
          <div className="w-full h-full rounded-[40px] overflow-hidden relative border border-black/10 bg-slate-900">
            {/* Glossy Sheen Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none z-10" />

            {/* Artwork on Phone Case */}
            <img
              src={artworkUrl}
              alt="Artwork on phone case"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    );
  }

  // Render Ceramic Mug Mockup
  if (productType === 'mug') {
    return (
      <div
        id="mockup-container-mug"
        className={`relative w-full aspect-square flex items-center justify-center overflow-hidden select-none ${className}`}
        style={{ backgroundColor: '#F8FAFC' }}
      >
        <div className="relative flex items-center justify-center w-[360px] h-[340px]">
          {/* Mug Handle */}
          <div className="absolute right-8 w-24 h-44 rounded-r-[50px] border-[18px] border-slate-100 shadow-md -z-0" />

          {/* Mug Cylinder Body */}
          <div className="relative w-64 h-72 bg-gradient-to-r from-slate-200 via-white to-slate-200 rounded-b-[36px] rounded-t-xl shadow-xl overflow-hidden z-10 border-t-4 border-slate-300">
            {/* Mug Rim Inner */}
            <div className="w-full h-8 bg-gradient-to-b from-slate-300 to-slate-100 rounded-full border-b border-slate-300 shadow-inner" />

            {/* Artwork wrapped around mug cylinder */}
            <div className="w-full h-56 flex items-center justify-center px-4 py-2">
              <img
                src={artworkUrl}
                alt="Artwork on mug"
                className="max-h-full max-w-full object-contain drop-shadow-sm"
                style={{
                  transform: `scale(${scale * 0.9})`,
                }}
              />
            </div>

            {/* Cylinder 3D Specular Highlight Line */}
            <div className="absolute top-0 left-8 w-6 h-full bg-white/40 blur-xs pointer-events-none" />
            <div className="absolute top-0 right-8 w-10 h-full bg-slate-900/10 pointer-events-none" />
          </div>
        </div>
      </div>
    );
  }

  // Render Framed Art Print Mockup
  if (productType === 'art-print') {
    const frameBorderColor =
      color.id === 'wood-frame'
        ? '#A27B5C'
        : color.id === 'white-frame'
        ? '#E2E8F0'
        : '#1F2937';

    return (
      <div
        id="mockup-container-art-print"
        className={`relative w-full aspect-square flex items-center justify-center p-8 overflow-hidden select-none ${className}`}
        style={{ backgroundColor: '#F1F5F9' }}
      >
        {/* Gallery Wall Shadow */}
        <div
          className="relative max-w-[80%] max-h-[85%] p-4 rounded-sm shadow-2xl transition-transform duration-300"
          style={{
            backgroundColor: frameBorderColor,
            border: `12px solid ${frameBorderColor}`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          }}
        >
          {/* Gallery Bevel Mat Board (Off-white) */}
          <div className="p-6 bg-[#FAFAF8] shadow-inner border border-slate-200">
            {/* Archival Artwork */}
            <div className="w-64 h-80 overflow-hidden flex items-center justify-center bg-white shadow-xs">
              <img
                src={artworkUrl}
                alt="Artwork print"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Canvas Tote Bag Mockup
  if (productType === 'tote-bag') {
    const isNatural = color.id === 'natural';
    return (
      <div
        id="mockup-container-tote-bag"
        className={`relative w-full aspect-square flex items-center justify-center overflow-hidden select-none ${className}`}
        style={{ backgroundColor: '#F8FAFC' }}
      >
        <div className="relative w-72 h-[420px] flex flex-col items-center">
          {/* Handles */}
          <div
            className="w-36 h-36 border-[12px] border-b-0 rounded-t-full -mb-3 z-0"
            style={{ borderColor: isNatural ? '#D8CCBA' : '#1F2937' }}
          />

          {/* Bag Body Canvas */}
          <div
            className="relative w-72 h-80 rounded-b-xl shadow-xl flex flex-col items-center justify-center p-6 z-10"
            style={{
              backgroundColor: isNatural ? '#F3EDE2' : '#111827',
              border: isNatural ? '1px solid #E5DAC9' : '1px solid #374151',
            }}
          >
            {/* Stitched top seam */}
            <div className="absolute top-4 inset-x-4 border-b border-dashed border-slate-400/30" />

            {/* Canvas Fabric Texture effect */}
            <div className="w-48 h-56 flex items-center justify-center">
              <img
                src={artworkUrl}
                alt="Artwork on tote bag"
                className="max-h-full max-w-full object-contain"
                style={{
                  mixBlendMode: isNatural ? 'multiply' : 'normal',
                  transform: `scale(${scale * 0.95})`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
