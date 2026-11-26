import { Platform } from "react-native";

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBiSu-xHo8EcAFHE_Y321AbpRz08-5wyzQ",
  authDomain: "repair-series.firebaseapp.com",
  projectId: "repair-series",
  storageBucket: "repair-series.firebasestorage.app",
  messagingSenderId: "180059659434",
  appId: "1:180059659434:web:a03f46d8ce9ad56dc404d3",
  measurementId: "G-49R5V1V8X5",
};

/**
 * Resolves the backend Next.js API URL based on platform.
 * - Android Emulator uses 10.0.2.2
 * - Local physical device over WiFi uses the dev machine LAN IP
 * - iOS Simulator / Web uses localhost
 */
export const DEFAULT_API_BASE_URL = (() => {
  if (Platform.OS === "android") {
    // 10.0.2.2 is the Android Emulator alias to host machine localhost.
    // For physical testing over LAN, 192.168.1.40 is used.
    return "http://10.0.2.2:3000";
  }
  return "http://localhost:3000";
})();

export const NETWORK_LAN_API_URL = "http://192.168.1.40:3000";

export const APP_INFO = {
  name: "Repair Series Partner",
  version: "1.0.0",
  supportPhone: "+91 98765 43210",
  supportWhatsApp: "919876543210",
  supportEmail: "partner-support@repairseries.com",
  operatingCities: ["Gurugram", "Hyderabad", "Aligarh"],
};
