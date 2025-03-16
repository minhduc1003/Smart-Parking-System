import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Provider } from "react-redux";
import { reduxStore } from "@/redux/store/store";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [initialized, setInitialized] = useState("login");
  const getTokens = async () => {
    const token = await SecureStore.getItemAsync("secure_token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setInitialized("(tabs)");
      navigation.reset({
        index: 0,
        routes: [{ name: "(tabs)" }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: "login" }],
      });
    }
  };
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      getTokens();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Provider store={reduxStore}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack initialRouteName={initialized}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="deposit" options={{ headerShown: false }} />
          <Stack.Screen name="withdraw" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </Provider>
  );
}
