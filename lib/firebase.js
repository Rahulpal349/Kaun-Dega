import { initializeApp, getApps, getApp } from '@firebase/app';
import { getAuth, GoogleAuthProvider } from '@firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBVFdYQlZWIijY1TMsGJJ49rVQMuWTncow",
  authDomain: "kaun-dega.firebaseapp.com",
  projectId: "kaun-dega",
  storageBucket: "kaun-dega.firebasestorage.app",
  messagingSenderId: "53793768201",
  appId: "1:53793768201:web:cf8f30379b73629cc7c9d8",
  measurementId: "G-ZVGTKZ8ZTS"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from '@firebase/auth';

export default app;
