import React from "react";
import { NativeModules } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";

// Register background/killed state notification handler only if Firebase native module is linked
if (NativeModules.RNFBAppModule) {
  try {
    const messaging = require("@react-native-firebase/messaging").default;
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("FCM: Message handled in background or killed state:", remoteMessage);
      // Perform background actions if necessary, returning a promise
    });
  } catch (error) {
    console.warn("FCM: Failed to initialize background message handler:", error);
  }
}

export default function App() {
  return <AppNavigator />;
}