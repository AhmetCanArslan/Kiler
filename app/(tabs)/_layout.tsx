// app/(tabs)/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRouter } from "expo-router";
import { useEffect } from 'react';
import { TouchableOpacity } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

import { initializeDatabase } from '../../database/database';
import HomeScreen from './home';
import LinksScreen from './links';
import NotesScreen from './notes';
import PhotosScreen from './photos';

import ShareIntentHandler from '../ShareIntentHandler';

const Tab = createMaterialTopTabNavigator();

export default function TabLayout() {
  const router = useRouter();
  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1D23' }} edges={['top', 'bottom', 'left', 'right']}>
      
      {/* 2. ADIM: Bileşeni buraya ekleyerek uygulamanın tamamında aktif olmasını sağla. */}
      <ShareIntentHandler />

      <Tab.Navigator
        initialRouteName="home"
        tabBarPosition="bottom"
        screenOptions={({ route }) => ({
          swipeEnabled: true,
          tabBarActiveTintColor:
            route.name === "notes"
              ? "#2ee28f"
              : route.name === "links"
              ? "#62abf0"
              : route.name === "photos"
              ? "#e4a448"
              : "#FF6B6B",
          tabBarInactiveTintColor: "#8E9BA2",
          tabBarStyle: {
            backgroundColor: "#1A1D23",
            borderTopColor: "#2D3748",
            borderTopWidth: 1,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -4,
            },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
            paddingBottom: 8,
          },
          tabBarShowIcon: true,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: '600',
            marginBottom: 2,
          },
          indicatorStyle: { height: 0, backgroundColor: 'transparent' },
        })}
      >
        <Tab.Screen
          name="home"
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="library" size={26} color={focused ? "#FF6B6B" : color} />
            ),
          }}
        >
          {props => <HomeScreen {...props} settingsButton={
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                zIndex: 99,
                backgroundColor: 'rgba(26,29,35,0.92)',
                borderRadius: 20,
                padding: 4,
              }}
              onPress={() => router.push("/settings")}
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={26} color="#F7FAFC" />
            </TouchableOpacity>
          } />}
        </Tab.Screen>
        <Tab.Screen
          name="notes"
          component={NotesScreen}
          options={{
            tabBarLabel: 'Notes',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="document-text" size={26} color={focused ? "#2ee28f" : color} />
            ),
          }}
        />
        <Tab.Screen
          name="links"
          component={LinksScreen}
          options={{
            tabBarLabel: 'Links',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="link" size={26} color={focused ? "#62abf0" : color} />
            ),
          }}
        />
        <Tab.Screen
          name="photos"
          component={PhotosScreen}
          options={{
            tabBarLabel: 'Photos',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="images" size={26} color={focused ? "#fab148" : color} />
            ),
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}