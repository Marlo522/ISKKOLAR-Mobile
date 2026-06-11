import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";

export default function SplashScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, isHydrated } = useContext(AuthContext);
  const [showWelcome, setShowWelcome] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const welcomeFade = useRef(new Animated.Value(0)).current;
  const welcomeSlide = useRef(new Animated.Value(40)).current;

  // Entry animation for loader logo
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 30,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Loop pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (user) {
      // If remember me kept them logged in, bypass welcome/login and auto-route
      const timer = setTimeout(() => {
        if (user.role === "applicant") {
          navigation.replace("Main");
        } else if (user.role === "scholar") {
          navigation.replace("ScholarTabs");
        } else if (user.role === "terminated") {
          navigation.replace("Terminated");
        } else {
          setShowWelcome(true);
        }
      }, 2400); // Slightly adjusted to allow animation to show
      return () => clearTimeout(timer);
    } else {
      // User is logged out, show welcome screen after duration
      const timer = setTimeout(() => setShowWelcome(true), 3000); // 3 seconds to let pulse run once/twice
      return () => clearTimeout(timer);
    }
  }, [isHydrated, user, navigation]);

  // Trigger welcome screen animations when it is shown
  useEffect(() => {
    if (showWelcome) {
      Animated.parallel([
        Animated.timing(welcomeFade, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(welcomeSlide, {
          toValue: 0,
          friction: 6,
          tension: 25,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showWelcome]);

  const handleRegister = () => navigation.navigate("Signup");
  const handleLogin = () => navigation.navigate("Login");

  if (!showWelcome) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <View style={styles.content}>
          <Animated.Image
            source={require("../../assets/images/logo.png")}
            style={[
              styles.logo,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: Animated.multiply(scaleAnim, pulseAnim) }
                ]
              }
            ]}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <Animated.View 
        style={[
          styles.top, 
          { 
            opacity: welcomeFade,
            transform: [{
              translateY: welcomeSlide.interpolate({
                inputRange: [0, 40],
                outputRange: [0, -15]
              })
            }]
          }
        ]}
      >
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logoSmall}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>
          75 Years of Faithful Mission,{"\n"}Changing Lives with Purpose and Compassion
        </Text>
      </Animated.View>

      <Animated.View 
        style={[
          styles.bottom, 
          { 
            opacity: welcomeFade,
            transform: [{ translateY: welcomeSlide }]
          }
        ]}
      >
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
      </Animated.View>
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
    width: 320,
    height: 320,
    marginBottom: 20,
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
    width: 220,
    height: 220,
    marginBottom: 18,
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