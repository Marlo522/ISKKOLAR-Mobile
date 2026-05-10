import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";

// Import existing screens
import ScholarDashboardScreen from "../screens/ScholarDashboardScreen";
import ProfileScreen from "../screens/ProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ScholarshipRenewalScreen from "../screens/ScholarshipRenewalScreen";
import ExamAssistanceScreen from "../screens/ExamAssistanceScreen";
import ActivitiesScreen from "../screens/ActivitiesScreen";
import ApplicationScreen from "../screens/ApplicationScreen";
import GradeComplianceScreen from "../screens/GradeComplianceScreen";
import FinancialRecordsScreen from "../screens/FinancialRecordsScreen";
import TransferSchoolScreen from "../screens/TransferSchoolScreen";
import VocationalDashboardScreen from "../screens/VocationalDashboardScreen";
import VocationalCompletionScreen from "../screens/VocationalCompletionScreen";

const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();

// Create a stack for the Scholar Dashboard so it can route to Notifications
function ScholarDashboardStackScreen() {
  const { user } = useContext(AuthContext);
  
  // Basic check for vocational status to decide which main dashboard to show
  const hasVocationalValue = (obj) => {
    if (!obj) return false;
    return Object.values(obj).some(val => {
      if (typeof val === 'string') return val.toLowerCase().includes('vocational');
      if (typeof val === 'object') return hasVocationalValue(val);
      return false;
    });
  };
  const isVocational = hasVocationalValue(user) || String(user?.program || '').toLowerCase().includes('vocational');

  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen 
        name="ScholarDashboardMain" 
        component={isVocational ? VocationalDashboardScreen : ScholarDashboardScreen} 
      />
      <DashboardStack.Screen name="ScholarshipRenewal" component={ScholarshipRenewalScreen} />
      <DashboardStack.Screen name="ExamAssistance" component={ExamAssistanceScreen} />
      <DashboardStack.Screen name="GradeCompliance" component={GradeComplianceScreen} />
      <DashboardStack.Screen name="FinancialRecords" component={FinancialRecordsScreen} />
      <DashboardStack.Screen name="TransferSchool" component={TransferSchoolScreen} />
      <DashboardStack.Screen name="Activities" component={ActivitiesScreen} />
      <DashboardStack.Screen name="Application" component={ApplicationScreen} />
      <DashboardStack.Screen name="VocationalCompletion" component={VocationalCompletionScreen} />
    </DashboardStack.Navigator>
  );
}

export default function ScholarTabs() {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);

  const hasVocationalValue = (obj) => {
    if (!obj) return false;
    return Object.values(obj).some(val => {
      if (typeof val === 'string') return val.toLowerCase().includes('vocational');
      if (typeof val === 'object') return hasVocationalValue(val);
      return false;
    });
  };

  const isVocational = hasVocationalValue(user);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#5b5f97",
        tabBarInactiveTintColor: "#a2aab8",
        tabBarStyle: { 
          backgroundColor: "#fff", 
          borderTopColor: "#e6eaf3",
          height: 60 + Math.max(insets.bottom, 10),
          paddingBottom: 8 + Math.max(insets.bottom, 0),
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
          else if (route.name === "Activities") iconName = focused ? "calendar" : "calendar-outline";
          else if (route.name === "Notifications") iconName = focused ? "notifications" : "notifications-outline";
          else if (route.name === "Application") iconName = focused ? "clipboard" : "clipboard-outline";
          else if (route.name === "Profile") iconName = focused ? "person" : "person-outline";

          return <Ionicons name={iconName} size={24} color={color} style={{ marginBottom: -4 }} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={ScholarDashboardStackScreen} />
      {!isVocational && <Tab.Screen name="Activities" component={ActivitiesScreen} />}
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      {!isVocational && <Tab.Screen name="Application" component={ApplicationScreen} />}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
