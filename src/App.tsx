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
  SlidersHorizontal
} from 'lucide-react';
import { useCurrency } from './context/CurrencyContext';

export type MarketplaceSortOption = 'newest' | 'popularity' | 'price-low' | 'price-high';

export default function App() {
  const [activeTab, setActiveTab] = useState<'product' | 'studio' | 'dashboard' | 'explore' | 'portfolio'>('explore');
  const [artworks, setArtworks] = useState<Artwork[]>(INITIAL_ARTWORKS);
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
          setArtworks(list);

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
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans text-slate-900 antialiased selection:bg-rose-500 selection:text-white">
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
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-xs shadow-2xs">
              <p className="text-slate-600">
                Found <strong>{filteredArtworks.length}</strong> designs matching "
                <strong className="text-slate-900">{searchQuery}</strong>"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-rose-600 font-bold hover:underline cursor-pointer"
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
              setArtworks((prev) => [newArt, ...prev]);
              setCurrentArtwork(newArt);
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

        {/* View Switcher: Explore / Marketplace Gallery */}
        {activeTab === 'explore' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Independent Artist Marketplace</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Explore Creator Designs
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Every purchase directly funds independent artists with custom profit margins.
                </p>
              </div>

              {/* Quick Filter Tags including Art & Design and China girl */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="marketplace-filter-art-design"
                  type="button"
                  onClick={() => handleFilterByGenre('Art & Design')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    searchQuery.toLowerCase() === 'art & design'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  🎨 Art & Design
                </button>
                <button
                  id="marketplace-filter-china-girl"
                  type="button"
                  onClick={() => handleFilterByGenre('China girl')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    searchQuery.toLowerCase() === 'china girl'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                  }`}
                >
                  ✨ China girl
                </button>
                <span className="text-xs font-semibold text-slate-500 ml-1">
                  {sortedArtworks.length} {sortedArtworks.length === 1 ? 'artwork' : 'artworks'}
                </span>
              </div>
            </div>

            {/* Category Filter Pills in Explore */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 whitespace-nowrap">
              <button
                id="explore-category-all"
                type="button"
                onClick={() => handleSelectCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-rose-500" />
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-rose-600 text-white font-bold shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {prod.displayName}
                  </button>
                );
              })}
            </div>

            {/* Marketplace Gallery Control & Sort Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>
                  Showing <strong className="font-bold text-slate-900">{sortedArtworks.length}</strong> {sortedArtworks.length === 1 ? 'artwork' : 'artworks'}
                </span>
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <span>Category:</span>
                    <strong className="font-bold">{PRODUCT_CATALOG.find((p) => p.category === selectedCategory)?.displayName || selectedCategory}</strong>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <span>Filter:</span>
                    <strong className="font-bold">"{searchQuery}"</strong>
                  </span>
                )}
              </div>

              {/* Sort Filter Dropdown */}
              <div className="flex items-center gap-2 self-start sm:self-auto" id="marketplace-sort-dropdown">
                <label 
                  htmlFor="marketplace-sort-select" 
                  className="text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sort by:</span>
                </label>
                <div className="relative">
                  <select
                    id="marketplace-sort-select"
                    value={marketplaceSort}
                    onChange={(e) => setMarketplaceSort(e.target.value as MarketplaceSortOption)}
                    className="appearance-none bg-white text-slate-800 text-xs font-bold pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer transition-all"
                  >
                    <option value="newest">Newest</option>
                    <option value="popularity">Popularity</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Artwork Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedArtworks.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 p-8">
                  <Palette className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">No artworks found</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Try clearing your search query or selecting another category.
                  </p>
                  <button
                    type="button"
                    onClick={handleNavigateToMarketplace}
                    className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    Reset Filters & View All
                  </button>
                </div>
              ) : (
                sortedArtworks.map((art) => {
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
                      key={art.id}
                      id={`explore-card-${art.id}`}
                      onClick={() => handleSelectArtwork(art)}
                      className={`group bg-white rounded-3xl border overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col ${
                        isChinaGirl
                          ? 'border-rose-300 ring-2 ring-rose-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="aspect-square bg-slate-50 p-6 flex items-center justify-center overflow-hidden relative">
                        {isChinaGirl && (
                          <div className="absolute top-3 left-3 z-10 bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
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
                      <div className="p-5 border-t border-slate-100 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span>{art.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-medium">❤️ {art.likesCount}</span>
                              <span className="font-semibold text-emerald-600">+{art.creatorMarginPercent}% margin</span>
                            </div>
                          </div>
                          <h3 className="font-black text-base text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1">
                            {art.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <span>by</span>
                            <button
                              id={`explore-card-artist-${art.id}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCreatorByName(art.creatorName, art.creatorId);
                              }}
                              className="font-bold text-slate-900 hover:text-rose-600 hover:underline cursor-pointer inline-flex items-center gap-1 transition-colors group/artistlink"
                              title={`View ${art.creatorName}'s Artist Portfolio & all works`}
                            >
                              <span>{art.creatorName}</span>
                              <Palette className="w-3 h-3 text-rose-500 opacity-60 group-hover/artistlink:opacity-100 transition-opacity" />
                            </button>
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                              {selectedCategory === 'all' ? 'From' : PRODUCT_CATALOG.find((p) => p.category === selectedCategory)?.displayName || 'Format'}
                            </span>
                            <span className="font-black text-lg text-slate-900">
                              {formatPrice(Number(activePrice))}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-rose-600 group-hover:bg-rose-600 group-hover:text-white bg-rose-50 px-3 py-1.5 rounded-xl transition-colors">
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
      <footer className="bg-white border-t border-slate-200 mt-16 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Trust Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-10 border-b border-slate-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Empowering Artists</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Over millions paid directly to independent creators around the world.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Secure & Certified</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  PCI-DSS certified encryption, verified purchases, and 30-day free returns.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Worldwide Delivery</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ethically sourced fabrics printed locally to reduce delivery transit emissions.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Directory Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-10">
            <div>
              <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-3 text-[11px]">
                Explore Art
              </h5>
              <ul className="space-y-2 text-slate-500">
                <li 
                  onClick={handleNavigateToMarketplace}
                  className="hover:text-rose-600 font-bold text-rose-600 cursor-pointer flex items-center gap-1.5"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Shop Home (All Items)</span>
                </li>
                <li 
                  onClick={() => handleSelectCategory('t-shirt')}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  Graphic T-Shirts
                </li>
                <li 
                  onClick={() => handleSelectCategory('sticker')}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  Vinyl Stickers
                </li>
                <li 
                  onClick={() => handleSelectCategory('phone-case')}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  Phone Cases
                </li>
                <li 
                  onClick={() => handleSelectCategory('art-print')}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  Wall Art & Posters
                </li>
                <li 
                  onClick={() => handleSelectCategory('mug')}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  Ceramic Mugs
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-3 text-[11px]">
                For Artists & Creators
              </h5>
              <ul className="space-y-2 text-slate-500">
                <li 
                  onClick={() => {
                    setActiveTab('studio');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="hover:text-rose-600 font-semibold cursor-pointer text-slate-900"
                >
                  Sell Your Art
                </li>
                <li 
                  onClick={() => {
                    setActiveTab('dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="hover:text-rose-600 font-semibold cursor-pointer text-slate-900"
                >
                  Real-time Earnings Dashboard
                </li>
                <li className="hover:text-slate-900 cursor-pointer">Creator Guidelines</li>
                <li className="hover:text-slate-900 cursor-pointer">Royalty Calculator</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-3 text-[11px]">
                Customer Care
              </h5>
              <ul className="space-y-2 text-slate-500">
                <li className="hover:text-slate-900 cursor-pointer">Delivery & Tracking</li>
                <li className="hover:text-slate-900 cursor-pointer">Returns & Exchanges</li>
                <li className="hover:text-slate-900 cursor-pointer">Contact Support</li>
                <li className="hover:text-slate-900 cursor-pointer">Student Discounts</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-3 text-[11px]">
                Connected Cloud
              </h5>
              <div className="space-y-2 text-slate-500">
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
                <p className="text-[11px] text-slate-400 pt-2">
                  Featured design: "China girl" by artist Bamicash1
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <MxLogo size="sm" showText={false} />
              <p>© 2026 MX Gallery • Independent artist marketplace & creator studio.</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="hover:underline cursor-pointer">Privacy Policy</span>
              <span className="hover:underline cursor-pointer">Terms of Service</span>
              <span className="hover:underline cursor-pointer">Copyright & IP Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
