export type ProductCategory = 
  | 't-shirt'
  | 'hoodie'
  | 'sticker'
  | 'phone-case'
  | 'mug'
  | 'art-print'
  | 'tote-bag';

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
  isDark?: boolean;
}

export interface ProductOption {
  category: ProductCategory;
  displayName: string;
  basePrice: number;
  description: string;
  materials: string[];
  sizes: string[];
  colors: ProductColor[];
}

export interface Artwork {
  id: string;
  title: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  description: string;
  tags: string[];
  category: string;
  imageUrl: string;
  thumbnailUrl?: string;
  storagePath?: string;
  createdAt: number;
  basePrice: number;
  creatorMarginPercent: number; // e.g. 20 for 20%
  salesCount: number;
  viewsCount: number;
  likesCount: number;
  featured?: boolean;
  defaultCategory?: ProductCategory;
  enabledProducts?: ProductCategory[];
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  website?: string;
  youtube?: string;
  tiktok?: string;
  behance?: string;
}

export interface BankDetails {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  accountType?: 'checking' | 'savings';
  country?: string;
  lastUpdated?: string;
}

export interface CreatorProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bannerUrl?: string;
  bio: string;
  location: string;
  joinedDate: string;
  totalSales: number;
  totalEarnings: number;
  availableBalance: number;
  followerCount: number;
  isFollowing?: boolean;
  verified: boolean;
  instagram?: string;
  twitter?: string;
  socialLinks?: SocialLinks;
  bankDetails?: BankDetails;
}

export interface OrderItem {
  id: string;
  artworkId: string;
  artworkTitle: string;
  artworkImage: string;
  creatorId: string;
  creatorName: string;
  productType: ProductCategory;
  productName: string;
  size: string;
  color: ProductColor;
  quantity: number;
  unitPrice: number;
  artistMarginAmount: number;
}

export interface Order {
  id: string;
  buyerName: string;
  buyerEmail: string;
  phoneNumber?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'paypal';
  paymentStatus: 'paid' | 'processing';
  orderStatus: 'printing' | 'shipped' | 'delivered';
  createdAt: number;
  estimatedDelivery: string;
}

export interface Review {
  id: string;
  artworkId: string;
  author: string;
  avatar?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  date: string;
  productPurchased: string;
  colorPurchased: string;
  sizePurchased: string;
  verifiedBuyer: boolean;
  helpfulCount: number;
}

export interface CartItem {
  id: string; // unique cart line id
  artwork: Artwork;
  productType: ProductCategory;
  size: string;
  color: ProductColor;
  quantity: number;
  price: number;
  artistMargin: number;
}
