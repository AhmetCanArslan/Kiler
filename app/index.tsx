import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.title}>Kiler</Text>
        <Text style={styles.subtitle}>Digital Poetry Archive</Text>
        <Text style={styles.description}>
          Your personal collection for links, photos, notes, and memories
        </Text>
        
        <TouchableOpacity 
          style={styles.startButton}
          onPress={() => router.replace("/(tabs)/home")}
        >
          <Text style={styles.startButtonText}>Enter Archive</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#e94560",
    marginBottom: 10,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: "#f5f5f5",
    marginBottom: 30,
    fontWeight: "300",
  },
  description: {
    fontSize: 16,
    color: "#a0a0a0",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 50,
  },
  startButton: {
    backgroundColor: "#e94560",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: "#e94560",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
});
