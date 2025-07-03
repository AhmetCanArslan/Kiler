import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
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

export default function HomeScreen() {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [stats, setStats] = useState<DatabaseStats>({
    notes_count: 0,
    links_count: 0,
    photos_count: 0,
    tags_count: 0,
    collections_count: 0,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const screenFadeAnim = useRef(new Animated.Value(0)).current;

  // Load data on component mount and when screen comes into focus
  useEffect(() => {
    loadData();
    Animated.timing(screenFadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
      screenFadeAnim.setValue(0);
      Animated.timing(screenFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, [screenFadeAnim])
  );

  const loadData = async () => {
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
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
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

      Alert.alert("Success", "Note saved successfully!", [
        {
          text: "OK",
          onPress: () => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setShowNoteModal(false);
              setNoteTitle("");
              setNoteContent("");
              loadData(); // Refresh data after saving
            });
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert("Error", "Failed to save note. Please try again.");
    }
  };

  const handleCloseModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowNoteModal(false);
      setNoteTitle("");
      setNoteContent("");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: screenFadeAnim }}>
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
            {recentItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.itemCard}>
                <View style={styles.itemIcon}>
                  <Ionicons
                    name={getIconName(item.type) as any}
                    size={20}
                    color="#FF6B6B"
                  />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDate}>{item.date}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#8E9BA2" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={[styles.actionCard, { width: "22%" }]} onPress={handleAddNote}>
                <Ionicons name="add-circle" size={28} color="#FF6B6B" />
                <Text style={styles.actionText}>Add Note</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { width: "22%" }]}>
                <Ionicons name="camera" size={28} color="#FF6B6B" />
                <Text style={styles.actionText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { width: "22%" }]}>
                <Ionicons name="share" size={28} color="#FF6B6B" />
                <Text style={styles.actionText}>Share Item</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { width: "22%" }]}>
                <Ionicons name="search" size={28} color="#FF6B6B" />
                <Text style={styles.actionText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Add Note Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={showNoteModal}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          {/* Fixed backdrop with fade animation */}
          <Animated.View 
            style={[
              styles.backdrop,
              {
                opacity: fadeAnim,
              }
            ]} 
          />
          
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  },
                ],
              }
            ]}
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
          </Animated.View>
        </View>
      </Modal>
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
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#1A202C",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
    borderTopWidth: 1,
    borderTopColor: "#2D3748",
  },
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
