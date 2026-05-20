import React, { createContext, useState, useEffect } from "react";
import { NativeModules } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deletePushToken } from "../services/pushNotificationService";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const normalizeUser = (value) => {
    if (!value || typeof value !== "object") return null;
    return {
      ...value,
      firstName: value.firstName || value.first_name || "",
      middleName: value.middleName || value.middle_name || "",
      lastName: value.lastName || value.last_name || "",
    };
  };

  useEffect(() => {
    let mounted = true;

    const hydrateSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");

        if (!mounted) return;

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(normalizeUser(parsedUser));
        }
      } catch (error) {
        if (!mounted) return;
        setUser(null);
      }
    };

    hydrateSession();

    return () => {
      mounted = false;
    };
  }, []);

  const loginUser = async (userData) => {
    const normalized = normalizeUser(userData);
    setUser(normalized);
    await AsyncStorage.setItem("user", JSON.stringify(normalized));
  };

  const logoutUser = async () => {
    try {
      // 1. Get FCM token and unregister it from backend before destroying session (only if Firebase is linked)
      if (NativeModules.RNFBAppModule) {
        const messaging = require("@react-native-firebase/messaging").default;
        const token = await messaging().getToken().catch(() => null);
        if (token) {
          await deletePushToken(token).catch(err => {
            console.warn("FCM: Failed to delete push token from backend during logout:", err);
          });
        }
      }
    } catch (error) {
      console.warn("FCM: Error clearing push token on logout:", error);
    }

    try {
      // 2. Call backend logout endpoint to clear HttpOnly session cookies
      await api.post("/auth/logout").catch(err => {
        console.warn("Auth: Server logout request failed:", err);
      });
    } catch (error) {
      console.warn("Auth: Error during server logout:", error);
    }

    // 3. Clear local state and Storage (always execute even if server requests fail)
    setUser(null);
    await AsyncStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};