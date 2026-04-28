import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeScreen from "../screens/HomeScreen";
import ProgramDetailScreen from "../screens/ProgramDetailScreen";
import ProgramApplyScreen from "../screens/ProgramApplyScreen";
import ApplicantApplicationHistory from "../screens/ApplicantApplicationHistory";
import ProfileScreen from "../screens/ProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
      <HomeStack.Screen name="ProgramApply" component={ProgramApplyScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  );
}

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#5b5f97",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: { 
          backgroundColor: "#f3f3ff", 
          borderTopColor: "#ddd",
          height: 60 + Math.max(insets.bottom, 10),
          paddingBottom: 8 + Math.max(insets.bottom, 0),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: -4
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = focused ? "home" : "home-outline";
          else if (route.name === "Application") iconName = focused ? "clipboard" : "clipboard-outline";
          else if (route.name === "Profile") iconName = focused ? "person" : "person-outline";

          return <Ionicons name={iconName} size={size} color={color} style={{ marginBottom: -4 }} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="Application" component={ApplicantApplicationHistory} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
