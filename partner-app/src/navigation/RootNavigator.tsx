import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../config/theme";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { PartnerRegisterScreen } from "../screens/auth/PartnerRegisterScreen";
import { PendingApprovalScreen } from "../screens/auth/PendingApprovalScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import { JobDetailScreen } from "../screens/jobs/JobDetailScreen";
import { RequestPayoutScreen } from "../screens/earnings/RequestPayoutScreen";
import { CashSettlementScreen } from "../screens/earnings/CashSettlementScreen";
import { PartnerSupportScreen } from "../screens/profile/PartnerSupportScreen";

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { partnerDoc, isLoading, verificationStatus } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!partnerDoc ? (
          // Unauthenticated / Auth Flow
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={PartnerRegisterScreen} />
          </>
        ) : verificationStatus !== "active" && verificationStatus !== "approved" ? (
          // Partner registered but awaiting admin verification
          <>
            <Stack.Screen
              name="PendingApproval"
              component={PendingApprovalScreen}
            />
            <Stack.Screen
              name="Register"
              component={PartnerRegisterScreen}
              options={{ animation: "slide_from_right" }}
            />
          </>
        ) : (
          // Active Partner Authenticated Main App
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="JobDetail"
              component={JobDetailScreen}
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="RequestPayout"
              component={RequestPayoutScreen}
              options={{ animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="CashSettlement"
              component={CashSettlementScreen}
              options={{ animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="PartnerSupport"
              component={PartnerSupportScreen}
              options={{ animation: "slide_from_right" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
