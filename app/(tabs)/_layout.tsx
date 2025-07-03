import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#e94560",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#1a1a2e",
          borderTopColor: "#333",
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
        headerStyle: {
          backgroundColor: "#1a1a2e",
        },
        headerTintColor: "#f5f5f5",
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Archive",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="links"
        options={{
          title: "Links",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="link" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="photos"
        options={{
          title: "Photos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: "Notes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
