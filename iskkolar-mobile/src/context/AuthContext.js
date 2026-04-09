import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

    const loginUser = async (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    await SecureStore.setItemAsync("secure_token", jwt);
    await AsyncStorage.setItem("user", JSON.stringify(userData));
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