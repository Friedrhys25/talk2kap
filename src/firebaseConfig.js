// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore"; // ← ADD THIS

const firebaseConfig = {
  apiKey: "AIzaSyCClZL4LQep_2AiJGLAsnq818DePxn9YT4",
  authDomain: "talk2kap-8c526.firebaseapp.com",
  databaseURL: "https://talk2kap-8c526-default-rtdb.firebaseio.com",
  projectId: "talk2kap-8c526",
  storageBucket: "talk2kap-8c526.firebasestorage.app",
  messagingSenderId: "608373284626",
  appId: "1:608373284626:web:9a24fc3e0b6aa2d6f5ddcb",
  measurementId: "G-4NGNTZQ24M"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);         // Realtime Database (keep for other pages)
export const firestore = getFirestore(app); // ← ADD THIS (Firestore for complaints)
export default app;