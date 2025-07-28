import { Ionicons } from "@expo/vector-icons";
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => <View style={{ height: insets.top, backgroundColor: '#0F1419' }} />,
        headerStyle: {
          backgroundColor: '#0F1419',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        tabBarActiveTintColor:
          route.name === "notes"
            ? "#2ee28f"
            : route.name === "links"
            ? "#62abf0"
            : route.name === "photos"
            ? "#e4a448"
            : "#FF6B6B",
        tabBarInactiveTintColor: "#8E9BA2",
        
        // --- BURAYI GÜNCELLEYİN ---
        tabBarStyle: {
          backgroundColor: "#1A1D23",
          borderTopColor: "#2D3748",
          borderTopWidth: 1,
          paddingTop: 4, // İkonların üstündeki boşluk kalabilir, bu stilsel bir tercih.
          // KALDIRILDI: height: 65,
          // KALDIRILDI: paddingBottom: 8,
        },
        // --- GÜNCELLEME SONU ---

        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
        },
      })}
    >
      {/* Tab.Screen'leriniz burada değişmeden kalacak */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="library" size={26} color={focused ? "#FF6B6B" : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="document-text" size={26} color={focused ? "#2ee28f" : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="links"
        options={{
          title: 'Links',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="link" size={26} color={focused ? "#62abf0" : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="photos"
        options={{
          title: 'Photos',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="images" size={26} color={focused ? "#fab148" : color} />
          ),
        }}
      />
    </Tabs>
  );
}