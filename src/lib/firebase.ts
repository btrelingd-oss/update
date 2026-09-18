import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import {
  getFirestore,
  setLogLevel,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  increment,
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { Artwork, CreatorProfile, Order, Review, BankDetails } from '../types';
import { INITIAL_ARTWORKS, INITIAL_CREATOR, INITIAL_REVIEWS } from './seedData';
import { sendOrderToSupabase } from './supabase';

function extractFirebaseApiKey(val?: unknown): string {
  if (!val) return 'AIzaSyA3qj4533RIMscz0MDnUkMqj1phZ3x0xGo';
  const str = String(val).trim();
  const match = str.match(/AIzaSy[A-Za-z0-9_\-]+/);
  if (match) return match[0];
  return cleanEnvValue(str) || 'AIzaSyA3qj4533RIMscz0MDnUkMqj1phZ3x0xGo';
}

function cleanEnvValue(val?: unknown): string {
  if (!val) return '';
  return String(val)
    .trim()
    .replace(/^["']|["',]+$/g, '')
    .replace(/^["']|["',]+$/g, '')
    .trim();
}

const cleanedApiKey = extractFirebaseApiKey(import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey);
const cleanedAuthDomain = cleanEnvValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || cleanEnvValue(firebaseConfigJson.authDomain) || "ageless-webbing-502620-b8.firebaseapp.com";
const cleanedProjectId = cleanEnvValue(import.meta.env.VITE_FIREBASE_PROJECT_ID) || cleanEnvValue(firebaseConfigJson.projectId) || "ageless-webbing-502620-b8";
const cleanedStorageBucket = cleanEnvValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || cleanEnvValue(firebaseConfigJson.storageBucket) || "ageless-webbing-502620-b8.firebasestorage.app";
const cleanedSenderId = cleanEnvValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || cleanEnvValue(firebaseConfigJson.messagingSenderId) || "13095343309";
const cleanedAppId = cleanEnvValue(import.meta.env.VITE_FIREBASE_APP_ID) || cleanEnvValue(firebaseConfigJson.appId) || "1:13095343309:web:3e1c7348424884c90c4584";

export const firebaseConfig = {
  apiKey: cleanedApiKey,
  authDomain: cleanedAuthDomain,
  projectId: cleanedProjectId,
  storageBucket: cleanedStorageBucket,
  messagingSenderId: cleanedSenderId,
  appId: cleanedAppId,
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Suppress internal connection retry notices from polluting console.error in preview iframe environments
try {
  setLogLevel('silent');
} catch {
  // Ignore
}

// Standardized Firestore operation types & error reporting conforming to Firebase integration specifications
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initialize Firestore with custom database ID according to Firebase Skill specification
const targetDatabaseId = cleanEnvValue(import.meta.env.VITE_FIRESTORE_DATABASE_ID) || cleanEnvValue(firebaseConfigJson.firestoreDatabaseId);
let dbInstance: Firestore;
try {
  if (targetDatabaseId && targetDatabaseId !== '(default)') {
    dbInstance = getFirestore(app, targetDatabaseId);
  } else {
    dbInstance = getFirestore(app);
  }
} catch {
  dbInstance = getFirestore(app);
}
export const db = dbInstance;

// Test connection to Firestore backend as mandated by Firebase Skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch {
    return false;
  }
}

// Initialize Firebase Cloud Storage
let storageInstance: FirebaseStorage | null = null;
try {
  storageInstance = getStorage(app, `gs://${firebaseConfigJson.storageBucket}`);
} catch {
  try {
    storageInstance = getStorage(app);
  } catch (err) {
    console.warn('Firebase Storage initialization fallback:', err);
  }
}
export const storage = storageInstance;

// Observe Auth Session without attempting unauthorized anonymous sign-in
export const ensureAuthSession = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user || null);
    });
    // Fallback timeout safeguard
    setTimeout(() => {
      resolve(auth.currentUser || null);
    }, 1200);
  });
};

