import React, { useState, useEffect } from 'react';
import { 
  Artwork, 
  CartItem, 
  CreatorProfile, 
  ProductCategory, 
  Review 
} from './types';
import { 
  INITIAL_ARTWORKS, 
  INITIAL_CREATOR, 
  INITIAL_REVIEWS, 
  PRODUCT_CATALOG 
} from './lib/seedData';
import { 
  ensureAuthSession, 
  seedInitialMarketplaceData, 
  testConnection,
  db,
  auth,
  logoutUser
} from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  setDoc 
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Header } from './components/Header';
import { ProductDetail } from './components/ProductDetail';
import { CreatorStudio } from './components/CreatorStudio';
import { EarningsDashboard } from './components/EarningsDashboard';
import { ArtistPortfolio } from './components/ArtistPortfolio';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { MxLogo } from './components/MxLogo';
import { 
  Sparkles, 
  Shield, 
  Heart, 
  HelpCircle, 
  Globe, 
  RefreshCw, 
  Palette, 
  ExternalLink, 
  Home,
  ArrowUpDown,
  ChevronDown,
  SlidersHorizontal,
  CheckCircle2,
  ArrowRight,
  X
} from 'lucide-react';
import { useCurrency } from './context/CurrencyContext';

export type MarketplaceSortOption = 'newest' | 'popularity' | 'price-low' | 'price-high';

