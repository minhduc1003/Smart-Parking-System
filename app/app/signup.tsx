import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleSignup = () => {
    // Add your signup logic here
    console.log("Signup attempt with:", email, password, confirmPassword);
    navigation.reset({
      index: 0,
      routes: [{ name: "(tabs)" }],
    });
  };

  const handleLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "login" }],
    });
  };

  const theme = {
    backgroundColor: isDark ? "#121212" : "#fff",
    textColor: isDark ? "#e0e0e0" : "#333",
    subtitleColor: isDark ? "#a0a0a0" : "#666",
    inputBackground: isDark ? "#2a2a2a" : "#f9f9f9",
    inputBorder: isDark ? "#444" : "#e0e0e0",
    primaryColor: isDark ? "#738bcc" : "#4c669f",
    headerBackground: isDark ? "#1f2937" : "#4c669f",
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View
          style={[
            styles.background,
            { backgroundColor: theme.headerBackground },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <View style={styles.logoContainer}>
              <Text style={styles.appName}>Smart Parking</Text>
            </View>

            <View
              style={[
                styles.formContainer,
                { backgroundColor: theme.backgroundColor },
              ]}
            >
              <Text style={[styles.title, { color: theme.textColor }]}>
                Create Account
              </Text>
              <Text style={[styles.subtitle, { color: theme.subtitleColor }]}>
                Sign up to get started
              </Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.textColor }]}>
                  Email
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.textColor,
                    },
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={isDark ? "#707070" : "#a0a0a0"}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.textColor }]}>
                  Password
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.textColor,
                    },
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={isDark ? "#707070" : "#a0a0a0"}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.textColor }]}>
                  Confirm Password
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.textColor,
                    },
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor={isDark ? "#707070" : "#a0a0a0"}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primaryColor }]}
                onPress={handleSignup}
              >
                <Text style={styles.buttonText}>SIGN UP</Text>
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={[styles.signupText, { color: theme.textColor }]}>
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity onPress={handleLogin}>
                  <Text
                    style={[styles.signupLink, { color: theme.primaryColor }]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

// Using dimensions for responsive design
const dimensions = Dimensions.get("window");
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
  },
  keyboardView: {
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 20,
  },
  appName: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 10,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 40,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  button: {
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});
