// lib/supabase.ts
// Supabase client with platform-specific storage for Expo
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Import URL polyfill for React Native (needed for Supabase)
if (Platform.OS !== 'web') {
  try {
    require('react-native-url-polyfill/auto');
  } catch (e) {
    // Polyfill not installed, but may not be needed for newer Supabase versions
    console.warn('react-native-url-polyfill not found. If you encounter URL errors, install it: npm install react-native-url-polyfill');
  }
}

// Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Platform-specific storage adapter
// Uses expo-secure-store for native, localStorage for web
const createStorageAdapter = () => {
  // Web platform: use localStorage
  if (Platform.OS === 'web') {
    return {
      getItem: async (key: string): Promise<string | null> => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Error reading from localStorage:', error);
          return null;
        }
      },
      setItem: async (key: string, value: string): Promise<void> => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error writing to localStorage:', error);
          throw error;
        }
      },
      removeItem: async (key: string): Promise<void> => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      },
    };
  }

  // Native platform: use expo-secure-store with chunking for large values
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const SecureStore = require('expo-secure-store');

  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        // Try to get the main key
        const value = await SecureStore.getItemAsync(key);
        if (value) return value;

        // If not found, check for chunked values
        const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
        if (!chunkCount) return null;

        const chunks: string[] = [];
        const count = parseInt(chunkCount, 10);
        
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
          if (chunk) {
            chunks.push(chunk);
          } else {
            // If any chunk is missing, return null
            return null;
          }
        }

        return chunks.join('');
      } catch (error) {
        console.error('Error reading from SecureStore:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        // SecureStore has a 2KB limit per item
        // If value is small enough, store directly
        if (value.length <= 2000) {
          await SecureStore.setItemAsync(key, value);
          // Clean up any existing chunks
          const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
          if (chunkCount) {
            const count = parseInt(chunkCount, 10);
            for (let i = 0; i < count; i++) {
              await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
            }
            await SecureStore.deleteItemAsync(`${key}_chunks`);
          }
          return;
        }

        // For large values, split into chunks
        const chunkSize = 2000;
        const chunks: string[] = [];
        
        for (let i = 0; i < value.length; i += chunkSize) {
          chunks.push(value.slice(i, i + chunkSize));
        }

        // Store chunk count
        await SecureStore.setItemAsync(`${key}_chunks`, chunks.length.toString());

        // Store each chunk
        for (let i = 0; i < chunks.length; i++) {
          await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunks[i]);
        }

        // Remove the direct key if it exists
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error('Error writing to SecureStore:', error);
        throw error;
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        // Remove main key
        await SecureStore.deleteItemAsync(key);

        // Remove chunked values
        const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
        if (chunkCount) {
          const count = parseInt(chunkCount, 10);
          for (let i = 0; i < count; i++) {
            await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
          }
          await SecureStore.deleteItemAsync(`${key}_chunks`);
        }
      } catch (error) {
        console.error('Error removing from SecureStore:', error);
      }
    },
  };
};

// Create storage adapter based on platform
const storageAdapter = createStorageAdapter();

// Create Supabase client with platform-specific storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web', // Enable for web to handle OAuth redirects
  },
});

// Export types for use throughout the app
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          age: number | null;
          gender: string | null;
          height: number | null;
          weight: number | null;
          activity: string | null;
          goal: string | null;
          macro_targets: any | null;
          custom_macro_targets: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          age?: number | null;
          gender?: string | null;
          height?: number | null;
          weight?: number | null;
          activity?: string | null;
          goal?: string | null;
          macro_targets?: any | null;
          custom_macro_targets?: any | null;
        };
        Update: {
          id?: string;
          age?: number | null;
          gender?: string | null;
          height?: number | null;
          weight?: number | null;
          activity?: string | null;
          goal?: string | null;
          macro_targets?: any | null;
          custom_macro_targets?: any | null;
        };
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          workout_name: string;
          region: string | null;
          level: string | null;
          exercise_name: string;
          duration: number | null;
          tag: string | null;
          intensity: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          workout_name: string;
          region?: string | null;
          level?: string | null;
          exercise_name: string;
          duration?: number | null;
          tag?: string | null;
          intensity?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          workout_name?: string;
          region?: string | null;
          level?: string | null;
          exercise_name?: string;
          duration?: number | null;
          tag?: string | null;
          intensity?: number | null;
        };
      };
      workout_sets: {
        Row: {
          id: string;
          workout_id: string;
          set_order: number;
          reps: number;
          weight: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          set_order: number;
          reps: number;
          weight: number;
        };
        Update: {
          id?: string;
          workout_id?: string;
          set_order?: number;
          reps?: number;
          weight?: number;
        };
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          meal_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          meal_type: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          meal_type?: string;
        };
      };
      meal_items: {
        Row: {
          id: string;
          meal_id: string;
          name: string;
          quantity: number;
          serving_size: number;
          serving_unit: string;
          calories: number;
          protein: number;
          carbs: number;
          fats: number;
          fiber: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_id: string;
          name: string;
          quantity: number;
          serving_size: number;
          serving_unit: string;
          calories: number;
          protein: number;
          carbs: number;
          fats: number;
          fiber?: number;
        };
        Update: {
          id?: string;
          meal_id?: string;
          name?: string;
          quantity?: number;
          serving_size?: number;
          serving_unit?: string;
          calories?: number;
          protein?: number;
          carbs?: number;
          fats?: number;
          fiber?: number;
        };
      };
    };
  };
};
