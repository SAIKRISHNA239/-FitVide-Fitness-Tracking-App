import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // ✅ Add this line

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDSqwezctereLQ3yM8vGX3NUWuE9zGsr_M",
  authDomain: "fitvide-f5e02.firebaseapp.com",
  projectId: "fitvide-f5e02",
  storageBucket: "fitvide-f5e02.appspot.com", // 🔁 FIXED: It was wrong
  messagingSenderId: "743430946246",
  appId: "1:743430946246:web:17b745e6250b82792746c7",
  measurementId: "G-8DF0CMQQ5P"
};

// ✅ Only initialize once (important in Expo Hot Reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ✅ Auth, Firestore and Storage
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // ✅ Initialize storage

// ✅ Export everything
export { app, auth, db, storage };
