import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    setUser(null);
    await AsyncStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};