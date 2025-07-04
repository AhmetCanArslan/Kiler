import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { CommonModal } from "../../components/CommonModal";
import { LinksService } from "../../database/linksService";
import { NotesService } from "../../database/notesService";
import { PhotosService } from "../../database/photosService";

// Remove: import { getRecentItems } from "../../database/recentService";

// Add this type and mock data above the AddScreen component:
// type RecentItem = {
//   id: string;
//   type: 'note' | 'link' | 'photo';
//   title: string;
// };

// const mockRecentItems: RecentItem[] = [
//   { id: '1', type: 'note', title: 'My Poem' },
//   { id: '2', type: 'link', title: 'React Docs' },
//   { id: '3', type: 'photo', title: 'Sunset' },
// ];

export default function AddScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  // const [recentItems] = useState<RecentItem[]>(mockRecentItems);
  // Home ekranındaki gibi fade animasyonu
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentOpacityAnim = useRef(new Animated.Value(1)).current;

  // Ekran mount olduğunda ve focus olduğunda animasyonu başlat

  // Her ekrana gelindiğinde animasyon çalışsın
  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, [fadeAnim])
  );

  useEffect(() => {
    // Fetch recent items (notes, links, photos)
    // getRecentItems().then(setRecentItems);
  }, []);

  // Take photo function
  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
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
  const pickImageFromGallery = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery permission is needed to select photos.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
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
      // Generate a title from the filename or use a default
      const filename = asset.uri.split('/').pop() || 'untitled.jpg';
      const title = filename.replace(/\.[^/.]+$/, ""); // Remove extension

      await PhotosService.createPhoto({
        title: title,
        description: `Photo taken on ${new Date().toLocaleDateString()}`,
        file_path: asset.uri,
        original_name: filename,
        file_size: asset.fileSize,
        width: asset.width,
        height: asset.height,
        mime_type: asset.mimeType,
        tags: ['photo', 'captured'],
        taken_at: new Date().toISOString(),
      });

      Alert.alert('Success', 'Photo saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setModalVisible(false);
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo');
    }
  };

  // Eğer tab focus animasyonu da istenirse aşağıdaki kodu açabilirsiniz:
  // import { useFocusEffect } from '@react-navigation/native';
  // useFocusEffect(
  //   useCallback(() => {
  //     fadeAnim.setValue(0);
  //     require('react-native').Animated.timing(fadeAnim, {
  //       toValue: 1,
  //       duration: 400,
  //       useNativeDriver: true,
  //     }).start();
  //   }, [fadeAnim])
  // );

  const addOptions = [
    {
      id: "note",
      title: "Create Note",
      description: "Write poetry, thoughts, or ideas",
      icon: "create",
      color: "#68D391",
    },
    {
      id: "link",
      title: "Save Link",
      description: "Bookmark inspiring websites",
      icon: "link",
      color: "#63B3ED",
    },
    {
      id: "photo",
      title: "Add Photo",
      description: "Capture moments and inspiration",
      icon: "camera",
      color: "#F6AD55",
    },
    {
      id: "import",
      title: "Import Content",
      description: "Share from other apps",
      icon: "share",
      color: "#D53F8C",
    },
  ];

  const handleOptionPress = (type: string) => {
    // Animate content fade out smoothly before showing modal
    Animated.timing(contentOpacityAnim, {
      toValue: 0.7,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedType(type);
      setModalVisible(true);
    });
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedType("");
    
    // Animate content back to full opacity smoothly
    Animated.timing(contentOpacityAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const renderAddForm = () => {
    switch (selectedType) {
      case "note":
        return <NoteForm onClose={handleCloseModal} />;
      case "link":
        return <LinkForm onClose={handleCloseModal} />;
      case "photo":
        return <PhotoForm 
          onClose={handleCloseModal} 
          onTakePhoto={takePhoto}
          onPickFromGallery={pickImageFromGallery}
        />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <Text style={styles.title}>Add to Archive</Text>
          <Text style={styles.subtitle}>Choose what you'd like to add</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.optionsContainer}>
            {addOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionCard}
                onPress={() => handleOptionPress(option.id)}
              >
                <View style={[styles.optionIcon, { backgroundColor: option.color }]}> 
                  <Ionicons name={option.icon as any} size={32} color="#fff" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8E9BA2" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                key="clipboard"
                style={[styles.quickAction, { width: "23%" }]}
                onPress={() => handleOptionPress("note")}
              > 
                <Ionicons name="copy" size={28} color="#FF6B6B" />
                <Text style={styles.quickActionText}>Paste from Clipboard</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                key="voice"
                style={[styles.quickAction, { width: "23%" }]}
                onPress={() => handleOptionPress("note")}
              > 
                <Ionicons name="mic" size={28} color="#FF6B6B" />
                <Text style={styles.quickActionText}>Voice Note</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                key="scan"
                style={[styles.quickAction, { width: "23%" }]}
                onPress={() => handleOptionPress("note")}
              > 
                <Ionicons name="scan" size={28} color="#FF6B6B" />
                <Text style={styles.quickActionText}>Scan Text</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                key="gallery"
                style={[styles.quickAction, { width: "23%" }]}
                onPress={() => handleOptionPress("photo")}
              > 
                <Ionicons name="library" size={28} color="#FF6B6B" />
                <Text style={styles.quickActionText}>From Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <CommonModal
          visible={modalVisible}
          onClose={handleCloseModal}
        >
          {renderAddForm()}
        </CommonModal>
      </Animated.View>
    </SafeAreaView>
  );
}

// Simple form components for different content types
const NoteForm = ({ onClose }: { onClose: () => void }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSave = async () => {
    // Skip database operations on web platform
    if (Platform.OS === 'web') {
      Alert.alert("Not supported", "Database operations are not supported on web platform");
      return;
    }

    if (!title.trim() || !content.trim()) {
      Alert.alert("Error", "Please fill in both title and content");
      return;
    }

    try {
      await NotesService.createNote({
        title: title.trim(),
        content: content.trim(),
      });

      Alert.alert("Success", "Note saved successfully!", [
        {
          text: "OK",
          onPress: onClose,
        },
      ]);
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert("Error", "Failed to save note. Please try again.");
    }
  };

  return (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Create Note</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#8E9BA2" />
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.titleInput}
        placeholder="Note title..."
        placeholderTextColor="#8E9BA2"
        value={title}
        onChangeText={setTitle}
        autoFocus={true}
      />
      <TextInput
        style={styles.contentInput}
        placeholder="Write your thoughts, poetry, or ideas..."
        placeholderTextColor="#8E9BA2"
        multiline
        numberOfLines={10}
        value={content}
        onChangeText={setContent}
        textAlignVertical="top"
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Note</Text>
      </TouchableOpacity>
    </View>
  );
};

const LinkForm = ({ onClose }: { onClose: () => void }) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = async () => {
    // Skip database operations on web platform
    if (Platform.OS === 'web') {
      Alert.alert("Not supported", "Database operations are not supported on web platform");
      return;
    }

    if (!title.trim() || !url.trim()) {
      Alert.alert("Error", "Please fill in both title and URL");
      return;
    }

    try {
      await LinksService.createLink({
        title: title.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
      });

      Alert.alert("Success", "Link saved successfully!", [
        {
          text: "OK",
          onPress: onClose,
        },
      ]);
    } catch (error) {
      console.error('Error saving link:', error);
      Alert.alert("Error", "Failed to save link. Please try again.");
    }
  };

  return (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Save Link</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#8E9BA2" />
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.titleInput}
        placeholder="Link title..."
        placeholderTextColor="#8E9BA2"
        value={title}
        onChangeText={setTitle}
        autoFocus={true}
      />
      <TextInput
        style={styles.titleInput}
        placeholder="URL..."
        placeholderTextColor="#8E9BA2"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        keyboardType="url"
      />
      <TextInput
        style={styles.contentInput}
        placeholder="Description (optional)..."
        placeholderTextColor="#8E9BA2"
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
        textAlignVertical="top"
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Link</Text>
      </TouchableOpacity>
    </View>
  );
};

