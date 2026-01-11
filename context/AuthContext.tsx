// context/AuthContext.tsx
// Refactored for Supabase Auth with Google OAuth
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  googleLogin: () => Promise<void>;
  signInWithGoogle: () => Promise<void>; // Alias for backward compatibility
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  deleteAccount: async () => {},
  googleLogin: async () => {},
  signInWithGoogle: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    // Always clear user state, even if Supabase signOut fails
    // This ensures the user is logged out locally regardless of network issues
    try {
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Supabase signOut error (continuing with local logout):', error);
        // Don't throw - we'll still clear local state
      }
    } catch (error) {
      console.warn('Logout error (continuing with local logout):', error);
      // Don't throw - we'll still clear local state
    } finally {
      // ALWAYS clear user state, even if Supabase fails
      // This ensures the UI updates and user is logged out locally
      setUser(null);
      setLoading(false);
      
      // On web, explicitly clear localStorage to ensure session is removed
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        try {
          // Clear all Supabase-related keys from localStorage
          const keysToRemove: string[] = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key && (key.includes('supabase') || key.includes('sb-'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => {
            try {
              window.localStorage.removeItem(key);
            } catch (e) {
              console.warn(`Failed to remove ${key} from localStorage:`, e);
            }
          });
        } catch (error) {
          console.warn('Error clearing localStorage:', error);
        }
      }
      
      // Force a session check to ensure state is synced
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // If session still exists, try signOut again
          await supabase.auth.signOut();
          // Clear localStorage again after second signOut attempt
          if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
            try {
              const keysToRemove: string[] = [];
              for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                if (key && (key.includes('supabase') || key.includes('sb-'))) {
                  keysToRemove.push(key);
                }
              }
              keysToRemove.forEach(key => window.localStorage.removeItem(key));
            } catch (e) {
              // Ignore
            }
          }
        }
      } catch (error) {
        // Ignore errors - we've already cleared local state
        console.warn('Session check error during logout:', error);
      }
    }
  };

  const googleLogin = async () => {
    try {
      // Generate redirect URL using expo-auth-session with fitvide scheme
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'fitvide',
        path: 'auth/callback',
      });

      // Use Supabase OAuth with Google provider
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      // On mobile, the OAuth flow will complete via deep link
      // On web, it will redirect to the callback URL
      // The session will be handled by onAuthStateChange
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  // Alias for backward compatibility
  const signInWithGoogle = googleLogin;

  const deleteAccount = async () => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      // Call the RPC function to delete user account
      const { error } = await supabase.rpc('delete_user');

      if (error) {
        console.error('Error deleting account:', error);
        
        // Handle authentication errors
        if (error.message?.includes('authentication') || error.code === 'PGRST301') {
          throw new Error('Please log out and log back in to delete your account.');
        }
        
        throw error;
      }

      // Sign out after successful deletion
      // The user will be automatically removed from auth.users
      // All related data will be cascade deleted
      await supabase.auth.signOut();
      setUser(null);
    } catch (error: any) {
      console.error('Delete Account Error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, deleteAccount, googleLogin, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
