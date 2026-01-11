// context/getCalorieBudget.tsx
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export const getCalorieBudget = async (): Promise<number> => {
  try {
    // Get current user from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return 3200; // Default if not logged in

    const { data, error } = await supabase
      .from('profiles')
      .select('custom_macro_targets, macro_targets')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error("Error fetching calorie budget:", error);
      return 3200;
    }

    if (data?.custom_macro_targets?.calories > 0) {
      return data.custom_macro_targets.calories;
    }
    
    if (data?.macro_targets?.calories > 0) {
      return data.macro_targets.calories;
    }

    return 3200; // Default fallback
  } catch (err) {
    console.error("Error fetching calorie budget:", err);
    return 3200;
  }
};
