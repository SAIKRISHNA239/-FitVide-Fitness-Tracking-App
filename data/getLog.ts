import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";

export const getLogs = async (collectionName: string) => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const logsCollectionRef = collection(db, collectionName, user.uid, "logs");
    const snapshot = await getDocs(logsCollectionRef);
    return snapshot.docs.map(doc => doc.data());
  } catch (err) {
    console.error(`Failed to load ${collectionName}`, err);
    return [];
  }
};

export const getExerciseLogs = () => getLogs("exerciseLogs");
export const getHydrationLogs = () => getLogs("hydrationLogs");
export const getDailyNutritionLogs = () => getLogs("dailyNutritionLogs");
export const getSleepLogs = () => getLogs("sleepLogs");