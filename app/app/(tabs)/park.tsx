import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useSelector } from "react-redux";
import { userSelector } from "@/redux/selectors/userSelector";

export default function TabThreeScreen() {
  const colorScheme = useColorScheme();
  const { user } = useSelector(userSelector);
  const [slotStatus, setSlotStatus] = useState<any>([
    {
      location: "54 Triều Khúc (DH CNGTVT)",
      slot: [0, 0, 0, 0],
    },
    {
      location: "32 Nguyễn Công Chứ",
      slot: [0, 0, 0],
    },
    {
      location: "68 Lê Văn Lương",
      slot: [1, 1, 1, 1],
    },
  ]);
  const [bookedUsers, setBookedUsers] = useState<{
    [location: string]: { [index: number]: string };
  }>({});
  const [selectedLocation, setSelectedLocation] = useState(
    "Select Parking Area"
  );
  const [locationExpanded, setLocationExpanded] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<{ [key: string]: number[] }>(
    {}
  );

  const openGoogleMaps = (location: string) => {
    const query = encodeURIComponent(location);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
  };

  const sendBookingToServer = async (location: string, index: number) => {
    console.log(1);
    try {
      const response = await fetch("http://160.250.246.12:3000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location,
          slotIndex: index,
          userID: user?._id,
        }),
      });

      if (!response.ok) {
        console.warn("Booking failed:", await response.text());
      } else {
        console.log("Booking success:", await response.json());
      }
    } catch (error) {
      console.error("Error sending booking to server:", error);
    }
  };
  const sendCancelToServer = async (location: string, index: number) => {
    try {
      const response = await fetch("http://160.250.246.12:3000/api/bookings", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ location, slotIndex: index, userID: user?._id }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.warn("Cancel failed:", result.message);
      } else {
        console.log("Cancel success:", result);
      }
    } catch (error) {
      console.error("Error sending cancel to server:", error);
    }
  };

  useEffect(() => {
    const ws = new WebSocket("ws://160.250.246.12:8080");

    ws.onopen = () => {
      console.log("Connected to WebSocket");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log(message);
        if (message.type === "slot-update") {
          setSlotStatus([
            {
              location: "54 Triều Khúc (DH CNGTVT)",
              slot: message?.slots || [0, 0, 0, 0],
            },
            {
              location: "32 Nguyễn Công Chứ",
              slot: message?.slots2 || [0, 0],
            },
            {
              location: "68 Lê Văn Lương",
              slot: [1, 1, 1, 1],
            },
          ]);
          setBookedUsers(message.bookedUsers);
        }
      } catch (error) {
        console.error("WebSocket error:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => ws.close();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ThemedView style={{ padding: 16, flex: 1 }}>
        <ThemedView style={styles.titleContainer}>
          <IconSymbol
            name="car"
            size={24}
            color={colorScheme === "dark" ? "#fff" : "#000"}
          />
          <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
            Parking Status
          </ThemedText>
        </ThemedView>

        {/* Location Dropdown */}
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
              color={colorScheme === "dark" ? "#fff" : "#000"}
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

        <ScrollView style={{ flex: 1 }}>
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
            {slotStatus
              .filter((s: any) => s.location === selectedLocation)
              .flatMap((s: any) => s.slot)
              .map((slot: number, i: number) => {
                const isBookedByUser =
                  bookedUsers?.[selectedLocation]?.[i] === user?._id;

                return (
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
                    }}
                  >
                    <ThemedText style={{ fontSize: 18, fontWeight: "bold" }}>
                      Slot {i + 1}
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 14,
                        marginBottom: 8,
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

                    {slot === 0 &&
                      !(bookedSlots[selectedLocation] || []).includes(i) && (
                        <TouchableOpacity
                          style={{
                            backgroundColor: "#22c55e",
                            borderRadius: 6,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                          }}
                          onPress={() =>
                            sendBookingToServer(selectedLocation, i)
                          }
                        >
                          <Text style={{ color: "#fff", fontWeight: "600" }}>
                            Đặt chỗ
                          </Text>
                        </TouchableOpacity>
                      )}
                    {isBookedByUser && (
                      <TouchableOpacity
                        style={{
                          backgroundColor: "#ef4444",
                          borderRadius: 6,
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          marginTop: 6,
                        }}
                        onPress={() => sendCancelToServer(selectedLocation, i)}
                      >
                        <Text style={{ color: "#fff", fontWeight: "600" }}>
                          Hủy chỗ
                        </Text>
                      </TouchableOpacity>
                    )}

                    {(bookedSlots[selectedLocation] || []).includes(i) && (
                      <Text
                        style={{
                          color: "#10b981",
                          fontWeight: "600",
                          marginTop: 4,
                        }}
                      >
                        Đã đặt
                      </Text>
                    )}
                  </ThemedView>
                );
              })}
          </ThemedView>

          <ThemedView style={styles.mapButtonContainer}>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => openGoogleMaps(selectedLocation)}
            >
              <IconSymbol name="location" size={20} color="#fff" />
              <Text style={styles.mapButtonText}>Open in Google Maps</Text>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 50,
  },
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
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  mapButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
