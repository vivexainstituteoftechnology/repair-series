import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
// @ts-ignore
import { getReactNativePersistence } from "@firebase/auth/dist/rn/index.js";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FIREBASE_CONFIG } from "../config/env";

const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();

let authInstance;
try {
  // Use AsyncStorage persistence for React Native session persistence across app restarts
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}

export const firebaseApp = app;
export const auth = authInstance;
export const db = getFirestore(app);
