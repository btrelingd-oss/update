import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Trash2, 
  Check, 
  AlertTriangle, 
  Loader2, 
  Percent, 
  Layers, 
  Tag, 
  FileText,
  Sliders
} from 'lucide-react';
import { Artwork, ProductCategory } from '../types';
import { PRODUCT_CATALOG } from '../lib/seedData';
import { useCurrency } from '../context/CurrencyContext';

interface EditArtworkModalProps {
  artwork: Artwork;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedArtwork: Artwork) => Promise<void> | void;
  onDelete?: (artworkId: string) => Promise<void> | void;
}

export const EditArtworkModal: React.FC<EditArtworkModalProps> = ({
  artwork,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const { formatPrice } = useCurrency();

  const [title, setTitle] = useState(artwork.title);
  const [description, setDescription] = useState(artwork.description);
  const [category, setCategory] = useState(artwork.category || 'Illustration & Graphic Art');
  const [tagsInput, setTagsInput] = useState(artwork.tags?.join(', ') || 'streetwear, graphic tee, original');
  const [creatorMarginPercent, setCreatorMarginPercent] = useState<number>(artwork.creatorMarginPercent || 20);
  const [defaultCategory, setDefaultCategory] = useState<ProductCategory>(artwork.defaultCategory || 't-shirt');
  const [enabledProducts, setEnabledProducts] = useState<ProductCategory[]>(
    artwork.enabledProducts && artwork.enabledProducts.length > 0
      ? artwork.enabledProducts
      : PRODUCT_CATALOG.map((p) => p.category)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const toggleProduct = (cat: ProductCategory) => {
    setEnabledProducts((prev) => {
      if (prev.includes(cat)) {
        if (prev.length <= 1) return prev; // Keep at least one format
        return prev.filter((c) => c !== cat);
      }
      return [...prev, cat];
    });
  };

  const handleSelectAllProducts = () => {
    setEnabledProducts(PRODUCT_CATALOG.map((p) => p.category));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Artwork title is required.' });
      return;
    }

    setIsSaving(true);
    setFeedbackMsg(null);

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const updated: Artwork = {
      ...artwork,
      title: title.trim(),
      description: description.trim(),
      category,
      tags: parsedTags.length > 0 ? parsedTags : ['original'],
      creatorMarginPercent: Math.max(5, Math.min(100, Number(creatorMarginPercent))),
      defaultCategory,
      enabledProducts,
    };

    try {
      await onSave(updated);
      setFeedbackMsg({ type: 'success', text: 'Project updated successfully!' });
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to save changes.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(artwork.id);
      onClose();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to delete project.' });
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Profit calculation preview
  const estimatedProfit = (19.99 * (creatorMarginPercent / 100)).toFixed(2);
  const retailPrice = (19.99 * (1 + creatorMarginPercent / 100)).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="edit-artwork-modal"
        className="bg-[#121520] border border-[#252c40] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl text-white relative my-auto max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f2638] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a1f30] border border-[#2c354f] flex items-center justify-center shrink-0 overflow-hidden">
              <img src={artwork.imageUrl} alt={artwork.title} className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#dfb15b] uppercase tracking-wider">Project Management</span>
                <span className="text-[10px] text-[#6b778d]">• ID: {artwork.id.slice(0, 10)}</span>
              </div>
              <h2 className="text-lg font-black text-white truncate max-w-xs sm:max-w-md">
                Edit "{artwork.title}"
              </h2>
            </div>
          </div>

          <button
            type="button"
            id="close-edit-artwork-modal-btn"
            onClick={onClose}
            className="p-2 text-[#7d8aa0] hover:text-white hover:bg-[#1a1f30] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <div 
            className={`mt-4 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              feedbackMsg.type === 'success' 
                ? 'bg-emerald-950/70 border border-emerald-700 text-emerald-300'
                : 'bg-rose-950/70 border border-rose-700 text-rose-300'
            }`}
          >
            {feedbackMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm ? (
          <div className="py-8 px-4 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Permanently Delete this Artwork Project?</h3>
              <p className="text-xs text-[#9aa7bc] max-w-md mx-auto mt-1 leading-relaxed">
                Are you sure you want to remove <strong className="text-white">"{artwork.title}"</strong> from the marketplace? 
                This design will no longer be available for sale across all mockups and products.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl border border-[#2b344c] bg-[#161b29] hover:bg-[#20273b] text-white text-xs font-bold transition-all cursor-pointer"
              >
                Cancel, Keep Project
              </button>
              <button
                type="button"
                id="confirm-delete-artwork-btn"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-rose-900/30 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Edit Form */
          <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-4 py-4 flex-1">
            {/* Title & Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 space-y-1.5">
                <label className="text-xs font-bold text-[#b5c1d4] uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#dfb15b]" />
                  <span>Project Title</span>
                </label>
                <input
                  type="text"
                  id="edit-artwork-title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. China girl, Cyber Samurai"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#0d1018] border border-[#242c40] rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-[#dfb15b] transition-colors"
                />
              </div>

              <div className="sm:col-span-5 space-y-1.5">
                <label className="text-xs font-bold text-[#b5c1d4] uppercase tracking-wide flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#dfb15b]" />
                  <span>Category</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0d1018] border border-[#242c40] rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-[#dfb15b] transition-colors cursor-pointer"
                >
                  <option value="Illustration & Graphic Art">Illustration & Graphic Art</option>
                  <option value="Anime & Manga">Anime & Manga</option>
                  <option value="Typography & Quotes">Typography & Quotes</option>
                  <option value="Digital Painting">Digital Painting</option>
                  <option value="Streetwear & Modern">Streetwear & Modern</option>
                  <option value="Vintage & Retro">Vintage & Retro</option>
                  <option value="Abstract & Patterns">Abstract & Patterns</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#b5c1d4] uppercase tracking-wide">
                Artwork Description / Story
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the inspiration, style, and concept behind this design..."
                className="w-full px-3.5 py-2.5 bg-[#0d1018] border border-[#242c40] rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-[#dfb15b] transition-colors resize-none"
              />
            </div>

            {/* Tags Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#b5c1d4] uppercase tracking-wide flex items-center justify-between">
                <span>Search Keywords / Tags (comma separated)</span>
                <span className="text-[10px] text-[#6b778d]">Helps buyers discover your project</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="streetwear, asian, portrait, vector, anime"
                className="w-full px-3.5 py-2.5 bg-[#0d1018] border border-[#242c40] rounded-xl text-xs text-white focus:outline-hidden focus:border-[#dfb15b] transition-colors"
              />
            </div>

            {/* Creator Profit Margin Slider Box */}
            <div className="bg-[#0b0e16] border border-[#20273b] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#dfb15b]/20 flex items-center justify-center text-[#dfb15b]">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Creator Royalty Share</h4>
                    <p className="text-[11px] text-[#7d8aa0]">Set your desired profit margin per sale</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-[#dfb15b]">+{creatorMarginPercent}%</span>
                  <span className="text-[11px] text-emerald-400 block font-bold">
                    +{formatPrice(Number(estimatedProfit))} profit / tee
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <input
                  type="range"
                  min="5"
                  max="70"
                  step="1"
                  value={creatorMarginPercent}
                  onChange={(e) => setCreatorMarginPercent(Number(e.target.value))}
                  className="w-full accent-[#dfb15b] cursor-pointer h-2 bg-[#1b2133] rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-[#677388] font-bold">
                  <span>5% (Budget)</span>
                  <span>20% (Recommended)</span>
                  <span>40% (Premium)</span>
                  <span>70% (Luxury)</span>
                </div>
              </div>

              <div className="bg-[#121623] rounded-xl p-2.5 text-[11px] flex items-center justify-between text-[#8a96aa] border border-[#1b2133]">
                <span>Buyer Retail Price for Classic T-Shirt:</span>
                <span className="font-bold text-white text-xs">{formatPrice(Number(retailPrice))}</span>
              </div>
            </div>

            {/* Default Product Format & Enabled Merch Styles */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#b5c1d4] uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#dfb15b]" />
                  <span>Available Merchandise Formats</span>
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllProducts}
                  className="text-[11px] font-bold text-[#dfb15b] hover:underline cursor-pointer"
                >
                  Enable All 7 Formats
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRODUCT_CATALOG.map((prod) => {
                  const isEnabled = enabledProducts.includes(prod.category);
                  const isDefault = defaultCategory === prod.category;
                  return (
                    <div
                      key={prod.category}
                      className={`p-2 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                        isEnabled
                          ? 'bg-[#141926] border-[#29344f] text-white'
                          : 'bg-[#0b0e14] border-[#181d2c] text-[#556073] opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <label className="flex items-center gap-1.5 cursor-pointer font-semibold truncate">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => toggleProduct(prod.category)}
                            className="accent-[#dfb15b] rounded-sm w-3.5 h-3.5"
                          />
                          <span className="truncate">{prod.displayName}</span>
                        </label>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#1e2538] text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isEnabled) toggleProduct(prod.category);
                            setDefaultCategory(prod.category);
                          }}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                            isDefault
                              ? 'bg-[#dfb15b] text-[#0b0c12]'
                              : 'text-[#8492a8] hover:text-white'
                          }`}
                        >
                          {isDefault ? 'Primary' : 'Set Primary'}
                        </button>
                        <span className="font-semibold text-[#768399]">
                          {formatPrice(prod.basePrice * (1 + creatorMarginPercent / 100))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-4 border-t border-[#1f2638] flex items-center justify-between gap-3">
              {onDelete ? (
                <button
                  type="button"
                  id="delete-artwork-trigger-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950 text-rose-400 hover:text-rose-300 border border-rose-900/60 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Project</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-[#141824] hover:bg-[#1d2334] text-[#8a96aa] hover:text-white text-xs font-bold border border-[#232a3d] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-artwork-changes-btn"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#dfb15b] hover:bg-[#ebd085] text-[#0b0c12] text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#0b0c12]" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
