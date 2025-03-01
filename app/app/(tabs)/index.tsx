import { Image, StyleSheet, Platform, View } from "react-native";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useState } from "react";

export default function HomeScreen() {
  const [isLightOn, setIsLightOn] = useState(false);
  return (
    <>
      <View style={styles.container}>
        <ThemedView style={{ flex: 1, padding: 16 }}>
          <ThemedView style={styles.cameraGrid}>
            <ThemedView style={styles.cameraCard}>
              <ThemedText style={styles.cameraTitle}>Live Feed</ThemedText>
              <ThemedView style={styles.cameraView}>
                <Image
                  source={require("@/assets/images/partial-react-logo.png")}
                  style={styles.cameraImage}
                  resizeMode="cover"
                />
              </ThemedView>
              <ThemedView style={styles.infoSection}>
                <ThemedText style={styles.infoTitle}>Smart Control</ThemedText>
                <ThemedView
                  style={[
                    styles.licensePlateContainer,
                    {
                      transform: [{ scale: 1.02 }],
                      shadowColor: isLightOn ? "#059669" : "#DC2626",
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 4 },
                      backgroundColor: isLightOn
                        ? "rgba(209, 250, 229, 0.9)"
                        : "rgba(254, 202, 202, 0.9)",
                    },
                  ]}
                >
                  <ThemedText
                    onPress={() => {
                      setIsLightOn(!isLightOn);
                      console.log("Toggle light:", !isLightOn);
                    }}
                    style={[
                      styles.licensePlateText,
                      {
                        textAlign: "center",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        color: isLightOn ? "#059669" : "#DC2626",
                      },
                    ]}
                  >
                    Light {isLightOn ? "On" : "Off"}
                  </ThemedText>
                </ThemedView>
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
  cameraGrid: {
    flexDirection: "row",
    gap: 24,
  },
  cameraCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cameraTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#059669",
    marginBottom: 16,
    letterSpacing: 0.5,
    marginTop: 30,
  },
  cameraView: {
    height: 340,
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cameraImage: {
    flex: 1,
  },
  infoSection: {
    marginTop: 24,
    gap: 16,
  },
  infoTitle: {
    fontSize: 25,
    fontWeight: "700",
    color: "#10B981",
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
