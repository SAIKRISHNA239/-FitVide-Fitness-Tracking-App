import React, { createContext, useContext, useState, useEffect } from "react";
import { db, auth } from "../firebase"; // adjust path as needed
import { doc, getDoc, setDoc } from "firebase/firestore";


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

  // Load from AsyncStorage on mount
 useEffect(() => {
  const loadData = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const docRef = doc(db, "nutrition", uid);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      setData(snapshot.data() as NutritionData);
    }
  };
  loadData();
}, []);


  // Save to AsyncStorage whenever data changes
  useEffect(() => {
  const saveData = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const docRef = doc(db, "nutrition", uid);
    await setDoc(docRef, data);
  };
  saveData();
}, [data]);

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