// Seed initial marketplace data into Firestore if empty
export const seedInitialMarketplaceData = async () => {
  try {
    const artworksCol = collection(db, 'artworks');
    const existingArtworks = await getDocs(query(artworksCol, limit(1)));

    if (existingArtworks.empty) {
      console.log('Seeding initial marketplace artworks to Firestore...');
      // Seed Artworks
      for (const art of INITIAL_ARTWORKS) {
        await setDoc(doc(db, 'artworks', art.id), art);
      }

      // Seed Creator
      await setDoc(doc(db, 'creators', INITIAL_CREATOR.id), INITIAL_CREATOR);

      // Seed Reviews
      for (const rev of INITIAL_REVIEWS) {
        await setDoc(doc(db, 'reviews', rev.id), rev);
      }

      // Seed Initial dummy orders to populate creator earnings chart
      const dummyOrders: Order[] = [
        {
          id: 'ord-1001',
          buyerName: 'Chloe Bennett',
          buyerEmail: 'chloe.b@example.com',
          shippingAddress: {
            street: '742 Evergreen Terrace',
            city: 'Springfield',
            state: 'OR',
            postalCode: '97477',
            country: 'United States'
          },
          items: [
            {
              id: 'line-1',
              artworkId: 'china-girl-183863295',
              artworkTitle: 'China girl',
              artworkImage: INITIAL_ARTWORKS[0].imageUrl,
              creatorId: 'bamicash1',
              creatorName: 'Bamicash1',
              productType: 't-shirt',
              productName: 'Classic T-Shirt',
              size: 'M',
              color: { id: 'black', name: 'Classic Black', hex: '#111827', isDark: true },
              quantity: 1,
              unitPrice: 24.80,
              artistMarginAmount: 4.80
            }
          ],
          subtotal: 24.80,
          discount: 0,
          shipping: 4.50,
          tax: 1.98,
          total: 31.28,
          paymentMethod: 'card',
          paymentStatus: 'paid',
          orderStatus: 'shipped',
          createdAt: Date.now() - 1000 * 60 * 60 * 48,
          estimatedDelivery: 'Sep 18, 2026'
        },
        {
          id: 'ord-1002',
          buyerName: 'Liam Walker',
          buyerEmail: 'liam.w@example.com',
          shippingAddress: {
            street: '120 Queen St West',
            city: 'Toronto',
            state: 'ON',
            postalCode: 'M5H 2M9',
            country: 'Canada'
          },
          items: [
            {
              id: 'line-2',
              artworkId: 'china-girl-183863295',
              artworkTitle: 'China girl',
              artworkImage: INITIAL_ARTWORKS[0].imageUrl,
              creatorId: 'bamicash1',
              creatorName: 'Bamicash1',
              productType: 'hoodie',
              productName: 'Pullover Hoodie',
              size: 'L',
              color: { id: 'charcoal', name: 'Dark Charcoal', hex: '#374151', isDark: true },
              quantity: 1,
              unitPrice: 51.00,
              artistMarginAmount: 8.50
            },
            {
              id: 'line-3',
              artworkId: 'china-girl-183863295',
              artworkTitle: 'China girl',
              artworkImage: INITIAL_ARTWORKS[0].imageUrl,
              creatorId: 'bamicash1',
              creatorName: 'Bamicash1',
              productType: 'sticker',
              productName: 'Die-Cut Vinyl Sticker',
              size: 'Medium (5" x 5")',
              color: { id: 'white', name: 'White Contour', hex: '#FFFFFF', isDark: false },
              quantity: 3,
              unitPrice: 4.20,
              artistMarginAmount: 2.40
            }
          ],
          subtotal: 63.60,
          discount: 0,
          shipping: 6.00,
          tax: 5.08,
          total: 74.68,
          paymentMethod: 'apple_pay',
          paymentStatus: 'paid',
          orderStatus: 'printing',
          createdAt: Date.now() - 1000 * 60 * 60 * 12,
          estimatedDelivery: 'Sep 19, 2026'
        }
      ];

      for (const ord of dummyOrders) {
        await setDoc(doc(db, 'orders', ord.id), ord);
      }
    }
  } catch (err) {
    console.warn('Seed database warning:', err);
  }
};

// Upload artwork image to Firebase Cloud Storage with Base64 fallback for safety
export const uploadArtworkAsset = async (
  file: File,
  creatorId: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; storagePath?: string }> => {
  if (onProgress) onProgress(15);

  // Read as DataURL for immediate local preview / reliable fallback
  const readDataUrl = (): Promise<string> =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });

  const base64Data = await readDataUrl();
  if (onProgress) onProgress(45);

  if (storage) {
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `artworks/${creatorId}/${Date.now()}_${cleanFileName}`;
      const fileRef = ref(storage, storagePath);

      if (onProgress) onProgress(65);
      const snapshot = await uploadBytes(fileRef, file, {
        contentType: file.type || 'image/png',
      });

      if (onProgress) onProgress(90);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      if (onProgress) onProgress(100);

      return {
        url: downloadUrl,
        storagePath,
      };
    } catch (storageErr) {
      console.warn('Firebase Cloud Storage upload fallback to high-resolution asset:', storageErr);
      if (onProgress) onProgress(100);
      return {
        url: base64Data,
      };
    }
  }

  if (onProgress) onProgress(100);
  return {
    url: base64Data,
  };
};

