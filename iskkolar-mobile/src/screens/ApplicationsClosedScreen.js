import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function ApplicationsClosedScreen({
  year = new Date().getFullYear(),
  onBack,
  onNavigateToNotifications,
  onNavigateToAccount,
}) {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  const handleNotificationsPress = () => {
    if (onNavigateToNotifications) {
      onNavigateToNotifications();
    } else {
      navigation.navigate("Notifications");
    }
  };

  const name = user?.firstName || user?.first_name || (user?.name ? user.name.split(' ')[0] : "User");

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}>
      {/* Upper Profile Header Section */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.userSubtitle}>Hello,</Text>
          <Text style={styles.userTitle}>{name}</Text>
        </View>
        <TouchableOpacity style={styles.iconBubble} activeOpacity={0.8} onPress={handleNotificationsPress}>
          <Ionicons name="notifications-outline" size={24} color="#1d2e57" />
          <View style={styles.notifyDot} />
        </TouchableOpacity>
      </View>

      {/* Decorative Top Space & Circles */}
      <View style={styles.headerSpacer} />

      {/* Stacked Circle Padlock Icon Layout */}
      <View style={styles.iconContainer}>
        {/* Floating background decorative dots */}
        <View style={styles.pinkDot} />
        <View style={styles.greyDot} />

        {/* Large translucent outer circle */}
        <View style={styles.outerCircle}>
          {/* Medium translucent middle circle */}
          <View style={styles.middleCircle}>
            {/* Inner solid circle containing padlock */}
            <View style={styles.innerCircle}>
              <Ionicons name="lock-closed" size={32} color="#5b6095" />
            </View>
          </View>
        </View>
      </View>

      {/* Pill Badge */}
      <View style={styles.badge}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeText}>Applications Closed</Text>
      </View>

      {/* Header Heading */}
      <Text style={styles.heading}>Applications are currently closed</Text>

      {/* Description Text */}
      <Text style={styles.description}>
        The scholarship application window for <Text style={styles.boldText}>{year}</Text> is not yet open. Please check back later or follow our announcements for updates on when applications will be accepted.
      </Text>

      {/* "What you can do now" lilac card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>WHAT YOU CAN DO NOW</Text>

        {/* Action item 1 */}
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={onNavigateToNotifications} 
          style={styles.actionItem}
        >
          <View style={styles.actionIconWrapper}>
            <Ionicons name="notifications" size={18} color="#f59e0b" />
          </View>
          <Text style={styles.actionText}>
            Check your <Text style={styles.boldText}>Notifications</Text> tab for announcements about the application period.
          </Text>
        </TouchableOpacity>

        {/* Action item 2 */}
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={onNavigateToAccount} 
          style={styles.actionItem}
        >
          <View style={styles.actionIconWrapper}>
            <Ionicons name="person" size={18} color="#6b21a8" />
          </View>
          <Text style={styles.actionText}>
            Update your <Text style={styles.boldText}>Account</Text> profile so you are ready when applications open.
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />

      {/* Sleek Primary Navigation Button at the Bottom */}
      <TouchableOpacity activeOpacity={0.8} onPress={onBack} style={styles.actionButton}>
        <Text style={styles.actionButtonText}>Return to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  userSubtitle: {
    fontSize: 16,
    color: "#7a82a0",
    fontWeight: "600",
    marginBottom: 2,
  },
  userTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#131b3e",
    letterSpacing: -0.5,
  },
  iconBubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f6f8fb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notifyDot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 10,
    height: 10,
    backgroundColor: "#e94e4e",
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerSpacer: {
    height: 15,
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 25,
  },
  pinkDot: {
    position: "absolute",
    top: 5,
    right: -15,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#fbcfe8",
    opacity: 0.8,
  },
  greyDot: {
    position: "absolute",
    bottom: 5,
    left: -20,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e2e8f0",
    opacity: 0.8,
  },
  outerCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(91, 96, 149, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  middleCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "rgba(91, 96, 149, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#eef0f7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    marginRight: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ef4444",
  },
  heading: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 32,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#64748b",
    textAlign: "center",
    paddingHorizontal: 8,
    marginBottom: 32,
  },
  boldText: {
    fontWeight: "700",
    color: "#1e293b",
  },
  infoCard: {
    width: "100%",
    backgroundColor: "#f4f5f9",
    borderWidth: 1,
    borderColor: "#e8ebf3",
    borderRadius: 18,
    padding: 20,
    marginTop: 5,
  },
  infoCardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4f5fc5",
    letterSpacing: 0.8,
    marginBottom: 15,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  actionIconWrapper: {
    marginRight: 12,
    marginTop: 2,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  actionButton: {
    width: "100%",
    backgroundColor: "#4f5fc5",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4f5fc5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "850",
  },
});
