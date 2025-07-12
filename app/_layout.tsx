// This is the root layout file for Expo Router apps.
// Add the Android share intent handler here.

import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { initializeDatabase } from "../database/database";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const initDb = async () => {
      try {
        await initializeDatabase();
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initDb();
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      const handleIntent = async () => {
        // Listen for app launch with intent
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          // Custom scheme: kiler://share?type=photo|link|text&data=...
          const parsed = Linking.parse(initialUrl);
          if (parsed.scheme === "kiler" && parsed.path === "share") {
            const { type, data } = parsed.queryParams || {};
            if (type === "photo") {
              router.push({
                pathname: "/(tabs)/photos",
                params: { shareUri: data },
              });
            } else if (type === "link") {
              router.push({
                pathname: "/(tabs)/links",
                params: { shareUrl: data },
              });
            } else if (type === "text") {
              router.push({
                pathname: "/(tabs)/home",
                params: { shareText: data },
              });
            }
          }
        }
      };
      handleIntent();

      // Listen for new intents while app is running
      const subscription = Linking.addEventListener("url", ({ url }) => {
        const parsed = Linking.parse(url);
        if (parsed.scheme === "kiler" && parsed.path === "share") {
          const { type, data } = parsed.queryParams || {};
          if (type === "photo") {
            router.push({
              pathname: "/(tabs)/photos",
              params: { shareUri: data },
            });
          } else if (type === "link") {
            router.push({
              pathname: "/(tabs)/links",
              params: { shareUrl: data },
            });
          } else if (type === "text") {
            router.push({
              pathname: "/(tabs)/home",
              params: { shareText: data },
            });
          }
        }
      });

      return () => subscription.remove();
    }
  }, [router]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