export default function App() {
  const [activeTab, setActiveTab] = useState<'product' | 'studio' | 'dashboard' | 'explore' | 'portfolio'>('explore');
  const [artworks, setArtworks] = useState<Artwork[]>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('mx_custom_artworks') || '[]');
      if (Array.isArray(cached) && cached.length > 0) {
        const cachedIds = new Set(cached.map((c: any) => c.id));
        return [...cached, ...INITIAL_ARTWORKS.filter((a) => !cachedIds.has(a.id))];
      }
    } catch {}
    return INITIAL_ARTWORKS;
  });
  const [currentArtwork, setCurrentArtwork] = useState<Artwork>(INITIAL_ARTWORKS[0]);
  const [creator, setCreator] = useState<CreatorProfile>(INITIAL_CREATOR);
  const [portfolioCreator, setPortfolioCreator] = useState<CreatorProfile>(INITIAL_CREATOR);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [activeProductCategory, setActiveProductCategory] = useState<ProductCategory>('t-shirt');
  const [allProductsTrigger, setAllProductsTrigger] = useState<number>(0);
  const [isFollowingCreator, setIsFollowingCreator] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [marketplaceSort, setMarketplaceSort] = useState<MarketplaceSortOption>('popularity');
  const [recentlyPublishedArt, setRecentlyPublishedArt] = useState<Artwork | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const { formatPrice } = useCurrency();

  // Listen to Firebase Auth state changes (Google Sign In & Email)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.displayName) {
        setCreator((prev) => ({
          ...prev,
          name: user.displayName || prev.name,
          avatar: user.photoURL || prev.avatar,
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Initialize Firebase Auth & Seed Data on mount
  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      try {
        await ensureAuthSession();
        await seedInitialMarketplaceData();
      } catch (err) {
        console.warn('Firebase initialization notice:', err);
      } finally {
        if (isMounted) {
          setFirebaseReady(true);
        }
      }
      testConnection().catch(() => {});
    };
    initApp();
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to Firestore real-time updates for artworks (only when Firebase is ready)
  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribe = onSnapshot(
      collection(db, 'artworks'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Artwork[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as Artwork);
          });

          // Merge Firestore artworks with any local custom uploads
          try {
            const cached: Artwork[] = JSON.parse(localStorage.getItem('mx_custom_artworks') || '[]');
            const firestoreIds = new Set(list.map((a) => a.id));
            const extraCustom = cached.filter((c) => !firestoreIds.has(c.id));
            setArtworks([...extraCustom, ...list]);
          } catch {
            setArtworks(list);
          }

          // If current artwork is updated or not set, keep it synced
          const found = list.find((a) => a.id === currentArtwork.id);
          if (found) {
            setCurrentArtwork(found);
          }
        }
      },
      (err) => {
        console.warn('Firestore artworks listener notice:', err);
      }
    );

    return () => unsubscribe();
  }, [firebaseReady, currentArtwork.id]);

  // Listen to Firestore real-time updates for reviews (only when Firebase is ready)
  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribe = onSnapshot(
      collection(db, 'reviews'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Review[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as Review);
          });
          setReviews(list);
        }
      },
      (err) => {
        console.warn('Firestore reviews listener notice:', err);
      }
    );

    return () => unsubscribe();
  }, [firebaseReady]);

  // Listen to creator profile updates (only when Firebase is ready)
  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribe = onSnapshot(
      doc(db, 'creators', 'bamicash1'),
      (snap) => {
        if (snap.exists()) {
          setCreator(snap.data() as CreatorProfile);
        }
      },
      (err) => {
        console.warn('Firestore creator listener notice:', err);
      }
    );

    return () => unsubscribe();
  }, [firebaseReady]);

  // Cart operations
  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
          i.artwork.id === item.artwork.id &&
          i.productType === item.productType &&
          i.color.id === item.color.id &&
          i.size === item.size
      );
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += item.quantity;
        return copy;
      }
      return [...prev, item];
    });
  };

  const handleAddMultipleToCart = (items: CartItem[]) => {
    setCart((prev) => {
      const next = [...prev];
      for (const item of items) {
        const existingIdx = next.findIndex(
          (i) =>
            i.artwork.id === item.artwork.id &&
            i.productType === item.productType &&
            i.color.id === item.color.id &&
            i.size === item.size
        );
        if (existingIdx > -1) {
          next[existingIdx] = {
            ...next[existingIdx],
            quantity: next[existingIdx].quantity + item.quantity,
          };
        } else {
          next.push(item);
        }
      }
      return next;
    });
  };

  const handleInstantBuy = (item: CartItem) => {
    handleAddToCart(item);
    setIsCheckoutOpen(true);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleProceedToCheckout = (discount: number) => {
    setAppliedDiscount(discount);
    setIsCheckoutOpen(true);
  };

  const handleOrderCompleted = (orderId: string) => {
    setCart([]);
  };

  // Add review and save to Firestore
  const handleAddReview = async (
    newRev: Omit<Review, 'id' | 'date' | 'helpfulCount'>
  ) => {
    const reviewId = `rev-${Date.now()}`;
    const fullReview: Review = {
      ...newRev,
      id: reviewId,
      date: 'Just now',
      helpfulCount: 0,
    };

    try {
      await setDoc(doc(db, 'reviews', reviewId), fullReview);
      setReviews((prev) => [fullReview, ...prev]);
    } catch (err) {
      console.warn('Review save fallback:', err);
      setReviews((prev) => [fullReview, ...prev]);
    }
  };

  // Artwork selection handler
  const handleSelectArtwork = (art: Artwork) => {
    setCurrentArtwork(art);
    if (selectedCategory !== 'all') {
      setActiveProductCategory(selectedCategory);
    } else if (art.defaultCategory) {
      setActiveProductCategory(art.defaultCategory);
    }
    setActiveTab('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Category selection handler (synchronizes Header pills, ProductDetail mockup, and Marketplace)
  const handleSelectCategory = (cat: ProductCategory | 'all') => {
    setSelectedCategory(cat);
    if (cat === 'all') {
      setActiveTab('explore');
      setSearchQuery('');
      if (activeTab === 'product') {
        setAllProductsTrigger(Date.now());
      }
    } else {
      setActiveProductCategory(cat);
      if (activeTab !== 'product' && activeTab !== 'explore') {
        setActiveTab('explore');
      }
    }
  };

  // Navigate directly to Marketplace
  const handleNavigateToMarketplace = () => {
    setActiveTab('explore');
    setSelectedCategory('all');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter Marketplace by category, genre, or tag (e.g. Art & Design, China girl)
  const handleFilterByGenre = (genre: string) => {
    setActiveTab('explore');
    setSearchQuery(genre);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to Artist Portfolio view for a specific creator
  const handleSelectCreator = (c?: CreatorProfile) => {
    if (c) {
      setPortfolioCreator(c);
    } else {
      setPortfolioCreator(creator);
    }
    setActiveTab('portfolio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCreatorByName = (creatorName: string, creatorId?: string) => {
    if (creator.id === creatorId || creator.name.toLowerCase() === creatorName.toLowerCase()) {
      handleSelectCreator(creator);
    } else {
      const customCreator: CreatorProfile = {
        ...creator,
        id: creatorId || creatorName.toLowerCase().replace(/\s+/g, '-'),
        name: creatorName,
        username: creatorName.toLowerCase().replace(/\s+/g, '_'),
      };
      handleSelectCreator(customCreator);
    }
  };

  // Filter artworks by search query or category
  const filteredArtworks = artworks.filter((art) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (q === 'art & design' ? true : (
        art.title.toLowerCase().includes(q) ||
        art.creatorName.toLowerCase().includes(q) ||
        art.category.toLowerCase().includes(q) ||
        art.tags.some((t) => t.toLowerCase().includes(q))
      ));

    const matchesCategory =
      selectedCategory === 'all' ||
      art.defaultCategory === selectedCategory ||
      art.category.toLowerCase().includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  // Calculate retail price for an artwork based on current selected category context
  const getArtworkRetailPrice = (art: Artwork): number => {
    if (selectedCategory !== 'all') {
      const foundProd = PRODUCT_CATALOG.find((p) => p.category === selectedCategory);
      if (foundProd) {
        return foundProd.basePrice * (1 + (art.creatorMarginPercent || 0) / 100);
      }
    }
    return (art.basePrice || 19.99) * (1 + (art.creatorMarginPercent || 0) / 100);
  };

  // Sort artworks for Marketplace gallery based on active sort option ('Newest', 'Popularity', 'Price: Low to High')
  const sortedArtworks = [...filteredArtworks].sort((a, b) => {
    if (marketplaceSort === 'newest') {
      return (b.createdAt || 0) - (a.createdAt || 0);
    }
    if (marketplaceSort === 'popularity') {
      const scoreA = (a.salesCount || 0) * 10 + (a.likesCount || 0) * 2 + (a.viewsCount || 0) * 0.05;
      const scoreB = (b.salesCount || 0) * 10 + (b.likesCount || 0) * 2 + (b.viewsCount || 0) * 0.05;
      return scoreB - scoreA;
    }
    if (marketplaceSort === 'price-low') {
      const priceA = getArtworkRetailPrice(a);
      const priceB = getArtworkRetailPrice(b);
      return priceA - priceB;
    }
    if (marketplaceSort === 'price-high') {
      const priceA = getArtworkRetailPrice(a);
      const priceB = getArtworkRetailPrice(b);
      return priceB - priceA;
    }
    return 0;
  });

  // Update Creator Profile and sync to Firestore & local state
  const handleUpdateCreator = async (updatedCreator: CreatorProfile) => {
    setCreator(updatedCreator);
    try {
      await setDoc(doc(db, 'creators', updatedCreator.id), updatedCreator, { merge: true });
      // Sync creator metadata across artworks
      setArtworks((prev) =>
        prev.map((art) =>
          art.creatorId === updatedCreator.id
            ? { ...art, creatorName: updatedCreator.name, creatorAvatar: updatedCreator.avatar }
            : art
        )
      );
      if (currentArtwork.creatorId === updatedCreator.id) {
        setCurrentArtwork((prev) => ({
          ...prev,
          creatorName: updatedCreator.name,
          creatorAvatar: updatedCreator.avatar,
        }));
      }
    } catch (err) {
      console.warn('Firestore creator profile update notice:', err);
    }
  };

  const handleToggleFollowCreator = async () => {
    const nextFollowing = !isFollowingCreator;
    setIsFollowingCreator(nextFollowing);
    const updated = {
      ...creator,
      followerCount: nextFollowing ? creator.followerCount + 1 : Math.max(0, creator.followerCount - 1),
      isFollowing: nextFollowing,
    };
    setCreator(updated);
    try {
      await setDoc(doc(db, 'creators', creator.id), {
        followerCount: updated.followerCount,
      }, { merge: true });
    } catch (err) {
      console.warn('Follow count update notice:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c12] flex flex-col font-sans text-slate-100 antialiased selection:bg-[#dfb15b] selection:text-[#0b0c12]">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cart={cart}
        setIsCartOpen={setIsCartOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Search / Category Filter Bar Results notice */}
        {searchQuery && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="bg-[#121522] border border-[#23283a] rounded-2xl p-4 flex items-center justify-between text-xs shadow-xl">
              <p className="text-[#9ca6b8]">
                Found <strong className="text-white">{filteredArtworks.length}</strong> designs matching "
                <strong className="text-[#dfb15b]">{searchQuery}</strong>"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#dfb15b] hover:text-[#f3cd82] font-bold hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          </div>
        )}

        {/* View Switcher: Product Detail View */}
        {activeTab === 'product' && (
          <ProductDetail
            artwork={currentArtwork}
            creator={creator}
            selectedCategory={activeProductCategory}
            onSelectCategory={(cat) => {
              setActiveProductCategory(cat);
              setSelectedCategory(cat);
            }}
            onNavigateToMarketplace={handleNavigateToMarketplace}
            onFilterByGenre={handleFilterByGenre}
            openAllProductsTrigger={allProductsTrigger}
            onAddToCart={handleAddToCart}
            onAddMultipleToCart={handleAddMultipleToCart}
            onOpenCart={() => setIsCartOpen(true)}
            onInstantBuy={handleInstantBuy}
            onSelectArtwork={handleSelectArtwork}
            artworksList={artworks}
            reviews={reviews}
            onAddReview={handleAddReview}
            isCreatorFollowing={isFollowingCreator}
            onToggleFollowCreator={handleToggleFollowCreator}
            onSelectCreator={handleSelectCreator}
          />
        )}

        {/* View Switcher: Artist Portfolio View */}
        {activeTab === 'portfolio' && (
          <ArtistPortfolio
            creator={portfolioCreator}
            artworks={artworks}
            onSelectArtwork={handleSelectArtwork}
            onNavigateToMarketplace={handleNavigateToMarketplace}
            isFollowing={isFollowingCreator}
            onToggleFollow={handleToggleFollowCreator}
          />
        )}

        {/* View Switcher: Creator Upload Studio */}
        {activeTab === 'studio' && (
          <CreatorStudio
            creator={creator}
            onArtworkPublished={(newArt) => {
              setArtworks((prev) => [newArt, ...prev.filter((a) => a.id !== newArt.id)]);
              setCurrentArtwork(newArt);
              setRecentlyPublishedArt(newArt);
              setMarketplaceSort('newest');
              handleNavigateToMarketplace();
            }}
            onViewProduct={(art) => {
              setCurrentArtwork(art);
              setActiveTab('product');
            }}
            onNavigateToHome={handleNavigateToMarketplace}
          />
        )}

        {/* View Switcher: Real-Time Creator Earnings Dashboard */}
        {activeTab === 'dashboard' && (
          <EarningsDashboard
            creator={creator}
            artworks={artworks}
            onViewArtwork={(art) => {
              setCurrentArtwork(art);
              setActiveTab('product');
            }}
            onNavigateToStudio={() => setActiveTab('studio')}
            onNavigateToHome={handleNavigateToMarketplace}
            onUpdateCreator={handleUpdateCreator}
            onViewPortfolio={() => handleSelectCreator(creator)}
          />
        )}

        {/* View Switcher: Explore / Marketplace Gallery (Shop Home) */}
        {activeTab === 'explore' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Automatic Return Success Banner when user sells/publishes a project */}
            {recentlyPublishedArt && (
              <div 
                id="recently-published-announcement"
                className="bg-gradient-to-r from-[#0f2419] via-[#142d1f] to-[#1a2318] border-2 border-[#2b593f] rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#0b1610] p-1.5 border border-[#2b593f] flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    <img 
                      src={recentlyPublishedArt.imageUrl} 
                      alt={recentlyPublishedArt.title} 
                      className="w-full h-full object-contain drop-shadow-sm" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#1e402b] text-[#4ade80] text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-[#2d613f]">
                        <CheckCircle2 className="w-3 h-3 text-[#4ade80]" />
                        <span>Project Published & Live on Shop Home</span>
                      </span>
                      <span className="text-[11px] text-[#8ea699]">Synced to Firebase Firestore</span>
                    </div>
                    <h3 className="text-base font-black text-white">
                      "{recentlyPublishedArt.title}"
                    </h3>
                    <p className="text-xs text-[#a2c8b1] mt-0.5">
                      Your artwork is now live for purchase across all 60+ products. Earn +{formatPrice((19.99 * (recentlyPublishedArt.creatorMarginPercent || 20)) / 100)} profit per T-shirt!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                  <button
                    id="view-live-published-product-btn"
                    type="button"
                    onClick={() => handleSelectArtwork(recentlyPublishedArt)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-[#dfb15b] hover:bg-[#f0c26c] text-[#0b0c12] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    <span>View Product Page</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecentlyPublishedArt(null)}
                    className="p-2 text-[#8ea699] hover:text-white rounded-xl hover:bg-[#183626] border border-transparent hover:border-[#2b593f] transition-all cursor-pointer"
                    title="Dismiss notice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#dfb15b] uppercase tracking-wider mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#EB212B] inline-block animate-pulse" />
                  <Sparkles className="w-4 h-4 text-[#dfb15b]" />
                  <span>Independent Artist Marketplace</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Explore Creator Designs
                </h2>
                <p className="text-xs sm:text-sm text-[#8a96aa] mt-1">
                  Every purchase directly funds independent artists with custom profit margins.
                </p>
              </div>

              {/* Quick Filter Tags including Art & Design and China girl */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="marketplace-filter-art-design"
                  type="button"
                  onClick={() => handleFilterByGenre('Art & Design')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border uppercase tracking-wider ${
                    searchQuery.toLowerCase() === 'art & design'
                      ? 'bg-[#dfb15b] text-[#0b0c12] border-[#dfb15b] shadow-sm font-black'
                      : 'bg-[#121520] text-[#a1acbe] hover:text-white border-[#24293a] hover:border-[#dfb15b]/40'
                  }`}
                >
                  🎨 Art & Design
                </button>
                <button
                  id="marketplace-filter-china-girl"
                  type="button"
                  onClick={() => handleFilterByGenre('China girl')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border uppercase tracking-wider ${
                    searchQuery.toLowerCase() === 'china girl'
                      ? 'bg-[#EB212B] text-white border-[#EB212B] shadow-sm'
                      : 'bg-[#181216] text-[#ff808d] hover:bg-[#28151c] border-[#441a23]'
                  }`}
                >
                  ✨ China girl
                </button>
                <span className="text-xs font-semibold text-[#737f94] ml-1">
                  {sortedArtworks.length} {sortedArtworks.length === 1 ? 'artwork' : 'artworks'}
                </span>
              </div>
            </div>

            {/* Category Filter Pills in Explore */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#1b2030] whitespace-nowrap">
              <button
                id="explore-category-all"
                type="button"
                onClick={() => handleSelectCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider ${
                  selectedCategory === 'all'
                    ? 'bg-[#dfb15b] text-[#0b0c12] font-black shadow-md border border-[#dfb15b]'
                    : 'bg-[#121520] text-[#8e98ab] hover:text-white border border-[#232838] hover:border-[#dfb15b]/40'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Shop Home (All Products)</span>
              </button>
              {PRODUCT_CATALOG.map((prod) => {
                const isActive = selectedCategory === prod.category;
                return (
                  <button
                    key={prod.category}
                    id={`explore-category-${prod.category}`}
                    type="button"
                    onClick={() => handleSelectCategory(prod.category)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider ${
                      isActive
                        ? 'bg-[#dfb15b] text-[#0b0c12] font-black shadow-md border border-[#dfb15b]'
                        : 'bg-[#121520] text-[#8e98ab] hover:text-white border border-[#232838] hover:border-[#dfb15b]/40'
                    }`}
                  >
                    {prod.displayName}
                  </button>
                );
              })}
            </div>

            {/* Marketplace Gallery Control & Sort Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#7e899c]">
                <span>
                  Showing <strong className="font-bold text-white">{sortedArtworks.length}</strong> {sortedArtworks.length === 1 ? 'artwork' : 'artworks'}
                </span>
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1a1f30] text-[#dfb15b] border border-[#dfb15b]/30">
                    <span>Category:</span>
                    <strong className="font-bold">{PRODUCT_CATALOG.find((p) => p.category === selectedCategory)?.displayName || selectedCategory}</strong>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1a1f30] text-white border border-[#2a3147]">
                    <span>Filter:</span>
                    <strong className="font-bold text-[#dfb15b]">"{searchQuery}"</strong>
                  </span>
                )}
              </div>

              {/* Sort Filter Dropdown */}
              <div className="flex items-center gap-2 self-start sm:self-auto" id="marketplace-sort-dropdown">
                <label 
                  htmlFor="marketplace-sort-select" 
                  className="text-xs font-bold text-[#9ca6b8] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#dfb15b]" />
                  <span>Sort by:</span>
                </label>
                <div className="relative">
                  <select
                    id="marketplace-sort-select"
                    value={marketplaceSort}
                    onChange={(e) => setMarketplaceSort(e.target.value as MarketplaceSortOption)}
                    className="appearance-none bg-[#121520] text-white text-xs font-bold pl-3.5 pr-8 py-2 rounded-xl border border-[#252a3d] hover:border-[#dfb15b]/50 focus:outline-hidden focus:border-[#dfb15b] cursor-pointer transition-all shadow-md"
                  >
                    <option value="newest" className="bg-[#121520] text-white">Newest</option>
                    <option value="popularity" className="bg-[#121520] text-white">Popularity</option>
                    <option value="price-low" className="bg-[#121520] text-white">Price: Low to High</option>
                    <option value="price-high" className="bg-[#121520] text-white">Price: High to Low</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#7e899c] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Artwork Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedArtworks.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-[#121522] rounded-3xl border border-[#23283a] p-8">
                  <Palette className="w-12 h-12 text-[#4b556b] mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white">No artworks found</h3>
                  <p className="text-xs text-[#8a96aa] mt-1 max-w-sm mx-auto">
                    Try clearing your search query or selecting another category.
                  </p>
                  <button
                    type="button"
                    onClick={handleNavigateToMarketplace}
                    className="mt-4 px-4 py-2 bg-[#dfb15b] text-[#0b0c12] text-xs font-black rounded-xl hover:bg-[#ebd085] transition-colors cursor-pointer"
                  >
                    Reset Filters & View All
                  </button>
                </div>
              ) : (
                sortedArtworks.map((art, index) => {
                  const isChinaGirl = art.title.toLowerCase().includes('china girl');
                  const activePrice = selectedCategory !== 'all'
                    ? (() => {
                        const foundProd = PRODUCT_CATALOG.find((p) => p.category === selectedCategory);
                        return foundProd
                          ? (foundProd.basePrice * (1 + art.creatorMarginPercent / 100)).toFixed(2)
                          : (art.basePrice * (1 + art.creatorMarginPercent / 100)).toFixed(2);
                      })()
                    : (art.basePrice * (1 + art.creatorMarginPercent / 100)).toFixed(2);

                  return (
                    <div
                      key={`${art.id}-${marketplaceSort}-${selectedCategory}-${searchQuery}`}
                      id={`explore-card-${art.id}`}
                      onClick={() => handleSelectArtwork(art)}
                      className={`animate-fade-in group bg-[#121522] rounded-3xl border overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 flex flex-col ${
                        isChinaGirl
                          ? 'border-[#dfb15b]/50 ring-1 ring-[#dfb15b]/30 shadow-[0_4px_25px_rgba(223,177,91,0.08)]'
                          : 'border-[#212638] hover:border-[#dfb15b]/40'
                      }`}
                      style={{
                        animationDelay: `${Math.min(index, 15) * 50}ms`,
                      }}
                    >
                      <div className="aspect-square bg-[#0b0d14] p-6 flex items-center justify-center overflow-hidden relative">
                        {isChinaGirl && (
                          <div className="absolute top-3 left-3 z-10 bg-[#EB212B] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
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
                      <div className="p-5 border-t border-[#1d2232] flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-[#717d91] mb-1">
                            <span className="uppercase tracking-wider font-semibold text-[#8a96aa]">{art.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[#8a96ab] font-medium">❤️ {art.likesCount}</span>
                              <span className="font-semibold text-emerald-400">+{art.creatorMarginPercent}% margin</span>
                            </div>
                          </div>
                          <h3 className="font-black text-base text-white group-hover:text-[#dfb15b] transition-colors line-clamp-1">
                            {art.title}
                          </h3>
                          <p className="text-xs text-[#8a96aa] mt-1 flex items-center gap-1">
                            <span>by</span>
                            <button
                              id={`explore-card-artist-${art.id}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCreatorByName(art.creatorName, art.creatorId);
                              }}
                              className="font-bold text-[#c5cddb] hover:text-[#dfb15b] hover:underline cursor-pointer inline-flex items-center gap-1 transition-colors group/artistlink"
                              title={`View ${art.creatorName}'s Artist Portfolio & all works`}
                            >
                              <span>{art.creatorName}</span>
                              <Palette className="w-3 h-3 text-[#dfb15b] opacity-70 group-hover/artistlink:opacity-100 transition-opacity" />
                            </button>
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#1d2232] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[#717d91] block font-bold uppercase tracking-wider">
                              {selectedCategory === 'all' ? 'From' : PRODUCT_CATALOG.find((p) => p.category === selectedCategory)?.displayName || 'Format'}
                            </span>
                            <span className="font-black text-lg text-[#dfb15b]">
                              {formatPrice(Number(activePrice))}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[#0b0c12] bg-[#dfb15b] group-hover:bg-[#ebd085] px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer shadow-sm">
                            Customize &rarr;
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={handleProceedToCheckout}
        onNavigateToHome={handleNavigateToMarketplace}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        appliedDiscount={appliedDiscount}
        onOrderCompleted={handleOrderCompleted}
      />

      {/* Google Sign In & Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={(user) => {
          setCurrentUser(user);
          if (user.displayName) {
            setCreator((prev) => ({
              ...prev,
              name: user.displayName || prev.name,
              avatar: user.photoURL || prev.avatar,
            }));
          }
        }}
      />

      {/* MX Gallery Marketplace Footer */}
      <footer className="bg-[#08090e] border-t border-[#1b2030] mt-16 text-[#7d889b] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Trust Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-10 border-b border-[#1b2030]">
            <div className="flex items-start gap-3.5 bg-[#0f121b] border border-[#1e2333] p-4 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-[#23171a] text-[#EB212B] flex items-center justify-center shrink-0 border border-[#3f1c24]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Empowering Artists</h4>
                <p className="text-xs text-[#8a96aa] mt-0.5">
                  Over millions paid directly to independent creators around the world.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-[#0f121b] border border-[#1e2333] p-4 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-[#122419] text-[#4ade80] flex items-center justify-center shrink-0 border border-[#1f422b]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Secure & Certified</h4>
                <p className="text-xs text-[#8a96aa] mt-0.5">
                  PCI-DSS certified encryption, verified purchases, and 30-day free returns.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-[#0f121b] border border-[#1e2333] p-4 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-[#171d2b] text-[#60a5fa] flex items-center justify-center shrink-0 border border-[#20314f]">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Worldwide Delivery</h4>
                <p className="text-xs text-[#8a96aa] mt-0.5">
                  Ethically sourced fabrics printed locally to reduce delivery transit emissions.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Directory Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-10">
            <div>
              <h5 className="font-bold text-[#dfb15b] uppercase tracking-wider mb-3 text-[11px]">
                Explore Art
              </h5>
              <ul className="space-y-2 text-[#8a96aa]">
                <li 
                  onClick={handleNavigateToMarketplace}
                  className="hover:text-[#dfb15b] font-bold text-[#dfb15b] cursor-pointer flex items-center gap-1.5"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Shop Home (All Items)</span>
                </li>
                <li 
                  onClick={() => handleSelectCategory('t-shirt')}
                  className="hover:text-white cursor-pointer transition-colors"
                >
                  Graphic T-Shirts
                </li>
                <li 
                  onClick={() => handleSelectCategory('sticker')}
                  className="hover:text-white cursor-pointer transition-colors"
                >
                  Vinyl Stickers
                </li>
                <li 
                  onClick={() => handleSelectCategory('phone-case')}
                  className="hover:text-white cursor-pointer transition-colors"
                >
                  Phone Cases
                </li>
                <li 
                  onClick={() => handleSelectCategory('art-print')}
                  className="hover:text-white cursor-pointer transition-colors"
                >
                  Wall Art & Posters
                </li>
                <li 
                  onClick={() => handleSelectCategory('mug')}
                  className="hover:text-white cursor-pointer transition-colors"
                >
                  Ceramic Mugs
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-[#dfb15b] uppercase tracking-wider mb-3 text-[11px]">
                For Artists & Creators
              </h5>
              <ul className="space-y-2 text-[#8a96aa]">
                <li 
                  onClick={() => {
                    setActiveTab('studio');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="hover:text-[#dfb15b] font-semibold cursor-pointer text-[#d6dbe6]"
                >
                  Sell Your Art
                </li>
                <li 
                  onClick={() => {
                    setActiveTab('dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="hover:text-[#dfb15b] font-semibold cursor-pointer text-[#d6dbe6]"
                >
                  Real-time Earnings Dashboard
                </li>
                <li className="hover:text-white cursor-pointer transition-colors">Creator Guidelines</li>
                <li className="hover:text-white cursor-pointer transition-colors">Royalty Calculator</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-[#dfb15b] uppercase tracking-wider mb-3 text-[11px]">
                Customer Care
              </h5>
              <ul className="space-y-2 text-[#8a96aa]">
                <li className="hover:text-white cursor-pointer transition-colors">Delivery & Tracking</li>
                <li className="hover:text-white cursor-pointer transition-colors">Returns & Exchanges</li>
                <li className="hover:text-white cursor-pointer transition-colors">Contact Support</li>
                <li className="hover:text-white cursor-pointer transition-colors">Student Discounts</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-[#dfb15b] uppercase tracking-wider mb-3 text-[11px]">
                Connected Cloud
              </h5>
              <div className="space-y-2 text-[#8a96aa]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Google Cloud Firestore</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Firebase Cloud Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Firebase Authentication</span>
                </div>
                <p className="text-[11px] text-[#636f82] pt-2">
                  Featured design: "China girl" by artist Bamicash1
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#1b2030] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#636f82]">
            <div className="flex items-center gap-3">
              <MxLogo size="sm" showText={false} />
              <p>© 2026 mx gallery • Independent artist marketplace & creator studio.</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="hover:underline cursor-pointer hover:text-white">Privacy Policy</span>
              <span className="hover:underline cursor-pointer hover:text-white">Terms of Service</span>
              <span className="hover:underline cursor-pointer hover:text-white">Copyright & IP Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
