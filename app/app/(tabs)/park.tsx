import {
  StyleSheet,
  Image,
  Platform,
  View,
  Text,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Linking,
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
  const [selectedLocation, setSelectedLocation] = useState("Main Parking Area");
  const [locationExpanded, setLocationExpanded] = useState(false);
  const openGoogleMaps = (location: string) => {
    const query = encodeURIComponent(location);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
  };
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

          {/* Parking Area Location Dropdown */}
          <ThemedView style={styles.dropdownContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setLocationExpanded(!locationExpanded)}
              style={styles.dropdownHeader}
            >
              <ThemedText style={styles.dropdownHeaderText}>
                {selectedLocation}
              </ThemedText>
              <IconSymbol
                name={locationExpanded ? "chevron.up" : "chevron.down"}
                size={18}
                color={colorScheme === "dark" ? "#ffffff" : "#000000"}
              />
            </TouchableOpacity>

            {locationExpanded && (
              <ThemedView style={styles.dropdownOptionsContainer}>
                {[
                  "54 Triều Khúc (DH CNGTVT)",
                  "32 Nguyễn Công Chứ",
                  "68 Lê Văn Lương",
                ].map((location, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dropdownOption,
                      selectedLocation === location && styles.selectedOption,
                    ]}
                    onPress={() => {
                      setSelectedLocation(location);
                      setLocationExpanded(false);
                      // Update slotStatus based on location selection
                      setSlotStatus(
                        location === "54 Triều Khúc (DH CNGTVT)"
                          ? [0, 0, 0]
                          : location === "32 Nguyễn Công Chứ"
                          ? [1, 1]
                          : [1, 1, 1, 1]
                      );
                    }}
                  >
                    <ThemedText
                      style={[
                        styles.dropdownOptionText,
                        selectedLocation === location &&
                          styles.selectedOptionText,
                      ]}
                    >
                      {location}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            )}
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
            {/* Google Maps Button */}
            <ThemedView style={styles.mapButtonContainer}>
              <TouchableOpacity
                style={styles.mapButton}
                activeOpacity={0.7}
                onPress={() => openGoogleMaps(selectedLocation)}
              >
                <IconSymbol name="location" size={20} color="#ffffff" />
                <Text style={styles.mapButtonText}>Open in Google Maps</Text>
              </TouchableOpacity>
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
  // Dropdown styles
  dropdownContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.3)",
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  dropdownHeaderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dropdownOptionsContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.3)",
  },
  dropdownOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  selectedOption: {
    backgroundColor: "rgba(100, 100, 255, 0.1)",
  },
  dropdownOptionText: {
    fontSize: 16,
  },
  selectedOptionText: {
    fontWeight: "600",
  },
  mapButtonContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4285F4", // Google Maps blue color
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  mapButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
