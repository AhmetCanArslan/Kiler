import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function HomeScreen() {
  const recentItems = [
    { id: 1, type: "note", title: "Poetry Collection Ideas", date: "Today" },
    { id: 2, type: "link", title: "Modern Poetry Website", date: "Yesterday" },
    { id: 3, type: "photo", title: "Sunset Inspiration", date: "2 days ago" },
    { id: 4, type: "note", title: "Verse about freedom", date: "3 days ago" },
  ];

  const getIconName = (type: string) => {
    switch (type) {
      case "note":
        return "document-text";
      case "link":
        return "link";
      case "photo":
        return "image";
      default:
        return "document";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Kiler</Text>
          <Text style={styles.subtitle}>Your digital poetry archive</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="library" size={24} color="#FF6B6B" />
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="document-text" size={24} color="#68D391" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Notes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="link" size={24} color="#63B3ED" />
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Links</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="images" size={24} color="#F6AD55" />
            <Text style={styles.statNumber}>4</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Items</Text>
          {recentItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.itemCard}>
              <View style={styles.itemIcon}>              <Ionicons
                name={getIconName(item.type) as any}
                size={20}
                color="#FF6B6B"
              />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDate}>{item.date}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="add-circle" size={32} color="#FF6B6B" />
              <Text style={styles.actionText}>Add Note</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="camera" size={32} color="#FF6B6B" />
              <Text style={styles.actionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="share" size={32} color="#FF6B6B" />
              <Text style={styles.actionText}>Share Item</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="search" size={32} color="#FF6B6B" />
              <Text style={styles.actionText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1419",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#F7FAFC",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#A0AEC0",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#1A202C",
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F7FAFC",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#A0AEC0",
    marginTop: 4,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F7FAFC",
    marginBottom: 15,
  },
  itemCard: {
    backgroundColor: "#1A202C",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    color: "#F7FAFC",
    fontWeight: "500",
  },
  itemDate: {
    fontSize: 14,
    color: "#A0AEC0",
    marginTop: 2,
  },
  quickActions: {
    marginBottom: 30,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    backgroundColor: "#1A202C",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: "48%",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  actionText: {
    color: "#F7FAFC",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
  },
});
