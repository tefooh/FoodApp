// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVPm8jvSDGJGAnXvYD-canmkEc-DVY6s8",
  authDomain: "tempelate-d11ad.firebaseapp.com",
  projectId: "tempelate-d11ad",
  storageBucket: "tempelate-d11ad.firebasestorage.app",
  messagingSenderId: "560293001704",
  appId: "1:560293001704:web:0dee267ade7cb1d30d4c5d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
