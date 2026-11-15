import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

// Store Firebase ID Token strictly in memory (never in localStorage)
let cachedIdToken: string | null = null;

export function getCachedIdToken(): string | null {
  return cachedIdToken;
}

export async function refreshIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    cachedIdToken = null;
    return null;
  }
  const token = await user.getIdToken();
  cachedIdToken = token;
  return token;
}

export async function signInWithGoogle(): Promise<{ user: User; idToken: string }> {
  const result = await signInWithPopup(auth, googleAuthProvider);
  const idToken = await result.user.getIdToken();
  cachedIdToken = idToken;
  return { user: result.user, idToken };
}

export async function signOutGoogle(): Promise<void> {
  cachedIdToken = null;
  await signOut(auth);
}

export function subscribeFirebaseAuth(
  callback: (user: User | null, idToken: string | null) => void
): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const token = await user.getIdToken();
        cachedIdToken = token;
        callback(user, token);
      } catch {
        cachedIdToken = null;
        callback(null, null);
      }
    } else {
      cachedIdToken = null;
      callback(null, null);
    }
  });
}
