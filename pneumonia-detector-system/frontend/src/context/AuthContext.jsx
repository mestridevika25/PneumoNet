import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseConfigError } from '../services/firebase';

const AuthContext = createContext(null);

const getReadableAuthError = (err) => {
  if (err?.message?.includes('Firebase is not configured')) return err.message;

  switch (err?.code) {
    case 'auth/api-key-not-valid':
      return 'Firebase API key is invalid. Check frontend/.env Firebase values and restart the dev server.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/user-not-found':
      return 'No account found for this email.';
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.';
    default:
      return err?.message?.replace('Firebase: ', '') || 'Authentication failed.';
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        setUser(u);
        setLoading(false);
      },
      () => {
        setUser(null);
        setLoading(false);
      },
    );

    // Failsafe to avoid indefinite loading on unexpected SDK init issues.
    const timer = setTimeout(() => setLoading(false), 4000);

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  const login = async (email, password) => {
    if (firebaseConfigError) {
      throw new Error(firebaseConfigError);
    }

    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw new Error(getReadableAuthError(err));
    }
  };

  const signup = async (email, password, displayName) => {
    if (firebaseConfigError) {
      throw new Error(firebaseConfigError);
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      return cred;
    } catch (err) {
      throw new Error(getReadableAuthError(err));
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
