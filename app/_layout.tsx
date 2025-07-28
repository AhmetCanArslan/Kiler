// app/_layout.tsx

console.log('=== APP ENTRY ===');

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { initializeDatabase } from "../database/database";
import ShareIntentHandler from "./ShareIntentHandler";

// 1. SafeAreaProvider'ı import edin
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {

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

  return (
    // 2. Tüm uygulamayı SafeAreaProvider ile sarmalayın
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <ShareIntentHandler />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}