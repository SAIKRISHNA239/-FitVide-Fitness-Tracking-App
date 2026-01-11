import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface NutritionData {
  protein: number;
  carbs: number;
  fats: number;
  calories: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
}

const defaultValues: NutritionData = {
  protein: 0,
  carbs: 0,
  fats: 0,
  calories: {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
  },
};

const NutritionContext = createContext<{
  data: NutritionData;
  updateData: (newData: Partial<NutritionData>) => void;
  updateMeal: (meal: keyof NutritionData["calories"], value: number) => void;
} | null>(null);

export const useNutrition = () => {
  const context = useContext(NutritionContext);
  if (!context) throw new Error("useNutrition must be used inside NutritionProvider");
  return context;
};

export const NutritionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<NutritionData>(defaultValues);
  const { user } = useAuth();

  // Load from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        const { data: nutritionData, error } = await supabase
          .from('profiles')
          .select('macro_targets, custom_macro_targets')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error loading nutrition data:', error);
          return;
        }

        // Nutrition data is stored in profiles table, but we calculate from meals
        // This context is mainly for real-time updates from meal logging
        // The actual data comes from meals table
      } catch (error) {
        console.error('Error loading nutrition data:', error);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user]);

  // Save to Supabase whenever data changes (for caching/quick access)
  useEffect(() => {
    const saveData = async () => {
      if (!user) return;
      
      try {
        // Note: We don't save nutrition data to profiles anymore
        // It's calculated from meals table in real-time
        // This is kept for backward compatibility and local state management
      } catch (error) {
        console.error('Error saving nutrition data:', error);
      }
    };
    
    // Only save if user is logged in and data has meaningful values
    if (user && (data.protein > 0 || data.carbs > 0 || data.fats > 0)) {
      // Debounce saves to avoid too many writes
      const timeoutId = setTimeout(saveData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [data, user]);

  const updateData = (newData: Partial<NutritionData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const updateMeal = (meal: keyof NutritionData["calories"], value: number) => {
    setData((prev) => ({
      ...prev,
      calories: {
        ...prev.calories,
        [meal]: value,
      },
    }));
  };

  return (
    <NutritionContext.Provider value={{ data, updateData, updateMeal }}>
      {children}
    </NutritionContext.Provider>
  );
};
