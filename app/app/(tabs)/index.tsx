import { Image, StyleSheet, Platform, View } from "react-native";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useState } from "react";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const [isLightOn, setIsLightOn] = useState(false);

  const router = useRouter();

  return (
    <>
      <View style={styles.container}>
        <ThemedView style={{ flex: 1, padding: 16 }}>
          {/* User and Plate Information Section */}
          <ThemedView style={styles.infoSection}>
            <ThemedView style={{ flexDirection: "row", alignItems: "center" }}>
              <HelloWave />
              <ThemedText style={styles.infoTitle}> Welcome back</ThemedText>
            </ThemedView>
            <ThemedView style={styles.licensePlateContainer}>
              <ThemedText style={styles.licensePlateText}>
                PLATE: ABC-1234
              </ThemedText>
              <ThemedText style={[styles.licensePlateText, { marginTop: 8 }]}>
                USER: John Doe
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
                $250.00
              </ThemedText>
            </ThemedView>

            <ThemedView style={{ flexDirection: "row", gap: 16 }}>
              {/* Deposit Option */}
              <ThemedView
                style={[
                  styles.licensePlateContainer,
                  {
                    flex: 1,
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    borderColor: "rgba(16, 185, 129, 0.3)",
                  },
                ]}
              >
                <ThemedText
                  onPress={() => {
                    router.push("/deposit");
                    console.log("Processing deposit");
                  }}
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
              </ThemedView>

              {/* Withdraw Option */}
              <ThemedView
                style={[
                  styles.licensePlateContainer,
                  {
                    flex: 1,
                    backgroundColor: "rgba(247, 223, 30, 0.1)",
                    borderColor: "rgba(247, 223, 30, 0.3)",
                  },
                ]}
              >
                <ThemedText
                  onPress={() => {
                    router.push("/withdraw");
                    console.log("Processing withdrawal");
                  }}
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
              </ThemedView>
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
