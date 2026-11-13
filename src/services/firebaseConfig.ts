import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  type FirebaseStorage,
} from 'firebase/storage';

/**
 * HƯỚNG DẪN CẤU HÌNH FIREBASE THỰC TẾ:
 * 1. Tạo dự án trên https://console.firebase.google.com/
 * 2. Bật Authentication -> Sign-in method -> Google
 * 3. Bật Cloud Firestore & Cloud Storage
 * 4. Sao chép các biến môi trường vào tệp .env (theo mẫu .env.example):
 *    VITE_FIREBASE_API_KEY=...
 *    VITE_FIREBASE_AUTH_DOMAIN=...
 *    VITE_FIREBASE_PROJECT_ID=...
 *    VITE_FIREBASE_STORAGE_BUCKET=...
 *    VITE_FIREBASE_MESSAGING_SENDER_ID=...
 *    VITE_FIREBASE_APP_ID=...
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

export function getFirebaseServices() {
  if (!isFirebaseConfigured()) {
    return null;
  }
  if (!appInstance) {
    appInstance = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);
  }
  return {
    app: appInstance,
    auth: authInstance!,
    db: dbInstance!,
    storage: storageInstance!,
  };
}

export async function signInWithGooglePopup() {
  const services = getFirebaseServices();
  if (!services) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(services.auth, provider);
  return result.user;
}

export async function signOutFirebase() {
  const services = getFirebaseServices();
  if (services) {
    await signOut(services.auth);
  }
}

export async function persistEntityToFirestore(
  collectionName: string,
  docId: string,
  payload: Record<string, unknown>
) {
  const services = getFirebaseServices();
  if (!services) return false;
  await setDoc(doc(collection(services.db, collectionName), docId), payload, {
    merge: true,
  });
  return true;
}

export async function uploadMaterialToStorage(file: File, folder = 'materials') {
  const services = getFirebaseServices();
  if (!services) {
    // Fallback URL local blob khi chạy chế độ Demo chưa gắn Firebase Storage
    return URL.createObjectURL(file);
  }
  const storageRef = ref(services.storage, `${folder}/${Date.now()}_${file.name}`);
  const snap = await uploadBytes(storageRef, file);
  return getDownloadURL(snap.ref);
}