const PhotoForm = ({ 
  onClose, 
  onTakePhoto, 
  onPickFromGallery 
}: { 
  onClose: () => void;
  onTakePhoto: () => Promise<void>;
  onPickFromGallery: () => Promise<void>;
}) => (
  <View style={styles.formContainer}>
    <View style={styles.formHeader}>
      <Text style={styles.formTitle}>Add Photo</Text>
      <TouchableOpacity onPress={onClose}>
        <Ionicons name="close" size={24} color="#8E9BA2" />
      </TouchableOpacity>
    </View>
    <View style={styles.photoOptions}>
      <TouchableOpacity style={styles.photoOption} onPress={onTakePhoto}>
        <Ionicons name="camera" size={32} color="#F6AD55" />
        <Text style={styles.photoOptionText}>Take Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.photoOption} onPress={onPickFromGallery}>
        <Ionicons name="library" size={32} color="#F6AD55" />
        <Text style={styles.photoOptionText}>Choose from Gallery</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1419",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#F7FAFC",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#A0AEC0",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: "#1A202C",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F7FAFC",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#A0AEC0",
  },
  recentSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F7FAFC",
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickAction: {
    backgroundColor: "#1A202C",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: "48%",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  quickActionText: {
    color: "#F7FAFC",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  formContainer: {
    padding: 20,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F7FAFC",
  },
  titleInput: {
    backgroundColor: "#2D3748",
    borderRadius: 12,
    padding: 15,
    color: "#F7FAFC",
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#4A5568",
  },
  contentInput: {
    backgroundColor: "#2D3748",
    borderRadius: 12,
    padding: 15,
    color: "#F7FAFC",
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#4A5568",
  },
  saveButton: {
    backgroundColor: "#68D391",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  photoOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 30,
    gap: 20,
  },
  photoOption: {
    flex: 1,
    backgroundColor: "#2D3748",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#4A5568",
  },
  photoOptionText: {
    color: "#F7FAFC",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
