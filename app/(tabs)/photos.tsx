import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Photo, PhotosService } from "../../database/photosService";

const { width } = Dimensions.get("window");
const imageSize = (width - 75) / 2;

export default function PhotosScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const listAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Load photos when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (searchQuery.trim()) {
        searchPhotos();
      } else {
        loadPhotos();
      }
    }, [searchQuery])
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      searchPhotos();
    } else {
      loadPhotos();
    }
  }, [searchQuery]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      // Reset animations
      listAnim.setValue(0);
      slideAnim.setValue(50);
      
      const allPhotos = await PhotosService.getAllPhotos();
      // Sort photos: favorites first, then by updated_at desc
      const sortedPhotos = allPhotos.sort((a, b) => {
        // First sort by favorite status (favorites first)
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        // Then sort by updated_at (most recent first)
        const dateA = new Date(a.updated_at || a.created_at || '').getTime();
        const dateB = new Date(b.updated_at || b.created_at || '').getTime();
        return dateB - dateA;
      });
      setPhotos(sortedPhotos);
      
      // Animate list appearance
      Animated.parallel([
        Animated.timing(listAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const searchPhotos = async () => {
    try {
      setLoading(true);
      const searchResults = await PhotosService.searchPhotos(searchQuery.trim());
      setPhotos(searchResults);
    } catch (error) {
      console.error('Error searching photos:', error);
      Alert.alert('Error', 'Failed to search photos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const toggleFavorite = async (photoId: number) => {
    try {
      await PhotosService.toggleFavorite(photoId);
      // Refresh the photos to show updated favorite status
      if (searchQuery.trim()) {
        searchPhotos();
      } else {
        loadPhotos();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E9BA2" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search photos..."
            placeholderTextColor="#8E9BA2"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="camera" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="camera-outline" size={64} color="#4A5568" />
            <Text style={styles.emptyTitle}>No Photos Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? "Try a different search term" : "Start capturing your first photo"}
            </Text>
          </View>
        ) : (
          <View style={styles.photosGrid}>
            {photos.map((photo, index) => (
              <Animated.View
                key={photo.id}
                style={[
                  {
                    opacity: listAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, 50 + index * 10],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity style={styles.photoCard}>
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="image" size={32} color="#8E9BA2" />
                  </View>
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoTitle} numberOfLines={1}>
                      {photo.title}
                    </Text>
                    <Text style={styles.photoDescription} numberOfLines={2}>
                      {photo.description || "No description"}
                    </Text>
                    <View style={styles.photoFooter}>
                      <View style={styles.tags}>
                        {(photo.tags || []).slice(0, 2).map((tag, index) => (
                          <Text key={index} style={styles.tag}>
                            #{tag}
                          </Text>
                        ))}
                      </View>
                      <Text style={styles.photoDate}>
                        {formatDate(
                          photo.taken_at ||
                            photo.updated_at ||
                            photo.created_at ||
                            ""
                        )}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(photo.id!)}
                  >
                    <Ionicons
                      name={photo.is_favorite ? "heart" : "heart-outline"}
                      size={16}
                      color={photo.is_favorite ? "#FF6B6B" : "#8E9BA2"}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1419",
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
    backgroundColor: "#1A202C",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  searchInput: {
    flex: 1,
    color: "#F7FAFC",
    fontSize: 16,
    marginLeft: 10,
    height: 45,
  },
  addButton: {
    backgroundColor: "#F6AD55",
    borderRadius: 12,
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
    backgroundColor: "#1A202C",
    borderRadius: 16,
    padding: 12,
    marginBottom: 15,
    width: imageSize,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  photoPlaceholder: {
    width: "100%",
    height: imageSize * 0.7,
    backgroundColor: "#2D3748",
    borderRadius: 12,
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
    color: "#F7FAFC",
    marginBottom: 4,
  },
  photoDescription: {
    fontSize: 12,
    color: "#A0AEC0",
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
    backgroundColor: "#2D3748",
    color: "#F6AD55",
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  photoDate: {
    fontSize: 10,
    color: "#8E9BA2",
  },
  shareButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 6,
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 38,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    color: "#A0AEC0",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#A0AEC0",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#8E9BA2",
    textAlign: "center",
  },
});
