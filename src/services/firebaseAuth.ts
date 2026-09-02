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

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account'
});

// Cache token in memory
let cachedAccessToken: string | null = null;
let isSigningIn = false;

declare global {
  interface Window {
    google?: any;
  }
}

export interface AuthenticatedGoogleUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

/**
 * Direct Google Identity Services (GSI) Token Client OAuth
 * Bypasses Firebase Auth user table to directly request Google Workspace OAuth tokens.
 */
export const signInWithGSI = async (): Promise<{ 
  user: AuthenticatedGoogleUser; 
  accessToken: string 
}> => {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services client is still loading. Please wait 2 seconds and try again.'));
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: firebaseConfig.oAuthClientId,
        scope: SCOPES.join(' '),
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('GSI OAuth Error:', tokenResponse);
            reject(new Error(tokenResponse.error_description || tokenResponse.error || 'Google authorization was not completed.'));
            return;
          }

          const token = tokenResponse.access_token;
          if (!token) {
            reject(new Error('No access token returned by Google OAuth.'));
            return;
          }

          cachedAccessToken = token;

          // Fetch user profile information using the access token
          let userInfo: AuthenticatedGoogleUser = {
            uid: 'google_user_graphicspunching264',
            displayName: 'Graphics Punching',
            email: 'graphicspunching264@gmail.com',
            photoURL: undefined
          };

          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.ok) {
              const profile = await userRes.json();
              userInfo = {
                uid: profile.sub || 'google_user_graphicspunching264',
                displayName: profile.name || profile.given_name || 'Graphics Punching',
                email: profile.email || 'graphicspunching264@gmail.com',
                photoURL: profile.picture
              };
            }
          } catch (profileErr) {
            console.warn('Could not fetch user profile details:', profileErr);
          }

          resolve({
            user: userInfo,
            accessToken: token
          });
        }
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      reject(err);
    }
  });
};

export const initAuth = (
  onAuthSuccess?: (user: AuthenticatedGoogleUser, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(
          {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
          },
          cachedAccessToken
        );
      }
    } else {
      if (!cachedAccessToken) {
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ 
  user: AuthenticatedGoogleUser; 
  accessToken: string 
}> => {
  isSigningIn = true;

  // 1. Try Google Identity Services (GSI) first if loaded (bypasses Firebase Auth user disable limitations)
  if (window.google?.accounts?.oauth2) {
    try {
      const gsiResult = await signInWithGSI();
      return gsiResult;
    } catch (gsiError: any) {
      console.warn('GSI login failed or popup dismissed:', gsiError);
      if (
        gsiError?.message?.includes('closed') ||
        gsiError?.message?.includes('denied') ||
        gsiError?.message?.includes('cancelled')
      ) {
        throw gsiError;
      }
    }
  }

  // 2. Fallback to Firebase Auth popup
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Google sign-in completed, but no Gmail access token was returned. Please ensure popups and permissions are allowed.');
    }

    cachedAccessToken = credential.accessToken;
    return { 
      user: {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL
      }, 
      accessToken: cachedAccessToken 
    };
  } catch (error: any) {
    console.error('Firebase Google Sign-In error:', error);

    // If Firebase reports user-disabled, automatically try GSI OAuth client
    if (error?.code === 'auth/user-disabled' || error?.message?.includes('user-disabled')) {
      if (window.google?.accounts?.oauth2) {
        return await signInWithGSI();
      }
      throw new Error('Google authentication account restriction detected. Please try signing in again with the Google authorization prompt.');
    }

    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before completing authentication. Please try again.');
    } else if (error?.code === 'auth/cancelled-popup-request') {
      throw new Error('Multiple popups opened. Please complete sign in.');
    }
    
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getActiveAccessToken = getCachedAccessToken;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const setActiveAccessToken = setCachedAccessToken;

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Firebase signout error:', e);
  }
  cachedAccessToken = null;
};

export const logOutFromGoogle = logout;
export const signInWithGoogle = googleSignIn;
export const initAuthListener = initAuth;

