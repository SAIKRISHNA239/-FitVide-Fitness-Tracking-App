import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../firebase";

export const getLogs = async (collectionName: string, limitCount?: number) => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const logsCollectionRef = collection(db, collectionName, user.uid, "logs");
    let q = query(logsCollectionRef, orderBy("date", "desc"));
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (err) {
    console.error(`Failed to load ${collectionName}`, err);
    return [];
  }
};

export const getExerciseLogs = () => getLogs("exerciseLogs", 30);
export const getHydrationLogs = () => getLogs("hydrationLogs", 30);
export const getDailyNutritionLogs = () => getLogs("dailyNutritionLogs", 30);
export const getSleepLogs = () => getLogs("sleepLogs", 30);