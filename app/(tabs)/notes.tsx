import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Note, NotesService } from "../../database/notesService";

export default function NotesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Notes screen focused - reloading data');
      if (searchQuery.trim()) {
        searchNotes();
      } else {
        loadNotes();
      }
    }, [searchQuery])
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      searchNotes();
    } else {
      loadNotes();
    }
  }, [searchQuery]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const allNotes = await NotesService.getAllNotes();
      setNotes(allNotes);
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

  return (
    <SafeAreaView style={styles.container}>
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
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="create" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading notes...</Text>
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
          notes.map((note) => (
            <TouchableOpacity key={note.id} style={styles.noteCard}>
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
          ))
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
});
