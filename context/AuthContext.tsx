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
  signInWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  deleteAccount: async () => {},
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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Clear user state immediately
      setUser(null);
    } catch (error) {
      console.error('Logout Error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Generate redirect URL based on platform
      let redirectTo: string;
      
      if (Platform.OS === 'web') {
        // For web, use the current origin
        if (typeof window !== 'undefined') {
          redirectTo = `${window.location.origin}/auth/callback`;
        } else {
          // Fallback for SSR
          redirectTo = AuthSession.makeRedirectUri({
            scheme: 'fitvide',
            path: 'auth/callback',
          });
        }
      } else {
        // For mobile, use expo-auth-session to generate redirect URI
        const redirectUri = AuthSession.makeRedirectUri({
          scheme: 'fitvide',
          path: 'auth/callback',
        });
        redirectTo = redirectUri;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
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
    <AuthContext.Provider value={{ user, loading, logout, deleteAccount, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
