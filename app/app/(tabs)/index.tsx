import {
  Image,
  StyleSheet,
  Platform,
  View,
  Button,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { userSelector } from "@/redux/selectors/userSelector";
import { getUserAction, logoutAction } from "@/redux/reduxActions/userAction";
import * as SecureStore from "expo-secure-store";
import { useNavigation } from "@react-navigation/native";
import axiosInstance from "@/api/axiosConfig";
export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [isLightOn, setIsLightOn] = useState(false);
  const colorScheme = useColorScheme();
  const router = useRouter();
  const dispatch = useDispatch();

  const { user } = useSelector(userSelector);
  useEffect(() => {
    console.log("User", user);
  }, [user]);
  const checkToken = async () => {
    const token = await SecureStore.getItemAsync("secure_token");
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (token) {
      dispatch(getUserAction());
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: "login" }],
      });
    }
  };
  useEffect(() => {
    checkToken();
  }, []);
  return (
    <>
      <View style={styles.container}>
        <ThemedView style={{ flex: 1, padding: 16 }}>
          {/* User and Plate Information Section */}
          <ThemedView style={styles.infoSection}>
            <ThemedView style={{ flexDirection: "row", alignItems: "center" }}>
              <HelloWave />
              <ThemedText
                style={[
                  styles.infoTitle,
                  { color: colorScheme === "dark" ? "#ffffff" : "#000000" },
                ]}
              >
                Welcome back
              </ThemedText>
              <TouchableOpacity
                onPress={async () => {
                  await SecureStore.deleteItemAsync("secure_token");
                  dispatch(logoutAction());
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "login" }],
                  });
                }}
                style={{
                  marginLeft: "auto",
                  padding: 10,
                  backgroundColor: "rgba(255, 107, 107, 0.1)",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "rgba(255, 107, 107, 0.3)",
                  paddingHorizontal: 16,
                  elevation: 1,
                  shadowColor: "#FF6B6B",
                }}
              >
                <ThemedText
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#FF6B6B",
                  }}
                >
                  Logout
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
            <ThemedView style={styles.licensePlateContainer}>
              <ThemedText style={styles.licensePlateText}>
                PLATE: {user?.numberPlate}
              </ThemedText>
              <ThemedText style={[styles.licensePlateText, { marginTop: 8 }]}>
                USER: {user?.name}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Binance Withdrawal Section */}
          <ThemedView style={styles.infoSection}>
            <ThemedView
              style={[
                styles.licensePlateContainer,
                {
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  marginBottom: 16,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.licensePlateText,
                  {
                    textAlign: "center",
                    fontSize: 18,
                    marginBottom: 8,
                  },
                ]}
              >
                Account Balance
              </ThemedText>
              <ThemedText
                style={{
                  textAlign: "center",
                  color: "#047857",
                  fontSize: 24,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                {user?.money} VNĐ
              </ThemedText>
            </ThemedView>

            <ThemedView style={{ flexDirection: "row", gap: 16 }}>
              <TouchableOpacity
                style={[
                  styles.licensePlateContainer,
                  {
                    flex: 1,
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    borderColor: "rgba(16, 185, 129, 0.3)",
                  },
                ]}
                onPress={() => router.navigate("/deposit")}
              >
                <ThemedText
                  style={[
                    styles.licensePlateText,
                    {
                      textAlign: "center",
                      color: "#047857",
                      marginBottom: 8,
                    },
                  ]}
                >
                  Deposit Funds
                </ThemedText>
                <ThemedText
                  style={{
                    textAlign: "center",
                    color: "#047857",
                    fontSize: 14,
                  }}
                >
                  Add money
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.licensePlateContainer,
                  {
                    flex: 1,
                    backgroundColor: "rgba(247, 223, 30, 0.1)",
                    borderColor: "rgba(247, 223, 30, 0.3)",
                  },
                ]}
                onPress={() => router.navigate("/withdraw")}
              >
                <ThemedText
                  style={[
                    styles.licensePlateText,
                    {
                      textAlign: "center",
                      color: "#B8860B",
                      marginBottom: 8,
                    },
                  ]}
                >
                  Withdraw Funds
                </ThemedText>
                <ThemedText
                  style={{
                    textAlign: "center",
                    color: "#047857",
                    fontSize: 14,
                  }}
                >
                  Transfer to bank
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  infoSection: {
    marginTop: 50,
    gap: 16,
  },
  infoTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#000000",
    letterSpacing: 0.5,
  },
  licensePlateContainer: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  licensePlateText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#047857",
    fontSize: 16,
    fontWeight: "600",
  },
});
