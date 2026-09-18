import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Truck, 
  Sparkles, 
  ArrowRight,
  PackageCheck,
  Database,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { CartItem, Order, OrderItem } from '../types';
import { processOrderTransaction } from '../lib/firebase';
import { sendOrderToSupabase, SupabaseSyncResult, SUPABASE_ORDERS_TABLE_SQL, SUPABASE_PROJECT_ID } from '../lib/supabase';
import { useCurrency } from '../context/CurrencyContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  appliedDiscount: number;
  onOrderCompleted: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  appliedDiscount = 0,
  onOrderCompleted,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'google_pay' | 'paypal'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{ id: string; delivery: string } | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseSyncResult | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlSetup, setShowSqlSetup] = useState(false);

  // Form Fields
  const [buyerName, setBuyerName] = useState('Sarah Jenkins');
  const [buyerEmail, setBuyerEmail] = useState('sarah.jenkins@example.com');
  const [phoneNumber, setPhoneNumber] = useState('+1 (555) 234-5678');
  const [street, setStreet] = useState('452 Kensington Ave');
  const [city, setCity] = useState('Toronto');
  const [state, setState] = useState('ON');
  const [postalCode, setPostalCode] = useState('M5T 2W7');
  const [country, setCountry] = useState('Canada');

  // Card fields
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvc, setCardCvc] = useState('892');
  const { currency, formatPrice } = useCurrency();

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalArtistMargin = cart.reduce((acc, item) => acc + item.artistMargin * item.quantity, 0);
  const shipping = subtotal > 55 ? 0 : 4.50;
  const tax = Number(((subtotal - appliedDiscount) * 0.08).toFixed(2));
  const grandTotal = Number((subtotal - appliedDiscount + shipping + tax).toFixed(2));

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Build order items
      const orderItems: OrderItem[] = cart.map((c) => ({
        id: c.id,
        artworkId: c.artwork.id,
        artworkTitle: c.artwork.title,
        artworkImage: c.artwork.imageUrl,
        creatorId: c.artwork.creatorId,
        creatorName: c.artwork.creatorName,
        productType: c.productType,
        productName: c.productType.replace('-', ' '),
        size: c.size,
        color: c.color,
        quantity: c.quantity,
        unitPrice: c.price,
        artistMarginAmount: c.artistMargin,
      }));

      // Estimated delivery 4 days out
      const deliveryDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      // Simulate network verification and call Firestore
      await new Promise((res) => setTimeout(res, 1200));

      const newOrderId = await processOrderTransaction({
        buyerName,
        buyerEmail,
        shippingAddress: {
          street,
          city,
          state,
          postalCode,
          country,
        },
        items: orderItems,
        subtotal,
        discount: appliedDiscount,
        shipping,
        tax,
        total: grandTotal,
        paymentMethod,
        paymentStatus: 'paid',
        orderStatus: 'printing',
        createdAt: Date.now(),
        estimatedDelivery: deliveryDate,
      });

      // Synchronize full order record to Supabase
      const fullOrderForSupabase: Order = {
        id: newOrderId,
        buyerName,
        buyerEmail,
        phoneNumber,
        shippingAddress: {
          street,
          city,
          state,
          postalCode,
          country,
        },
        items: orderItems,
        subtotal,
        discount: appliedDiscount,
        shipping,
        tax,
        total: grandTotal,
        paymentMethod,
        paymentStatus: 'paid',
        orderStatus: 'printing',
        createdAt: Date.now(),
        estimatedDelivery: deliveryDate,
      };

      const supaResult = await sendOrderToSupabase(fullOrderForSupabase);
      setSupabaseStatus(supaResult);

      setConfirmedOrder({
        id: newOrderId,
        delivery: deliveryDate,
      });

      onOrderCompleted(newOrderId);
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-black text-slate-900">Secure Order Checkout</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Database className="w-3 h-3 text-emerald-600" />
                <span>Syncs to Supabase Database (Project: {SUPABASE_PROJECT_ID})</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Confirmed Receipt View */}
        {confirmedOrder ? (
          <div className="py-8 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Payment Authorized & Production Queued
              </span>
              <h3 className="text-2xl font-black text-slate-900">Thank you for your order!</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your order is now being individually printed. Confirmation sent to <strong>{buyerEmail}</strong>.
              </p>
            </div>

            {/* Receipt Details Box */}
            <div className="bg-slate-50 rounded-2xl p-5 text-left border border-slate-200 space-y-3 max-w-lg mx-auto text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Order Reference:</span>
                <strong className="text-slate-900 font-mono">{confirmedOrder.id}</strong>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Estimated Delivery:</span>
                <strong className="text-slate-900">{confirmedOrder.delivery}</strong>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Total Paid:</span>
                <strong className="text-slate-900 font-bold">{formatPrice(grandTotal)}</strong>
              </div>
              <div className="flex items-center justify-between text-emerald-800 bg-emerald-100/70 p-2.5 rounded-xl font-medium">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Independent Artist Support:
                </span>
                <strong>+{formatPrice(totalArtistMargin)} to Bamicash1</strong>
              </div>

              {/* Supabase Order Database Sync Status */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    Supabase Order Database:
                  </span>
                  {supabaseStatus?.success ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Synced to orders table
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Connected ({SUPABASE_PROJECT_ID})
                    </span>
                  )}
                </div>

                {supabaseStatus && !supabaseStatus.success && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 space-y-1.5">
                    <p className="font-medium">
                      All order fields were dispatched to Supabase project <code className="font-mono font-bold">{SUPABASE_PROJECT_ID}</code>.
                    </p>
                    {supabaseStatus.tableNotice && (
                      <p className="text-amber-800">
                        {supabaseStatus.tableNotice}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowSqlSetup(!showSqlSetup)}
                      className="text-xs font-bold text-amber-900 underline hover:text-amber-950 inline-flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      {showSqlSetup ? 'Hide Supabase Table SQL Setup' : 'View / Copy SQL to create orders table in Supabase'}
                    </button>
                    {showSqlSetup && (
                      <div className="mt-2 p-2 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono overflow-x-auto relative">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(SUPABASE_ORDERS_TABLE_SQL);
                            setCopiedSql(true);
                            setTimeout(() => setCopiedSql(false), 2500);
                          }}
                          className="absolute right-2 top-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-sans text-[10px] flex items-center gap-1"
                        >
                          {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedSql ? 'Copied' : 'Copy SQL'}
                        </button>
                        <pre className="pr-16">{SUPABASE_ORDERS_TABLE_SQL}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Back to Marketplace
              </button>
            </div>
          </div>
        ) : (
          /* Active Checkout Form */
          <form onSubmit={handleCheckoutSubmit} className="py-6 space-y-6">
            {/* Express Pay Methods */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Express Checkout
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'apple_pay'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span> Pay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('google_pay')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'google_pay'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>G Pay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'paypal'
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                      : 'border-slate-200 text-blue-700 hover:bg-slate-50'
                  }`}
                >
                  <span>PayPal</span>
                </button>
              </div>
            </div>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="shrink-0 px-3 text-xs text-slate-400 font-semibold uppercase">
                Or Pay With Credit Card
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Credit Card Input Group */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-rose-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Security Code (CVC)
                  </label>
                  <input
                    type="text"
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="CVC"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-rose-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address Inputs */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-600" />
                <span>Shipping Address</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">First & Last Name</label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount</span>
                  <span>-{formatPrice(appliedDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Sales Tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount Due</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="confirm-payment-btn"
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Secure Payment...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay {formatPrice(grandTotal)} & Complete Order</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
