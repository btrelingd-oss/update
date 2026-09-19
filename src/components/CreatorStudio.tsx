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
  Home,
  RefreshCw,
  Zap,
  ShieldCheck,
  Cloud
} from 'lucide-react';
import { Artwork, CreatorProfile, ProductCategory, ProductColor } from '../types';
import { PRODUCT_CATALOG, PRODUCT_COLORS, CHINA_GIRL_ARTWORK_SVG, CYBER_NEON_ARTWORK_SVG, DRAGON_INK_ARTWORK_SVG } from '../lib/seedData';
import { MockupRenderer } from './MockupRenderer';
import { uploadArtworkAsset, optimizeArtworkImage } from '../lib/firebase';
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
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileDetails, setFileDetails] = useState<{
    originalSize: number;
    optimizedSize: number;
    width: number;
    height: number;
  } | null>(null);
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

  // Publishing & Progress State
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStepMessage, setUploadStepMessage] = useState('');
  const [publishedArtwork, setPublishedArtwork] = useState<Artwork | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

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

  // Handle file drop & select with instant high-res optimization
  const handleFileSelection = async (file: File) => {
    if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.svg')) {
      setErrorMessage('Please select a valid artwork file (PNG, JPG, SVG, WebP).');
      return;
    }
    setErrorMessage('');
    setSelectedFile(file);
    setIsProcessingFile(true);

    try {
      const optimized = await optimizeArtworkImage(file);
      setPreviewUrl(optimized.dataUrl);
      setFileDetails({
        originalSize: optimized.originalSize,
        optimizedSize: optimized.optimizedSize,
        width: optimized.width,
        height: optimized.height,
      });

      if (!title) {
        // Auto-generate a clean, human-readable title from the filename
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    } catch (err) {
      console.warn('Direct file preview fallback:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
        if (!title) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingFile(false);
    }
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
    setFileDetails(null);
    setErrorMessage('');
  };

  // Publish to Firebase Cloud Storage & Firestore
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please provide a title for your artwork.');
      return;
    }
    if (!previewUrl) {
      setErrorMessage('Please choose or upload artwork before publishing.');
      return;
    }

    setIsPublishing(true);
    setErrorMessage('');
    setUploadProgress(15);
    setUploadStepMessage('Preparing artwork print resolution...');

    try {
      let finalImageUrl = previewUrl;
      let storagePath: string | undefined;

      // If a real local file was chosen, upload to Firebase Cloud Storage
      if (selectedFile) {
        setUploadStepMessage('Uploading asset to Firebase Cloud Storage...');
        const uploadResult = await uploadArtworkAsset(
          selectedFile,
          creator.id,
          (percent, stepText) => {
            setUploadProgress(Math.max(15, Math.min(85, percent)));
            if (stepText) setUploadStepMessage(stepText);
          }
        );
        finalImageUrl = uploadResult.url;
        storagePath = uploadResult.storagePath;
      } else {
        setUploadProgress(70);
      }

      setUploadProgress(85);
      setUploadStepMessage('Registering merchandise catalog in Firestore...');

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
        description: description.trim() || `Original design by ${creator.name}. Formatted and printed on championship quality merchandise.`,
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

      // Save into Firestore with local storage cache fallback
      try {
        await setDoc(doc(db, 'artworks', artworkId), newArtwork);
      } catch (firestoreErr) {
        console.warn('Firestore direct write warning; caching locally:', firestoreErr);
      }

      // Always update local persistent cache so user's work is instantly visible
      try {
        const cached = JSON.parse(localStorage.getItem('mx_custom_artworks') || '[]');
        const updated = [newArtwork, ...cached.filter((a: Artwork) => a.id !== artworkId)];
        localStorage.setItem('mx_custom_artworks', JSON.stringify(updated.slice(0, 50)));
      } catch (storageErr) {
        console.warn('Local storage cache note:', storageErr);
      }

      setUploadProgress(100);
      setUploadStepMessage('Artwork published! Returning to Shop Home automatically...');

      setPublishedArtwork(newArtwork);

      // Immediately return back to Shop Home automatically
      setTimeout(() => {
        onArtworkPublished(newArtwork);
      }, 500);
    } catch (err: any) {
      console.error('Publishing error:', err);
      const errDetail = err?.message || 'Network communication error';
      setErrorMessage(`Publishing issue (${errDetail}). Please verify details and try again.`);
    } finally {
      setIsPublishing(false);
    }
  };

  // Calculate profit breakdown for display
  const baseTeePrice = 19.99;
  const teeProfit = Number(((baseTeePrice * creatorMarginPercent) / 100).toFixed(2));
  const teeRetail = Number((baseTeePrice + teeProfit).toFixed(2));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Back to Shop Home Navigation */}
      <div className="flex items-center justify-between">
        <button
          id="studio-back-to-shop-home-btn"
          type="button"
          onClick={onNavigateToHome}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#d6dbe6] hover:text-[#dfb15b] bg-[#121520] hover:bg-[#1a1f30] border border-[#212638] px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Home className="w-4 h-4 text-[#dfb15b]" />
          <span>← Back to Shop Home</span>
        </button>
        <div className="flex items-center gap-2 text-xs text-[#8c97aa]">
          <Cloud className="w-3.5 h-3.5 text-[#dfb15b]" />
          <span>Firebase Cloud Storage & Firestore Sync</span>
        </div>
      </div>

      {/* Studio Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#121520] via-[#161a28] to-[#1f1722] rounded-3xl p-6 sm:p-8 border border-[#242b3d] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EB212B]/15 text-[#ff5f68] border border-[#EB212B]/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#EB212B]" />
            <span>Creator Studio & Asset Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sell Your Art on 60+ Products
          </h1>
          <p className="text-[#9ca6b8] text-xs sm:text-sm leading-relaxed">
            Upload your original illustrations, anime art, vectors, or graphics. We automatically optimize your print resolution, sync with Firebase Cloud Storage & Firestore, and generate instant mockups with customized creator royalties.
          </p>
        </div>

        {/* Creator Mini Profile Badge */}
        <div className="flex items-center gap-3.5 bg-[#0c0e15]/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-[#212638] shrink-0 relative z-10">
          <img
            src={creator.avatar}
            alt={creator.name}
            className="w-12 h-12 rounded-xl object-cover border-2 border-[#dfb15b]/60"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-white">{creator.name}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]" />
            </div>
            <p className="text-xs text-[#8c97aa]">{creator.location}</p>
            <p className="text-[11px] font-bold text-[#4ade80] mt-0.5">
              Available Balance: {formatPrice(creator.availableBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal / Banner when published */}
      {publishedArtwork && (
        <div className="bg-[#0e2118] border-2 border-[#235839] rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in zoom-in-95 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1d7044] text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                "{publishedArtwork.title}" is now LIVE on the Marketplace!
              </h3>
              <p className="text-xs text-[#a3c9b3] mt-0.5">
                Stored in Firebase Cloud Storage & Firestore catalog. Ready for customer orders with {formatPrice(Number(teeProfit))} royalty per t-shirt.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => onViewProduct(publishedArtwork)}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#dfb15b] hover:bg-[#f0c26c] text-[#0b0c12] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <span>View Live Product Page</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setPublishedArtwork(null);
                setTitle('');
                setDescription('');
                setSelectedFile(null);
                setFileDetails(null);
              }}
              className="px-4 py-2.5 bg-[#162920] border border-[#2b593f] text-[#d6e5dc] rounded-xl text-xs font-bold hover:bg-[#1f382c] cursor-pointer"
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
          <div className="bg-[#121520] border border-[#212638] rounded-3xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#EB212B]" />
                <span>1. Upload High-Quality Artwork File</span>
              </h3>
              <span className="text-xs text-[#8c97aa]">PNG, SVG, JPG, WebP up to 25MB</span>
            </div>

            {/* Dropzone Container */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all flex flex-col items-center justify-center relative overflow-hidden ${
                isDragging
                  ? 'border-[#dfb15b] bg-[#dfb15b]/10 scale-[1.01]'
                  : 'border-[#293147] hover:border-[#dfb15b]/60 bg-[#0c0e15]/80'
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

              {isProcessingFile ? (
                <div className="py-6 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-2 border-[#dfb15b] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-[#dfb15b] font-bold">Optimizing artwork resolution for apparel printing...</p>
                </div>
              ) : selectedFile ? (
                <div className="flex flex-col items-center py-2">
                  <div className="w-20 h-20 rounded-2xl bg-[#161a28] p-2 border border-[#2d364e] mb-3 flex items-center justify-center overflow-hidden shadow-inner">
                    <img
                      src={previewUrl}
                      alt="Uploaded artwork preview"
                      className="max-h-full max-w-full object-contain drop-shadow-md"
                    />
                  </div>
                  <p className="text-sm font-bold text-white max-w-md truncate">
                    {selectedFile.name}
                  </p>
                  {fileDetails && (
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#182a20] border border-[#2b593f] text-[#4ade80] text-[11px] font-bold inline-flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        <span>Print Ready ({fileDetails.width} × {fileDetails.height}px)</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#181c2b] border border-[#262c3e] text-[#a0abbd] text-[11px]">
                        {(fileDetails.originalSize / (1024 * 1024)).toFixed(2)}MB original → {(fileDetails.optimizedSize / 1024).toFixed(0)}KB optimized
                      </span>
                    </div>
                  )}
                  <p className="text-[11px] text-[#8c97aa] mt-2">
                    Click or drag another file to replace
                  </p>
                </div>
              ) : (
                <div className="py-3 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#161a28] border border-[#262c3e] flex items-center justify-center text-[#EB212B] mb-3 shadow-inner">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-white">
                    Click to browse artwork or drag & drop file here
                  </p>
                  <p className="text-xs text-[#8c97aa] mt-1 max-w-sm">
                    Transparent PNG, high-res JPEG, or vector SVG. We automatically optimize dimensions and store high-res assets in Firebase.
                  </p>
                </div>
              )}
            </div>

            {/* Preset Samples Bar */}
            <div className="mt-4 pt-4 border-t border-[#1d2335]">
              <p className="text-xs font-semibold text-[#8c97aa] mb-2">
                Or test immediately with an artist template:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handlePickPreset(CHINA_GIRL_ARTWORK_SVG, 'China girl (Deluxe Edition)', 'china girl, asian art, retro anime, oriental, streetwear')}
                  className="px-3 py-1.5 rounded-xl border border-[#262c3e] bg-[#0c0e15] hover:border-[#dfb15b] text-xs font-bold text-[#d6dbe6] hover:text-[#dfb15b] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-[#EB212B]" />
                  <span>China girl</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePickPreset(CYBER_NEON_ARTWORK_SVG, 'Tokyo 2099 Neon Grid', 'cyberpunk, tokyo, synthwave, neon, sci-fi')}
                  className="px-3 py-1.5 rounded-xl border border-[#262c3e] bg-[#0c0e15] hover:border-[#dfb15b] text-xs font-bold text-[#d6dbe6] hover:text-[#dfb15b] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Tokyo Neon 2099</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePickPreset(DRAGON_INK_ARTWORK_SVG, 'Dragon Ink Sumi-e', 'dragon, ink wash, sumi-e, calligraphy, japanese')}
                  className="px-3 py-1.5 rounded-xl border border-[#262c3e] bg-[#0c0e15] hover:border-[#dfb15b] text-xs font-bold text-[#d6dbe6] hover:text-[#dfb15b] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Dragon Ink</span>
                </button>
              </div>
            </div>
          </div>

          {/* Artwork Metadata Form */}
          <form onSubmit={handlePublish} className="bg-[#121520] border border-[#212638] rounded-3xl p-6 shadow-md space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#dfb15b]" />
              <span>2. Artwork Title & Marketplace Details</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#d6dbe6] uppercase tracking-wider mb-1.5">
                Artwork Title *
              </label>
              <input
                id="studio-artwork-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. China girl"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c0e15] border border-[#252b3d] text-sm text-white placeholder:text-[#6a7587] focus:outline-hidden focus:border-[#dfb15b] focus:ring-1 focus:ring-[#dfb15b]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#d6dbe6] uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  id="studio-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0c0e15] border border-[#252b3d] text-sm text-white focus:outline-hidden focus:border-[#dfb15b]"
                >
                  <option className="bg-[#0c0e15]">Illustration & Graphic Art</option>
                  <option className="bg-[#0c0e15]">Digital Art & Vectors</option>
                  <option className="bg-[#0c0e15]">Painting & Mixed Media</option>
                  <option className="bg-[#0c0e15]">Typography & Lettering</option>
                  <option className="bg-[#0c0e15]">Anime & Manga</option>
                  <option className="bg-[#0c0e15]">Minimalist & Line Art</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#d6dbe6] uppercase tracking-wider mb-1.5">
                  Tags (Comma separated)
                </label>
                <input
                  id="studio-tags-input"
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. china girl, streetwear, digital art"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0c0e15] border border-[#252b3d] text-sm text-white placeholder:text-[#6a7587] focus:outline-hidden focus:border-[#dfb15b]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#d6dbe6] uppercase tracking-wider mb-1.5">
                Artwork Description / Story
              </label>
              <textarea
                id="studio-description-textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your design inspiration, techniques used, and story..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c0e15] border border-[#252b3d] text-sm text-white placeholder:text-[#6a7587] focus:outline-hidden focus:border-[#dfb15b]"
              />
            </div>

            {/* Creator Markup & Margin Slider */}
            <div className="p-4 bg-[#0c0e15] rounded-2xl border border-[#252b3d] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#4ade80]" />
                  <span>Artist Royalty Margin: {creatorMarginPercent}%</span>
                </label>
                <span className="text-xs font-bold text-[#4ade80] bg-[#162920] border border-[#2b593f] px-2.5 py-0.5 rounded-md">
                  +{formatPrice(Number(teeProfit))} profit per T-shirt
                </span>
              </div>

              <input
                id="studio-margin-slider"
                type="range"
                min={10}
                max={50}
                step={1}
                value={creatorMarginPercent}
                onChange={(e) => setCreatorMarginPercent(Number(e.target.value))}
                className="w-full accent-[#dfb15b] cursor-pointer"
              />

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="bg-[#121520] p-2.5 rounded-xl border border-[#212638]">
                  <span className="text-[#8c97aa] block text-[10px]">T-Shirt Retail</span>
                  <strong className="text-white text-xs">{formatPrice(Number(teeRetail))}</strong>
                </div>
                <div className="bg-[#121520] p-2.5 rounded-xl border border-[#212638]">
                  <span className="text-[#8c97aa] block text-[10px]">Your Profit (Tee)</span>
                  <strong className="text-[#4ade80] text-xs">+{formatPrice(Number(teeProfit))}</strong>
                </div>
                <div className="bg-[#121520] p-2.5 rounded-xl border border-[#212638]">
                  <span className="text-[#8c97aa] block text-[10px]">Your Profit (Hoodie)</span>
                  <strong className="text-[#4ade80] text-xs">
                    +{formatPrice((42.5 * creatorMarginPercent) / 100)}
                  </strong>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#2b1418] border border-[#5c242c] text-[#ff8088] text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#EB212B]" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Dynamic Multi-Step Upload Progress Bar */}
            {isPublishing && (
              <div className="space-y-2 p-3 bg-[#0c0e15] rounded-xl border border-[#262c3e]">
                <div className="flex justify-between text-xs text-[#d6dbe6] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#dfb15b]" />
                    <span>{uploadStepMessage || 'Uploading to Firebase Cloud Storage & Firestore...'}</span>
                  </span>
                  <span className="text-[#dfb15b] font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-[#181c2b] h-2.5 rounded-full overflow-hidden border border-[#262c3e]">
                  <div
                    className="bg-gradient-to-r from-[#dfb15b] to-[#EB212B] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="publish-artwork-btn"
              type="submit"
              disabled={isPublishing || isProcessingFile}
              className="w-full py-4 px-6 rounded-2xl bg-[#EB212B] hover:bg-[#ff333e] disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-[#EB212B]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing to Catalog & Storage...</span>
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
          <div className="sticky top-24 bg-[#121520] border border-[#212638] rounded-3xl p-6 shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#dfb15b]" />
                  <span>Live Product Mockup Stager</span>
                </h3>
                <span className="text-[11px] text-[#8c97aa]">
                  {enabledProducts.length} of {PRODUCT_CATALOG.length} products enabled
                </span>
              </div>

              {/* Add to All Products Action Button */}
              <button
                type="button"
                id="studio-add-all-products-btn"
                onClick={handleApplyToAllProducts}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#EB212B] to-[#b0141d] hover:from-[#ff3b45] hover:to-[#c41822] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Add to All Products</span>
              </button>
            </div>

            {/* Notification Banner when applied to all products */}
            {appliedAllNotice && (
              <div className="p-3 bg-[#132b1e] border border-[#235839] rounded-2xl flex items-center gap-2.5 text-xs text-[#4ade80] animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0" />
                <span>
                  <strong>Success!</strong> Artwork enabled and synchronized across all {PRODUCT_CATALOG.length} products.
                </span>
              </div>
            )}

            {/* View Mode Switcher: Single vs All Products Matrix */}
            <div className="flex items-center justify-between bg-[#0c0e15] p-1 rounded-2xl border border-[#212638]">
              <button
                type="button"
                onClick={() => setStagedViewMode('single')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  stagedViewMode === 'single'
                    ? 'bg-[#dfb15b] text-[#0b0c12] shadow-sm'
                    : 'text-[#8c97aa] hover:text-white'
                }`}
              >
                Single Focus
              </button>
              <button
                type="button"
                onClick={() => setStagedViewMode('grid')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  stagedViewMode === 'grid'
                    ? 'bg-[#dfb15b] text-[#0b0c12] shadow-sm'
                    : 'text-[#8c97aa] hover:text-white'
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        stagedProduct === prod.category
                          ? 'bg-white text-[#0b0c12] shadow-xs'
                          : 'bg-[#181c2b] text-[#8c97aa] hover:text-white hover:bg-[#202538] border border-[#262c3e]'
                      }`}
                    >
                      {prod.displayName.replace('Classic ', '')}
                    </button>
                  ))}
                </div>

                {/* Render Stage Preview */}
                <div className="border border-[#262c3e] rounded-2xl overflow-hidden bg-[#0c0e15] flex items-center justify-center p-4">
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
                    <span className="font-bold text-[#d6dbe6] flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-[#dfb15b]" />
                      Print Scale: {Math.round(scale * 100)}%
                    </span>
                    <input
                      type="range"
                      min={0.6}
                      max={1.4}
                      step={0.05}
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="w-36 accent-[#dfb15b] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#d6dbe6]">Vertical Offset</span>
                    <input
                      type="range"
                      min={-30}
                      max={30}
                      step={2}
                      value={offsetY}
                      onChange={(e) => setOffsetY(Number(e.target.value))}
                      className="w-36 accent-[#dfb15b] cursor-pointer"
                    />
                  </div>

                  {/* Garment Color Swatches */}
                  <div className="pt-2">
                    <span className="block text-xs font-bold text-[#d6dbe6] uppercase tracking-wider mb-2">
                      Preview on Garment Color:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {PRODUCT_COLORS.slice(0, 6).map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => setStagedColor(c)}
                          className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                            stagedColor.id === c.id
                              ? 'border-[#dfb15b] ring-2 ring-[#dfb15b]/40 scale-110'
                              : 'border-[#2d364e]'
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
                            ? 'border-[#262c3e] bg-[#0c0e15]'
                            : 'border-dashed border-[#202537] bg-[#0c0e15]/40 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white truncate">
                            {prod.displayName.replace('Classic ', '')}
                          </span>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => toggleProductEnabled(prod.category)}
                            className="w-4 h-4 accent-[#EB212B] cursor-pointer"
                            title="Enable or disable on this product"
                          />
                        </div>

                        <div className="h-32 bg-[#121520] rounded-xl overflow-hidden flex items-center justify-center p-2 mb-2 border border-[#1f2538]">
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
                          <span className="font-bold text-white">{formatPrice(Number(prodRetail))}</span>
                          <span className="text-[#4ade80] font-semibold bg-[#162920] px-1.5 py-0.5 rounded-sm">
                            +{formatPrice(Number(prodProfit))}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setStagedProduct(prod.category);
                            setStagedViewMode('single');
                          }}
                          className="w-full py-1 text-[11px] font-bold text-[#8c97aa] hover:text-white hover:bg-[#181c2b] rounded-lg transition-colors border border-[#212638] cursor-pointer"
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
