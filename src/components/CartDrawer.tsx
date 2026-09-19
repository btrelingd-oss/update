import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Tag, 
  Check,
  Home
} from 'lucide-react';
import { CartItem } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedToCheckout: (appliedDiscount: number) => void;
  onNavigateToHome?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onNavigateToHome,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const { currency, formatPrice } = useCurrency();

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalArtistMargin = cart.reduce((acc, item) => acc + item.artistMargin * item.quantity, 0);
  const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
  const shipping = subtotal > 55 ? 0 : 4.50;
  const total = Number((subtotal - discountAmount + (subtotal > 0 ? shipping : 0)).toFixed(2));

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'CREATOR15') {
      setDiscountPercent(15);
      setPromoMessage('15% discount applied!');
    } else if (promoCode.trim().toUpperCase() === 'ARTISAN20') {
      setDiscountPercent(20);
      setPromoMessage('20% special creator discount applied!');
    } else {
      setPromoMessage('Invalid promo code. Try CREATOR15');
      setDiscountPercent(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0f121d] border-l border-[#202638] text-slate-100 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Cart Header */}
          <div className="p-5 border-b border-[#1e2436] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#dfb15b]" />
              <h2 className="text-base font-black text-white">Your Bag</h2>
              <span className="text-xs font-bold bg-[#181d2c] px-2 py-0.5 rounded-full text-[#dfb15b] border border-[#dfb15b]/30">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#7e899c] hover:text-white hover:bg-[#1b2030] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#161a27] text-[#556175] flex items-center justify-center mx-auto border border-[#212739]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-white text-sm">Your bag is empty</h4>
                <p className="text-xs text-[#8a96aa] max-w-xs mx-auto">
                  Explore original designs by independent artists and find your next favorite tee or print.
                </p>
                <button
                  id="empty-cart-shop-home-btn"
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateToHome) onNavigateToHome();
                  }}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-[#dfb15b] hover:bg-[#ebd085] text-[#0b0c12] rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Start Shopping on Shop Home</span>
                </button>
              </div>
            ) : (
              <>
                {/* Independent Artist Direct Support Banner */}
                <div className="bg-[#1f1915] border border-[#3d2e1c] rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-[#ebd085]">
                  <Sparkles className="w-4 h-4 text-[#dfb15b] shrink-0" />
                  <span>
                    <strong className="text-white">{formatPrice(totalArtistMargin)}</strong> from this order directly supports independent artists!
                  </span>
                </div>

                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3.5 p-3 rounded-2xl bg-[#141824] border border-[#232a3d] hover:border-[#dfb15b]/40 transition-colors"
                  >
                    {/* Item Thumbnail */}
                    <div className="w-20 h-20 rounded-xl bg-[#0b0d14] border border-[#1e2333] overflow-hidden flex items-center justify-center p-1 shrink-0">
                      <img
                        src={item.artwork.imageUrl}
                        alt={item.artwork.title}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-white truncate">
                            {item.artwork.title}
                          </h4>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-[#647185] hover:text-[#ff6b7b] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-[#8a96aa] capitalize">
                          {item.productType.replace('-', ' ')} • {item.size}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-[#2a3348]"
                            style={{ backgroundColor: item.color.hex }}
                          />
                          <span className="text-[11px] text-[#8a96aa]">{item.color.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {/* Stepper */}
                        <div className="flex items-center border border-[#252c40] rounded-lg overflow-hidden bg-[#0c0e17] text-xs">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-[#8a96aa] hover:bg-[#181d2c] hover:text-white"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-[#8a96aa] hover:bg-[#181d2c] hover:text-white"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-black text-[#dfb15b]">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Cart Footer & Summary */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-[#1e2436] bg-[#0c0e17] space-y-4">
              {/* Promo code form */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-[#7e899c]" />
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo code (e.g. CREATOR15)"
                    className="w-full pl-8 pr-3 py-2 bg-[#141824] border border-[#252c40] rounded-xl text-xs text-white focus:outline-hidden focus:border-[#dfb15b] uppercase placeholder:text-[#556175]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#dfb15b] hover:bg-[#ebd085] text-[#0b0c12] text-xs font-black rounded-xl cursor-pointer transition-colors shadow-sm"
                >
                  Apply
                </button>
              </form>

              {promoMessage && (
                <p className={`text-[11px] font-semibold ${discountPercent > 0 ? 'text-[#4ade80]' : 'text-[#ff6b7b]'}`}>
                  {promoMessage}
                </p>
              )}

              {/* Cost calculations */}
              <div className="space-y-1.5 text-xs text-[#8a96aa]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#4ade80] font-semibold">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Standard Shipping</span>
                  <span>{shipping === 0 ? <strong className="text-[#4ade80]">FREE</strong> : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-[#1e2436]">
                  <span>Total ({currency})</span>
                  <span className="text-[#dfb15b] text-base">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                id="drawer-checkout-btn"
                onClick={() => {
                  onClose();
                  onProceedToCheckout(discountAmount);
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#dfb15b] to-[#ebd085] hover:from-[#e5b963] hover:to-[#f3dc98] text-[#0b0c12] font-black text-sm shadow-lg hover:shadow-[0_4px_20px_rgba(223,177,91,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onNavigateToHome && (
                <button
                  id="cart-continue-shop-home-btn"
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateToHome) onNavigateToHome();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#252c40] hover:bg-[#141824] text-[#8a96aa] hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-[#dfb15b]" />
                  <span>Continue Browsing on Shop Home</span>
                </button>
              )}

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#556175]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4ade80]" />
                <span>Encrypted 256-bit PCI-DSS payment processing</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
