import { StyleSheet, Image, Platform, View, ScrollView } from "react-native";

import { Collapsible } from "@/components/Collapsible";
import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { userSelector } from "@/redux/selectors/userSelector";
import axios from "axios";
export default function TabTwoScreen() {
  const colorScheme = useColorScheme();
  const [parkingLotRecord, setParkingLotRecord] = useState<any>([]);
  const { user } = useSelector(userSelector);
  useEffect(() => {
    axios
      .post("http://160.250.246.12:3000/user-plate", {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          plateNumber: user?.numberPlate,
        },
      })
      .then((response) => {
        setParkingLotRecord(response.data.userPlates);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);
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
          {parkingLotRecord.map((vehicle: any, index: number) => (
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
                  <ThemedText>
                    Check-in: {new Date(vehicle.entryTime).toLocaleString()}
                  </ThemedText>
                  <ThemedText>
                    Check-out: {new Date(vehicle.exitTime).toLocaleString()}
                  </ThemedText>
                  <ThemedText>
                    Duration: {Math.floor(vehicle.duration / 60)}m{" "}
                    {vehicle.duration % 60}s
                  </ThemedText>
                </ThemedView>
                <ThemedText
                  style={{
                    color: colorScheme === "dark" ? "#818CF8" : "#4F46E5",
                    fontWeight: "600",
                    fontSize: 20,
                  }}
                >
                  {vehicle.fee / 100} vnđ
                </ThemedText>
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
