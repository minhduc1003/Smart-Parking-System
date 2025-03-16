import { StyleSheet, Image, Platform, View, ScrollView } from "react-native";

import { Collapsible } from "@/components/Collapsible";
import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useEffect } from "react";
export default function TabTwoScreen() {
  const colorScheme = useColorScheme();
  return (
    <View style={{ flex: 1 }}>
      <ThemedView style={{ padding: 16, flex: 1 }}>
        <ThemedView style={styles.titleContainer}>
          <IconSymbol
            name="car"
            size={24}
            color={colorScheme == "dark" ? "white" : "#000000"}
          />
          <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
            History Parking
          </ThemedText>
        </ThemedView>

        <ScrollView
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          style={{ marginTop: 30, flex: 1 }}
        >
          {[
            {
              plateNumber: "ABC 123",
              checkIn: "10:30 AM",
              duration: "2h 30m",
              fee: "$5.00",
              status: "Leaving",
            },
            {
              plateNumber: "XYZ 789",
              checkIn: "11:45 AM",
              duration: "1h 15m",
              fee: "$3.00",
              status: "Active",
            },
            {
              plateNumber: "DEF 456",
              checkIn: "09:15 AM",
              duration: "3h 45m",
              fee: "$7.50",
              status: "Active",
            },
            {
              plateNumber: "DEF 456",
              checkIn: "09:15 AM",
              duration: "3h 45m",
              fee: "$7.50",
              status: "Active",
            },
          ].map((vehicle, index) => (
            <ThemedView
              key={index}
              style={{
                padding: 16,
                marginVertical: 8,
                borderRadius: 16,
                backgroundColor: colorScheme === "dark" ? "#1F2937" : "#F3F4F6",
              }}
            >
              <ThemedView
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor:
                    colorScheme === "dark" ? "#1F2937" : "#F3F4F6",
                }}
              >
                <ThemedView
                  style={{
                    backgroundColor:
                      colorScheme === "dark" ? "#1F2937" : "#F3F4F6",
                  }}
                >
                  <ThemedText
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      marginBottom: 8,
                    }}
                  >
                    {vehicle.plateNumber}
                  </ThemedText>
                  <ThemedText>Check-in: {vehicle.checkIn}</ThemedText>
                  <ThemedText>Duration: {vehicle.duration}</ThemedText>
                  <ThemedText
                    style={{
                      color: colorScheme === "dark" ? "#818CF8" : "#4F46E5",
                      fontWeight: "600",
                      marginTop: 8,
                    }}
                  >
                    Fee: {vehicle.fee}
                  </ThemedText>
                </ThemedView>
                <ThemedView
                  style={{
                    backgroundColor:
                      vehicle.status === "Leaving"
                        ? colorScheme === "dark"
                          ? "#78350F"
                          : "#FEF3C7"
                        : colorScheme === "dark"
                        ? "#064E3B"
                        : "#D1FAE5",
                    padding: 12,
                    borderRadius: 20,
                  }}
                >
                  <ThemedText
                    style={{
                      color:
                        vehicle.status === "Leaving"
                          ? colorScheme === "dark"
                            ? "#FCD34D"
                            : "#92400E"
                          : colorScheme === "dark"
                          ? "#6EE7B7"
                          : "#065F46",
                      fontWeight: "bold",
                    }}
                  >
                    {vehicle.status}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          ))}
        </ScrollView>
      </ThemedView>
    </View>
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
