import AsyncStorage from "@react-native-async-storage/async-storage";

export const getLogs = async (key: string) => {
  try {
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error(`Failed to load ${key}`, err);
    return [];
  }
};

export const getExerciseLogs = () => getLogs("exerciseLogs");
export const getHydrationLogs = () => getLogs("hydrationLogs");
export const getDailyNutritionLogs = () => getLogs("dailyNutritionLogs");
export const getSleepLogs = () => getLogs("sleepLogs");
