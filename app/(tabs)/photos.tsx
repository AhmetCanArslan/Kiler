import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
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

function PhotosScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  // Animation state for each photo
  const [photoAnims, setPhotoAnims] = useState<{ [id: number]: { opacity: Animated.Value, translateY: Animated.Value } }>({});
  const containerRef = useRef<View>(null);
  // Fade animations removed
  // const listAnim = useRef(new Animated.Value(0)).current;
  // const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load photos when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      searchPhotos();
    } else {
      loadPhotos();
    }
  }, [searchQuery]);

  // Fade in animation only on focus (tab switch)
  // Fade animation on focus removed


  const loadPhotos = async (withAnim = false, newId?: number) => {
    try {
      setLoading(true);
      const allPhotos = await PhotosService.getAllPhotos();
      const sortedPhotos = allPhotos.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        const dateA = new Date(a.updated_at || a.created_at || '').getTime();
        const dateB = new Date(b.updated_at || b.created_at || '').getTime();
        return dateB - dateA;
      });
      // Animasyon state'lerini güncelle
      setPhotoAnims(prev => {
        const newAnims: { [id: number]: { opacity: Animated.Value, translateY: Animated.Value } } = { ...prev };
        sortedPhotos.forEach((photo) => {
          if (typeof photo.id === 'number' && !newAnims[photo.id]) {
            newAnims[photo.id] = {
              opacity: new Animated.Value(newId === photo.id ? 0 : 1),
              translateY: new Animated.Value(0),
            };
          }
        });
        // Remove anims for deleted photos
        Object.keys(newAnims).forEach(id => {
          if (!sortedPhotos.find(p => p.id === Number(id))) {
            delete newAnims[Number(id)];
          }
        });
        return newAnims;
      });
      setPhotos(sortedPhotos);
      // If a new photo was added, fade it in
      if (withAnim && newId) {
        setTimeout(() => {
          if (photoAnims[newId]) {
            Animated.timing(photoAnims[newId].opacity, {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            }).start();
          }
        }, 50);
      }
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

  // Animate slide for all items to new positions, then update data
  const animateReorder = async (newOrder: Photo[]) => {
    const prevPositions = photos.map((p, idx) => ({ id: p.id, idx }));
    newOrder.forEach((photo, idx) => {
      if (typeof photo.id === 'number') {
        const prev = prevPositions.find(p => p.id === photo.id);
        if (prev && prev.idx !== idx && photoAnims[photo.id]) {
          photoAnims[photo.id].translateY.setValue((prev.idx - idx) * (imageSize + 20));
          Animated.spring(photoAnims[photo.id].translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      }
    });
    // Wait for animation to finish before updating data
    await new Promise(res => setTimeout(res, 350));
    setPhotos(newOrder);
  };

  const toggleFavorite = async (photoId: number) => {
    try {
      await PhotosService.toggleFavorite(photoId);
      // Get new sorted order
      const allPhotos = await PhotosService.getAllPhotos();
      const sortedPhotos = allPhotos.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        const dateA = new Date(a.updated_at || a.created_at || '').getTime();
        const dateB = new Date(b.updated_at || b.created_at || '').getTime();
        return dateB - dateA;
      });
      await animateReorder(sortedPhotos);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  // Add delete handler
  const handleDeletePhoto = (photoId: number) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Fade out animation
            await new Promise(res => {
              Animated.timing(photoAnims[photoId]?.opacity || new Animated.Value(1), {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
              }).start(() => res(null));
            });
            try {
              await PhotosService.deletePhoto(photoId);
              // Remove from data and animate slide
              const allPhotos = await PhotosService.getAllPhotos();
              const sortedPhotos = allPhotos.sort((a, b) => {
                if (a.is_favorite && !b.is_favorite) return -1;
                if (!a.is_favorite && b.is_favorite) return 1;
                const dateA = new Date(a.updated_at || a.created_at || '').getTime();
                const dateB = new Date(b.updated_at || b.created_at || '').getTime();
                return dateB - dateA;
              });
              await animateReorder(sortedPhotos);
              setPhotoAnims(prev => {
                const copy = { ...prev };
                delete copy[photoId];
                return copy;
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  // (No longer needed, replaced by animateReorder)

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8E9BA2" style={{ textShadowColor: '#1A365D', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }} />
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
              {photos.map((photo) => (
                <Animated.View
                  key={photo.id}
              style={{
                opacity: typeof photo.id === 'number' && photoAnims[photo.id]?.opacity !== undefined ? photoAnims[photo.id].opacity : 1,
                transform: [
                  {
                    translateY:
                      typeof photo.id === 'number' && photoAnims[photo.id]?.translateY !== undefined
                        ? photoAnims[photo.id].translateY
                        : 0,
                  },
                ],
              }}
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
                    <View style={{ position: 'absolute', top: 8, right: 8, alignItems: 'center' }}>
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
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeletePhoto(photo.id!)}
                      >
                        <Ionicons name="trash" size={16} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export default PhotosScreen;

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
  deleteButton: {
    padding: 8,
    marginTop: 2,
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
