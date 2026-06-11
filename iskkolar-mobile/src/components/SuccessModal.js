import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SuccessModal({ visible, title, message, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={36} color="#10b981" />
          </View>
          <Text style={styles.title}>{title || "Success!"}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(8, 13, 25, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    shadowColor: "#080d19",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ecfdf5",
    borderWidth: 3,
    borderColor: "#a7f3d0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#080d19",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    color: "#4f566b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#5b61a7",
    width: "100%",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#5b61a7",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
  },
});
