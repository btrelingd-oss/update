import React, { useState, useRef } from 'react';
import { 
  User, 
  Camera, 
  Globe, 
  Instagram, 
  Twitter, 
  Youtube, 
  Palette, 
  Share2, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  Eye, 
  Save, 
  RefreshCw,
  UploadCloud,
  ShieldCheck,
  UserCheck,
  Landmark,
  Lock,
  Building2
} from 'lucide-react';
import { CreatorProfile, SocialLinks, BankDetails } from '../types';
import { uploadArtworkAsset } from '../lib/firebase';

interface ArtistProfileSectionProps {
  creator: CreatorProfile;
  onUpdateCreator: (updated: CreatorProfile) => Promise<void> | void;
  onViewProductPage: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
];

const BIO_TEMPLATES = [
  {
    label: 'Cyberpunk & Anime',
    text: 'Digital illustrator & visual concept designer specializing in contemporary Asian aesthetics, anime cyberpunk fusion, and streetwear graphic prints.',
  },
  {
    label: 'Botanical & Minimalist',
    text: 'Independent artist creating delicate watercolor botanicals, mindful floral geometries, and earth-toned minimalist art prints for modern homes.',
  },
  {
    label: 'Retro Graphic Pop',
    text: 'Graphic designer obsessed with 80s synthwave, bold retro typography, and vibrant pop art vector illustrations printed on premium garments.',
  },
];

