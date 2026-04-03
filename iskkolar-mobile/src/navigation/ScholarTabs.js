import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

// Import existing screens
import ScholarDashboardScreen from "../screens/ScholarDashboardScreen";
import ActivitiesScreen from "../screens/ActivitiesScreen";
import ApplicationScreen from "../screens/ApplicationScreen";
import ProfileScreen from "../screens/ProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ScholarshipRenewalScreen from "../screens/ScholarshipRenewalScreen";
import ExamAssistanceScreen from "../screens/ExamAssistanceScreen";
import GradeComplianceScreen from "../screens/GradeComplianceScreen";
import FinancialRecordsScreen from "../screens/FinancialRecordsScreen";

const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();

// Create a stack for the Scholar Dashboard so it can route to Notifications
function ScholarDashboardStackScreen() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="ScholarDashboardMain" component={ScholarDashboardScreen} />
      <DashboardStack.Screen name="Notifications" component={NotificationsScreen} />
      <DashboardStack.Screen name="ScholarshipRenewal" component={ScholarshipRenewalScreen} />
      <DashboardStack.Screen name="ExamAssistance" component={ExamAssistanceScreen} />
      <DashboardStack.Screen name="GradeCompliance" component={GradeComplianceScreen} />
      <DashboardStack.Screen name="FinancialRecords" component={FinancialRecordsScreen} />
    </DashboardStack.Navigator>
  );
}

export default function ScholarTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#5b5f97",
        tabBarInactiveTintColor: "#a2aab8",
        tabBarStyle: { 
          backgroundColor: "#fff", 
          borderTopColor: "#e6eaf3",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: "#1d2e57",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
          elevation: 10
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: -4
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = focused ? "home" : "home-outline";
          else if (route.name === "Activities") iconName = focused ? "clipboard" : "clipboard-outline";
          else if (route.name === "Application") iconName = focused ? "document-text" : "document-text-outline";
          else if (route.name === "Profile") iconName = focused ? "person" : "person-outline";

          return <Ionicons name={iconName} size={24} color={color} style={{ marginBottom: -4 }} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={ScholarDashboardStackScreen} />
      <Tab.Screen name="Activities" component={ActivitiesScreen} />
      <Tab.Screen name="Application" component={ApplicationScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
