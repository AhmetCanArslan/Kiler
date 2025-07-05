import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
import { getDatabaseStats } from "../../database/database";
import { LinksService } from "../../database/linksService";
import { NotesService } from "../../database/notesService";
import { PhotosService } from "../../database/photosService";

interface RecentItem {
  id: number;
  type: "note" | "link" | "photo";
  title: string;
  date: string;
}

interface DatabaseStats {
  notes_count: number;
  links_count: number;
  photos_count: number;
  tags_count: number;
  collections_count: number;
}

interface HomeScreenProps {
  settingsButton?: React.ReactNode;
}

export default function HomeScreen({ settingsButton }: HomeScreenProps) {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [stats, setStats] = useState<DatabaseStats>({
    notes_count: 0,
    links_count: 0,
    photos_count: 0,
    tags_count: 0,
    collections_count: 0,
  });

  const loadData = useCallback(async () => {
    // Skip database operations on web platform
    if (Platform.OS === 'web') {
      return;
    }
    
    try {
      // Load database stats
      const dbStats = await getDatabaseStats();
      setStats(dbStats as DatabaseStats);

      // Load recent items
      const recentNotes = await NotesService.getRecentNotes(2);
      const recentLinks = await LinksService.getRecentLinks(2);
      const recentPhotos = await PhotosService.getRecentPhotos(2);

      const allRecent: RecentItem[] = [
        ...recentNotes.map(note => ({
          id: note.id!,
          type: "note" as const,
          title: note.title,
          date: formatDate(note.updated_at || note.created_at || ""),
        })),
        ...recentLinks.map(link => ({
          id: link.id!,
          type: "link" as const,
          title: link.title,
          date: formatDate(link.updated_at || link.created_at || ""),
        })),
        ...recentPhotos.map(photo => ({
          id: photo.id!,
          type: "photo" as const,
          title: photo.title,
          date: formatDate(photo.updated_at || photo.created_at || ""),
        })),
      ];

      // Sort by date and take top 4
      allRecent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentItems(allRecent.slice(0, 4));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh home data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Only fade animation when screen comes into focus, avoid duplicate data loading
  // Fade animation on focus removed

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

  const handleAddNote = () => {
    setShowNoteModal(true);
  };

  const handleSaveNote = async () => {
    // Skip database operations on web platform
    if (Platform.OS === 'web') {
      Alert.alert("Not supported", "Database operations are not supported on web platform");
      return;
    }
    
    if (!noteTitle.trim() || !noteContent.trim()) {
      Alert.alert("Error", "Please fill in both title and content");
      return;
    }

    try {
      await NotesService.createNote({
        title: noteTitle.trim(),
        content: noteContent.trim(),
      });

      // Close modal and clear inputs immediately
      setShowNoteModal(false);
      setNoteTitle("");
      setNoteContent("");
      
      // Refresh data immediately
      loadData();

      Alert.alert("Success", "Note saved successfully!");
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert("Error", "Failed to save note. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setShowNoteModal(false);
    setNoteTitle("");
    setNoteContent("");
  };

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

      // Refresh data immediately
      loadData();

      Alert.alert('Success', 'Photo saved successfully!');
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo');
    }
  };

  // Handle add link
  const handleAddLink = () => {
    setShowLinkModal(true);
  };

  // Handle save link
  const handleSaveLink = async () => {
    // Skip database operations on web platform
    if (Platform.OS === 'web') {
      Alert.alert("Not supported", "Database operations are not supported on web platform");
      return;
    }
    
    if (!linkTitle.trim() || !linkUrl.trim()) {
      Alert.alert("Error", "Please fill in both title and URL");
      return;
    }

    try {
      await LinksService.createLink({
        title: linkTitle.trim(),
        url: linkUrl.trim(),
        description: linkDescription.trim(),
      });

      // Close modal and clear inputs immediately
      setShowLinkModal(false);
      setLinkTitle("");
      setLinkUrl("");
      setLinkDescription("");
      
      // Refresh data immediately
      loadData();

      Alert.alert("Success", "Link saved successfully!");
    } catch (error) {
      console.error('Error saving link:', error);
      Alert.alert("Error", "Failed to save link. Please try again.");
    }
  };

  const handleCloseLinkModal = () => {
    setShowLinkModal(false);
    setLinkTitle("");
    setLinkUrl("");
    setLinkDescription("");
  };

  return (
    <SafeAreaView style={styles.container}>
      {settingsButton}
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Kiler</Text>
            <Text style={styles.subtitle}>Your digital poetry archive</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="library" size={24} color="#FF6B6B" />
              <Text style={styles.statNumber}>
                {stats.notes_count + stats.links_count + stats.photos_count}
              </Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="document-text" size={24} color="#68D391" />
              <Text style={styles.statNumber}>{stats.notes_count}</Text>
              <Text style={styles.statLabel}>Notes</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="link" size={24} color="#63B3ED" />
              <Text style={styles.statNumber}>{stats.links_count}</Text>
              <Text style={styles.statLabel}>Links</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="images" size={24} color="#F6AD55" />
              <Text style={styles.statNumber}>{stats.photos_count}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Items</Text>
            {recentItems.map((item) => {
              let icon, color;
              if (item.type === 'note') {
                icon = 'document-text';
                color = '#68D391';
              } else if (item.type === 'link') {
                icon = 'link';
                color = '#63B3ED';
              } else if (item.type === 'photo') {
                icon = 'image';
                color = '#F6AD55';
              } else {
                icon = 'document';
                color = '#8E9BA2';
              }
              return (
                <TouchableOpacity key={`${item.type}-${item.id}`} style={styles.itemCard}>
                  <View style={[styles.itemIcon, { backgroundColor: color, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 6, elevation: 6, borderWidth: 2, borderColor: 'rgba(0,0,0,0.18)' }]}> 
                    <Ionicons
                      name={icon as any}
                      size={22}
                      color="#fff"
                      style={{ textShadowColor: '#222', textShadowRadius: 6, textShadowOffset: { width: 0, height: 2 } }}
                    />
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemDate}>{item.date}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#8E9BA2" />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity key="add-note" style={[styles.actionCard, { width: "22%", backgroundColor: "#68D391", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 0 }] } onPress={handleAddNote}>
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={[styles.actionText, { color: "#fff", textAlign: "center", fontSize: 12 }]}>Add Note</Text>
              </TouchableOpacity>
              <TouchableOpacity key="take-photo" style={[styles.actionCard, { width: "22%", backgroundColor: "#F6AD55", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 0 }]} onPress={handleTakePhoto}>
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={[styles.actionText, { color: "#fff", textAlign: "center", fontSize: 12 }]}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity key="add-link" style={[styles.actionCard, { width: "22%", backgroundColor: "#63B3ED", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 0 }]} onPress={handleAddLink}>
              <Ionicons name="link" size={24} color="#fff" />
              <Text style={[styles.actionText, { color: "#fff", textAlign: "center", fontSize: 12 }]}>Add Link</Text>
              </TouchableOpacity>
              <TouchableOpacity key="search" style={[styles.actionCard, { width: "22%", backgroundColor: "#2D3748", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 0 }]}>
              <Ionicons name="search" size={24} color="#fff" />
              <Text style={[styles.actionText, { color: "#fff", textAlign: "center", fontSize: 12 }]}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Add Note Modal */}
      <CommonModal
        visible={showNoteModal}
        onClose={handleCloseModal}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create Note</Text>
          <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#8E9BA2" />
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.titleInput}
          placeholder="Note title..."
          placeholderTextColor="#8E9BA2"
          value={noteTitle}
          onChangeText={setNoteTitle}
          autoFocus={true}
        />

        <TextInput
          style={styles.contentInput}
          placeholder="Write your thoughts, poetry, or ideas..."
          placeholderTextColor="#8E9BA2"
          value={noteContent}
          onChangeText={setNoteContent}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />

        <View style={styles.modalButtons}>
          <TouchableOpacity style={[styles.cancelButton, { flex: 0.4 }]} onPress={handleCloseModal}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveButton, { flex: 0.55 }]} onPress={handleSaveNote}>
            <Text style={styles.saveButtonText}>Save Note</Text>
          </TouchableOpacity>
        </View>
      </CommonModal>

      {/* Add Link Modal */}
      <CommonModal
        visible={showLinkModal}
        onClose={handleCloseLinkModal}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Link</Text>
          <TouchableOpacity onPress={handleCloseLinkModal} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#8E9BA2" />
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.titleInput}
          placeholder="Link title..."
          placeholderTextColor="#8E9BA2"
          value={linkTitle}
          onChangeText={setLinkTitle}
          autoFocus={true}
        />

        <TextInput
          style={styles.titleInput}
          placeholder="URL..."
          placeholderTextColor="#8E9BA2"
          value={linkUrl}
          onChangeText={setLinkUrl}
          autoCapitalize="none"
          keyboardType="url"
        />

        <TextInput
          style={styles.contentInput}
          placeholder="Description (optional)..."
          placeholderTextColor="#8E9BA2"
          value={linkDescription}
          onChangeText={setLinkDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={styles.modalButtons}>
          <TouchableOpacity style={[styles.cancelButton, { flex: 0.4 }]} onPress={handleCloseLinkModal}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveButton, { flex: 0.55 }]} onPress={handleSaveLink}>
            <Text style={styles.saveButtonText}>Save Link</Text>
          </TouchableOpacity>
        </View>
      </CommonModal>
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
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    // Extra contrast for modal overlay
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.18)',
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
  // Modal styles
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F7FAFC",
  },
  closeButton: {
    padding: 4,
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
    minHeight: 120,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#4A5568",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#2D3748",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4A5568",
  },
  cancelButtonText: {
    color: "#A0AEC0",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
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
});
