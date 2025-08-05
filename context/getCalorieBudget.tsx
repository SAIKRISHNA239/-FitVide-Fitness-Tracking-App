// context/getCalorieBudget.tsx
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export const getCalorieBudget = async (): Promise<number> => {
  const user = auth.currentUser;
  if (!user) return 3200; // Default if not logged in

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.customMacroTargets && data.customMacroTargets.calories > 0) {
        return data.customMacroTargets.calories;
      }
      if (data.macroTargets && data.macroTargets.calories > 0) {
        return data.macroTargets.calories;
      }
    }
    return 3200; // Default fallback
  } catch (err) {
    console.error("Error fetching calorie budget:", err);
    return 3200;
  }
};