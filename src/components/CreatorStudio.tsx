import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Sliders, 
  DollarSign, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Tag, 
  Eye, 
  ArrowRight,
  AlertCircle,
  FileCheck,
  Home
} from 'lucide-react';
import { Artwork, CreatorProfile, ProductCategory, ProductColor } from '../types';
import { PRODUCT_CATALOG, PRODUCT_COLORS, CHINA_GIRL_ARTWORK_SVG, CYBER_NEON_ARTWORK_SVG, DRAGON_INK_ARTWORK_SVG } from '../lib/seedData';
import { MockupRenderer } from './MockupRenderer';
import { uploadArtworkAsset } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCurrency } from '../context/CurrencyContext';

interface CreatorStudioProps {
  creator: CreatorProfile;
  onArtworkPublished: (newArtwork: Artwork) => void;
  onViewProduct: (artwork: Artwork) => void;
  onNavigateToHome?: () => void;
}

export const CreatorStudio: React.FC<CreatorStudioProps> = ({
  creator,
  onArtworkPublished,
  onViewProduct,
  onNavigateToHome,
}) => {
  // Upload & File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(CHINA_GIRL_ARTWORK_SVG);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { formatPrice } = useCurrency();

  // Artwork Listing Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Illustration & Graphic Art');
  const [tagsInput, setTagsInput] = useState('streetwear, graphic tee, digital art, original');
  const [creatorMarginPercent, setCreatorMarginPercent] = useState<number>(20);

  // Live Staging Controls
  const [stagedProduct, setStagedProduct] = useState<ProductCategory>('t-shirt');
  const [stagedColor, setStagedColor] = useState<ProductColor>(PRODUCT_COLORS[4]); // Classic Black
  const [scale, setScale] = useState<number>(1.0);
  const [offsetY, setOffsetY] = useState<number>(0);

  // Staging multi-product state & Add to All Products
  const [stagedViewMode, setStagedViewMode] = useState<'single' | 'grid'>('single');
  const [enabledProducts, setEnabledProducts] = useState<ProductCategory[]>(
    () => PRODUCT_CATALOG.map((p) => p.category)
  );
  const [appliedAllNotice, setAppliedAllNotice] = useState(false);

  const handleApplyToAllProducts = () => {
    setEnabledProducts(PRODUCT_CATALOG.map((p) => p.category));
    setAppliedAllNotice(true);
    setTimeout(() => setAppliedAllNotice(false), 3500);
  };

  const toggleProductEnabled = (cat: ProductCategory) => {
    setEnabledProducts((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Publishing & Progress State
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishedArtwork, setPublishedArtwork] = useState<Artwork | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle file drop & select
  const handleFileSelection = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    setErrorMessage('');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
      if (!title) {
        // Auto-generate title from filename
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  // Sample preset quick selector for testing
  const handlePickPreset = (presetSvg: string, presetTitle: string, defaultTags: string) => {
    setPreviewUrl(presetSvg);
    setTitle(presetTitle);
    setTagsInput(defaultTags);
    setSelectedFile(null);
    setErrorMessage('');
  };

  // Publish to Firebase Cloud Storage & Firestore
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please provide a title for your artwork.');
      return;
    }

    setIsPublishing(true);
    setErrorMessage('');
    setUploadProgress(10);

    try {
      let finalImageUrl = previewUrl;
      let storagePath: string | undefined;

      // If a real local file was chosen, upload to Firebase Cloud Storage
      if (selectedFile) {
        const uploadResult = await uploadArtworkAsset(
          selectedFile,
          creator.id,
          (percent) => setUploadProgress(Math.max(10, percent))
        );
        finalImageUrl = uploadResult.url;
        storagePath = uploadResult.storagePath;
      } else {
        setUploadProgress(80);
      }

      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const artworkId = `art-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      const newArtwork: Artwork = {
        id: artworkId,
        title: title.trim(),
        creatorId: creator.id,
        creatorName: creator.name,
        creatorAvatar: creator.avatar,
        description: description.trim() || `Original design by ${creator.name}. Printed on high quality merchandise.`,
        tags: parsedTags.length > 0 ? parsedTags : ['original', 'artisan', 'graphic'],
        category,
        imageUrl: finalImageUrl,
        storagePath,
        createdAt: Date.now(),
        basePrice: 19.99,
        creatorMarginPercent,
        salesCount: 0,
        viewsCount: 1,
        likesCount: 0,
        defaultCategory: stagedProduct,
        enabledProducts,
      };

      // Save into Firestore
      await setDoc(doc(db, 'artworks', artworkId), newArtwork);
      setUploadProgress(100);

      setPublishedArtwork(newArtwork);
      onArtworkPublished(newArtwork);
    } catch (err) {
      console.error('Publishing error:', err);
      setErrorMessage('Failed to publish artwork. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Calculate profit breakdown for display
  const baseTeePrice = 19.99;
  const teeProfit = Number(((baseTeePrice * creatorMarginPercent) / 100).toFixed(2));
  const teeRetail = Number((baseTeePrice + teeProfit).toFixed(2));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Back to Shop Home Navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          id="studio-back-to-shop-home-btn"
          type="button"
          onClick={onNavigateToHome}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-rose-600 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
        >
          <Home className="w-4 h-4 text-rose-500" />
          <span>← Back to Shop Home</span>
        </button>
        <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
          Independent Creator Studio
        </span>
      </div>

      {/* Studio Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Creator Studio & Asset Delivery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Upload & Sell Your Custom Artwork
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Upload high-resolution files. Our automated print engine formats your art across
            over 60+ products with customizable margins, instant previews, and real-time Firestore synchronization.
          </p>
        </div>

        {/* Creator Mini Profile Badge */}
        <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 shrink-0">
          <img
            src={creator.avatar}
            alt={creator.name}
            className="w-12 h-12 rounded-xl object-cover border border-rose-300/40"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-white">{creator.name}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-300">{creator.location}</p>
            <p className="text-[11px] font-semibold text-emerald-400 mt-0.5">
              Available Payout: {formatPrice(creator.availableBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal / Banner when published */}
      {publishedArtwork && (
        <div className="bg-emerald-50 border-2 border-emerald-500/30 rounded-3xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in zoom-in-95 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                "{publishedArtwork.title}" is now LIVE on the Marketplace!
              </h3>
              <p className="text-xs text-slate-600">
                Stored in Firebase Cloud Storage & Firestore. Ready for customer orders with {formatPrice(Number(teeProfit))} profit per t-shirt.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => onViewProduct(publishedArtwork)}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>View Product Page</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setPublishedArtwork(null);
                setTitle('');
                setDescription('');
              }}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Upload Another
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: File Upload & Metadata Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* File Drag-and-Drop Uploader Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-rose-600" />
                <span>1. Upload High-Quality Artwork File</span>
              </h3>
              <span className="text-xs text-slate-400">PNG, SVG, JPG up to 25MB</span>
            </div>

            {/* Dropzone Container */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-rose-500 bg-rose-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelection(e.target.files[0]);
                  }
                }}
              />

              <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-rose-600 mb-3">
                <ImageIcon className="w-7 h-7" />
              </div>

              <p className="text-sm font-bold text-slate-900">
                {selectedFile ? selectedFile.name : 'Click to upload or drag & drop artwork'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Transparent PNG or high-res vector SVG recommended for best apparel printing results.
              </p>

              {selectedFile && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB file ready</span>
                </div>
              )}
            </div>

            {/* Preset Samples Bar */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Or test immediately with an artist template:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handlePickPreset(CHINA_GIRL_ARTWORK_SVG, 'China girl (Deluxe Edition)', 'china girl, asian art, retro anime, oriental, streetwear')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-500 text-xs font-semibold text-slate-700 hover:text-rose-600 transition-colors flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  <span>China girl</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePickPreset(CYBER_NEON_ARTWORK_SVG, 'Tokyo 2099 Neon Grid', 'cyberpunk, tokyo, synthwave, neon, sci-fi')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-500 text-xs font-semibold text-slate-700 hover:text-rose-600 transition-colors flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span>Tokyo Neon 2099</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePickPreset(DRAGON_INK_ARTWORK_SVG, 'Dragon Ink Sumi-e', 'dragon, ink wash, sumi-e, calligraphy, japanese')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-500 text-xs font-semibold text-slate-700 hover:text-rose-600 transition-colors flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  <span>Dragon Ink</span>
                </button>
              </div>
            </div>
          </div>

          {/* Artwork Metadata Form */}
          <form onSubmit={handlePublish} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-rose-600" />
              <span>2. Artwork Title & Marketplace Details</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Artwork Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. China girl"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-hidden focus:border-rose-500"
                >
                  <option>Illustration & Graphic Art</option>
                  <option>Digital Art & Vectors</option>
                  <option>Painting & Mixed Media</option>
                  <option>Typography & Lettering</option>
                  <option>Anime & Manga</option>
                  <option>Minimalist & Line Art</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. china girl, asian art, streetwear"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Artwork Description / Story
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your design inspiration, techniques used, and story..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500"
              />
            </div>

            {/* Creator Markup & Margin Slider */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Artist Royalty Margin: {creatorMarginPercent}%</span>
                </label>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  +{formatPrice(Number(teeProfit))} profit per T-shirt
                </span>
              </div>

              <input
                type="range"
                min={10}
                max={50}
                step={1}
                value={creatorMarginPercent}
                onChange={(e) => setCreatorMarginPercent(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">T-Shirt Retail</span>
                  <strong className="text-slate-900">{formatPrice(Number(teeRetail))}</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Your Profit (Tee)</span>
                  <strong className="text-emerald-600">+{formatPrice(Number(teeProfit))}</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Your Profit (Hoodie)</span>
                  <strong className="text-emerald-600">
                    +{formatPrice((42.5 * creatorMarginPercent) / 100)}
                  </strong>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isPublishing && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600 font-semibold">
                  <span>Uploading to Firebase Cloud Storage & Firestore...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="publish-artwork-btn"
              type="submit"
              disabled={isPublishing}
              className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing to Catalog...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Publish & List on Marketplace</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Real-time Multi-Product Stager & Visualizer (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-28 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-rose-600" />
                  <span>Live Product Mockup Stager</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  {enabledProducts.length} of {PRODUCT_CATALOG.length} products enabled
                </span>
              </div>

              {/* Add to All Products Action Button */}
              <button
                type="button"
                id="studio-add-all-products-btn"
                onClick={handleApplyToAllProducts}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Add to All Products</span>
              </button>
            </div>

            {/* Notification Banner when applied to all products */}
            {appliedAllNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Success!</strong> Artwork enabled and synchronized across all {PRODUCT_CATALOG.length} products.
                </span>
              </div>
            )}

            {/* View Mode Switcher: Single vs All Products Matrix */}
            <div className="flex items-center justify-between bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setStagedViewMode('single')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  stagedViewMode === 'single'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Single Focus
              </button>
              <button
                type="button"
                onClick={() => setStagedViewMode('grid')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  stagedViewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Products Grid ({enabledProducts.length})</span>
              </button>
            </div>

            {stagedViewMode === 'single' ? (
              <>
                {/* Product Type Selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                  {PRODUCT_CATALOG.map((prod) => (
                    <button
                      type="button"
                      key={prod.category}
                      onClick={() => setStagedProduct(prod.category)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        stagedProduct === prod.category
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {prod.displayName.replace('Classic ', '')}
                    </button>
                  ))}
                </div>

                {/* Render Stage Preview */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center p-4">
                  <MockupRenderer
                    productType={stagedProduct}
                    color={stagedColor}
                    artworkUrl={previewUrl}
                    scale={scale}
                    offsetY={offsetY}
                    className="max-h-[380px]"
                  />
                </div>

                {/* Placement & Scale Sliders */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5" />
                      Print Scale: {Math.round(scale * 100)}%
                    </span>
                    <input
                      type="range"
                      min={0.6}
                      max={1.4}
                      step={0.05}
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="w-36 accent-rose-600"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Vertical Offset</span>
                    <input
                      type="range"
                      min={-30}
                      max={30}
                      step={2}
                      value={offsetY}
                      onChange={(e) => setOffsetY(Number(e.target.value))}
                      className="w-36 accent-rose-600"
                    />
                  </div>

                  {/* Garment Color Swatches */}
                  <div className="pt-2">
                    <span className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                      Preview on Garment Color:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {PRODUCT_COLORS.slice(0, 6).map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => setStagedColor(c)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${
                            stagedColor.id === c.id
                              ? 'border-rose-600 ring-2 ring-rose-500/30 scale-110'
                              : 'border-slate-300'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* All Products Grid View (All 7 Products Matrix) */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {PRODUCT_CATALOG.map((prod) => {
                    const isEnabled = enabledProducts.includes(prod.category);
                    const prodProfit = Number(((prod.basePrice * creatorMarginPercent) / 100).toFixed(2));
                    const prodRetail = Number((prod.basePrice + prodProfit).toFixed(2));

                    return (
                      <div
                        key={prod.category}
                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                          isEnabled
                            ? 'border-slate-200 bg-white shadow-2xs'
                            : 'border-dashed border-slate-200 bg-slate-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {prod.displayName.replace('Classic ', '')}
                          </span>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => toggleProductEnabled(prod.category)}
                            className="w-4 h-4 accent-rose-600 cursor-pointer"
                            title="Enable or disable on this product"
                          />
                        </div>

                        <div className="h-32 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-2 mb-2">
                          <MockupRenderer
                            productType={prod.category}
                            color={prod.colors[0]}
                            artworkUrl={previewUrl}
                            scale={scale}
                            offsetY={offsetY}
                            className="w-full h-full transform scale-90"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] mb-2">
                          <span className="font-bold text-slate-900">{formatPrice(Number(prodRetail))}</span>
                          <span className="text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                            +{formatPrice(Number(prodProfit))} profit
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setStagedProduct(prod.category);
                            setStagedViewMode('single');
                          }}
                          className="w-full py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                        >
                          Tune Placement
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