// Create a new order and update creator earnings in Firestore
export const processOrderTransaction = async (orderData: Omit<Order, 'id'>): Promise<string> => {
  const orderId = `RB-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
  const orderRef = doc(db, 'orders', orderId);
  const fullOrder: Order = {
    ...orderData,
    id: orderId,
  };

  await setDoc(orderRef, fullOrder);

  // Group margin by creator to update their balance in real-time
  const creatorMargins: Record<string, number> = {};
  for (const item of orderData.items) {
    creatorMargins[item.creatorId] = (creatorMargins[item.creatorId] || 0) + (item.artistMarginAmount * item.quantity);
  }

  for (const [cId, margin] of Object.entries(creatorMargins)) {
    try {
      const creatorRef = doc(db, 'creators', cId);
      const snap = await getDoc(creatorRef);
      if (snap.exists()) {
        await updateDoc(creatorRef, {
          totalSales: increment(1),
          totalEarnings: increment(margin),
          availableBalance: increment(margin),
        });
      }
    } catch (err) {
      console.warn(`Could not update creator ${cId} balance:`, err);
    }
  }

  // Also increment sales count on each artwork
  for (const item of orderData.items) {
    try {
      const artRef = doc(db, 'artworks', item.artworkId);
      await updateDoc(artRef, {
        salesCount: increment(item.quantity),
      });
    } catch (err) {
      console.warn(`Could not update artwork sales count:`, err);
    }
  }

  // Synchronize entire order to Supabase database
  try {
    await sendOrderToSupabase(fullOrder);
  } catch (supaErr) {
    console.warn('Supabase background sync exception:', supaErr);
  }

  return orderId;
};

// ==========================================
// Google & Email Authentication Handlers
// ==========================================

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export interface AuthActionResult {
  success: boolean;
  user: User | null;
  error?: string;
}

/**
 * Sign in or sign up using Google Identity Services with Firebase Auth
 */
export async function loginWithGoogle(): Promise<AuthActionResult> {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: credential.user,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('Google Sign-In notice:', errorMsg);
    return {
      success: false,
      user: null,
      error: errorMsg,
    };
  }
}

/**
 * Sign in using email and password
 */
export async function loginWithEmail(email: string, pass: string): Promise<AuthActionResult> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, pass);
    return {
      success: true,
      user: credential.user,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // If testing with demo account and user doesn't exist yet, auto-create it smoothly
    if (email.toLowerCase().includes('demo@mxgallery.com') && (errorMsg.includes('user-not-found') || errorMsg.includes('invalid-credential') || errorMsg.includes('INVALID_LOGIN_CREDENTIALS'))) {
      try {
        const signupRes = await createUserWithEmailAndPassword(auth, email, pass);
        if (signupRes.user) {
          await updateProfile(signupRes.user, { displayName: 'Demo Artist' });
        }
        return {
          success: true,
          user: signupRes.user,
        };
      } catch {
        // Continue to standard error reporting
      }
    }
    return {
      success: false,
      user: null,
      error: errorMsg,
    };
  }
}

/**
 * Sign up using email, password, and display name
 */
export async function signUpWithEmail(name: string, email: string, pass: string): Promise<AuthActionResult> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    if (credential.user && name) {
      await updateProfile(credential.user, { displayName: name });
    }
    return {
      success: true,
      user: credential.user,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      user: null,
      error: errorMsg,
    };
  }
}

/**
 * Sign out current authenticated user
 */
export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('Sign out warning:', err);
  }
}

/**
 * Update and persist creator bank account details in Firestore
 */
export async function updateCreatorBankDetails(
  creatorId: string, 
  bankDetails: BankDetails
): Promise<boolean> {
  try {
    const creatorRef = doc(db, 'creators', creatorId);
    await updateDoc(creatorRef, {
      bankDetails: {
        ...bankDetails,
        lastUpdated: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
      }
    });
    return true;
  } catch (err) {
    console.warn('Error updating creator bank details in Firestore:', err);
    return false;
  }
}
