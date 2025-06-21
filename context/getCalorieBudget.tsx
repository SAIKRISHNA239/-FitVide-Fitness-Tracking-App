// utils/getCalorieBudget.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getCalorieBudget = async (): Promise<number> => {
  try {
    const custom = await AsyncStorage.getItem("customMacroTargets");
    const fallback = await AsyncStorage.getItem("macroTargets");

    const customParsed = custom ? JSON.parse(custom) : null;
    const fallbackParsed = fallback ? JSON.parse(fallback) : null;

    if (customParsed && customParsed.calories && customParsed.calories > 0) {
      return customParsed.calories;
    } else if (fallbackParsed && fallbackParsed.calories) {
      return fallbackParsed.calories;
    }

    return 3200; // default fallback
  } catch (err) {
    console.error("Error fetching calorie budget:", err);
    return 3200;
  }
};
