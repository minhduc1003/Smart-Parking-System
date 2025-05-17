import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
  Dimensions,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  useColorScheme as RNUseColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useDispatch, useSelector } from "react-redux";
import { loginAction } from "@/redux/reduxActions/userAction";
import { userSelector } from "@/redux/selectors/userSelector";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const user = useSelector(userSelector);
  const dispatch = useDispatch();
  const handleLogin = async () => {
    dispatch(loginAction(email, password));
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: "(tabs)" }],
      });
    }, 500);
  };

  const handleSignup = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "signup" }],
    });
  };

  const navigateToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "(tabs)" }],
    });
  };
  const theme = {
    backgroundColor: isDark ? "#121212" : "#fff",
    textColor: isDark ? "#e0e0e0" : "#333",
    subtitleColor: isDark ? "#a0a0a0" : "#666",
    inputBackground: isDark ? "#2a2a2a" : "#f9f9f9",
    inputBorder: isDark ? "#444" : "#e0e0e0",
    primaryColor: isDark ? "#10B981" : "#4ADE80",
    headerBackground: isDark ? "#047857" : "#059669",
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
                Welcome Back
              </Text>
              <Text style={[styles.subtitle, { color: theme.subtitleColor }]}>
                Sign in to continue
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

              <TouchableOpacity>
                <Text
                  style={[styles.forgotPassword, { color: theme.primaryColor }]}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primaryColor }]}
                onPress={handleLogin}
              >
                <Text style={styles.buttonText}>SIGN IN</Text>
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text
                  style={[styles.signupText, { color: theme.subtitleColor }]}
                >
                  Don't have an account?{" "}
                </Text>
                <TouchableOpacity>
                  <Text
                    style={[styles.signupLink, { color: theme.primaryColor }]}
                    onPress={handleSignup}
                  >
                    Sign Up
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
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 10,
  },
  formContainer: {
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 55,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    marginBottom: 30,
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
