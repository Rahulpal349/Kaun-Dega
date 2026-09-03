import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBVFdYQlZWIijY1TMsGJJ49rVQMuWTncow",
  authDomain: "kaun-dega.firebaseapp.com",
  projectId: "kaun-dega",
  storageBucket: "kaun-dega.firebasestorage.app",
  messagingSenderId: "53793768201",
  appId: "1:53793768201:web:cf8f30379b73629cc7c9d8",
  measurementId: "G-ZVGTKZ8ZTS"
};

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
