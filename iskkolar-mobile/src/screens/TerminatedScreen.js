import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

export default function TerminatedScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logoutUser } = useContext(AuthContext);

  const handleLogout = async () => {
    await logoutUser();
    navigation.replace("Login");
  };

  const scholarName = user?.firstName
    ? `Dear ${user.firstName},`
    : "Dear Scholar,";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fc" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="ban" size={48} color="#ef4444" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Scholarship Terminated</Text>

          {/* Message */}
          <Text style={styles.message}>
            {scholarName} your scholarship has been terminated. You no longer have
            access to the scholar dashboard and its features.
          </Text>

          {/* Contact Assistance Box */}
          <View style={styles.assistanceBox}>
            <Text style={styles.assistanceTitle}>Need assistance?</Text>
            <Text style={styles.assistanceText}>
              If you believe this is a mistake or have questions, please contact
              the Kapatiran-Kaunlaran Foundation, Inc. (KKFI) office for further
              assistance.
            </Text>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          {/* Footer Branding */}
          <View style={styles.footer}>
            <View style={styles.footerDot} />
            <Text style={styles.footerText}>ISKKOLAR Systems</Text>
            <View style={styles.footerDot} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fc",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 32,
    paddingHorizontal: 28,
    paddingVertical: 36,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: "#5b5f97",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1f2654",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
    marginBottom: 28,
  },
  assistanceBox: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  assistanceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  assistanceText: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  logoutButton: {
    width: "100%",
    backgroundColor: "#5b5f97",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#5b5f97",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoutText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 48,
    opacity: 0.3,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#5b5f97",
    marginHorizontal: 8,
  },
  footerText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#5b5f97",
  },
});