export const ArtistProfileSection: React.FC<ArtistProfileSectionProps> = ({
  creator,
  onUpdateCreator,
  onViewProductPage,
}) => {
  // Form State
  const [name, setName] = useState(creator.name);
  const [username, setUsername] = useState(creator.username);
  const [location, setLocation] = useState(creator.location || 'Toronto, Canada');
  const [bio, setBio] = useState(creator.bio || '');
  const [avatar, setAvatar] = useState(creator.avatar);
  
  // Social links state
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: creator.socialLinks?.instagram || 'https://instagram.com/bamicash1.art',
    twitter: creator.socialLinks?.twitter || 'https://x.com/bamicash1',
    website: creator.socialLinks?.website || 'https://bamicash1.design',
    youtube: creator.socialLinks?.youtube || 'https://youtube.com/@bamicash1',
    tiktok: creator.socialLinks?.tiktok || '',
    behance: creator.socialLinks?.behance || 'https://behance.net/bamicash1',
  });

  // Bank Account & Direct Payout state
  const [bankName, setBankName] = useState(creator.bankDetails?.bankName || 'Commercial Bank of Ethiopia (CBE)');
  const [accountNumber, setAccountNumber] = useState(creator.bankDetails?.accountNumber || '1000293847561');
  const [accountHolder, setAccountHolder] = useState(creator.bankDetails?.accountHolderName || creator.name);
  const [swiftCode, setSwiftCode] = useState(creator.bankDetails?.swiftCode || 'CBETETAA');
  const [routingNumber, setRoutingNumber] = useState(creator.bankDetails?.routingNumber || 'CBEETAA');
  const [accountType, setAccountType] = useState<'checking' | 'savings'>(creator.bankDetails?.accountType || 'checking');
  const [bankCountry, setBankCountry] = useState(creator.bankDetails?.country || 'Ethiopia');

  // Upload & Save status state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo File Upload
  const handlePhotoSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file (PNG, JPEG, WebP, SVG).');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setErrorMessage(null);
      const res = await uploadArtworkAsset(file, creator.id);
      setAvatar(res.url);
    } catch (err) {
      console.warn('Photo upload fallback:', err);
      // Fallback: Read as data URL locally
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePhotoSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please provide an artist display name.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const updatedCreator: CreatorProfile = {
      ...creator,
      name: name.trim(),
      username: username.trim().replace(/^@/, ''),
      location: location.trim(),
      bio: bio.trim(),
      avatar: avatar.trim() || creator.avatar,
      instagram: socialLinks.instagram?.trim() || undefined,
      twitter: socialLinks.twitter?.trim() || undefined,
      socialLinks: {
        instagram: socialLinks.instagram?.trim() || undefined,
        twitter: socialLinks.twitter?.trim() || undefined,
        website: socialLinks.website?.trim() || undefined,
        youtube: socialLinks.youtube?.trim() || undefined,
        tiktok: socialLinks.tiktok?.trim() || undefined,
        behance: socialLinks.behance?.trim() || undefined,
      },
      bankDetails: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolder.trim() || name.trim(),
        swiftCode: swiftCode.trim(),
        routingNumber: routingNumber.trim(),
        accountType: accountType,
        country: bankCountry.trim(),
        lastUpdated: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
      },
    };

    try {
      await onUpdateCreator(updatedCreator);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Error updating creator profile:', err);
      setErrorMessage('Failed to save profile. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Artist Profile & Public Storefront
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Customize your bio, profile photo, and social media handles visible to buyers across all your product pages.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onViewProductPage}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span>View on Product Page</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm">
                Artist Profile Updated Successfully!
              </h4>
              <p className="text-xs text-emerald-700">
                Your new profile photo, biography, and social links are now live on your storefront and all product pages.
              </p>
            </div>
          </div>
          <button
            onClick={onViewProductPage}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            View Live
          </button>
        </div>
      )}

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-semibold">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls (7 cols) */}
        <form onSubmit={handleSaveProfile} className="lg:col-span-7 space-y-6">
          {/* Card 1: Profile Photo Customization */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-rose-600" />
                <span>Profile Photo (Avatar)</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                High resolution square recommended (min. 400x400px)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Photo Preview with Upload Trigger */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative group w-24 h-24 rounded-3xl overflow-hidden border-2 cursor-pointer transition-all shrink-0 ${
                  isDragging 
                    ? 'border-rose-500 scale-105 shadow-md ring-4 ring-rose-500/20' 
                    : 'border-slate-200 hover:border-rose-400'
                }`}
                title="Click or drag image to change profile photo"
              >
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity">
                  <Camera className="w-5 h-5 mb-1" />
                  <span>Upload</span>
                </div>
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Input & Presets */}
              <div className="flex-1 space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                  </button>

                  <span className="text-xs text-slate-400">or pick a sample avatar:</span>
                </div>

                {/* Quick Avatar Presets */}
                <div className="flex items-center gap-2">
                  {AVATAR_PRESETS.map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(presetUrl)}
                      className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        avatar === presetUrl 
                          ? 'border-rose-600 ring-2 ring-rose-500/20 scale-105' 
                          : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                      }`}
                      title={`Select Avatar Style ${idx + 1}`}
                    >
                      <img src={presetUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Artist Identity & Biography */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Artist Bio & Identity</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Artist Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bamicash1 Studio"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-rose-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Creator Handle / Username
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs text-slate-400 font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Studio Location / Country
                </label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Toronto, Canada or Tokyo, Japan"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Biography Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Artist Biography & Statement <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {bio.length} / 500 characters
                </span>
              </div>
              <textarea
                required
                rows={4}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell buyers about your background, artistic medium, creative inspiration, and what your designs represent..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs text-slate-900 leading-relaxed focus:outline-hidden focus:border-rose-500 transition-colors"
              />

              {/* Bio Starter Ideas */}
              <div className="mt-2.5">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Quick bio starters:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {BIO_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.label}
                      type="button"
                      onClick={() => setBio(tmpl.text)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      + {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Social Media Links */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-rose-600" />
                <span>Social Media & Portfolio Links</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Connect your social accounts. Clickable icons will be rendered on every product page you publish.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Instagram */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                  <span>Instagram</span>
                </label>
                <input
                  type="text"
                  value={socialLinks.instagram || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                  placeholder="https://instagram.com/your_handle"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-pink-500"
                />
              </div>

              {/* X / Twitter */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  <Twitter className="w-3.5 h-3.5 text-sky-500" />
                  <span>X (Twitter)</span>
                </label>
                <input
                  type="text"
                  value={socialLinks.twitter || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                  placeholder="https://x.com/your_handle"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              {/* Website / Portfolio */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Website / Portfolio</span>
                </label>
                <input
                  type="text"
                  value={socialLinks.website || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                  placeholder="https://yourportfolio.design"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* YouTube */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  <Youtube className="w-3.5 h-3.5 text-red-600" />
                  <span>YouTube Channel</span>
                </label>
                <input
                  type="text"
                  value={socialLinks.youtube || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                  placeholder="https://youtube.com/@channel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-red-500"
                />
              </div>

              {/* TikTok */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  <Share2 className="w-3.5 h-3.5 text-slate-800" />
                  <span>TikTok</span>
                </label>
                <input
                  type="text"
                  value={socialLinks.tiktok || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                  placeholder="https://tiktok.com/@your_handle"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-slate-800"
                />
              </div>

              {/* Behance / ArtStation */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  <span>Behance / ArtStation</span>
                </label>
                <input
                  type="text"
                  value={socialLinks.behance || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, behance: e.target.value })}
                  placeholder="https://behance.net/your_profile"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Connected Bank Account & Payout Section */}
          <div className="bg-white border-2 border-emerald-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Direct Deposit Bank Account</h3>
                  <p className="text-xs text-slate-500">Your bank account number for artwork royalty payouts</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Bank Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Commercial Bank of Ethiopia (CBE), Chase"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Bank Account Number / IBAN
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 1000293847561"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Account Beneficiary
                </label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="e.g. Bamicash1 Creative Studio"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  SWIFT / Routing Code
                </label>
                <input
                  type="text"
                  value={swiftCode}
                  onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CBETETAA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              id="save-artist-profile-btn"
              disabled={isSaving}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving to Firestore...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Artist Profile & Sync to Product Pages</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Live Product Page Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="sticky top-28 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-rose-600" />
                <span>Live Product Page Preview</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Synchronized
              </span>
            </div>

            {/* Product Page Artist Spotlight Card Preview */}
            <div className="bg-white border-2 border-rose-100 rounded-3xl p-6 shadow-md space-y-5">
              <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                Independent Artist Spotlight
              </div>

              {/* Creator Header */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <img
                    src={avatar}
                    alt={name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-200 shadow-xs"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-base font-black text-slate-900 leading-tight">
                        {name || 'Your Artist Name'}
                      </h4>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      @{username || 'username'} • {location || 'Studio Location'}
                    </p>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {creator.followerCount.toLocaleString()} followers • {creator.totalSales.toLocaleString()} artworks sold
                    </div>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Following</span>
                </div>
              </div>

              {/* Biography Statement */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Artist Biography
                </span>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {bio || 'Your artist statement, inspiration, and creative background will be shown here.'}
                </p>
              </div>

              {/* Social Media Badges */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Connect with Artist
                </span>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.instagram && (
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-pink-50 text-pink-700 border border-pink-100 text-xs font-semibold hover:bg-pink-100 transition-colors"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span>Instagram</span>
                    </a>
                  )}

                  {socialLinks.twitter && (
                    <a
                      href={socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 text-xs font-semibold hover:bg-sky-100 transition-colors"
                    >
                      <Twitter className="w-3.5 h-3.5" />
                      <span>X (Twitter)</span>
                    </a>
                  )}

                  {socialLinks.website && (
                    <a
                      href={socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Portfolio</span>
                    </a>
                  )}

                  {socialLinks.youtube && (
                    <a
                      href={socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-100 text-xs font-semibold hover:bg-red-100 transition-colors"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      <span>YouTube</span>
                    </a>
                  )}

                  {socialLinks.tiktok && (
                    <a
                      href={socialLinks.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>TikTok</span>
                    </a>
                  )}

                  {socialLinks.behance && (
                    <a
                      href={socialLinks.behance}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold hover:bg-blue-100 transition-colors"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>Behance</span>
                    </a>
                  )}

                  {!Object.values(socialLinks).some(Boolean) && (
                    <span className="text-xs text-slate-400 italic">
                      Add social links on the left to show them here.
                    </span>
                  )}
                </div>
              </div>

              {/* Product Storefront Callout */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Seen by buyers before checking out
                </span>
                <button
                  type="button"
                  onClick={onViewProductPage}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to Product</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
