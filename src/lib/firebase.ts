import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  projectId: "paintcrm-365b0",
  appId: "1:13098667229:web:e0cb35a8675a9d8d381f34",
  storageBucket: "paintcrm-365b0.firebasestorage.app",
  apiKey: "AIzaSyCg-cP4OVhTkv5ppnyrOBSfkB21_Lo24y8",
  authDomain: "paintcrm-365b0.firebaseapp.com",
  messagingSenderId: "13098667229",
  measurementId: "G-DNEL2EDZGM"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
