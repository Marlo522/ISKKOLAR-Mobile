// src/navigation/AppNavigator.js
import React from "react";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import RoleSelectionScreen from "../screens/RoleSelectionScreen";
import ScholarTabs from "./ScholarTabs";
import MainTabs from "./MainTabs";
import { AuthProvider } from "../context/AuthContext";

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ["iskkolarmobile://"],
  config: {
    screens: {
      ResetPassword: "reset-password",
      Login: "login",
      ForgotPassword: "forgot-password",
    },
  },
  // Custom parsing for Supabase style hash parameters
  getStateFromPath: (path, config) => {
    // If the path contains a #, it's likely Supabase hash params
    if (path.includes("#")) {
      const [realPath, hash] = path.split("#");
      const params = {};
      new URLSearchParams(hash).forEach((value, key) => {
        params[key] = value;
      });
      
      // Map to the correct screen
      if (realPath === "reset-password" || realPath === "/reset-password") {
        return {
          routes: [{ name: "ResetPassword", params }],
        };
      }
    }
    // Fallback to default
    return undefined; 
  }
};

export default function AppNavigator() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={DefaultTheme} linking={linking}>
          <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="ScholarTabs" component={ScholarTabs} />
            <Stack.Screen name="Main" component={MainTabs} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}