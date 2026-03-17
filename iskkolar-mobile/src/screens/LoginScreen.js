import React, { useState, useContext } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { getApiErrorMessage, login } from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const { loginUser } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Please enter email and password");

    setLoading(true);
    try {
      const response = await login(email, password);
      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        await loginUser(userData, token);
        Alert.alert("Success", "Logged in successfully!");
        navigation.replace("Home");
      } else {
        Alert.alert("Error", response.data.message || "Login failed");
      }
    } catch (err) {
      console.log(err.response?.data || err.message);
      Alert.alert("Error", getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      <Button title={loading ? "Logging in..." : "Login"} onPress={handleLogin} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#ffffff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: "#111111" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    color: "#111111",
    backgroundColor: "#ffffff",
  },
});