import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../config/theme";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { JobsScreen } from "../screens/jobs/JobsScreen";
import { EarningsScreen } from "../screens/earnings/EarningsScreen";
import { AlertsScreen } from "../screens/alerts/AlertsScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { useBookings } from "../context/BookingContext";

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  const { newRequests } = useBookings();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsScreen}
        options={{
          tabBarLabel: "Jobs",
          tabBarBadge: newRequests.length > 0 ? newRequests.length : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.primary,
            fontSize: 10,
            color: COLORS.textInverse,
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          tabBarLabel: "Earnings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          tabBarLabel: "Alerts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
