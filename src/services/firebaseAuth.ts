import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export const TARGET_EMAIL = 'graphicspunching264@gmail.com';

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account',
  login_hint: TARGET_EMAIL
});

// Cache token in memory and local session
const TOKEN_STORAGE_KEY = 'gp_gmail_access_token';
const USER_STORAGE_KEY = 'gp_gmail_user_data';

let cachedAccessToken: string | null = (() => {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || null;
  } catch {
    return null;
  }
})();

let isSigningIn = false;

export interface AuthenticatedGoogleUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

export const initAuth = (
  onAuthSuccess?: (user: AuthenticatedGoogleUser, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  // Check if session had saved user
  try {
    const savedUserJson = sessionStorage.getItem(USER_STORAGE_KEY);
    const savedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (savedUserJson && savedToken && onAuthSuccess) {
      const savedUser = JSON.parse(savedUserJson);
      onAuthSuccess(savedUser, savedToken);
    }
  } catch {
    // Ignore storage parse errors
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const authUser: AuthenticatedGoogleUser = {
        uid: user.uid,
        displayName: user.displayName || 'Graphics Punching',
        email: user.email || TARGET_EMAIL,
        photoURL: user.photoURL
      };
      if (onAuthSuccess) {
        onAuthSuccess(authUser, cachedAccessToken);
      }
    } else {
      if (!cachedAccessToken) {
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

/**
 * Sign in using Firebase Auth GoogleAuthProvider popup.
 * Routes authentication through the authorized authDomain (firebaseapp.com),
 * avoiding the "Error 400: origin_mismatch" caused by direct GSI calls on preview URLs.
 */
export const googleSignIn = async (hintEmail: string = TARGET_EMAIL): Promise<{ 
  user: AuthenticatedGoogleUser; 
  accessToken: string 
}> => {
  isSigningIn = true;

  provider.setCustomParameters({
    prompt: 'select_account',
    login_hint: hintEmail
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Google sign-in succeeded, but no Gmail access token was returned. Please ensure you grant Gmail send and read permissions.');
    }

    cachedAccessToken = credential.accessToken;
    const user: AuthenticatedGoogleUser = {
      uid: result.user.uid,
      displayName: result.user.displayName || 'Graphics Punching',
      email: result.user.email || hintEmail,
      photoURL: result.user.photoURL
    };

    try {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, cachedAccessToken);
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Storage might be restricted in some sandboxed iframes
    }

    return { 
      user, 
      accessToken: cachedAccessToken 
    };
  } catch (error: any) {
    console.error('Firebase Google Sign-In error:', error);

    if (error?.code === 'auth/popup-blocked') {
      throw new Error(
        'The sign-in popup was blocked by your browser. Please allow popups for this site, or open the app in a new tab and try again.'
      );
    } else if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error(
        'Sign-in was closed before completion. Please click "Connect Gmail" again and select ' + hintEmail + '.'
      );
    } else if (error?.code === 'auth/cancelled-popup-request') {
      throw new Error('A sign-in popup was already open. Please complete authorization in that popup.');
    } else if (error?.code === 'auth/unauthorized-domain') {
      throw new Error(
        'This domain is not yet authorized in Firebase Auth. Please open the app in a new tab or contact support.'
      );
    }

    throw new Error(error?.message || 'Failed to authenticate with Google. Please try again.');
  } finally {
    isSigningIn = false;
  }
};

/**
 * Connect with a direct OAuth access token (useful for manual token setup or testing)
 */
export const connectWithManualToken = (
  token: string,
  email: string = TARGET_EMAIL,
  name: string = 'Graphics Punching'
): { user: AuthenticatedGoogleUser; accessToken: string } => {
  cachedAccessToken = token;
  const user: AuthenticatedGoogleUser = {
    uid: 'manual_' + Date.now(),
    displayName: name,
    email: email,
    photoURL: undefined
  };

  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage issues
  }

  return { user, accessToken: token };
};

export const getCachedAccessToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

export const getActiveAccessToken = getCachedAccessToken;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // Ignore storage issues
  }
};

export const setActiveAccessToken = setCachedAccessToken;

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Firebase signout error:', e);
  }
  setCachedAccessToken(null);
};

export const logOutFromGoogle = logout;
export const signInWithGoogle = googleSignIn;
export const initAuthListener = initAuth;

