import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { Photo, PhotosService } from "../../database/photosService";

const { width } = Dimensions.get("window");
const imageSize = (width - 75) / 2;
const CARD_HEIGHT = 180; // Approximate height of a photo card (adjust if needed)

function PhotosScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [photoAnims, setPhotoAnims] = useState<{ [id: number]: { opacity: Animated.Value, translateY: Animated.Value, translateX: Animated.Value, scaleY: Animated.Value } }>({});

  const getPhotoAnim = useCallback((id: number) => {
    if (!photoAnims[id]) {
      const newAnim = {
        opacity: new Animated.Value(1),
        translateY: new Animated.Value(0),
        translateX: new Animated.Value(0),
        scaleY: new Animated.Value(1),
      };
      setPhotoAnims(prev => ({ ...prev, [id]: newAnim }));
      return newAnim;
    }
    return photoAnims[id];
  }, [photoAnims]);

  const loadPhotos = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      }
      const allPhotos = await PhotosService.getAllPhotos();
      const sortedPhotos = allPhotos.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        const dateA = new Date(a.updated_at || a.created_at || '').getTime();
        const dateB = new Date(b.updated_at || b.created_at || '').getTime();
        return dateB - dateA;
      });

      setPhotoAnims(prev => {
        const newAnims: { [id: number]: { opacity: Animated.Value, translateY: Animated.Value, translateX: Animated.Value, scaleY: Animated.Value } } = {};
        sortedPhotos.forEach(photo => {
          if (photo.id) {
            newAnims[photo.id] = prev[photo.id] || {
              opacity: new Animated.Value(1),
              translateY: new Animated.Value(0),
              translateX: new Animated.Value(0),
              scaleY: new Animated.Value(1),
            };
          }
        });
        return newAnims;
      });

      setPhotos(sortedPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, []);

  const searchPhotos = useCallback(async () => {
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
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchPhotos();
    } else {
      loadPhotos(true);
    }
  }, [searchQuery, loadPhotos, searchPhotos]);

  // Refresh photos when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!searchQuery.trim()) {
        loadPhotos(false); // Don't show loading indicator on focus refresh
      }
    }, [loadPhotos, searchQuery])
  );

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

  const animateFavoriteMove = useCallback(async (oldIdx: number, newIdx: number, photoId: number) => {
    const anim = getPhotoAnim(photoId);

    // 1. Fade out the item
    await new Promise(res => Animated.timing(anim.opacity, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => res(null)));

    // 2. Update list immediately
    setPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      const [movedPhoto] = newPhotos.splice(oldIdx, 1);
      newPhotos.splice(newIdx, 0, movedPhoto);
      return newPhotos;
    });

    // 3. Slide down animation for items that need to move
    await new Promise(resolve => {
      const slideAnimations = photos
        .filter((photo, index) => photo.id !== photoId && index >= newIdx)
        .map(photo => {
          const photoAnim = getPhotoAnim(photo.id as number);
          photoAnim.translateY.setValue(-CARD_HEIGHT);
          return Animated.timing(photoAnim.translateY, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          });
        });

      if (slideAnimations.length > 0) {
        Animated.parallel(slideAnimations).start(() => resolve(null));
      } else {
        resolve(null);
      }
    });

    // 4. Fade in the favorite item at new position
    anim.translateY.setValue(0);
    await new Promise(res => Animated.timing(anim.opacity, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start(() => res(null)));

  }, [getPhotoAnim, photos]);

  const toggleFavorite = useCallback(async (photoId: number) => {
    try {
      const oldIdx = photos.findIndex(p => p.id === photoId);
      await PhotosService.toggleFavorite(photoId);

      const allPhotos = await PhotosService.getAllPhotos();
      const sortedPhotos = allPhotos.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        const dateA = new Date(a.updated_at || a.created_at || '').getTime();
        const dateB = new Date(b.updated_at || b.created_at || '').getTime();
        return dateB - dateA;
      });
      const newIdx = sortedPhotos.findIndex(p => p.id === photoId);

      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        await animateFavoriteMove(oldIdx, newIdx, photoId);
      }
      loadPhotos();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  }, [photos, animateFavoriteMove, loadPhotos]);

  const handleDeletePhoto = useCallback((photoId: number) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const anim = getPhotoAnim(photoId);
            const photoIndex = photos.findIndex(p => p.id === photoId);

            // 1. Fade out and slide left in parallel
            await new Promise(res => Animated.parallel([
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 120,
                useNativeDriver: true,
              }),
              Animated.timing(anim.translateX, {
                toValue: -300,
                duration: 120,
                useNativeDriver: true,
              })
            ]).start(() => res(null)));

            try {
              await PhotosService.deletePhoto(photoId);
              
              // 2. Collapse the faded item by animating its scaleY to 0
              // This creates the gap-closing effect without re-rendering the list
              await new Promise(resolve => {
                Animated.timing(anim.scaleY, {
                  toValue: 0,
                  duration: 250,
                  useNativeDriver: true,
                }).start(() => resolve(null));
              });
              
              // 3. Now safely update the list - items are already in their final visual positions
              setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
              
              // 4. Clean up animation state for deleted item
              setPhotoAnims(prev => {
                const newAnims = { ...prev };
                delete newAnims[photoId];
                return newAnims;
              });

            } catch (error) {
              Alert.alert('Error', 'Failed to delete photo');
              anim.opacity.setValue(1); // Restore on error
              anim.translateX.setValue(0); // Restore position
              anim.scaleY.setValue(1); // Restore scale
            }
          },
        },
      ]
    );
  }, [getPhotoAnim, loadPhotos, photos]);

  const memoizedRenderItem = useMemo(() => ({ item }: { item: Photo }) => {
    const anim = photoAnims[item.id as number] || { opacity: new Animated.Value(1), translateY: new Animated.Value(0), translateX: new Animated.Value(0), scaleY: new Animated.Value(1) };
    return (
      <Animated.View
        style={{
          opacity: anim.opacity,
          transform: [
            { translateY: anim.translateY },
            { translateX: anim.translateX },
            { scaleY: anim.scaleY }
          ],
          width: imageSize,
          marginBottom: 15,
          overflow: 'hidden',
        }}
      >
        <TouchableOpacity style={styles.photoCard}>
          <View style={styles.photoPlaceholder}>
            <Ionicons name="image" size={32} color="#8E9BA2" />
          </View>
          <View style={styles.photoInfo}>
            <Text style={styles.photoTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.photoDescription} numberOfLines={2}>
              {item.description || "No description"}
            </Text>
            <View style={styles.photoFooter}>
              <View style={styles.tags}>
                {(item.tags || []).slice(0, 2).map((tag, index) => (
                  <Text key={index} style={styles.tag}>
                    #{tag}
                  </Text>
                ))}
              </View>
              <Text style={styles.photoDate}>
                {formatDate(
                  item.taken_at ||
                  item.updated_at ||
                  item.created_at ||
                  ""
                )}
              </Text>
            </View>
          </View>
          <View style={{ position: 'absolute', top: 8, right: 8, alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(item.id!)}
            >
              <Ionicons
                name={item.is_favorite ? "heart" : "heart-outline"}
                size={16}
                color={item.is_favorite ? "#FF6B6B" : "#8E9BA2"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePhoto(item.id!)}
            >
              <Ionicons name="trash" size={16} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [photoAnims, toggleFavorite, handleDeletePhoto]);


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

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F6AD55" />
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
          <FlatList
            data={photos}
            renderItem={memoizedRenderItem}
            keyExtractor={(item) => item.id!.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            contentContainerStyle={styles.content}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="camera-outline" size={64} color="#4A5568" />
                <Text style={styles.emptyTitle}>No Photos Found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? "Try a different search term" : "Start capturing your first photo"}
                </Text>
              </View>
            )}
          />
        )}
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
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    width: '100%',
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
