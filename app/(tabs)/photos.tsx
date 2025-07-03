import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const imageSize = (width - 60) / 2;

export default function PhotosScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const photos = [
    {
      id: 1,
      title: "Sunset Poetry",
      description: "Beautiful sunset that inspired my latest poem",
      tags: ["nature", "inspiration"],
      date: "Today",
    },
    {
      id: 2,
      title: "Old Library",
      description: "Ancient books and stories",
      tags: ["books", "library"],
      date: "2 days ago",
    },
    {
      id: 3,
      title: "Ocean Waves",
      description: "The rhythm of the sea",
      tags: ["ocean", "waves", "rhythm"],
      date: "1 week ago",
    },
    {
      id: 4,
      title: "City Lights",
      description: "Urban poetry in motion",
      tags: ["city", "lights", "urban"],
      date: "2 weeks ago",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search photos..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="camera" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.photosGrid}>
          {photos.map((photo) => (
            <TouchableOpacity key={photo.id} style={styles.photoCard}>
              <View style={styles.photoPlaceholder}>
                <Ionicons name="image" size={32} color="#666" />
              </View>
              <View style={styles.photoInfo}>
                <Text style={styles.photoTitle} numberOfLines={1}>
                  {photo.title}
                </Text>
                <Text style={styles.photoDescription} numberOfLines={2}>
                  {photo.description}
                </Text>
                <View style={styles.photoFooter}>
                  <View style={styles.tags}>
                    {photo.tags.slice(0, 2).map((tag, index) => (
                      <Text key={index} style={styles.tag}>
                        {tag}
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.photoDate}>{photo.date}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share" size={16} color="#666" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#f5f5f5",
    fontSize: 16,
    marginLeft: 10,
    height: 45,
  },
  addButton: {
    backgroundColor: "#e94560",
    borderRadius: 10,
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  photoCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    width: imageSize,
  },
  photoPlaceholder: {
    width: "100%",
    height: imageSize * 0.7,
    backgroundColor: "#333",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  photoInfo: {
    flex: 1,
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f5f5f5",
    marginBottom: 4,
  },
  photoDescription: {
    fontSize: 12,
    color: "#a0a0a0",
    lineHeight: 16,
    marginBottom: 8,
  },
  photoFooter: {
    marginTop: "auto",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  tag: {
    backgroundColor: "#333",
    color: "#FF9800",
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  photoDate: {
    fontSize: 10,
    color: "#666",
  },
  shareButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 6,
  },
});
