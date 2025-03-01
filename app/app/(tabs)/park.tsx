import {
  StyleSheet,
  Image,
  Platform,
  View,
  Text,
  ScrollView,
  useColorScheme,
} from "react-native";

import { Collapsible } from "@/components/Collapsible";
import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useState } from "react";

export default function TabThreeScreen() {
  const colorScheme = useColorScheme();
  const [slotStatus, setSlotStatus] = useState([0, 0, 0]); // Initial state for parking slots
  return (
    <>
      <View style={{ flex: 1 }}>
        <ThemedView style={{ padding: 16, flex: 1 }}>
          <ThemedView style={styles.titleContainer}>
            <IconSymbol
              name="car"
              size={24}
              color={colorScheme === "dark" ? "#ffffff" : "#000000"}
            />
            <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
              Parking Status
            </ThemedText>
          </ThemedView>
          <ScrollView scrollEnabled={slotStatus.length > 3} style={{ flex: 1 }}>
            <ThemedView
              style={{
                padding: 16,
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 30,
                marginBottom: 100,
              }}
            >
              {slotStatus.map((slot, i) => (
                <ThemedView
                  key={i}
                  style={{
                    flex: 1,
                    minWidth: "30%",
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor:
                      colorScheme === "dark"
                        ? slot === 1
                          ? "rgba(127, 29, 29, 0.6)"
                          : "rgba(6, 78, 59, 0.6)"
                        : slot === 1
                        ? "rgba(254, 226, 226, 0.8)"
                        : "rgba(209, 250, 229, 0.8)",
                    borderWidth: 1,
                    borderColor:
                      colorScheme === "dark"
                        ? slot === 1
                          ? "rgba(185, 28, 28, 0.8)"
                          : "rgba(5, 150, 105, 0.8)"
                        : slot === 1
                        ? "rgba(252, 165, 165, 0.8)"
                        : "rgba(110, 231, 183, 0.8)",
                    alignItems: "center",
                    transform: [{ scale: 1 }],
                  }}
                >
                  <ThemedText
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      marginBottom: 8,
                    }}
                  >
                    Slot {i + 1}
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontSize: 14,
                      color:
                        colorScheme === "dark"
                          ? slot === 1
                            ? "rgba(248, 113, 113, 0.9)"
                            : "rgba(34, 197, 94, 0.9)"
                          : slot === 1
                          ? "rgba(220, 38, 38, 0.9)"
                          : "rgba(5, 150, 105, 0.9)",
                    }}
                  >
                    {slot === 1 ? "Occupied" : "Available"}
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          </ScrollView>
        </ThemedView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 50,
  },
});
