import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function SplashScreen() {
  const navigation = useNavigation();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(true), 2600);
    return () => clearTimeout(timer);
  }, []);

  const handleRegister = () => navigation.navigate("Signup");
  const handleLogin = () => navigation.navigate("Login");

  if (!showWelcome) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <View style={styles.content}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>ISKKOLAR</Text>
      </View>
    </View>
  );
}

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <View style={styles.top}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logoSmall}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>
          75 Years of Faithful Mission,{"\n"}Changing Lives with Purpose and Compassion
        </Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Welcome!</Text>
          <Text style={styles.welcomeSubtitle}>
            Make all student transactions easier just stay at home.
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
            <Text style={styles.primaryButtonText}>REGISTER</Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <Text style={styles.rowText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.linkText}>Log in here.</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#3d4076",
  },
  top: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  logoSmall: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  tagline: {
    textAlign: "center",
    color: "#333",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  bottom: {
    backgroundColor: "#5b5f97",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 26,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#5b5f97",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  rowText: {
    color: "#667084",
    fontSize: 13,
  },
  linkText: {
    color: "#5b5f97",
    fontSize: 13,
    fontWeight: "600",
  },
});