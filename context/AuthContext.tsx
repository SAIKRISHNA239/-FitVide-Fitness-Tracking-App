// context/AuthContext.tsx
// Refactored for Supabase Auth
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  deleteAccount: async () => {},
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

  const deleteAccount = async () => {
    try {
      // Note: User deletion from auth.users requires Admin API
      // For client-side, we'll delete all user data and then sign out
      // The actual auth.users deletion should be done via backend/edge function
      
      if (!user) {
        throw new Error('No user logged in');
      }

      // All data will be cascade deleted when user is deleted from auth.users
      // For now, we sign out - actual user deletion requires Admin API
      // In production, create an Edge Function to handle this securely
      
      await supabase.auth.signOut();
      
      // Note: To fully delete the user account, you need to:
      // 1. Create a Supabase Edge Function that uses service role key
      // 2. Call supabase.auth.admin.deleteUser(user.id) in that function
      // 3. Call that Edge Function from here
      
    } catch (error: any) {
      console.error('Delete Account Error:', error);
      
      // Handle requires-recent-login equivalent
      if (error?.message?.includes('authentication') || error?.code === 'PGRST301') {
        throw new Error('Please log out and log back in to delete your account.');
      }
      
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
