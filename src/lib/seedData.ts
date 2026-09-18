import { Artwork, CreatorProfile, ProductColor, ProductOption, Review } from '../types';

export const PRODUCT_COLORS: ProductColor[] = [
  { id: 'white', name: 'White', hex: '#FFFFFF', isDark: false },
  { id: 'off-white', name: 'Vintage Cream', hex: '#F4F1EA', isDark: false },
  { id: 'heather-grey', name: 'Heather Grey', hex: '#D2D6DC', isDark: false },
  { id: 'charcoal', name: 'Dark Charcoal', hex: '#374151', isDark: true },
  { id: 'black', name: 'Classic Black', hex: '#111827', isDark: true },
  { id: 'crimson', name: 'Crimson Red', hex: '#DC2626', isDark: true },
  { id: 'navy', name: 'Navy Blue', hex: '#1E3A8A', isDark: true },
  { id: 'forest', name: 'Forest Green', hex: '#166534', isDark: true },
  { id: 'pastel-pink', name: 'Pastel Rose', hex: '#FBCFE8', isDark: false },
  { id: 'mustard', name: 'Mustard Gold', hex: '#D97706', isDark: true },
];

export const PRODUCT_CATALOG: ProductOption[] = [
  {
    category: 't-shirt',
    displayName: 'Classic T-Shirt',
    basePrice: 19.99,
    description: 'The all-time favorite classic unisex tee. Soft, mid-weight 100% combed ringspun cotton with durable double-stitched seams.',
    materials: ['100% combed ringspun cotton', 'Pre-shrunk fabric', 'Double-needle stitched neckline and bottom hem', 'Ethically manufactured'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    colors: PRODUCT_COLORS,
  },
  {
    category: 'hoodie',
    displayName: 'Pullover Hoodie',
    basePrice: 42.50,
    description: 'Heavyweight fleece hoodie with kangaroo front pocket, matching drawstrings, and ribbed cuffs for cozy warmth.',
    materials: ['80% cotton, 20% polyester fleece', 'Spacious front pouch pocket', 'Fleece-lined hood with dyed-to-match drawcord'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: PRODUCT_COLORS.slice(0, 7),
  },
  {
    category: 'sticker',
    displayName: 'Die-Cut Vinyl Sticker',
    basePrice: 3.40,
    description: 'Ultra-durable, waterproof die-cut vinyl sticker with white border contour. UV-protected and dishwasher safe.',
    materials: ['Waterproof premium vinyl', 'Removable with no residue', 'Satin matte finish with UV laminate'],
    sizes: ['Small (3" x 3")', 'Medium (5" x 5")', 'Large (8.5" x 8.5")'],
    colors: [{ id: 'white', name: 'White Contour', hex: '#FFFFFF', isDark: false }],
  },
  {
    category: 'phone-case',
    displayName: 'Tough Phone Case',
    basePrice: 28.00,
    description: 'Dual-layer armor case with shock-absorbing TPU silicone inner liner and impact-resistant polycarbonate outer shell.',
    materials: ['Polycarbonate hard outer shell', 'TPU silicone shock cushion interior', 'Wireless charging compatible', 'Raised screen bezel lip'],
    sizes: ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 15 / 15 Pro', 'Samsung Galaxy S24 Ultra', 'Google Pixel 9 Pro'],
    colors: [
      { id: 'black', name: 'Black Core', hex: '#111827', isDark: true },
      { id: 'white', name: 'Gloss White', hex: '#FFFFFF', isDark: false },
    ],
  },
  {
    category: 'mug',
    displayName: 'Ceramic Mug (11oz)',
    basePrice: 14.50,
    description: 'Glossy ceramic mug with high-contrast, edge-to-edge vibrant dye sublimation print. Microwave and dishwasher safe.',
    materials: ['White high-grade ceramic', 'Dishwasher & microwave safe', 'Ergonomic C-handle'],
    sizes: ['11 oz Standard', '15 oz Tall'],
    colors: [{ id: 'white', name: 'Ceramic White', hex: '#FFFFFF', isDark: false }],
  },
  {
    category: 'art-print',
    displayName: 'Framed Art Print',
    basePrice: 32.00,
    description: 'Museum-grade archival 250gsm matte fine art paper with vivid pigment inks, framed in solid natural wood.',
    materials: ['Archival matte paper 250 gsm', 'Solid oak wood frame with shatterproof acrylic', 'Pre-installed mounting wire'],
    sizes: ['12" x 16"', '18" x 24"', '24" x 32"'],
    colors: [
      { id: 'black-frame', name: 'Satin Black Frame', hex: '#1F2937', isDark: true },
      { id: 'wood-frame', name: 'Natural Oak Frame', hex: '#D7BA89', isDark: false },
      { id: 'white-frame', name: 'Crisp White Frame', hex: '#F9FAFB', isDark: false },
    ],
  },
  {
    category: 'tote-bag',
    displayName: 'Cotton Canvas Tote Bag',
    basePrice: 18.00,
    description: 'Heavyweight natural cotton canvas bag with reinforced shoulder straps and square bottom gusset.',
    materials: ['100% natural cotton canvas (10 oz)', 'Reinforced cross-stitched webbing handles', 'Spacious 15" x 16" main compartment'],
    sizes: ['Standard 15" x 16"'],
    colors: [
      { id: 'natural', name: 'Natural Canvas', hex: '#F3EDE2', isDark: false },
      { id: 'black', name: 'Black Canvas', hex: '#111827', isDark: true },
    ],
  },
];

// High quality SVG data URIs for default artworks
export const CHINA_GIRL_ARTWORK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <radialGradient id="sunGrad" cx="50%" cy="45%" r="48%">
      <stop offset="0%" stop-color="#FF4D4D"/>
      <stop offset="70%" stop-color="#DC2626"/>
      <stop offset="100%" stop-color="#991B1B"/>
    </radialGradient>
    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1E24"/>
      <stop offset="40%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#2D1B36"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="50%" stop-color="#EAB308"/>
      <stop offset="100%" stop-color="#CA8A04"/>
    </linearGradient>
    <linearGradient id="dressGrad" x1="0%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#BE123C"/>
      <stop offset="60%" stop-color="#881337"/>
      <stop offset="100%" stop-color="#4C0519"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Big Red Celestial Sun Disc -->
  <circle cx="400" cy="380" r="320" fill="url(#sunGrad)" filter="url(#shadow)" />

  <!-- Cloud / Waves Traditional Patterns -->
  <path d="M120 480 Q 200 420 280 480 T 440 480 T 600 480 T 720 480" fill="none" stroke="#FEE2E2" stroke-width="4" stroke-opacity="0.45" stroke-dasharray="8 8"/>
  <path d="M140 540 Q 240 470 340 540 T 540 540 T 700 540" fill="none" stroke="#FEE2E2" stroke-width="3" stroke-opacity="0.35"/>
  <path d="M220 220 Q 300 170 380 220" fill="none" stroke="#FEF08A" stroke-width="3" stroke-opacity="0.4"/>

  <!-- Golden Calligraphic Stamp Seal -->
  <rect x="620" y="240" width="70" height="90" rx="8" fill="#B91C1C" stroke="#FDE047" stroke-width="3"/>
  <text x="655" y="280" font-family="'Noto Serif SC', serif" font-weight="900" font-size="28" fill="#FEF08A" text-anchor="middle">華</text>
  <text x="655" y="315" font-family="'Noto Serif SC', serif" font-weight="900" font-size="28" fill="#FEF08A" text-anchor="middle">夏</text>

  <!-- Cherry Blossom Branches -->
  <path d="M140 180 Q 240 260 320 220 T 420 180" fill="none" stroke="#451A03" stroke-width="7" stroke-linecap="round"/>
  <path d="M240 260 Q 290 320 340 310" fill="none" stroke="#451A03" stroke-width="5" stroke-linecap="round"/>
  
  <!-- Blossoms -->
  <circle cx="210" cy="210" r="14" fill="#FBCFE8"/>
  <circle cx="210" cy="210" r="5" fill="#DC2626"/>
  <circle cx="310" cy="220" r="16" fill="#FBCFE8"/>
  <circle cx="310" cy="220" r="6" fill="#DC2626"/>
  <circle cx="410" cy="180" r="18" fill="#FFE4E6"/>
  <circle cx="410" cy="180" r="7" fill="#BE123C"/>
  <circle cx="290" cy="310" r="12" fill="#FBCFE8"/>
  <circle cx="290" cy="310" r="4" fill="#DC2626"/>
  <circle cx="160" cy="190" r="10" fill="#FCE7F3"/>

  <!-- Girl Figure: Neck and Shoulders (Cheongsam / Qipao) -->
  <path d="M260 760 L 290 570 Q 400 580 510 570 L 540 760 Z" fill="url(#dressGrad)"/>
  
  <!-- Cheongsam Gold Embroidered Dragons / Floral Accents -->
  <path d="M350 600 Q 400 660 360 730" fill="none" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round"/>
  <path d="M450 610 Q 410 670 440 740" fill="none" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round"/>
  <circle cx="400" cy="620" r="7" fill="#FDE047"/>
  <circle cx="400" cy="655" r="7" fill="#FDE047"/>
  <circle cx="400" cy="690" r="7" fill="#FDE047"/>

  <!-- High Mandarin Collar -->
  <path d="M345 530 Q 400 545 455 530 L 460 575 Q 400 590 340 575 Z" fill="#9F1239" stroke="#EAB308" stroke-width="3"/>
  <path d="M380 550 L 420 550" stroke="#FDE047" stroke-width="4" stroke-linecap="round"/>

  <!-- Neck -->
  <path d="M360 460 L 360 540 Q 400 550 440 540 L 440 460 Z" fill="#FDE8D0"/>

  <!-- Face / Jawline -->
  <path d="M330 360 Q 330 470 400 485 Q 470 470 470 360 Q 470 280 400 280 Q 330 280 330 360 Z" fill="#FEEAD2"/>

  <!-- Lush Black Hair with Traditional Chignon Buns & Flowing Waves -->
  <path d="M320 370 Q 300 480 310 600 Q 340 540 340 450 Z" fill="url(#hairGrad)"/>
  <path d="M480 370 Q 500 480 490 600 Q 460 540 460 450 Z" fill="url(#hairGrad)"/>
  
  <!-- Hair Top Silhouette -->
  <path d="M310 350 C 300 220, 500 220, 490 350 C 470 260, 330 260, 310 350 Z" fill="url(#hairGrad)"/>
  <ellipse cx="280" cy="270" rx="45" ry="45" fill="url(#hairGrad)"/>
  <ellipse cx="520" cy="270" rx="45" ry="45" fill="url(#hairGrad)"/>

  <!-- Traditional Golden Hairpins / Floral Ornaments -->
  <path d="M220 240 L 330 280" stroke="url(#goldGrad)" stroke-width="5" stroke-linecap="round"/>
  <circle cx="220" cy="240" r="10" fill="#BE123C" stroke="#FDE047" stroke-width="2"/>
  <circle cx="215" cy="255" r="6" fill="#FDE047"/>
  <circle cx="210" cy="268" r="5" fill="#FDE047"/>

  <path d="M580 240 L 470 280" stroke="url(#goldGrad)" stroke-width="5" stroke-linecap="round"/>
  <circle cx="580" cy="240" r="10" fill="#BE123C" stroke="#FDE047" stroke-width="2"/>
  <circle cx="585" cy="255" r="6" fill="#FDE047"/>
  <circle cx="590" cy="268" r="5" fill="#FDE047"/>

  <!-- Hair Bangs / Fringe -->
  <path d="M335 320 Q 370 345 400 325 Q 430 345 465 320 Q 450 280 400 280 Q 350 280 335 320 Z" fill="#0F172A"/>

  <!-- Eyes & Eyebrows -->
  <!-- Left Eye -->
  <path d="M355 370 Q 375 365 390 373" stroke="#0F172A" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <path d="M355 360 Q 375 352 390 357" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none"/>
  <circle cx="374" cy="373" r="5" fill="#881337"/>
  <circle cx="374" cy="373" r="2.5" fill="#000000"/>
  <circle cx="376" cy="371" r="1.5" fill="#FFFFFF"/>
  <!-- Winged Eyeliner -->
  <path d="M350 372 L 358 370" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Right Eye -->
  <path d="M410 373 Q 425 365 445 370" stroke="#0F172A" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <path d="M410 357 Q 425 352 445 360" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none"/>
  <circle cx="426" cy="373" r="5" fill="#881337"/>
  <circle cx="426" cy="373" r="2.5" fill="#000000"/>
  <circle cx="428" cy="371" r="1.5" fill="#FFFFFF"/>
  <!-- Winged Eyeliner -->
  <path d="M442 370 L 450 372" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Elegant Nose -->
  <path d="M398 385 Q 402 415 396 422 Q 401 424 405 421" fill="none" stroke="#D4A373" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Soft Rouge Cheeks -->
  <ellipse cx="345" cy="410" rx="20" ry="12" fill="#F43F5E" fill-opacity="0.22"/>
  <ellipse cx="455" cy="410" rx="20" ry="12" fill="#F43F5E" fill-opacity="0.22"/>

  <!-- Iconic Crimson Red Lips -->
  <path d="M382 445 Q 400 440 418 445 Q 400 460 382 445 Z" fill="#BE123C"/>
  <path d="M388 446 Q 400 444 412 446 Q 400 454 388 446 Z" fill="#E11D48"/>
  <ellipse cx="400" cy="447" rx="3" ry="1.5" fill="#FFE4E6" fill-opacity="0.8"/>

  <!-- Floating Petals -->
  <path d="M220 460 Q 240 450 250 470 Q 230 480 220 460 Z" fill="#F43F5E" opacity="0.85"/>
  <path d="M570 410 Q 590 400 600 420 Q 580 430 570 410 Z" fill="#F43F5E" opacity="0.85"/>
  <path d="M520 520 Q 540 500 555 525 Q 530 540 520 520 Z" fill="#FB7185" opacity="0.75"/>
  <path d="M190 350 Q 205 340 215 355 Q 200 365 190 350 Z" fill="#FB7185" opacity="0.7"/>

  <!-- Subtle Artist Signature -->
  <text x="400" y="785" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="14" fill="#991B1B" text-anchor="middle" letter-spacing="4">BAMICASH1 STUDIO</text>
</svg>
`)}`;

export const CYBER_NEON_ARTWORK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <linearGradient id="cyberBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#1E1B4B"/>
      <stop offset="100%" stop-color="#311042"/>
    </linearGradient>
    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06B6D4"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" rx="40" fill="url(#cyberBg)"/>
  <circle cx="400" cy="380" r="240" fill="none" stroke="#EC4899" stroke-width="12" opacity="0.8"/>
  <polygon points="400,180 580,520 220,520" fill="none" stroke="#06B6D4" stroke-width="8"/>
  <circle cx="400" cy="390" r="120" fill="#F43F5E" opacity="0.9"/>
  <path d="M250 560 L 550 560" stroke="#FBBF24" stroke-width="6"/>
  <path d="M290 600 L 510 600" stroke="#FBBF24" stroke-width="4"/>
  <text x="400" y="680" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="44" fill="#38BDF8" text-anchor="middle" letter-spacing="8">TOKYO 2099</text>
</svg>
`)}`;

export const DRAGON_INK_ARTWORK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <radialGradient id="inkSun" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="100%" stop-color="#991B1B"/>
    </radialGradient>
  </defs>
  <circle cx="400" cy="400" r="290" fill="url(#inkSun)"/>
  <path d="M200 450 Q 280 260 400 320 T 600 400 T 450 550 T 260 480" fill="none" stroke="#111827" stroke-width="26" stroke-linecap="round"/>
  <path d="M260 380 Q 320 240 430 300 T 560 390" fill="none" stroke="#F3F4F6" stroke-width="6" stroke-linecap="round"/>
  <text x="400" y="700" font-family="serif" font-weight="900" font-size="36" fill="#111827" text-anchor="middle">龍 神 墨 繪</text>
</svg>
`)}`;

export const FLORA_BOTANICA_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#15803D"/>
      <stop offset="100%" stop-color="#064E3B"/>
    </linearGradient>
  </defs>
  <circle cx="400" cy="400" r="300" fill="#FEF3C7"/>
  <path d="M400 650 Q 400 450 320 300 Q 420 350 400 650 Z" fill="url(#leafGrad)"/>
  <path d="M400 580 Q 450 420 540 330 Q 470 390 400 580 Z" fill="#16A34A"/>
  <circle cx="340" cy="270" r="45" fill="#F43F5E"/>
  <circle cx="340" cy="270" r="18" fill="#FBBF24"/>
  <circle cx="510" cy="300" r="35" fill="#FB7185"/>
  <circle cx="510" cy="300" r="14" fill="#FEF08A"/>
</svg>
`)}`;

export const INITIAL_CREATOR: CreatorProfile = {
  id: 'bamicash1',
  name: 'Bamicash1',
  username: 'Bamicash1',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  bio: 'Digital illustrator & visual concept designer specializing in contemporary Asian aesthetics, anime cyberpunk fusion, and streetwear graphic prints.',
  location: 'Toronto, Canada',
  joinedDate: 'Joined March 2021',
  totalSales: 1420,
  totalEarnings: 8240.50,
  availableBalance: 1245.80,
  followerCount: 3890,
  isFollowing: false,
  verified: true,
  instagram: 'https://instagram.com/bamicash1.art',
  twitter: 'https://x.com/bamicash1',
  socialLinks: {
    instagram: 'https://instagram.com/bamicash1.art',
    twitter: 'https://x.com/bamicash1',
    website: 'https://bamicash1.design',
    youtube: 'https://youtube.com/@bamicash1',
    tiktok: 'https://tiktok.com/@bamicash1_art',
    behance: 'https://behance.net/bamicash1',
  },
  bankDetails: {
    bankName: 'Commercial Bank of Ethiopia (CBE)',
    accountHolderName: 'Bamicash1 Creative Studio',
    accountNumber: '1000293847561',
    routingNumber: 'CBEETAA',
    swiftCode: 'CBETETAA',
    accountType: 'checking',
    country: 'Ethiopia',
    lastUpdated: 'Sep 15, 2026',
  },
};

export const INITIAL_ARTWORKS: Artwork[] = [
  {
    id: 'china-girl-183863295',
    title: 'China girl',
    creatorId: 'bamicash1',
    creatorName: 'Bamicash1',
    creatorAvatar: INITIAL_CREATOR.avatar,
    description: 'Original stylized portrait capturing the elegance of classic oriental cheongsam silhouettes fused with bold contemporary pop graphic lines, set against an iconic red solar disc and floating cherry blossom petals.',
    tags: ['china girl', 'asian art', 'cheongsam', 'retro pop', 'streetwear', 'red aesthetic', 'oriental portrait', 'japanese art', 'qipao'],
    category: 'Illustration & Graphic Art',
    imageUrl: CHINA_GIRL_ARTWORK_SVG,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
    basePrice: 19.99,
    creatorMarginPercent: 24, // $4.80 margin on tee
    salesCount: 684,
    viewsCount: 14230,
    likesCount: 1890,
    featured: true,
    defaultCategory: 't-shirt',
  },
  {
    id: 'cyberpunk-tokyo-2099',
    title: 'Tokyo 2099 Neon Grid',
    creatorId: 'bamicash1',
    creatorName: 'Bamicash1',
    creatorAvatar: INITIAL_CREATOR.avatar,
    description: 'Futuristic synthwave cyberpunk metropolis illustration with neon geometric arches, holographic kanji typography, and hyper-saturated pink-cyan lighting.',
    tags: ['cyberpunk', 'tokyo', 'neon', 'synthwave', 'sci-fi', 'retro future', 'gamer'],
    category: 'Digital Art',
    imageUrl: CYBER_NEON_ARTWORK_SVG,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 35,
    basePrice: 19.99,
    creatorMarginPercent: 20,
    salesCount: 342,
    viewsCount: 8900,
    likesCount: 940,
    featured: false,
    defaultCategory: 'hoodie',
  },
  {
    id: 'dragon-ink-dynasty',
    title: 'Ryu Dragon Ink Dynasty',
    creatorId: 'bamicash1',
    creatorName: 'Bamicash1',
    creatorAvatar: INITIAL_CREATOR.avatar,
    description: 'Traditional sumi-e brush calligraphy dragon winding across a blood-orange sun crest. Masterfully balanced negative space for apparel printing.',
    tags: ['dragon', 'sumi-e', 'ink wash', 'mythology', 'japanese dragon', 'black and red'],
    category: 'Painting & Mixed Media',
    imageUrl: DRAGON_INK_ARTWORK_SVG,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
    basePrice: 19.99,
    creatorMarginPercent: 22,
    salesCount: 215,
    viewsCount: 5400,
    likesCount: 610,
    featured: false,
    defaultCategory: 't-shirt',
  },
  {
    id: 'flora-botanica-zen',
    title: 'Zen Botanical Bloom',
    creatorId: 'bamicash1',
    creatorName: 'Bamicash1',
    creatorAvatar: INITIAL_CREATOR.avatar,
    description: 'Minimalist mid-century botanical leaves and organic warm sunbursts with modern Scandinavian terracotta accents.',
    tags: ['botanical', 'nature', 'plants', 'minimalist', 'boho', 'earth tones'],
    category: 'Drawing',
    imageUrl: FLORA_BOTANICA_SVG,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    basePrice: 19.99,
    creatorMarginPercent: 20,
    salesCount: 179,
    viewsCount: 4120,
    likesCount: 420,
    featured: false,
    defaultCategory: 'tote-bag',
  },
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    artworkId: 'china-girl-183863295',
    author: 'Elena R.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    title: 'Absolute perfection! Colors pop even better in person',
    comment: 'The print on this Classic T-shirt is ridiculously crisp. The reds on the sun and cheongsam are rich and not washed out after 4 laundry cycles. Ordered size M and it fits true to size with a slight relaxed drape. Will definitely buy more from Bamicash1!',
    date: '3 days ago',
    productPurchased: 'Classic T-Shirt',
    colorPurchased: 'Classic Black',
    sizePurchased: 'M',
    verifiedBuyer: true,
    helpfulCount: 42,
  },
  {
    id: 'rev-2',
    artworkId: 'china-girl-183863295',
    author: 'Marcus K.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    title: 'Super soft cotton & breathtaking artwork',
    comment: 'Got this on the Heather Grey tee. The contrast of the dark ink lines against the grey fabric is so aesthetic. Shipped within 3 days and arrived in sustainable packaging. 10/10.',
    date: '1 week ago',
    productPurchased: 'Classic T-Shirt',
    colorPurchased: 'Heather Grey',
    sizePurchased: 'L',
    verifiedBuyer: true,
    helpfulCount: 19,
  },
  {
    id: 'rev-3',
    artworkId: 'china-girl-183863295',
    author: 'Aiko T.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    title: 'Bought both the hoodie and vinyl stickers!',
    comment: 'The vinyl sticker is thick and glossy, stuck it straight onto my MacBook Pro and hydroflask. The hoodie is super plush inside. Love supporting independent artists directly through here.',
    date: '2 weeks ago',
    productPurchased: 'Pullover Hoodie',
    colorPurchased: 'Classic Black',
    sizePurchased: 'XL',
    verifiedBuyer: true,
    helpfulCount: 28,
  },
  {
    id: 'rev-4',
    artworkId: 'china-girl-183863295',
    author: 'David P.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    rating: 4,
    title: 'Great quality print',
    comment: 'Solid print quality and comfortable neckline. Fits slightly roomy so if you like a tight fit maybe size down, but for me standard unisex L is spot on.',
    date: '3 weeks ago',
    productPurchased: 'Classic T-Shirt',
    colorPurchased: 'White',
    sizePurchased: 'L',
    verifiedBuyer: true,
    helpfulCount: 11,
  },
];
