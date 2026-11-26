import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldPresentAlert: true,
    shouldPresentSound: true,
    shouldPresentBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(
  partnerId?: string,
): Promise<string | null> {
  let token: string | null = null;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Job Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#C45508",
        sound: "default",
      });

      await Notifications.setNotificationChannelAsync("urgent_bookings", {
        name: "New Bookings",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 500, 250, 500],
        lightColor: "#C45508",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Failed to get push token for push notification!");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync().catch(
      (err) => {
        console.warn("Could not fetch Expo push token (emulator/dev environment):", err?.message);
        return null;
      },
    );

    token = tokenData?.data || null;

    if (token && partnerId) {
      const ref = doc(db, "technicians", partnerId);
      await updateDoc(ref, {
        expoPushToken: token,
        pushToken: token,
        fcmTokens: arrayUnion(token),
      }).catch((err) => {
        console.warn("Could not save push token to technician doc:", err);
      });
    }
  } catch (err) {
    console.warn("Error setting up push notifications:", err);
  }

  return token;
}

export function setupNotificationListeners(
  onNotification?: (notification: Notifications.Notification) => void,
  onResponse?: (response: Notifications.NotificationResponse) => void,
) {
  const notificationListener =
    Notifications.addNotificationReceivedListener((notification) => {
      onNotification?.(notification);
    });

  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      onResponse?.(response);
    });

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}
