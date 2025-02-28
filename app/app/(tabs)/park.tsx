import { StyleSheet, Image, Platform, View, Text, ScrollView } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useState } from 'react';

export default function TabThreeScreen() {
    const [slotStatus, setSlotStatus] = useState([0, 0, 0]); // Initial state for parking slots
  return (
<>
<View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }}>
        <ThemedView style={{ padding: 16, flex: 1 }}>
          <ThemedView style={styles.titleContainer}>
            <IconSymbol name="car" size={24} color="#000000" />
            <ThemedText style={{ fontSize: 24, fontWeight: 'bold' }}>
              Current Vehicles
            </ThemedText>
          </ThemedView>

          <ThemedView style={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 30,marginBottom: 100 }}>
            {slotStatus.map((slot, i) => (
              <ThemedView 
                key={i}
                style={{
                  flex: 1,
                  minWidth: '30%',
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: slot === 1 ? 'rgba(254, 226, 226, 0.8)' : 'rgba(209, 250, 229, 0.8)',
                  borderWidth: 1,
                  borderColor: slot === 1 ? 'rgba(252, 165, 165, 0.8)' : 'rgba(110, 231, 183, 0.8)',
                  alignItems: 'center',
                  transform: [{ scale: 1 }]
                }}
              >
                <ThemedText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                  Slot {i + 1}
                </ThemedText>
                <ThemedText style={{ fontSize: 14, color: slot === 1 ? 'rgba(220, 38, 38, 0.9)' : 'rgba(5, 150, 105, 0.9)' }}>
                  {slot === 1 ? 'Occupied' : 'Available'}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </View>
  </>
)
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 50,
  },
});
