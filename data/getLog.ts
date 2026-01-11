// data/getLog.ts
// Updated for Supabase - Note: This file may need further updates based on your schema
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// Helper function to get logs from Supabase
// Note: You may need to create additional tables for hydration, sleep, etc.
export const getExerciseLogs = async (limitCount: number = 30) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_sets (*)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.error('Failed to load exercise logs', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error(`Failed to load exercise logs`, err);
    return [];
  }
};

// Placeholder functions - you'll need to create tables for these
export const getHydrationLogs = async () => {
  // TODO: Create hydration_logs table if needed
  console.warn('getHydrationLogs: Table not yet created in Supabase');
  return [];
};

export const getDailyNutritionLogs = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('meals')
      .select(`
        *,
        meal_items (*)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Failed to load nutrition logs', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error(`Failed to load nutrition logs`, err);
    return [];
  }
};

export const getSleepLogs = async () => {
  // TODO: Create sleep_logs table if needed
  console.warn('getSleepLogs: Table not yet created in Supabase');
  return [];
};
