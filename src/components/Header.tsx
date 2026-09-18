import React, { useState } from 'react';
import { 
  Search, 
  ShoppingBag, 
  UploadCloud, 
  BarChart3, 
  Compass, 
  Heart, 
  User, 
  CheckCircle, 
  Tag, 
  Sparkles, 
  Layers, 
  Palette, 
  Home,
  LogIn,
  LogOut,
  Landmark,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { CartItem, ProductCategory } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { MxLogo } from './MxLogo';

interface HeaderProps {
  activeTab: 'product' | 'studio' | 'dashboard' | 'explore' | 'portfolio';
  setActiveTab: (tab: 'product' | 'studio' | 'dashboard' | 'explore' | 'portfolio') => void;
  cart: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectCategory?: (category: ProductCategory | 'all') => void;
  selectedCategory?: ProductCategory | 'all';
  currentUser?: FirebaseUser | null;
  onOpenAuthModal?: (mode?: 'signin' | 'signup') => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  cart,
  setIsCartOpen,
  searchQuery,
  setSearchQuery,
  onSelectCategory,
  selectedCategory = 'all',
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { currency, toggleCurrency, currencyLabel } = useCurrency();

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const categories: { id: ProductCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'Shop Home (All)' },
    { id: 't-shirt', label: 'T-Shirts' },
    { id: 'hoodie', label: 'Hoodies & Sweatshirts' },
    { id: 'sticker', label: 'Stickers' },
    { id: 'phone-case', label: 'Phone Cases' },
    { id: 'mug', label: 'Mugs & Drinkware' },
    { id: 'art-print', label: 'Wall Art & Prints' },
    { id: 'tote-bag', label: 'Bags & Totes' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Top Promotional Ribbon */}
      <div className="bg-slate-900 text-slate-100 text-xs py-1.5 px-4 font-medium flex items-center justify-between">
        <div className="flex items-center gap-2 mx-auto">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Support independent artists directly • Use code <strong className="text-amber-300 tracking-wider">CREATOR15</strong> for 15% off 2+ items
          </span>
          <span className="hidden sm:inline-block text-slate-400">• Free returns within 30 days</span>
        </div>
      </div>

      {/* Primary Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4 sm:gap-6">
          {/* Logo -> Shop Home */}
          <div 
            id="header-logo-container"
            onClick={() => {
              setActiveTab('explore');
              if (onSelectCategory) onSelectCategory('all');
              setSearchQuery('');
            }}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            title="Go to Shop Home"
          >
            <MxLogo size="md" subtitle="Creator Marketplace" />
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl relative">
            <div className={`relative flex items-center w-full transition-all duration-200 ${
              isSearchFocused ? 'ring-2 ring-rose-500 rounded-full' : ''
            }`}>
              <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="header-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Search artworks, designs, t-shirts, stickers..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border border-transparent focus:border-rose-500 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Live Search Quick Suggestion Pill Drawer */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in-50">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2">
                  Popular Creator Searches
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['China girl', 'Bamicash1', 'Anime aesthetic', 'Cyberpunk', 'Vinyl Stickers', 'Japanese Art', 'Minimalist Tee'].map((tag) => (
                    <button
                      key={tag}
                      onMouseDown={() => {
                        setSearchQuery(tag);
                        setActiveTab('product');
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-full text-xs font-medium text-slate-700 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Shop Home Button - Visible on all devices */}
            <button
              id="nav-shop-home-btn"
              onClick={() => {
                setActiveTab('explore');
                if (onSelectCategory) onSelectCategory('all');
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200 font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Browse all creator designs on Shop Home"
            >
              <Home className="w-4 h-4 text-rose-500" />
              <span>Shop Home</span>
            </button>

            {/* Product Page View Button (when in explore or other views) */}
            <button
              id="nav-product-btn"
              onClick={() => setActiveTab('product')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'product'
                  ? 'bg-rose-50 text-rose-600 font-bold ring-1 ring-rose-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="View Product Details"
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Product</span>
            </button>

            {/* Artist Portfolio View Indicator */}
            {activeTab === 'portfolio' && (
              <button
                id="nav-portfolio-btn"
                onClick={() => setActiveTab('portfolio')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-rose-50 text-rose-600 ring-1 ring-rose-200"
              >
                <Palette className="w-4 h-4 text-rose-500" />
                <span>Artist Portfolio</span>
              </button>
            )}

            {/* Creator Studio (Upload Art) */}
            <button
              id="nav-studio-btn"
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'studio'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Sell Your Art</span>
              <span className="sm:hidden">Upload</span>
            </button>

            {/* Real-time Earnings Dashboard */}
            <button
              id="nav-dashboard-btn"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span className="hidden lg:inline">Earnings Dashboard</span>
              <span className="lg:hidden">Stats</span>
            </button>

            {/* Ethiopian Birr (ETB) / Currency Switcher */}
            <button
              id="header-currency-toggle-btn"
              type="button"
              onClick={toggleCurrency}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50/80 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition-all cursor-pointer shadow-2xs shrink-0"
              title={`Active Currency: ${currencyLabel}. Click to switch between Ethiopian Birr (ETB) and USD.`}
            >
              <span className="text-sm">{currency === 'ETB' ? '🇪🇹' : '🇺🇸'}</span>
              <span className="tracking-tight">{currency === 'ETB' ? 'ETB (Birr)' : 'USD ($)'}</span>
            </button>

            {/* Google Authentication / User Profile Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="header-user-menu-btn"
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                >
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || 'User'} 
                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white font-bold text-xs flex items-center justify-center">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-800 hidden md:inline max-w-[90px] truncate">
                    {currentUser.displayName?.split(' ')[0] || currentUser.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {currentUser.displayName || 'Creator Account'}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                    </div>

                    <div className="p-1 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setActiveTab('dashboard');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-left"
                      >
                        <BarChart3 className="w-4 h-4 text-emerald-600" />
                        <span>Earnings & Royalties</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setActiveTab('dashboard');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-left"
                      >
                        <Landmark className="w-4 h-4 text-emerald-600" />
                        <span>Direct Deposit Bank Account</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setActiveTab('studio');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-left"
                      >
                        <UploadCloud className="w-4 h-4 text-rose-600" />
                        <span>Artist Studio & Upload</span>
                      </button>
                    </div>

                    <div className="p-1 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="header-google-signin-btn"
                type="button"
                onClick={() => onOpenAuthModal && onOpenAuthModal('signin')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs shrink-0"
              >
                {/* Authentic Google 'G' icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="hidden sm:inline">Google Sign In</span>
                <span className="sm:hidden">Log In</span>
              </button>
            )}

            {/* Shopping Cart Drawer Trigger */}
            <button
              id="nav-cart-btn"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute top-1 right-1 bg-rose-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Secondary Category Subnav Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 no-scrollbar text-xs font-medium border-t border-slate-100">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`category-btn-${cat.id}`}
              type="button"
              onClick={() => {
                if (onSelectCategory) {
                  onSelectCategory(cat.id);
                }
              }}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
