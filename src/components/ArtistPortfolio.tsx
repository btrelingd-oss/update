import React, { useState } from 'react';
import { 
  Artwork, 
  CreatorProfile, 
  ProductCategory 
} from '../types';
import { PRODUCT_CATALOG } from '../lib/seedData';
import { useCurrency } from '../context/CurrencyContext';
import { 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Sparkles, 
  UserPlus, 
  UserCheck, 
  Share2, 
  ExternalLink, 
  Instagram, 
  Twitter, 
  Globe, 
  Youtube, 
  Palette, 
  ArrowLeft, 
  Search, 
  Layers, 
  Heart, 
  ShoppingBag,
  Check,
  Filter,
  Home
} from 'lucide-react';

interface ArtistPortfolioProps {
  creator: CreatorProfile;
  artworks: Artwork[];
  onSelectArtwork: (artwork: Artwork) => void;
  onNavigateToMarketplace: () => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
}

export const ArtistPortfolio: React.FC<ArtistPortfolioProps> = ({
  creator,
  artworks,
  onSelectArtwork,
  onNavigateToMarketplace,
  isFollowing,
  onToggleFollow,
}) => {
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'title'>('popular');
  const [copiedLink, setCopiedLink] = useState(false);
  const { formatPrice } = useCurrency();

  // Social media link resolvers (checking both direct properties and nested socialLinks)
  const rawInstagram = creator.instagram || creator.socialLinks?.instagram;
  const rawTwitter = creator.twitter || creator.socialLinks?.twitter;
  const rawWebsite = creator.socialLinks?.website;
  const rawBehance = creator.socialLinks?.behance;
  const rawYoutube = creator.socialLinks?.youtube;

  const formatSocialUrl = (value?: string, platform?: 'instagram' | 'twitter') => {
    if (!value) return null;
    const clean = value.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
    const handle = clean.replace(/^@/, '');
    if (platform === 'instagram') return `https://instagram.com/${handle}`;
    if (platform === 'twitter') return `https://x.com/${handle}`;
    return `https://${clean}`;
  };

  const instagramHref = formatSocialUrl(rawInstagram, 'instagram');
  const twitterHref = formatSocialUrl(rawTwitter, 'twitter');
  const websiteHref = rawWebsite ? (rawWebsite.startsWith('http') ? rawWebsite : `https://${rawWebsite}`) : null;
  const behanceHref = rawBehance ? (rawBehance.startsWith('http') ? rawBehance : `https://behance.net/${rawBehance}`) : null;
  const youtubeHref = rawYoutube ? (rawYoutube.startsWith('http') ? rawYoutube : `https://youtube.com/${rawYoutube}`) : null;

  // Filter creator's artworks
  const creatorArtworks = artworks.filter((art) => {
    // Check creator ID or name match
    const isByThisCreator = 
      art.creatorId === creator.id || 
      art.creatorName.toLowerCase() === creator.name.toLowerCase();
    
    if (!isByThisCreator && artworks.length > 0) {
      // Fallback: if single creator in seed data, display current artworks
      return true;
    }
    return isByThisCreator;
  });

  const displayedArtworks = creatorArtworks
    .filter((art) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q || 
        art.title.toLowerCase().includes(q) || 
        art.description.toLowerCase().includes(q) ||
        art.tags.some(t => t.toLowerCase().includes(q));

      const matchesCat = 
        selectedFilterCategory === 'all' || 
        art.defaultCategory === selectedFilterCategory ||
        art.category.toLowerCase().includes(selectedFilterCategory);

      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return (b.salesCount || 0) - (a.salesCount || 0);
      if (sortBy === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  const handleCopyProfileLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="flex items-center justify-between gap-4">
        <nav className="flex items-center gap-2 text-xs font-medium text-[#8a96aa] overflow-x-auto whitespace-nowrap">
          <button
            id="portfolio-breadcrumb-marketplace-btn"
            type="button"
            onClick={onNavigateToMarketplace}
            className="hover:text-[#dfb15b] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Return to Shop Home"
          >
            <Home className="w-3.5 h-3.5 text-[#dfb15b]" />
            <span>Shop Home</span>
          </button>
          <span className="text-[#3b4455]">/</span>
          <span className="text-[#8a96aa]">Artists</span>
          <span className="text-[#3b4455]">/</span>
          <span className="font-bold flex items-center gap-1.5 bg-[#1c1813] text-[#dfb15b] border border-[#3d311c] px-2.5 py-0.5 rounded-md">
            <span>{creator.name}</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#dfb15b] text-[#0b0c12] px-1.5 py-0.2 rounded-xs">
              Portfolio
            </span>
          </span>
        </nav>

        <button
          id="portfolio-back-btn"
          type="button"
          onClick={onNavigateToMarketplace}
          className="text-xs font-bold text-white hover:text-white bg-[#141824] hover:bg-[#1c2233] border border-[#252c40] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
        >
          <Home className="w-3.5 h-3.5 text-[#dfb15b]" />
          <span>Back to Shop Home</span>
        </button>
      </div>

      {/* Creator Profile Hero Section */}
      <div className="bg-[#121520] border border-[#212637] rounded-3xl overflow-hidden shadow-xl text-white">
        {/* Decorative Creator Cover Banner */}
        <div className="h-44 sm:h-56 bg-gradient-to-r from-[#0b0c12] via-[#1a1412] to-[#0b0c12] relative overflow-hidden flex items-end p-6 border-b border-[#212637]">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#dfb15b_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              id="portfolio-share-btn"
              type="button"
              onClick={handleCopyProfileLink}
              className="px-3 py-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Share Artist Portfolio"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#dfb15b]" />
                  <span>Share Portfolio</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Profile Details Header */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6 pb-6 border-b border-[#1e2436]">
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative shrink-0">
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-[#121520] shadow-2xl bg-[#0c0e17]"
                />
                <div 
                  className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-[#dfb15b] to-[#ebd085] text-[#0b0c12] p-1 rounded-full shadow-md"
                  title="Verified Independent Artist"
                >
                  <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {creator.name}
                  </h1>
                  <span className="bg-[#14291f] text-[#4ade80] border border-[#1e4a33] text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Creator</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#8a96aa] mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-200">@{creator.username}</span>
                  <span className="text-[#3b4455]">•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#dfb15b]" />
                    <span>{creator.location || 'Toronto, Canada'}</span>
                  </span>
                  <span className="text-[#3b4455]">•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#8a96aa]" />
                    <span>{creator.joinedDate || 'Joined March 2021'}</span>
                  </span>
                </p>
              </div>
            </div>

            {/* Follow & Action CTA with Clickable Social Media Links */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Clickable Social Media Icons for Instagram and Twitter */}
              {(instagramHref || twitterHref || websiteHref) && (
                <div className="flex items-center gap-2" id="portfolio-header-social-icons">
                  {instagramHref && (
                    <a
                      id="portfolio-header-instagram-icon"
                      href={instagramHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${creator.name} on Instagram`}
                      title={`${creator.name} on Instagram`}
                      className="w-10 h-10 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-pink-400 border border-[#252c40] shadow-2xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer group"
                    >
                      <Instagram className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </a>
                  )}

                  {twitterHref && (
                    <a
                      id="portfolio-header-twitter-icon"
                      href={twitterHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${creator.name} on Twitter (X)`}
                      title={`${creator.name} on Twitter (X)`}
                      className="w-10 h-10 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-sky-400 border border-[#252c40] shadow-2xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer group"
                    >
                      <Twitter className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </a>
                  )}

                  {websiteHref && (
                    <a
                      id="portfolio-header-website-icon"
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${creator.name}'s Website`}
                      title={`${creator.name}'s Studio Website`}
                      className="w-10 h-10 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-[#dfb15b] border border-[#252c40] shadow-2xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer group"
                    >
                      <Globe className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </a>
                  )}
                </div>
              )}

              <button
                id="portfolio-follow-btn"
                type="button"
                onClick={onToggleFollow}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer uppercase tracking-wider ${
                  isFollowing
                    ? 'bg-[#141824] hover:bg-[#1c2233] text-white border border-[#252c40]'
                    : 'bg-gradient-to-r from-[#dfb15b] to-[#ebd085] hover:from-[#e5b963] hover:to-[#f3dc98] text-[#0b0c12] shadow-md hover:shadow-[0_4px_16px_rgba(223,177,91,0.3)]'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Following ({creator.followerCount + 1})</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow Artist ({creator.followerCount})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#0c0e17] border border-[#1e2436] text-center mb-6">
            <div>
              <span className="text-[11px] font-bold text-[#8a96aa] uppercase tracking-wider block">
                Total Works
              </span>
              <span className="text-xl font-black text-white">
                {creatorArtworks.length}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#8a96aa] uppercase tracking-wider block">
                Artworks Sold
              </span>
              <span className="text-xl font-black text-white">
                {(creator.totalSales || 1420).toLocaleString()}+
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#8a96aa] uppercase tracking-wider block">
                Followers
              </span>
              <span className="text-xl font-black text-white">
                {((creator.followerCount || 3890) + (isFollowing ? 1 : 0)).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#8a96aa] uppercase tracking-wider block">
                Artist Rating
              </span>
              <span className="text-xl font-black text-[#dfb15b] flex items-center justify-center gap-1">
                <span>4.9</span>
                <span className="text-[#dfb15b]">★</span>
              </span>
            </div>
          </div>

          {/* Biography & Social Media Links Two-Column Info */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
            {/* Biography */}
            <div className="md:col-span-8 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#8a96aa]">
                Artist Biography & Creative Statement
              </h2>
              <div className="bg-[#0c0e17] border border-[#1e2436] p-4 sm:p-5 rounded-2xl">
                <p className="text-sm text-[#cbd5e1] leading-relaxed">
                  {creator.bio || 'Digital illustrator and visual concept designer specializing in contemporary Asian aesthetics, anime cyberpunk fusion, and streetwear graphic prints.'}
                </p>
                <div className="mt-3 pt-3 border-t border-[#1e2436] flex items-center gap-2 text-xs text-[#ebd085]">
                  <Sparkles className="w-3.5 h-3.5 text-[#dfb15b] shrink-0" />
                  <span>Every order directly pays creator royalties ({creatorArtworks[0]?.creatorMarginPercent || 20}% margin).</span>
                </div>
              </div>
            </div>

            {/* Social Links & Clickable Icons */}
            <div className="md:col-span-4 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#8a96aa]">
                Connect With {creator.name}
              </h2>

              {/* Clickable Icons Strip */}
              {(instagramHref || twitterHref || websiteHref || behanceHref || youtubeHref) ? (
                <>
                  <div className="flex items-center gap-2 p-2.5 bg-[#0c0e17] border border-[#1e2436] rounded-2xl mb-2.5">
                    <span className="text-[11px] font-bold text-[#8a96aa] uppercase tracking-wider pl-1 mr-1">
                      Links:
                    </span>
                    {instagramHref && (
                      <a
                        id="portfolio-card-instagram-icon"
                        href={instagramHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${creator.name} Instagram`}
                        title={`Instagram: ${rawInstagram}`}
                        className="w-9 h-9 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-pink-400 border border-[#252c40] flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {twitterHref && (
                      <a
                        id="portfolio-card-twitter-icon"
                        href={twitterHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${creator.name} Twitter`}
                        title={`Twitter / X: ${rawTwitter}`}
                        className="w-9 h-9 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-sky-400 border border-[#252c40] flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {websiteHref && (
                      <a
                        id="portfolio-card-website-icon"
                        href={websiteHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${creator.name} Website`}
                        title={`Website: ${rawWebsite}`}
                        className="w-9 h-9 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-[#dfb15b] border border-[#252c40] flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {behanceHref && (
                      <a
                        id="portfolio-card-behance-icon"
                        href={behanceHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${creator.name} Behance`}
                        title={`Behance: ${rawBehance}`}
                        className="w-9 h-9 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-blue-400 border border-[#252c40] flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
                      >
                        <Palette className="w-4 h-4" />
                      </a>
                    )}
                    {youtubeHref && (
                      <a
                        id="portfolio-card-youtube-icon"
                        href={youtubeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${creator.name} YouTube`}
                        title={`YouTube: ${rawYoutube}`}
                        className="w-9 h-9 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-red-400 border border-[#252c40] flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
                      >
                        <Youtube className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {instagramHref && (
                      <a
                        id="portfolio-link-instagram"
                        href={instagramHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-pink-300 border border-[#252c40] text-xs font-semibold transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-pink-400" />
                          <span>Instagram</span>
                        </div>
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}

                    {twitterHref && (
                      <a
                        id="portfolio-link-twitter"
                        href={twitterHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-sky-300 border border-[#252c40] text-xs font-semibold transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <Twitter className="w-4 h-4 text-sky-400" />
                          <span>X (Twitter)</span>
                        </div>
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}

                    {websiteHref && (
                      <a
                        id="portfolio-link-website"
                        href={websiteHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-[#ebd085] border border-[#252c40] text-xs font-semibold transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[#dfb15b]" />
                          <span>Artist Studio Website</span>
                        </div>
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}

                    {behanceHref && (
                      <a
                        id="portfolio-link-behance"
                        href={behanceHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-blue-300 border border-[#252c40] text-xs font-semibold transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-blue-400" />
                          <span>Behance Gallery</span>
                        </div>
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}

                    {youtubeHref && (
                      <a
                        id="portfolio-link-youtube"
                        href={youtubeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-red-300 border border-[#252c40] text-xs font-semibold transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-red-400" />
                          <span>YouTube Channel</span>
                        </div>
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-xl bg-[#0c0e17] border border-[#1e2436] text-center">
                  <p className="text-xs text-[#8a96aa]">No social media profiles added yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Creator Works Gallery Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#dfb15b] uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Artist Catalog</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              All Works by {creator.name}
            </h2>
            <p className="text-xs text-[#8a96aa] mt-0.5">
              Select any design to customize and preview on Classic T-Shirts, Hoodies, Stickers, and 60+ products.
            </p>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7e899c]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artist designs..."
                className="pl-9 pr-3 py-1.5 text-xs bg-[#141824] border border-[#252c40] text-white rounded-xl focus:border-[#dfb15b] focus:outline-hidden w-48 sm:w-56 placeholder:text-[#556175]"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popular' | 'newest' | 'title')}
              className="px-3 py-1.5 text-xs bg-[#141824] border border-[#252c40] rounded-xl font-semibold text-white focus:outline-hidden cursor-pointer"
            >
              <option value="popular" className="bg-[#141824] text-white">Most Popular</option>
              <option value="newest" className="bg-[#141824] text-white">Newest Releases</option>
              <option value="title" className="bg-[#141824] text-white">Artwork Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#1e2436] whitespace-nowrap">
          <button
            type="button"
            onClick={() => setSelectedFilterCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilterCategory === 'all'
                ? 'bg-[#dfb15b] text-[#0b0c12] shadow-xs'
                : 'bg-[#141824] text-[#8a96aa] hover:text-white hover:bg-[#1c2233] border border-[#252c40]'
            }`}
          >
            All Products ({creatorArtworks.length})
          </button>
          {PRODUCT_CATALOG.map((prod) => {
            const isActive = selectedFilterCategory === prod.category;
            return (
              <button
                key={prod.category}
                type="button"
                onClick={() => setSelectedFilterCategory(prod.category)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#dfb15b] text-[#0b0c12] font-bold shadow-xs'
                    : 'bg-[#141824] text-[#8a96aa] hover:text-white hover:bg-[#1c2233] border border-[#252c40]'
                }`}
              >
                {prod.displayName}
              </button>
            );
          })}
        </div>

        {/* Artworks Grid */}
        {displayedArtworks.length === 0 ? (
          <div className="bg-[#121520] rounded-3xl border border-[#212637] p-12 text-center text-white">
            <Palette className="w-12 h-12 text-[#4b5569] mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">
              No designs found matching your filter
            </h3>
            <p className="text-xs text-[#8a96aa] mb-4">
              Try resetting your search query or selecting "All Products".
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedFilterCategory('all');
              }}
              className="px-4 py-2 bg-[#dfb15b] text-[#0b0c12] text-xs font-bold rounded-xl cursor-pointer hover:bg-[#ebd085]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedArtworks.map((art, index) => {
              const isChinaGirl = art.title.toLowerCase().includes('china girl');
              const price = (art.basePrice * (1 + art.creatorMarginPercent / 100)).toFixed(2);

              return (
                <div
                  key={`${art.id}-${sortBy}-${selectedFilterCategory}-${searchQuery}`}
                  id={`portfolio-artwork-card-${art.id}`}
                  onClick={() => onSelectArtwork(art)}
                  className={`animate-fade-in group bg-[#121520] rounded-3xl border overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 flex flex-col ${
                    isChinaGirl
                      ? 'border-[#dfb15b] ring-2 ring-[#dfb15b]/20'
                      : 'border-[#212637] hover:border-[#dfb15b]/40'
                  }`}
                  style={{
                    animationDelay: `${Math.min(index, 15) * 50}ms`,
                  }}
                >
                  <div className="aspect-square bg-[#0c0e17] p-6 flex items-center justify-center overflow-hidden relative">
                    {isChinaGirl && (
                      <div className="absolute top-3 left-3 z-10 bg-[#EB212B] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Featured Original</span>
                      </div>
                    )}
                    <img
                      src={art.imageUrl}
                      alt={art.title}
                      className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-5 border-t border-[#1e2436] flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[#7e899c] mb-1">
                        <span>{art.category}</span>
                        <span className="font-semibold text-[#4ade80]">+{art.creatorMarginPercent}% royalty</span>
                      </div>
                      <h3 className="font-black text-base text-white group-hover:text-[#dfb15b] transition-colors line-clamp-1">
                        {art.title}
                      </h3>
                      <p className="text-xs text-[#8a96aa] line-clamp-2 mt-1 leading-relaxed">
                        {art.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1e2436] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#7e899c] block font-bold uppercase tracking-wider">
                          From
                        </span>
                        <span className="font-black text-lg text-white">
                          {formatPrice(Number(price))}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#dfb15b] group-hover:bg-[#dfb15b] group-hover:text-[#0b0c12] bg-[#1a1713] border border-[#3d311c] px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1">
                        <span>Shop Design</span>
                        <span>&rarr;</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
