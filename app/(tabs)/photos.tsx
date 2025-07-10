import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// import ZoomableImage from "../../components/ZoomableImage";

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
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editLoading, setEditLoading] = useState(false);

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

  // Favori animasyonunu kaldırıyoruz, sıralama değişiminden sonra doğrudan güncelleme yapıyoruz

  const toggleFavorite = useCallback(async (photoId: number) => {
    try {
      await PhotosService.toggleFavorite(photoId);
      await loadPhotos();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  }, [loadPhotos]);

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

  const stripPhotoTakenOn = (desc?: string) => {
    if (!desc) return "No description";
    return desc.replace(/^Photo taken on .+? at .+?$/, '').trim() || "No description";
  };

  const handleEditDescriptionSave = async () => {
    if (!editingPhoto) return;
    setEditLoading(true);
    try {
    if (typeof editingPhoto.id === 'number') {
      await PhotosService.updatePhoto(editingPhoto.id, { description: editDescription });
    }
      setEditingPhoto(null);
      setEditDescription("");
      await loadPhotos();
      Alert.alert('Success', 'Description updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update description');
    } finally {
      setEditLoading(false);
    }
  };

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
          flex: 1,
          marginBottom: 15,
          overflow: 'hidden',
        }}
      >
        <TouchableOpacity style={styles.photoCard} onPress={() => setPreviewPhoto(item)}>
          <View style={styles.photoPlaceholder}>
            {item.file_path ? (
              <Image
                source={{ uri: item.file_path }}
                style={{ width: '100%', height: '100%', borderRadius: 12, resizeMode: 'cover' }}
              />
            ) : (
              <Ionicons name="image" size={32} color="#8E9BA2" />
            )}
          </View>
          <View style={styles.photoInfo}>
            <Text style={styles.photoTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.photoDescription} numberOfLines={2}>
              {stripPhotoTakenOn(item.description)}
            </Text>
            <View style={styles.photoFooter}>
              <View style={styles.tags}>
              </View>
            </View>
          </View>
          <View style={{ position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.favoriteButton, { position: 'relative', top: undefined, right: undefined }]}
              onPress={() => toggleFavorite(item.id!)}
            >
              <Ionicons
                name={item.is_favorite ? "heart" : "heart-outline"}
                size={16}
                color={item.is_favorite ? "#FF6B6B" : "#8E9BA2"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setEditingPhoto(item);
                const desc = stripPhotoTakenOn(item.description);
                setEditDescription(desc === "No description" ? "" : desc);
              }}
            >
              <Ionicons name="create-outline" size={16} color="#F6AD55" />
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

  // Take photo function
  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await savePhoto(asset);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Pick image from gallery
  const handlePickFromGallery = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery permission is needed to select photos.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await savePhoto(asset);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Save photo to database
  const savePhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    // Skip database operations on web platform
    if (Platform.OS === 'web') {
      Alert.alert("Not supported", "Photo saving is not supported on web platform");
      return;
    }

    try {
      // Generate a title with date-time-seconds format
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const title = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
      const filename = asset.uri.split('/').pop() || 'untitled.jpg';

      await PhotosService.createPhoto({
        title: title,
        description: `Photo taken on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`,
        file_path: asset.uri,
        original_name: filename,
        file_size: asset.fileSize,
        width: asset.width,
        height: asset.height,
        mime_type: asset.mimeType,
        tags: ['photo', 'captured'],
        taken_at: now.toISOString(),
      });

      // Refresh photos list immediately
      await loadPhotos();

      Alert.alert('Success', 'Photo saved successfully!');
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo');
    }
  };

  // Handle add photo button press
  const handleAddPhoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleTakePhoto();
          } else if (buttonIndex === 2) {
            handlePickFromGallery();
          }
        }
      );
    } else {
      // For Android, show alert with options
      Alert.alert(
        'Add Photo',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: handleTakePhoto },
          { text: 'Choose from Gallery', onPress: handlePickFromGallery },
        ]
      );
    }
  };

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
          <TouchableOpacity style={styles.addButton} onPress={handleAddPhoto}>
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
            columnWrapperStyle={{ gap: 15 }}
            contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20, flexGrow: 1 }}
            extraData={{ photos, photoAnims }}
            removeClippedSubviews={false}
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

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.92)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
        }}>
          {/* Tap outside to close */}
          <TouchableOpacity
            activeOpacity={1}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99,
            }}
            onPress={() => setPreviewPhoto(null)}
          />
          {/* Modal content */}
          <View style={{ zIndex: 100, alignItems: 'center', width: '100%' }}>
            <TouchableOpacity
              style={{ position: 'absolute', top: 40, right: 30, zIndex: 101 }}
              onPress={() => setPreviewPhoto(null)}
            >
              <Ionicons name="close-circle" size={40} color="#fff" />
            </TouchableOpacity>
            <ScrollView
              style={{ width: '100%' }}
              contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
              horizontal={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              scrollEnabled={true}
            >
              <View style={{ width: '100%', height: Dimensions.get('window').height * 0.7, alignItems: 'center', justifyContent: 'center' }}>
                {previewPhoto.file_path ? (
                  <Image
                    source={{ uri: previewPhoto.file_path }}
                    style={{ width: '90%', height: '100%', borderRadius: 18, resizeMode: 'contain', backgroundColor: '#222' }}
                  />
                ) : (
                  <Ionicons name="image" size={64} color="#8E9BA2" />
                )}
              </View>
            </ScrollView>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 18 }} numberOfLines={2}>{previewPhoto.title}</Text>
            {stripPhotoTakenOn(previewPhoto.description) !== 'No description' && (
              <Text style={{ color: '#ccc', fontSize: 14, marginTop: 6, marginBottom: 10, textAlign: 'center', maxWidth: '90%' }} numberOfLines={3}>
                {stripPhotoTakenOn(previewPhoto.description)}
              </Text>
            )}
          </View>
        </View>
      )}
      {/* Edit Description Modal */}
      {editingPhoto && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 200,
        }}>
          <View style={{ backgroundColor: '#1A202C', borderRadius: 16, padding: 24, width: '85%' }}>
            <Text style={{ color: '#F7FAFC', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Edit Description</Text>
            <TextInput
              style={{
                backgroundColor: '#2D3748',
                color: '#F7FAFC',
                borderRadius: 8,
                padding: 10,
                fontSize: 15,
                marginBottom: 16,
              }}
              multiline
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Enter new description..."
              placeholderTextColor="#8E9BA2"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={{ marginRight: 12 }}
                onPress={() => setEditingPhoto(null)}
                disabled={editLoading}
              >
                <Text style={{ color: '#A0AEC0', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#F6AD55', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 8 }}
                onPress={handleEditDescriptionSave}
                disabled={editLoading}
              >
                <Text style={{ color: '#1A202C', fontWeight: 'bold', fontSize: 16 }}>{editLoading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    minHeight: 260,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    // Remove any possible overlap by ensuring no absolute/fixed children except for buttons
  },
  photoPlaceholder: {
    width: "100%",
    height: imageSize,
    backgroundColor: "#2D3748",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: 'hidden', // Prevent image overflow
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
    marginBottom: 26
    
    ,
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
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 6,
    marginLeft: 0,
  },
  editButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 6,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
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
