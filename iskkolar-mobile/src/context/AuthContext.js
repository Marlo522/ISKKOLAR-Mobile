import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

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
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem("user"),
          SecureStore.getItemAsync("secure_token"),
        ]);

        if (!mounted) return;

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(normalizeUser(parsedUser));
        }

        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        if (!mounted) return;
        setUser(null);
        setToken(null);
      }
    };

    hydrateSession();

    return () => {
      mounted = false;
    };
  }, []);

  const loginUser = async (userData, jwt) => {
    const normalized = normalizeUser(userData);
    setUser(normalized);
    setToken(jwt);
    await SecureStore.setItemAsync("secure_token", jwt);
    await AsyncStorage.setItem("user", JSON.stringify(normalized));
  };

  const logoutUser = async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync("secure_token");
    await AsyncStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};