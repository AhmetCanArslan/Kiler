import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function TabLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={({ route }) => ({
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
          height: 85,
          paddingBottom: 12,
          paddingTop: 12,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        },
        headerStyle: {
          backgroundColor: "#0F1419",
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        },
        headerTintColor: "#F7FAFC",
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
        },
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 18 }}
            onPress={() => router.push("/settings")}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={26} color="#F7FAFC" />
          </TouchableOpacity>
        ),
      })}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: "Notes",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="document-text"
              size={size}
              color={focused ? "#2ee28f" : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="links"
        options={{
          title: "Links",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="link"
              size={size}
              color={focused ? "#62abf0" : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="photos"
        options={{
          title: "Photos",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name="images"
              size={size}
              color={focused ? "#fab148" : color}
            />
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
