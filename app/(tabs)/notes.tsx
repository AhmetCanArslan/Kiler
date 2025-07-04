import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
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
  View,
} from "react-native";
import { CommonModal } from "../../components/CommonModal";
import { Note, NotesService } from "../../database/notesService";

export default function NotesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;


  // Load notes when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      searchNotes();
    } else {
      loadNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Fade in animation only on focus (tab switch)
  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      
      // Only load notes if we don't have any yet or search is empty
      if (notes.length === 0 || !searchQuery.trim()) {
        loadNotes();
      }
    }, [])
  );

  const loadNotes = async () => {
    try {
      setLoading(true);
      
      const allNotes = await NotesService.getAllNotes();
      // Sort notes: favorites first, then by updated_at desc
      const sortedNotes = allNotes.sort((a, b) => {
        // First sort by favorite status (favorites first)
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        // Then sort by updated_at (most recent first)
        const dateA = new Date(a.updated_at || a.created_at || '').getTime();
        const dateB = new Date(b.updated_at || b.created_at || '').getTime();
        return dateB - dateA;
      });
      setNotes(sortedNotes);
      
      // Only animate if this is the first load or we don't have notes yet
      if (notes.length === 0) {
        // Reset animations for initial load
        listAnim.setValue(0);
        slideAnim.setValue(50);
        
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
      } else {
        // If we already have notes, just set the animation values to completed state
        listAnim.setValue(1);
        slideAnim.setValue(0);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      Alert.alert('Error', 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const searchNotes = async () => {
    try {
      setLoading(true);
      const searchResults = await NotesService.searchNotes(searchQuery.trim());
      setNotes(searchResults);
    } catch (error) {
      console.error('Error searching notes:', error);
      Alert.alert('Error', 'Failed to search notes');
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

  const toggleFavorite = async (noteId: number) => {
    try {
      await NotesService.toggleFavorite(noteId);
      // Refresh the notes to show updated favorite status
      if (searchQuery.trim()) {
        searchNotes();
      } else {
        loadNotes();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
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

      Alert.alert("Success", "Note saved successfully!", [
        {
          text: "OK",
          onPress: () => {
            setShowNoteModal(false);
            setNoteTitle("");
            setNoteContent("");
            loadNotes(); // Refresh data after saving
          },
        },
      ]);
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


  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8E9BA2" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notes..."
              placeholderTextColor="#8E9BA2"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNote}>
            <Ionicons name="create" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
            </View>
          ) : notes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#4A5568" />
              <Text style={styles.emptyTitle}>No Notes Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? "Try a different search term" : "Start creating your first note"}
              </Text>
            </View>
          ) : (
            <Animated.View
              style={[
                {
                  opacity: listAnim,
                  transform: [
                    {
                      translateY: slideAnim,
                    },
                  ],
                },
              ]}
            >
              {notes.map((note, index) => (
                <Animated.View
                  key={note.id}
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
                  <TouchableOpacity style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <View style={styles.noteIcon}>
                    <Ionicons name="document-text" size={20} color="#68D391" />
                  </View>
                  <View style={styles.noteInfo}>
                    <Text style={styles.noteTitle}>{note.title}</Text>
                    <Text style={styles.noteStats}>
                      {note.word_count || 0} words • {formatDate(note.updated_at || note.created_at || "")}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(note.id!)}
                  >
                    <Ionicons 
                      name={note.is_favorite ? "heart" : "heart-outline"} 
                      size={18} 
                      color={note.is_favorite ? "#FF6B6B" : "#8E9BA2"} 
                    />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.noteContent} numberOfLines={3}>
                  {note.content}
                </Text>
                
                <View style={styles.noteFooter}>
                  <View style={styles.tags}>
                    {(note.tags || []).map((tag, index) => (
                      <Text key={index} style={styles.tag}>
                        #{tag}
                      </Text>
                    ))}
                  </View>
                </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </Animated.View>
          )}
        </ScrollView>
      </Animated.View>

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
    backgroundColor: "#68D391",
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
  noteCard: {
    backgroundColor: "#1A202C",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  noteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#68D391",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F7FAFC",
    marginBottom: 4,
  },
  noteStats: {
    fontSize: 12,
    color: "#8E9BA2",
  },
  shareButton: {
    padding: 8,
  },
  favoriteButton: {
    padding: 8,
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
  noteContent: {
    fontSize: 14,
    color: "#A0AEC0",
    lineHeight: 22,
    marginBottom: 12,
    fontStyle: "italic",
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
  },
  tag: {
    color: "#68D391",
    fontSize: 12,
    marginRight: 8,
    marginBottom: 2,
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
    textAlignVertical: "top",
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
