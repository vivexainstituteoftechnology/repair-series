import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { BookingProvider } from "./src/context/BookingContext";
import { WalletProvider } from "./src/context/WalletContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BookingProvider>
          <WalletProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </WalletProvider>
        </BookingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
