import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Modal, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * LoadingOverlay – A translucent modal overlay with a spinning icon and message.
 *
 * Props:
 *   visible  (bool)   – whether the overlay is shown
 *   message  (string) – text displayed below the spinner (default: "Processing…")
 */
export default function LoadingOverlay({ visible = false, message = "Processing…" }) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
    }
  }, [visible, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      hardwareAccelerated
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sync-circle" size={56} color="#4f5fc5" />
          </Animated.View>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(8, 13, 25, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: "center",
    shadowColor: "#080d19",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    minWidth: 200,
  },
  message: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "700",
    color: "#3d4076",
    textAlign: "center",
    letterSpacing: -0.2,
  },
});
