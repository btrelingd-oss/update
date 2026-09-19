import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Share2, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Sparkles, 
  Star, 
  Check, 
  Info, 
  ChevronRight, 
  ChevronDown,
  Compass,
  ThumbsUp, 
  UserCheck, 
  UserPlus, 
  ArrowRight, 
  ZoomIn,
  Layers,
  ShoppingBag,
  X,
  PackageCheck,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  Palette,
  MapPin,
  ExternalLink,
  Home
} from 'lucide-react';
import { Artwork, CartItem, CreatorProfile, ProductCategory, ProductColor, ProductOption, Review } from '../types';
import { PRODUCT_CATALOG, PRODUCT_COLORS } from '../lib/seedData';
import { MockupRenderer } from './MockupRenderer';
import { useCurrency } from '../context/CurrencyContext';

interface ProductDetailProps {
  artwork: Artwork;
  creator?: CreatorProfile;
  selectedCategory?: ProductCategory;
  onSelectCategory?: (category: ProductCategory) => void;
  onNavigateToMarketplace?: () => void;
  onFilterByGenre?: (genre: string) => void;
  openAllProductsTrigger?: number;
  onAddToCart: (item: CartItem) => void;
  onAddMultipleToCart?: (items: CartItem[]) => void;
  onOpenCart?: () => void;
  onInstantBuy: (item: CartItem) => void;
  onSelectArtwork: (art: Artwork) => void;
  artworksList: Artwork[];
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'id' | 'date' | 'helpfulCount'>) => void;
  isCreatorFollowing?: boolean;
  onToggleFollowCreator?: () => void;
  onSelectCreator?: (creator: CreatorProfile) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  artwork,
  creator,
  selectedCategory: propSelectedCategory,
  onSelectCategory,
  onNavigateToMarketplace,
  onFilterByGenre,
  openAllProductsTrigger,
  onAddToCart,
  onAddMultipleToCart,
  onOpenCart,
  onInstantBuy,
  onSelectArtwork,
  artworksList,
  reviews,
  onAddReview,
  isCreatorFollowing = false,
  onToggleFollowCreator,
  onSelectCreator,
}) => {
  const { currency, formatPrice } = useCurrency();

  // Active product category (e.g. t-shirt, hoodie, sticker, etc.)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(
    propSelectedCategory || artwork.defaultCategory || 't-shirt'
  );

  // Dropdown switcher for product format in breadcrumb
  const [showProductSwitcher, setShowProductSwitcher] = useState(false);

  // Full artwork spotlight modal
  const [showArtworkDetailModal, setShowArtworkDetailModal] = useState(false);

  // Synchronize when external category prop changes (from Header pills or navigation)
  useEffect(() => {
    if (propSelectedCategory && propSelectedCategory !== selectedCategory) {
      handleSelectCategory(propSelectedCategory, false);
    }
  }, [propSelectedCategory]);

  // Synchronize when "All Products" is triggered from the header
  useEffect(() => {
    if (openAllProductsTrigger && openAllProductsTrigger > 0) {
      setShowAllProductsModal(true);
      const el = document.getElementById('also-available-products');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [openAllProductsTrigger]);

  // Active product config
  const currentProductConfig: ProductOption = 
    PRODUCT_CATALOG.find((p) => p.category === selectedCategory) || PRODUCT_CATALOG[0];

  // Active color
  const [selectedColor, setSelectedColor] = useState<ProductColor>(
    currentProductConfig.colors[0] || PRODUCT_COLORS[0]
  );

  // Active size
  const [selectedSize, setSelectedSize] = useState<string>(
    currentProductConfig.sizes[2] || currentProductConfig.sizes[0] || 'M'
  );

  // Active quantity
  const [quantity, setQuantity] = useState<number>(1);

  // View mode for mockup
  const [viewMode, setViewMode] = useState<'front' | 'lifestyle' | 'detail'>('front');

  // Wishlist state
  const [isFavorited, setIsFavorited] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Size guide modal state
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');

  // Cart animation state
  const [addedToast, setAddedToast] = useState(false);
  const [toastInfo, setToastInfo] = useState<{ title: string; desc: string; count?: number } | null>(null);

  // "Add to All Products" Modal & Configuration
  const [showAllProductsModal, setShowAllProductsModal] = useState(false);

  // Per-product configuration inside the "All Products" bundle modal
  const [bundleConfig, setBundleConfig] = useState<
    Record<ProductCategory, { enabled: boolean; color: ProductColor; size: string }>
  >(() => {
    const init: any = {};
    PRODUCT_CATALOG.forEach((p) => {
      init[p.category] = {
        enabled: true,
        color: p.colors[0] || PRODUCT_COLORS[0],
        size: p.sizes[0] || 'Standard',
      };
    });
    return init;
  });

  const toggleProductInBundle = (category: ProductCategory) => {
    setBundleConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        enabled: !prev[category]?.enabled,
      },
    }));
  };

  const setBundleProductColor = (category: ProductCategory, color: ProductColor) => {
    setBundleConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        color,
      },
    }));
  };

  const setBundleProductSize = (category: ProductCategory, size: string) => {
    setBundleConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        size,
      },
    }));
  };

  const setAllBundleProducts = (enabled: boolean) => {
    setBundleConfig((prev) => {
      const next: any = {};
      PRODUCT_CATALOG.forEach((p) => {
        next[p.category] = {
          ...prev[p.category],
          enabled,
        };
      });
      return next;
    });
  };

  // Calculate prices based on base price + artist margin
  const basePrice = currentProductConfig.basePrice;
  const marginPercentage = artwork.creatorMarginPercent || 20;
  const artistMarginAmount = Number(((basePrice * marginPercentage) / 100).toFixed(2));
  const unitPrice = Number((basePrice + artistMarginAmount).toFixed(2));
  const totalPrice = Number((unitPrice * quantity).toFixed(2));

  // Bundle calculations
  const enabledBundleProducts = PRODUCT_CATALOG.filter((p) => bundleConfig[p.category]?.enabled);
  const bundleOriginalTotal = Number(
    enabledBundleProducts
      .reduce((sum, p) => {
        const pPrice = Number((p.basePrice * (1 + marginPercentage / 100)).toFixed(2));
        return sum + pPrice;
      }, 0)
      .toFixed(2)
  );
  const bundleDiscountAmount = Number(((bundleOriginalTotal * 15) / 100).toFixed(2));
  const bundleFinalTotal = Number((bundleOriginalTotal - bundleDiscountAmount).toFixed(2));
  const bundleTotalArtistMargin = Number(
    enabledBundleProducts
      .reduce((sum, p) => {
        const pMargin = Number(((p.basePrice * marginPercentage) / 100).toFixed(2));
        return sum + pMargin;
      }, 0)
      .toFixed(2)
  );

  // Handle color click
  const handleSelectColor = (color: ProductColor) => {
    setSelectedColor(color);
  };

  // Switch category
  const handleSelectCategory = (cat: ProductCategory, notifyParent = true) => {
    setSelectedCategory(cat);
    const newConfig = PRODUCT_CATALOG.find((p) => p.category === cat) || PRODUCT_CATALOG[0];
    if (newConfig.colors.length > 0) {
      // Check if current color exists in new product, else fallback to first
      const exists = newConfig.colors.find((c) => c.id === selectedColor.id);
      setSelectedColor(exists || newConfig.colors[0]);
    }
    if (newConfig.sizes.length > 0) {
      setSelectedSize(newConfig.sizes[0]);
    }
    if (notifyParent && onSelectCategory) {
      onSelectCategory(cat);
    }
  };

  const createCartItem = (): CartItem => ({
    id: `${artwork.id}-${selectedCategory}-${selectedColor.id}-${selectedSize}-${Date.now()}`,
    artwork,
    productType: selectedCategory,
    size: selectedSize,
    color: selectedColor,
    quantity,
    price: unitPrice,
    artistMargin: artistMarginAmount,
  });

  const handleAdd = () => {
    onAddToCart(createCartItem());
    setToastInfo({
      title: 'Added to your bag!',
      desc: `${artwork.title} • ${currentProductConfig.displayName} (${selectedSize})`,
      count: 1,
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2400);
  };

  // Add all products to cart
  const handleAddAllProducts = (fromModal = false) => {
    const targetProducts = fromModal
      ? PRODUCT_CATALOG.filter((p) => bundleConfig[p.category]?.enabled)
      : PRODUCT_CATALOG;

    if (targetProducts.length === 0) return;

    const items: CartItem[] = targetProducts.map((prod) => {
      const pBase = prod.basePrice;
      const pMargin = Number(((pBase * marginPercentage) / 100).toFixed(2));
      const pPrice = Number((pBase + pMargin).toFixed(2));
      const cfg = bundleConfig[prod.category] || {
        color: prod.colors[0] || PRODUCT_COLORS[0],
        size: prod.sizes[0] || 'Standard',
      };
      return {
        id: `${artwork.id}-${prod.category}-${cfg.color.id}-${cfg.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        artwork,
        productType: prod.category,
        size: cfg.size,
        color: cfg.color,
        quantity: 1,
        price: pPrice,
        artistMargin: pMargin,
      };
    });

    if (onAddMultipleToCart) {
      onAddMultipleToCart(items);
    } else {
      items.forEach((it) => onAddToCart(it));
    }

    setToastInfo({
      title: `Added all ${items.length} products to your bag!`,
      desc: `Complete "${artwork.title}" collection. Use code CREATOR15 for 15% bundle savings!`,
      count: items.length,
    });
    setAddedToast(true);
    if (fromModal) {
      setShowAllProductsModal(false);
    }
    setTimeout(() => setAddedToast(false), 4500);
  };

  // Quick add single product directly from carousel
  const handleQuickAddProduct = (prod: ProductOption, e: React.MouseEvent) => {
    e.stopPropagation();
    const pBase = prod.basePrice;
    const pMargin = Number(((pBase * marginPercentage) / 100).toFixed(2));
    const pPrice = Number((pBase + pMargin).toFixed(2));
    const pColor = prod.colors[0] || PRODUCT_COLORS[0];
    const pSize = prod.sizes[0] || 'Standard';
    const item: CartItem = {
      id: `${artwork.id}-${prod.category}-${pColor.id}-${pSize}-${Date.now()}`,
      artwork,
      productType: prod.category,
      size: pSize,
      color: pColor,
      quantity: 1,
      price: pPrice,
      artistMargin: pMargin,
    };
    onAddToCart(item);
    setToastInfo({
      title: 'Added to your bag!',
      desc: `${artwork.title} • ${prod.displayName}`,
      count: 1,
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2400);
  };

  const handleBuyNow = () => {
    onInstantBuy(createCartItem());
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;

    onAddReview({
      artworkId: artwork.id,
      author: newReviewAuthor.trim(),
      rating: newReviewRating,
      title: newReviewTitle.trim() || 'Verified Customer Review',
      comment: newReviewComment.trim(),
      productPurchased: currentProductConfig.displayName,
      colorPurchased: selectedColor.name,
      sizePurchased: selectedSize,
      verifiedBuyer: true,
    });

    setNewReviewAuthor('');
    setNewReviewTitle('');
    setNewReviewComment('');
    setShowReviewModal(false);
  };

  const filteredReviews = reviews.filter((r) => r.artworkId === artwork.id);
  const averageRating = filteredReviews.length > 0 
    ? (filteredReviews.reduce((acc, r) => acc + r.rating, 0) / filteredReviews.length).toFixed(1)
    : '4.9';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3.5 border border-slate-700 animate-in slide-in-from-bottom-5 max-w-md">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {toastInfo?.title || 'Added to your bag!'}
            </p>
            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {toastInfo?.desc || `${artwork.title} • ${currentProductConfig.displayName} (${selectedSize})`}
            </p>
          </div>
          {onOpenCart && (
            <button
              onClick={() => {
                setAddedToast(false);
                onOpenCart();
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shrink-0 transition-colors flex items-center gap-1"
            >
              <span>View Bag</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Breadcrumb Navigation Bar */}
      <nav
        id="product-breadcrumb-nav"
        className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-[#8a96aa] mb-6 overflow-x-auto whitespace-nowrap py-1"
        aria-label="Breadcrumb"
      >
        {/* 1. Shop Home Button */}
        <button
          id="breadcrumb-btn-marketplace"
          type="button"
          onClick={() => {
            if (onNavigateToMarketplace) {
              onNavigateToMarketplace();
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-white border border-[#252c40] transition-all font-semibold cursor-pointer group"
          title="Browse all creator designs on Shop Home"
        >
          <Home className="w-3.5 h-3.5 text-[#dfb15b]" />
          <span>Shop Home</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-[#424d62] shrink-0" />

        {/* 2. Art & Design Button */}
        <button
          id="breadcrumb-btn-art-design"
          type="button"
          onClick={() => {
            if (onFilterByGenre) {
              onFilterByGenre(artwork.category || 'Art & Design');
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-white border border-[#252c40] transition-all font-semibold cursor-pointer group"
          title="Explore Art & Design artworks"
        >
          <Palette className="w-3.5 h-3.5 text-[#dfb15b] group-hover:scale-110 transition-transform" />
          <span>Art & Design</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-[#424d62] shrink-0" />

        {/* 3. Product Format Button (e.g. Classic T-Shirt) with interactive switcher */}
        <div className="relative">
          <button
            id="breadcrumb-btn-product-format"
            type="button"
            onClick={() => setShowProductSwitcher((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-white font-bold transition-all cursor-pointer border border-[#252c40] shadow-2xs"
            title="Click to switch product format (Classic T-Shirt, Pullover Hoodie, Stickers...)"
          >
            <Layers className="w-3.5 h-3.5 text-[#dfb15b]" />
            <span>{currentProductConfig.displayName}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#8a96aa] transition-transform ${showProductSwitcher ? 'rotate-180' : ''}`} />
          </button>

          {showProductSwitcher && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-[#121520] border border-[#212637] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 text-white">
              <div className="px-3 py-1.5 text-[10px] font-bold text-[#8a96aa] uppercase tracking-wider border-b border-[#1e2436] flex items-center justify-between">
                <span>Select Product Format</span>
                <span className="text-[#dfb15b] font-bold">{PRODUCT_CATALOG.length} Formats</span>
              </div>
              <div className="py-1 space-y-0.5 max-h-64 overflow-y-auto">
                {PRODUCT_CATALOG.map((prod) => {
                  const isCurrent = selectedCategory === prod.category;
                  const price = (prod.basePrice * (1 + marginPercentage / 100)).toFixed(2);
                  return (
                    <button
                      key={prod.category}
                      type="button"
                      onClick={() => {
                        handleSelectCategory(prod.category, true);
                        setShowProductSwitcher(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#1c1813] text-[#dfb15b] font-bold border border-[#3d311c]'
                          : 'hover:bg-[#1c2233] text-[#cbd5e1]'
                      }`}
                    >
                      <span className="truncate">{prod.displayName}</span>
                      <span className="text-[11px] font-semibold text-[#8a96aa] shrink-0 ml-2">
                        {formatPrice(Number(price))}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-[#1e2436] mt-1 pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAllProductsModal(true);
                    setShowProductSwitcher(false);
                  }}
                  className="w-full text-center px-3 py-2 rounded-xl text-xs font-bold text-[#0b0c12] bg-[#dfb15b] hover:bg-[#ebd085] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Layers className="w-3.5 h-3.5 text-[#0b0c12]" />
                  <span>Configure All 7 Products (-15%)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-[#424d62] shrink-0" />

        {/* 4. Artwork Title Button (e.g. China girl) */}
        <button
          id="breadcrumb-btn-artwork-title"
          type="button"
          onClick={() => setShowArtworkDetailModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c1813] hover:bg-[#2a2217] text-[#dfb15b] border border-[#3d311c] font-black transition-all cursor-pointer shadow-2xs group"
          title={`Click to view full original "${artwork.title}" artwork graphic & details`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#dfb15b] group-hover:scale-125 transition-transform" />
          <span className="truncate max-w-[140px] sm:max-w-none">{artwork.title}</span>
          <span className="text-[10px] bg-[#dfb15b] text-[#0b0c12] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
            Art Details
          </span>
        </button>
      </nav>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Interactive Mockup Stage & Artist Lore (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Main Mockup Stage Container */}
          <div className="relative bg-[#121520] border border-[#212637] rounded-3xl overflow-hidden shadow-xl text-white">
            {/* View Mode Switcher Header */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-[#0c0e17]/90 backdrop-blur-xs p-1 rounded-xl border border-[#212637] shadow-xs">
              <button
                onClick={() => setViewMode('front')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'front'
                    ? 'bg-[#dfb15b] text-[#0b0c12] font-black'
                    : 'text-[#8a96aa] hover:text-white'
                }`}
              >
                Front View
              </button>
              <button
                onClick={() => setViewMode('detail')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  viewMode === 'detail'
                    ? 'bg-[#dfb15b] text-[#0b0c12] font-black'
                    : 'text-[#8a96aa] hover:text-white'
                }`}
              >
                <ZoomIn className="w-3 h-3" />
                <span>Detail</span>
              </button>
            </div>

            {/* Mockup Canvas */}
            <div className="p-4 sm:p-8 flex items-center justify-center bg-[#0c0e17]/40">
              <MockupRenderer
                productType={selectedCategory}
                color={selectedColor}
                artworkUrl={artwork.imageUrl}
                viewMode={viewMode}
                className="max-h-[520px] rounded-2xl"
              />
            </div>

            {/* Bottom bar inside mockup: Eco-friendly print-on-demand badge */}
            <div className="bg-[#0c0e17] border-t border-[#1e2436] px-6 py-3 flex items-center justify-between text-xs text-[#8a96aa]">
              <span className="flex items-center gap-1.5 font-medium text-[#cbd5e1]">
                <Sparkles className="w-3.5 h-3.5 text-[#dfb15b]" />
                Individually printed on demand in high-fidelity dye sublimation
              </span>
              <span className="hidden sm:inline text-[#7e899c]">
                Artwork ID #{artwork.id.slice(0, 8)}
              </span>
            </div>
          </div>

          {/* "Also Available On 60+ Products" Product Carousel */}
          <div id="also-available-products" className="bg-[#121520] border border-[#212637] rounded-3xl p-5 shadow-xl scroll-mt-24 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Also available on other products</span>
                  <span className="bg-[#1c1813] text-[#dfb15b] border border-[#3d311c] text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {PRODUCT_CATALOG.length} styles
                  </span>
                </h3>
                <span className="text-xs text-[#8a96aa]">Click to switch mockup preview, or add the complete collection</span>
              </div>
              
              {/* Add to All Products Header Action */}
              <button
                id="carousel-add-to-all-products-btn"
                type="button"
                onClick={() => setShowAllProductsModal(true)}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#dfb15b] to-[#ebd085] hover:from-[#e5b963] hover:to-[#f3dc98] text-[#0b0c12] text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 group"
              >
                <Layers className="w-3.5 h-3.5 text-[#0b0c12] group-hover:rotate-12 transition-transform" />
                <span>Add to All Products</span>
                <span className="text-[10px] bg-[#EB212B] text-white font-black px-1.5 py-0.2 rounded-md">
                  Save 15%
                </span>
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {PRODUCT_CATALOG.map((prod) => {
                const isSelected = selectedCategory === prod.category;
                const prodPrice = (prod.basePrice * (1 + marginPercentage / 100)).toFixed(2);
                return (
                  <div
                    key={prod.category}
                    id={`format-card-${prod.category}`}
                    onClick={() => handleSelectCategory(prod.category, true)}
                    className={`group relative p-2 rounded-2xl border text-left transition-all flex flex-col items-center text-center cursor-pointer ${
                      isSelected
                        ? 'border-[#dfb15b] bg-[#1c1813] ring-2 ring-[#dfb15b]/20'
                        : 'border-[#212637] hover:border-[#dfb15b]/40 bg-[#0c0e17] hover:bg-[#141824]'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center bg-[#141824] mb-1.5 relative border border-[#212637]">
                      <MockupRenderer
                        productType={prod.category}
                        color={prod.colors[0]}
                        artworkUrl={artwork.imageUrl}
                        className="w-full h-full transform scale-90"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-white line-clamp-1 leading-tight">
                      {prod.displayName.replace('Classic ', '').replace('Pullover ', '')}
                    </span>
                    <span className="text-[10px] font-medium text-[#8a96aa] mb-1">
                      {formatPrice(Number(prodPrice))}
                    </span>

                    {/* Quick Add Button */}
                    <button
                      type="button"
                      onClick={(e) => handleQuickAddProduct(prod, e)}
                      title={`Quick add ${prod.displayName} to bag`}
                      className="w-full py-1 text-[10px] font-bold text-[#dfb15b] bg-[#141824] hover:bg-[#dfb15b] hover:text-[#0b0c12] border border-[#252c40] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>+ Add</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Artist Spotlight Box */}
          <div id="artist-spotlight" className="bg-[#121520] border border-[#212637] rounded-3xl p-6 shadow-xl space-y-5 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#1e2436]">
              <div 
                className="flex items-center gap-3.5 cursor-pointer group/artist"
                onClick={() => {
                  if (creator && onSelectCreator) onSelectCreator(creator);
                }}
                title={`View ${creator?.name || artwork.creatorName}'s Full Artist Portfolio`}
              >
                <img
                  src={creator?.avatar || artwork.creatorAvatar}
                  alt={creator?.name || artwork.creatorName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#3d311c] shadow-xs group-hover/artist:border-[#dfb15b] transition-colors"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-base sm:text-lg font-black text-white group-hover/artist:text-[#dfb15b] transition-colors flex items-center gap-1.5">
                      <span>{creator?.name || artwork.creatorName}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#dfb15b] opacity-70 group-hover/artist:opacity-100 transition-opacity" />
                    </h4>
                    <span className="bg-[#14291f] text-[#4ade80] border border-[#1e4a33] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#4ade80]" />
                      <span>Verified Artist</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#8a96aa] mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#dfb15b] shrink-0" />
                    <span>{creator?.location || 'Toronto, Canada'}</span>
                    <span className="text-[#424d62]">•</span>
                    <span className="text-[#cbd5e1]">{(creator?.totalSales || 1420).toLocaleString()} artworks sold</span>
                  </p>
                  <p className="text-[11px] text-[#7e899c] mt-0.5">
                    @{creator?.username || 'bamicash1'} • {(creator?.followerCount || 3890).toLocaleString()} community followers
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="spotlight-view-portfolio-btn"
                  type="button"
                  onClick={() => {
                    if (creator && onSelectCreator) onSelectCreator(creator);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#141824] hover:bg-[#1c2233] text-white border border-[#252c40] transition-all cursor-pointer shadow-2xs group"
                  title="View complete artist portfolio and creative works"
                >
                  <Palette className="w-3.5 h-3.5 text-[#dfb15b] group-hover:scale-110 transition-transform" />
                  <span>View Portfolio</span>
                </button>

                {/* Follow button */}
                <button
                  onClick={onToggleFollowCreator}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isCreatorFollowing
                      ? 'bg-[#141824] text-[#cbd5e1] border border-[#252c40] hover:bg-[#1c2233]'
                      : 'bg-[#dfb15b] hover:bg-[#ebd085] text-[#0b0c12] font-black shadow-xs'
                  }`}
                >
                  {isCreatorFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-[#4ade80]" />
                      <span>Following ({(creator?.followerCount || 3890) + 1})</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow Artist</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Artist Biography & Statement */}
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-[#8a96aa] uppercase tracking-wider block mb-1">
                  About the Artist & Creative Statement
                </span>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  {creator?.bio || artwork.description}
                </p>
              </div>

              {/* Social Media Links */}
              {((creator?.instagram || creator?.twitter) || (creator?.socialLinks && Object.values(creator.socialLinks).some(Boolean))) && (
                <div className="pt-2 border-t border-[#1e2436]">
                  <span className="text-[11px] font-bold text-[#8a96aa] uppercase tracking-wider block mb-2">
                    Connect with {creator.name}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(creator.instagram || creator.socialLinks?.instagram) && (
                      <a
                        href={(creator.instagram || creator.socialLinks?.instagram)!.startsWith('http') ? (creator.instagram || creator.socialLinks?.instagram)! : `https://instagram.com/${(creator.instagram || creator.socialLinks?.instagram)!.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-pink-400 border border-[#252c40] text-xs font-semibold transition-colors"
                        title="Follow on Instagram"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        <span>Instagram</span>
                      </a>
                    )}
                    {(creator.twitter || creator.socialLinks?.twitter) && (
                      <a
                        href={(creator.twitter || creator.socialLinks?.twitter)!.startsWith('http') ? (creator.twitter || creator.socialLinks?.twitter)! : `https://x.com/${(creator.twitter || creator.socialLinks?.twitter)!.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-sky-400 border border-[#252c40] text-xs font-semibold transition-colors"
                        title="Follow on X / Twitter"
                      >
                        <Twitter className="w-3.5 h-3.5" />
                        <span>X (Twitter)</span>
                      </a>
                    )}
                    {creator.socialLinks.website && (
                      <a
                        href={creator.socialLinks.website.startsWith('http') ? creator.socialLinks.website : `https://${creator.socialLinks.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-amber-400 border border-[#252c40] text-xs font-semibold transition-colors"
                        title="Artist Portfolio"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Portfolio</span>
                      </a>
                    )}
                    {creator.socialLinks.youtube && (
                      <a
                        href={creator.socialLinks.youtube.startsWith('http') ? creator.socialLinks.youtube : `https://youtube.com/${creator.socialLinks.youtube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-red-400 border border-[#252c40] text-xs font-semibold transition-colors"
                        title="YouTube Channel"
                      >
                        <Youtube className="w-3.5 h-3.5" />
                        <span>YouTube</span>
                      </a>
                    )}
                    {creator.socialLinks.tiktok && (
                      <a
                        href={creator.socialLinks.tiktok.startsWith('http') ? creator.socialLinks.tiktok : `https://tiktok.com/@${creator.socialLinks.tiktok.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-slate-300 border border-[#252c40] text-xs font-semibold transition-colors"
                        title="TikTok"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>TikTok</span>
                      </a>
                    )}
                    {creator.socialLinks.behance && (
                      <a
                        href={creator.socialLinks.behance.startsWith('http') ? creator.socialLinks.behance : `https://behance.net/${creator.socialLinks.behance}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1c2233] text-blue-400 border border-[#252c40] text-xs font-semibold transition-colors"
                        title="Behance / Design Gallery"
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>Behance</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Artwork Design Note */}
              <div className="p-3.5 bg-[#0c0e17] rounded-2xl border border-[#1e2436] text-xs text-[#cbd5e1]">
                <span className="font-bold text-[#dfb15b] block mb-0.5">Design Inspiration for this Artwork:</span>
                {artwork.description}
              </div>

              {/* Tags Cloud */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {artwork.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (onFilterByGenre) onFilterByGenre(tag);
                    }}
                    className="px-2.5 py-1 bg-[#141824] text-[#8a96aa] hover:bg-[#1c2233] hover:text-[#dfb15b] border border-[#252c40] text-xs font-medium rounded-lg cursor-pointer transition-colors"
                    title={`Browse all designs tagged #${tag}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* More Works by Artist */}
          <div className="bg-[#121520] border border-[#212637] rounded-3xl p-6 shadow-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">
                More designs by {artwork.creatorName}
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToMarketplace) onNavigateToMarketplace();
                }}
                className="text-xs font-bold text-[#dfb15b] hover:text-[#ebd085] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Shop Home Gallery</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {artworksList.map((otherArt) => {
                const isCurrent = otherArt.id === artwork.id;
                return (
                  <div
                    key={otherArt.id}
                    onClick={() => onSelectArtwork(otherArt)}
                    className={`cursor-pointer rounded-2xl border p-2 transition-all ${
                      isCurrent
                        ? 'border-[#dfb15b] bg-[#1c1813] ring-2 ring-[#dfb15b]/20'
                        : 'border-[#212637] bg-[#0c0e17] hover:border-[#dfb15b]/40 hover:shadow-xs'
                    }`}
                  >
                    <div className="aspect-square bg-[#141824] rounded-xl overflow-hidden mb-2 border border-[#212637]">
                      <img
                        src={otherArt.imageUrl}
                        alt={otherArt.title}
                        className="w-full h-full object-contain p-2 hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-xs font-bold text-white truncate">
                      {otherArt.title}
                    </p>
                    <p className="text-[11px] text-[#8a96aa]">
                      From {formatPrice(otherArt.basePrice * (1 + otherArt.creatorMarginPercent / 100))}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="bg-[#121520] border border-[#212637] rounded-3xl p-6 shadow-xl text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#1e2436]">
              <div>
                <h3 className="text-base font-bold text-white">
                  Customer Reviews ({filteredReviews.length})
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-white">{averageRating} out of 5</span>
                  <span className="text-xs text-[#8a96aa]">• Verified Purchases</span>
                </div>
              </div>

              <button
                onClick={() => setShowReviewModal(true)}
                className="px-4 py-2 border border-[#252c40] bg-[#141824] hover:bg-[#1c2233] rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Write a Review
              </button>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-[#0c0e17] border border-[#1e2436]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1c1813] border border-[#3d311c] flex items-center justify-center font-bold text-xs text-[#dfb15b]">
                        {rev.author[0]}
                      </div>
                      <span className="text-xs font-bold text-white">{rev.author}</span>
                      {rev.verifiedBuyer && (
                        <span className="text-[10px] text-[#4ade80] bg-[#14291f] border border-[#1e4a33] px-1.5 py-0.2 rounded-xs font-medium">
                          Verified Buyer
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#7e899c]">{rev.date}</span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 mb-1.5">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>

                  <h5 className="text-xs font-bold text-white mb-1">{rev.title}</h5>
                  <p className="text-xs text-[#cbd5e1] leading-relaxed">{rev.comment}</p>

                  <div className="mt-2 text-[11px] text-[#8a96aa] flex items-center justify-between">
                    <span>
                      Purchased: {rev.productPurchased} • {rev.colorPurchased} • {rev.sizePurchased}
                    </span>
                    <button className="flex items-center gap-1 text-[#8a96aa] hover:text-[#dfb15b] transition-colors cursor-pointer">
                      <ThumbsUp className="w-3 h-3" />
                      <span>Helpful ({rev.helpfulCount})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Product Purchase Customizer (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 bg-[#121520] border border-[#212637] rounded-3xl p-6 shadow-xl space-y-6 text-white">
            {/* Title & Artist Byline */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-bold text-[#dfb15b] uppercase tracking-wider">
                  Independent Artist Original
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFavorited(!isFavorited)}
                    className={`p-2 rounded-full border transition-colors cursor-pointer ${
                      isFavorited
                        ? 'border-[#3d311c] bg-[#1c1813] text-[#dfb15b]'
                        : 'border-[#252c40] bg-[#141824] text-[#8a96aa] hover:text-[#dfb15b]'
                    }`}
                    title="Save to favorites"
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-[#dfb15b]' : ''}`} />
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-full border border-[#252c40] bg-[#141824] text-[#8a96aa] hover:text-white transition-colors cursor-pointer"
                    title="Share artwork"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  {copiedLink && (
                    <span className="text-[10px] text-[#4ade80] font-semibold">
                      Link Copied!
                    </span>
                  )}
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {artwork.title}
              </h1>

              <div className="flex items-center gap-2 mt-2">
                <img
                  src={creator?.avatar || artwork.creatorAvatar}
                  alt={creator?.name || artwork.creatorName}
                  className="w-6 h-6 rounded-full object-cover border border-[#3d311c] shadow-2xs"
                />
                <p className="text-xs sm:text-sm text-[#8a96aa]">
                  Designed and sold by{' '}
                  <button
                    id="product-designed-by-artist-btn"
                    type="button"
                    onClick={() => {
                      if (creator && onSelectCreator) {
                        onSelectCreator(creator);
                      }
                    }}
                    className="font-bold text-[#dfb15b] underline decoration-[#dfb15b]/50 underline-offset-2 hover:text-[#ebd085] transition-colors inline-flex items-center gap-1 cursor-pointer"
                    title={`View ${creator?.name || artwork.creatorName}'s Artist Portfolio`}
                  >
                    <span>{creator?.name || artwork.creatorName}</span>
                    <ExternalLink className="w-3 h-3 text-[#dfb15b]" />
                  </button>
                </p>
              </div>

              {/* Star rating summary */}
              <div className="flex items-center gap-2 mt-2 text-xs">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-white">{averageRating}</span>
                <span className="text-[#8a96aa]">({filteredReviews.length} reviews)</span>
                <span className="text-[#4ade80] font-semibold ml-1">
                  • 680+ ordered
                </span>
              </div>
            </div>

            {/* Pricing Card & Artist Royalty Breakdown */}
            <div className="bg-[#0c0e17] rounded-2xl p-4 border border-[#1e2436]">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-black text-white">{formatPrice(unitPrice)}</span>
                  <span className="text-xs text-[#8a96aa] ml-1.5">{currency}</span>
                </div>
                <span className="bg-[#14291f] text-[#4ade80] border border-[#1e4a33] text-xs font-bold px-2.5 py-1 rounded-full">
                  In Stock & Ready to Print
                </span>
              </div>

              {/* Creator Support Direct Attribution */}
              <div className="mt-3 pt-3 border-t border-[#1e2436] flex items-center justify-between text-xs">
                <span className="text-[#cbd5e1] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#dfb15b]" />
                  Artist direct margin:
                </span>
                <span className="font-bold text-[#dfb15b] bg-[#1c1813] border border-[#3d311c] px-2 py-0.5 rounded-md">
                  +{formatPrice(artistMarginAmount)} to {artwork.creatorName}
                </span>
              </div>
            </div>

            {/* Product Color Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-white uppercase tracking-wide">
                  Color: <span className="text-[#8a96aa] normal-case">{selectedColor.name}</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {currentProductConfig.colors.map((color) => {
                  const isSelected = selectedColor.id === color.id;
                  return (
                    <button
                      key={color.id}
                      onClick={() => handleSelectColor(color)}
                      className={`relative w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'border-[#dfb15b] ring-2 ring-[#dfb15b]/40 scale-110'
                          : 'border-[#252c40] hover:border-[#8a96aa]'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {isSelected && (
                        <Check
                          className={`w-4 h-4 stroke-[3] ${
                            color.isDark ? 'text-white' : 'text-[#0b0c12]'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-white uppercase tracking-wide">
                  Size: <span className="text-[#8a96aa] normal-case">{selectedSize}</span>
                </label>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="text-xs text-[#dfb15b] hover:text-[#ebd085] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Size Chart</span>
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {currentProductConfig.sizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                        isSelected
                          ? 'border-[#dfb15b] bg-[#dfb15b] text-[#0b0c12] shadow-xs'
                          : 'border-[#252c40] bg-[#141824] text-[#cbd5e1] hover:border-[#dfb15b]/40 hover:bg-[#1c2233]'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#7e899c] mt-1.5">
                Standard unisex fit • Fits true to size
              </p>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-white uppercase tracking-wide">
                Quantity:
              </label>
              <div className="flex items-center border border-[#252c40] rounded-xl overflow-hidden bg-[#0c0e17]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-sm font-bold text-[#cbd5e1] hover:bg-[#141824] transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-bold text-white min-w-[2.5rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-sm font-bold text-[#cbd5e1] hover:bg-[#141824] transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-[#8a96aa]">
                Total: <strong className="text-white">{formatPrice(totalPrice)}</strong>
              </span>
            </div>

            {/* Action Buttons: Add to Cart & Buy Now */}
            <div className="space-y-2.5 pt-2">
              <button
                id="add-to-cart-btn"
                onClick={handleAdd}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#dfb15b] hover:bg-[#ebd085] text-[#0b0c12] font-black uppercase tracking-wider text-sm shadow-md hover:shadow-[0_4px_20px_rgba(223,177,91,0.3)] transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
              >
                <span>Add to Bag</span>
                <span>•</span>
                <span>{formatPrice(totalPrice)}</span>
              </button>

              <button
                id="buy-now-btn"
                onClick={handleBuyNow}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#EB212B] hover:bg-[#c91821] text-white font-black uppercase tracking-wider text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>Instant Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Add to All Products Bundle Option */}
              <div className="pt-2 border-t border-[#1e2436]">
                <button
                  id="add-to-all-products-btn"
                  type="button"
                  onClick={() => setShowAllProductsModal(true)}
                  className="w-full py-3 px-3.5 rounded-2xl bg-gradient-to-r from-[#1c1813] via-[#1f1618] to-[#1c1813] hover:from-[#2a2217] hover:to-[#2a2217] border border-[#3d311c] text-white font-bold text-xs transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#dfb15b] text-[#0b0c12] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 font-black">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-white">Add to All Products</span>
                        <span className="bg-[#EB212B] text-white text-[10px] font-black px-1.5 py-0.2 rounded-md uppercase">
                          Bundle
                        </span>
                      </div>
                      <span className="text-[11px] text-[#8a96aa] font-normal">
                        All 7 merchandise styles • Save 15% with CREATOR15
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[#dfb15b] font-bold text-xs group-hover:translate-x-0.5 transition-transform shrink-0">
                    <span>Bundle</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            </div>

            {/* Redbubble Trust Guarantees */}
            <div className="space-y-3 pt-4 border-t border-[#1e2436] text-xs text-[#8a96aa]">
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-[#dfb15b] shrink-0" />
                <span>
                  Worldwide shipping • Ships within <strong className="text-white">24–48 hours</strong>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="w-4 h-4 text-[#dfb15b] shrink-0" />
                <span>
                  Free return or exchange guarantee within <strong className="text-white">30 days</strong>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-[#dfb15b] shrink-0" />
                <span>
                  Secure payment with 256-bit encryption • PCI Compliant
                </span>
              </div>
            </div>

            {/* Product Features Accordion */}
            <div className="bg-[#0c0e17] rounded-2xl p-4 text-xs text-[#8a96aa] space-y-2 border border-[#1e2436]">
              <p className="font-bold text-white">{currentProductConfig.displayName} Details:</p>
              <ul className="list-disc list-inside space-y-1 text-[#cbd5e1]">
                {currentProductConfig.materials.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121520] border border-[#212637] text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#1e2436]">
              <h3 className="font-bold text-base text-white">
                Size & Fit Guide • {currentProductConfig.displayName}
              </h3>
              <button
                onClick={() => setShowSizeGuide(false)}
                className="text-[#8a96aa] hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <p className="text-xs text-[#8a96aa]">
                All measurements are in inches. Standard unisex classic regular cut.
              </p>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#212637] text-[#8a96aa] font-semibold">
                    <th className="py-2">Size</th>
                    <th className="py-2">Chest Width (in)</th>
                    <th className="py-2">Length (in)</th>
                    <th className="py-2">Sleeve (in)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2436] text-[#cbd5e1]">
                  <tr>
                    <td className="py-2 font-bold text-white">XS</td>
                    <td>16.5"</td>
                    <td>27.0"</td>
                    <td>8.0"</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-white">S</td>
                    <td>18.0"</td>
                    <td>28.0"</td>
                    <td>8.2"</td>
                  </tr>
                  <tr className="bg-[#1c1813] font-semibold text-[#dfb15b] border border-[#3d311c]">
                    <td className="py-2 font-bold text-[#dfb15b]">M (Popular)</td>
                    <td>20.0"</td>
                    <td>29.0"</td>
                    <td>8.5"</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-white">L</td>
                    <td>22.0"</td>
                    <td>30.0"</td>
                    <td>8.8"</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-white">XL</td>
                    <td>24.0"</td>
                    <td>31.0"</td>
                    <td>9.0"</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-white">2XL</td>
                    <td>26.0"</td>
                    <td>32.0"</td>
                    <td>9.5"</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setShowSizeGuide(false)}
              className="w-full py-2.5 bg-[#dfb15b] hover:bg-[#ebd085] text-[#0b0c12] text-xs font-black rounded-xl cursor-pointer transition-colors"
            >
              Close Size Chart
            </button>
          </div>
        </div>
      )}

      {/* Write a Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleReviewSubmit}
            className="bg-[#121520] border border-[#212637] text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2436]">
              <h3 className="font-bold text-base text-white">
                Write a Review for {artwork.title}
              </h3>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-[#8a96aa] hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#cbd5e1] mb-1">
                Your Rating
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setNewReviewRating(num)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        num <= newReviewRating ? 'fill-amber-400' : 'text-[#252c40]'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#cbd5e1] mb-1">
                Your Name / Nickname
              </label>
              <input
                type="text"
                required
                value={newReviewAuthor}
                onChange={(e) => setNewReviewAuthor(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full px-3 py-2 bg-[#0c0e17] border border-[#252c40] rounded-xl text-xs text-white placeholder-[#7e899c] focus:outline-hidden focus:border-[#dfb15b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#cbd5e1] mb-1">
                Review Headline
              </label>
              <input
                type="text"
                value={newReviewTitle}
                onChange={(e) => setNewReviewTitle(e.target.value)}
                placeholder="e.g. Stunning vibrant print on heavy cotton"
                className="w-full px-3 py-2 bg-[#0c0e17] border border-[#252c40] rounded-xl text-xs text-white placeholder-[#7e899c] focus:outline-hidden focus:border-[#dfb15b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#cbd5e1] mb-1">
                Your Experience
              </label>
              <textarea
                required
                rows={4}
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                placeholder="How did the fit feel? How was the print clarity and fabric comfort?"
                className="w-full px-3 py-2 bg-[#0c0e17] border border-[#252c40] rounded-xl text-xs text-white placeholder-[#7e899c] focus:outline-hidden focus:border-[#dfb15b]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2.5 border border-[#252c40] bg-[#141824] hover:bg-[#1c2233] text-[#cbd5e1] rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#dfb15b] hover:bg-[#ebd085] text-[#0b0c12] rounded-xl text-xs font-black shadow-xs cursor-pointer transition-colors"
              >
                Submit Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add to All Products Bundle Modal */}
      {showAllProductsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#121520] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#212637] animate-in zoom-in-95 text-white">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#1e2436] flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#1c1813] text-[#dfb15b] flex items-center justify-center shrink-0 border border-[#3d311c] shadow-2xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">
                      Add to All Products
                    </h3>
                    <span className="bg-[#EB212B] text-white text-[11px] font-black px-2 py-0.5 rounded-full uppercase">
                      15% Off Bundle
                    </span>
                  </div>
                  <p className="text-xs text-[#8a96aa] mt-0.5">
                    Collect "{artwork.title}" across all merchandise. Customize styles below.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllProductsModal(false)}
                className="w-8 h-8 rounded-full bg-[#141824] hover:bg-[#1c2233] text-[#8a96aa] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#252c40]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Bulk Select Bar */}
            <div className="px-6 py-2.5 bg-[#0c0e17] border-b border-[#1e2436] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#8a96aa]">
                {enabledBundleProducts.length} of {PRODUCT_CATALOG.length} products selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllBundleProducts(true)}
                  className="font-bold text-[#dfb15b] hover:text-[#ebd085] cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-[#252c40]">•</span>
                <button
                  type="button"
                  onClick={() => setAllBundleProducts(false)}
                  className="font-semibold text-[#8a96aa] hover:text-white cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Scrollable Products List */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5 divide-y divide-[#1e2436]">
              {PRODUCT_CATALOG.map((prod) => {
                const config = bundleConfig[prod.category] || {
                  enabled: true,
                  color: prod.colors[0] || PRODUCT_COLORS[0],
                  size: prod.sizes[0] || 'Standard',
                };
                const pBase = prod.basePrice;
                const pMargin = Number(((pBase * marginPercentage) / 100).toFixed(2));
                const pPrice = Number((pBase + pMargin).toFixed(2));

                return (
                  <div
                    key={prod.category}
                    className={`pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-2xl transition-all ${
                      config.enabled
                        ? 'bg-[#181c2b] border border-[#2d354d]'
                        : 'opacity-50 hover:opacity-75 bg-transparent border border-transparent'
                    }`}
                  >
                    {/* Checkbox + Thumbnail + Title */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={() => toggleProductInBundle(prod.category)}
                        className="w-4 h-4 rounded text-[#dfb15b] accent-[#dfb15b] cursor-pointer shrink-0"
                      />
                      <div className="w-14 h-14 rounded-xl bg-[#0c0e17] border border-[#212637] overflow-hidden flex items-center justify-center shrink-0">
                        <MockupRenderer
                          productType={prod.category}
                          color={config.color}
                          artworkUrl={artwork.imageUrl}
                          className="w-full h-full transform scale-90"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate">
                          {prod.displayName}
                        </h4>
                        <p className="text-[11px] text-[#8a96aa] truncate">
                          {prod.materials[0] || 'Premium Quality Print'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-black text-white">
                            {formatPrice(pPrice)}
                          </span>
                          <span className="text-[10px] text-[#4ade80] font-semibold bg-[#14291f] border border-[#1e4a33] px-1.5 py-0.2 rounded-sm">
                            +{formatPrice(pMargin)} to artist
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Color Swatches & Size Options (if enabled) */}
                    {config.enabled && (
                      <div className="flex items-center gap-3 pl-7 sm:pl-0">
                        {/* Colors */}
                        {prod.colors.length > 1 && (
                          <div className="flex items-center gap-1">
                            {prod.colors.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setBundleProductColor(prod.category, c)}
                                title={c.name}
                                className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                                  config.color.id === c.id
                                    ? 'border-[#dfb15b] ring-2 ring-[#dfb15b]/40 scale-110'
                                    : 'border-[#252c40] hover:scale-105'
                                }`}
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Sizes */}
                        {prod.sizes.length > 1 && (
                          <select
                            value={config.size}
                            onChange={(e) => setBundleProductSize(prod.category, e.target.value)}
                            className="text-[11px] font-semibold text-white bg-[#0c0e17] border border-[#252c40] rounded-lg px-2 py-1 focus:outline-hidden focus:border-[#dfb15b] cursor-pointer"
                          >
                            {prod.sizes.map((s) => (
                              <option key={s} value={s} className="bg-[#0c0e17] text-white">
                                {s}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Sticky Footer Summary */}
            <div className="p-5 sm:p-6 bg-[#0c0e17] border-t border-[#1e2436] rounded-b-3xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-white">
                      {formatPrice(bundleFinalTotal)}
                    </span>
                    {bundleDiscountAmount > 0 && (
                      <span className="text-xs text-[#7e899c] line-through">
                        {formatPrice(bundleOriginalTotal)}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-[#4ade80] bg-[#14291f] border border-[#1e4a33] px-1.5 py-0.5 rounded-md">
                      Saved {formatPrice(bundleDiscountAmount)} (15% Off)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8a96aa] mt-0.5">
                    Includes <strong className="text-[#dfb15b]">+{formatPrice(bundleTotalArtistMargin)}</strong> direct artist earnings for {artwork.creatorName}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAllProductsModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-[#8a96aa] hover:text-white hover:bg-[#141824] rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="confirm-add-all-products-btn"
                    disabled={enabledBundleProducts.length === 0}
                    onClick={() => handleAddAllProducts(true)}
                    className="px-5 py-2.5 bg-[#dfb15b] hover:bg-[#ebd085] disabled:opacity-50 text-[#0b0c12] text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      Add {enabledBundleProducts.length} {enabledBundleProducts.length === 1 ? 'Product' : 'Products'} to Bag
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Original Artwork Details Modal (Opens when clicking "China girl" / Artwork title in breadcrumb) */}
      {showArtworkDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#121520] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#212637] shadow-2xl p-6 relative animate-in zoom-in-95 text-white">
            <button
              type="button"
              id="close-artwork-detail-modal-btn"
              onClick={() => setShowArtworkDetailModal(false)}
              className="absolute top-4 right-4 p-2 text-[#8a96aa] hover:text-white hover:bg-[#141824] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-[#dfb15b] uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Original Artwork Spotlight</span>
            </div>

            <h3 className="text-2xl font-black text-white mb-1">
              {artwork.title}
            </h3>
            <p className="text-xs text-[#8a96aa] mb-5">
              By independent artist <strong className="text-[#dfb15b]">{creator?.name || artwork.creatorName}</strong>
            </p>

            <div className="aspect-square max-h-80 w-full bg-[#0c0e17] rounded-2xl border border-[#212637] p-6 flex items-center justify-center overflow-hidden mb-6 shadow-inner">
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="max-h-full max-w-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8a96aa] mb-1">
                  Artist Concept & Description
                </h4>
                <p className="text-sm text-[#cbd5e1] leading-relaxed bg-[#0c0e17] p-4 rounded-2xl border border-[#1e2436]">
                  {artwork.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8a96aa] mb-2">
                  Art Tags & Discovery
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {artwork.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setShowArtworkDetailModal(false);
                        if (onFilterByGenre) onFilterByGenre(tag);
                      }}
                      className="px-2.5 py-1 bg-[#141824] hover:bg-[#1c1813] hover:text-[#dfb15b] text-[#cbd5e1] text-xs font-medium rounded-lg cursor-pointer transition-colors border border-[#252c40] hover:border-[#3d311c]"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8a96aa] mb-2">
                  Preview "{artwork.title}" on merchandise:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRODUCT_CATALOG.map((prod) => (
                    <button
                      key={prod.category}
                      type="button"
                      onClick={() => {
                        handleSelectCategory(prod.category, true);
                        setShowArtworkDetailModal(false);
                      }}
                      className={`p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                        selectedCategory === prod.category
                          ? 'border-[#dfb15b] bg-[#1c1813] text-[#dfb15b] font-bold ring-1 ring-[#dfb15b]/30'
                          : 'border-[#252c40] bg-[#141824] hover:bg-[#1c2233] text-[#cbd5e1]'
                      }`}
                    >
                      <p className="font-semibold truncate">{prod.displayName}</p>
                      <p className="text-[11px] text-[#8a96aa]">
                        {formatPrice(prod.basePrice * (1 + marginPercentage / 100))}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1e2436] flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowArtworkDetailModal(false);
                    setShowAllProductsModal(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#141824] hover:bg-[#1c2233] border border-[#252c40] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-[#dfb15b]" />
                  <span>Configure All 7 Products Bundle (-15%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowArtworkDetailModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#dfb15b] hover:bg-[#ebd085] text-[#0b0c12] text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer text-center transition-colors"
                >
                  Customize on {currentProductConfig.displayName}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
