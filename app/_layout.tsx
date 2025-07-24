
console.log('=== APP ENTRY ===');
// This is the root layout file for Expo Router apps.
// Add the Android share intent handler here.

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { initializeDatabase } from "../database/database";
import ShareIntentHandler from "./ShareIntentHandler";

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
    <>
      <StatusBar style="auto" />
      <ShareIntentHandler />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
