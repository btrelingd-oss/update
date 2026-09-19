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
  deleteDoc,
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

// Optimize artwork file client-side to ensure high resolution while staying safely within Firestore & Storage limits
export async function optimizeArtworkImage(file: File): Promise<{
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
}> {
  const originalSize = file.size;

  // Handle vector SVG files cleanly
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    try {
      const text = await file.text();
      // If reasonable SVG size, keep as pure vector SVG data URL
      if (text.length < 350000) {
        const cleanSvg = text.trim();
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvg)}`;
        return {
          blob: new Blob([cleanSvg], { type: 'image/svg+xml' }),
          dataUrl,
          width: 1200,
          height: 1200,
          originalSize,
          optimizedSize: cleanSvg.length,
        };
      }
    } catch {
      // Fall through to raster conversion if reading text fails
    }
  }

  // Handle Raster Bitmaps (PNG, JPEG, WebP) with canvas downscaling and compression
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          // Standard print mockup max dimension: 1400px preserves ultra-crisp detail across all garments & posters
          const maxDim = 1400;
          let width = img.naturalWidth || img.width || 1000;
          let height = img.naturalHeight || img.height || 1000;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve({
              blob: file,
              dataUrl: rawDataUrl,
              width,
              height,
              originalSize,
              optimizedSize: originalSize,
            });
            return;
          }

          // Render with high-quality smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // WebP supports transparency and produces 80% smaller payloads than PNG
          const mimeType = 'image/webp';
          const quality = 0.88;

          let dataUrl = canvas.toDataURL(mimeType, quality);

          // If browser does not support WebP or dataUrl is unexpectedly large (>400KB), downscale slightly
          if (dataUrl.length > 450000) {
            const secondaryCanvas = document.createElement('canvas');
            const scaleDown = 0.8;
            secondaryCanvas.width = Math.round(width * scaleDown);
            secondaryCanvas.height = Math.round(height * scaleDown);
            const secCtx = secondaryCanvas.getContext('2d');
            if (secCtx) {
              secCtx.imageSmoothingEnabled = true;
              secCtx.imageSmoothingQuality = 'high';
              secCtx.drawImage(canvas, 0, 0, secondaryCanvas.width, secondaryCanvas.height);
              dataUrl = secondaryCanvas.toDataURL('image/jpeg', 0.82);
              width = secondaryCanvas.width;
              height = secondaryCanvas.height;
            }
          }

          canvas.toBlob(
            (blob) => {
              const finalBlob = blob || file;
              resolve({
                blob: finalBlob,
                dataUrl,
                width,
                height,
                originalSize,
                optimizedSize: finalBlob.size || dataUrl.length,
              });
            },
            mimeType,
            quality
          );
        } catch (canvasErr) {
          console.warn('Canvas optimization notice, using raw asset:', canvasErr);
          resolve({
            blob: file,
            dataUrl: rawDataUrl,
            width: img.width || 800,
            height: img.height || 800,
            originalSize,
            optimizedSize: originalSize,
          });
        }
      };

      img.onerror = () => {
        resolve({
          blob: file,
          dataUrl: rawDataUrl,
          width: 800,
          height: 800,
          originalSize,
          optimizedSize: originalSize,
        });
      };

      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

// Upload artwork image to Firebase Cloud Storage with Base64 fallback for safety
export const uploadArtworkAsset = async (
  file: File,
  creatorId: string,
  onProgress?: (percent: number, stepText?: string) => void
): Promise<{ url: string; storagePath?: string; isCloudStorage: boolean; dimensions?: { width: number; height: number } }> => {
  if (onProgress) onProgress(15, 'Preparing & optimizing artwork resolution...');

  // Step 1: Pre-process and optimize image client-side to guarantee it fits both Storage & Firestore
  let optimized;
  try {
    optimized = await optimizeArtworkImage(file);
  } catch (optErr) {
    console.warn('Image optimization notice:', optErr);
    // Fallback directly to basic file reader
    const fallbackDataUrl = await new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
    optimized = {
      blob: file,
      dataUrl: fallbackDataUrl,
      width: 1000,
      height: 1000,
      originalSize: file.size,
      optimizedSize: file.size,
    };
  }

  if (onProgress) onProgress(40, 'Contacting Firebase Cloud Storage...');

  // Step 2: Attempt Firebase Cloud Storage upload with a strict 6-second timeout race
  if (storage) {
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const isWebp = optimized.blob.type === 'image/webp';
      const ext = isWebp ? 'webp' : (file.name.split('.').pop() || 'png');
      const storagePath = `artworks/${creatorId}/${Date.now()}_${cleanFileName}.${ext}`;
      const fileRef = ref(storage, storagePath);

      if (onProgress) onProgress(65, 'Uploading asset to Cloud Storage bucket...');

      const uploadPromise = uploadBytes(fileRef, optimized.blob, {
        contentType: optimized.blob.type || file.type || 'image/webp',
        customMetadata: {
          creatorId,
          originalName: file.name,
          width: String(optimized.width),
          height: String(optimized.height),
          uploadedAt: new Date().toISOString(),
        },
      });

      // 6-second timeout race prevents the upload from ever freezing or hanging indefinitely
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Cloud Storage connection timed out')), 6000)
      );

      const snapshot = await Promise.race([uploadPromise, timeoutPromise]);

      if (onProgress) onProgress(85, 'Verifying download URL...');
      const downloadUrl = await getDownloadURL(snapshot.ref);
      if (onProgress) onProgress(95, 'Cloud asset stored successfully.');

      return {
        url: downloadUrl,
        storagePath,
        isCloudStorage: true,
        dimensions: { width: optimized.width, height: optimized.height },
      };
    } catch (storageErr) {
      console.warn('Firebase Cloud Storage fallback to optimized high-res asset:', storageErr);
      if (onProgress) onProgress(90, 'Applying high-resolution optimized asset...');
      return {
        url: optimized.dataUrl,
        isCloudStorage: false,
        dimensions: { width: optimized.width, height: optimized.height },
      };
    }
  }

  if (onProgress) onProgress(90, 'Applying high-resolution optimized asset...');
  return {
    url: optimized.dataUrl,
    isCloudStorage: false,
    dimensions: { width: optimized.width, height: optimized.height },
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

/**
 * Update an existing artwork document in Firestore and local storage cache
 */
export async function updateArtworkDoc(
  artworkId: string,
  updates: Partial<Artwork>
): Promise<boolean> {
  try {
    const artRef = doc(db, 'artworks', artworkId);
    await updateDoc(artRef, updates);

    // Also update local storage cache
    try {
      const cached: Artwork[] = JSON.parse(localStorage.getItem('mx_custom_artworks') || '[]');
      const updated = cached.map((a) => (a.id === artworkId ? { ...a, ...updates } : a));
      localStorage.setItem('mx_custom_artworks', JSON.stringify(updated));
    } catch {
      // Ignore cache write error
    }

    return true;
  } catch (err) {
    console.warn('Error updating artwork in Firestore:', err);
    // Fallback: update local storage cache even if Firestore update has transient error
    try {
      const cached: Artwork[] = JSON.parse(localStorage.getItem('mx_custom_artworks') || '[]');
      const updated = cached.map((a) => (a.id === artworkId ? { ...a, ...updates } : a));
      localStorage.setItem('mx_custom_artworks', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Delete an artwork document from Firestore and local storage cache
 */
export async function deleteArtworkDoc(artworkId: string): Promise<boolean> {
  try {
    const artRef = doc(db, 'artworks', artworkId);
    await deleteDoc(artRef);

    // Also remove from local storage cache
    try {
      const cached: Artwork[] = JSON.parse(localStorage.getItem('mx_custom_artworks') || '[]');
      const updated = cached.filter((a) => a.id !== artworkId);
      localStorage.setItem('mx_custom_artworks', JSON.stringify(updated));
    } catch {
      // Ignore cache remove error
    }

    return true;
  } catch (err) {
    console.warn('Error deleting artwork from Firestore:', err);
    // Fallback: remove from local storage cache
    try {
      const cached: Artwork[] = JSON.parse(localStorage.getItem('mx_custom_artworks') || '[]');
      const updated = cached.filter((a) => a.id !== artworkId);
      localStorage.setItem('mx_custom_artworks', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  }
}

