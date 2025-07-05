import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { Note, NotesService } from "../../database/notesService";

const CARD_HEIGHT = 120; // Approximate height of a note card (adjust if needed)

export default function NotesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteContent, setEditNoteContent] = useState("");
  const [noteAnims, setNoteAnims] = useState<{ [id: number]: { opacity: Animated.Value, translateY: Animated.Value, translateX: Animated.Value, scaleY: Animated.Value } }>({});
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  const getNoteAnim = useCallback((id: number) => {
    if (!noteAnims[id]) {
      const newAnim = {
        opacity: new Animated.Value(1),
        translateY: new Animated.Value(0),
        translateX: new Animated.Value(0),
        scaleY: new Animated.Value(1),
      };
      setNoteAnims(prev => ({ ...prev, [id]: newAnim }));
      return newAnim;
    }
    return noteAnims[id];
  }, [noteAnims]);

  const loadNotes = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      }
      const allNotes = await NotesService.getAllNotes();
      const sortedNotes = allNotes.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        const dateA = new Date(a.updated_at || a.created_at || '').getTime();
        const dateB = new Date(b.updated_at || b.created_at || '').getTime();
        return dateB - dateA;
      });

      setNoteAnims(prev => {
        const newAnims: { [id: number]: { opacity: Animated.Value, translateY: Animated.Value, translateX: Animated.Value, scaleY: Animated.Value } } = {};
        sortedNotes.forEach(note => {
          if (note.id) {
            newAnims[note.id] = prev[note.id] || {
              opacity: new Animated.Value(1),
              translateY: new Animated.Value(0),
              translateX: new Animated.Value(0),
              scaleY: new Animated.Value(1),
            };
          }
        });
        return newAnims;
      });

      setNotes(sortedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      Alert.alert('Error', 'Failed to load notes');
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, []);

  const searchNotes = useCallback(async () => {
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
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchNotes();
    } else {
      loadNotes(true);
    }
  }, [searchQuery, loadNotes, searchNotes]);

  // Refresh notes when screen comes into focus (e.g., after adding from home screen)
  useFocusEffect(
    useCallback(() => {
      if (!searchQuery.trim()) {
        loadNotes(false); // Don't show loading indicator on focus refresh
      }
    }, [loadNotes, searchQuery])
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

  const animateFavoriteMove = useCallback(async (oldIdx: number, newIdx: number, noteId: number) => {
    const anim = getNoteAnim(noteId);

    // 1. Fade out the item
    await new Promise(res => Animated.timing(anim.opacity, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => res(null)));

    // 2. Update list immediately
    setNotes(prevNotes => {
      const newNotes = [...prevNotes];
      const [movedNote] = newNotes.splice(oldIdx, 1);
      newNotes.splice(newIdx, 0, movedNote);
      return newNotes;
    });

    // 3. Slide down animation for items that need to move
    await new Promise(resolve => {
      const slideAnimations = notes
        .filter((note, index) => note.id !== noteId && index >= newIdx)
        .map(note => {
          const noteAnim = getNoteAnim(note.id as number);
          noteAnim.translateY.setValue(-CARD_HEIGHT);
          return Animated.timing(noteAnim.translateY, {
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

  }, [getNoteAnim, notes]);
  

  const toggleFavorite = useCallback(async (noteId: number) => {
    try {
      const oldIdx = notes.findIndex(n => n.id === noteId);
      await NotesService.toggleFavorite(noteId);

      const allNotes = await NotesService.getAllNotes();
      const sortedNotes = allNotes.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        const dateA = new Date(a.updated_at || a.created_at || '').getTime();
        const dateB = new Date(b.updated_at || b.created_at || '').getTime();
        return dateB - dateA;
      });
      const newIdx = sortedNotes.findIndex(n => n.id === noteId);

      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        await animateFavoriteMove(oldIdx, newIdx, noteId);
      }
      loadNotes();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  }, [notes, animateFavoriteMove, loadNotes]);

  const handleAddNote = () => {
    setShowNoteModal(true);
  };

  const handleSaveNote = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert("Not supported", "Database operations are not supported on web platform");
      return;
    }
    if (!noteTitle.trim() || !noteContent.trim()) {
      Alert.alert("Error", "Please fill in both title and content");
      return;
    }
    try {
      const newNoteId = await NotesService.createNote({
        title: noteTitle.trim(),
        content: noteContent.trim(),
      });

      handleCloseModal();

      // Create the new note object
      const newNote = {
        id: newNoteId,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        is_favorite: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: []
      };

      // Add animation for the new note
      const newAnim = {
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(0),
        translateX: new Animated.Value(0),
        scaleY: new Animated.Value(1),
      };
      setNoteAnims(prev => ({ ...prev, [newNoteId]: newAnim }));

      // Update the list by adding the new note at the top (it's not favorited so goes after favorites)
      setNotes(prevNotes => {
        const favoriteNotes = prevNotes.filter(note => note.is_favorite);
        const regularNotes = prevNotes.filter(note => !note.is_favorite);
        return [...favoriteNotes, newNote, ...regularNotes];
      });

      // Sequential add animation: slide down others → fade in new item
      setTimeout(async () => {
        const anim = getNoteAnim(newNoteId);
        if (anim) {
          // 1. Slide down items that are below the new item
          await new Promise(resolve => {
            const currentFavoriteCount = notes.filter(note => note.is_favorite).length;
            const slideAnimations = notes
              .filter((note, index) => index >= currentFavoriteCount) // Items after favorites
              .map(note => {
                const noteAnim = getNoteAnim(note.id as number);
                noteAnim.translateY.setValue(-CARD_HEIGHT);
                return Animated.timing(noteAnim.translateY, {
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

          // 2. Fade in the new item
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }).start();
        }
      }, 50);

    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert("Error", "Failed to save note. Please try again.");
    }
  }, [noteTitle, noteContent, loadNotes, getNoteAnim]);

  const handleCloseModal = () => {
    setShowNoteModal(false);
    setNoteTitle("");
    setNoteContent("");
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setEditNoteContent(note.content);
    setShowEditModal(true);
  };

  const handlePreviewNote = (note: Note) => {
    setPreviewNote(note);
    setShowPreviewModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingNote(null);
    setEditNoteTitle("");
    setEditNoteContent("");
  };

  const handleSaveEditedNote = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert("Not supported", "Database operations are not supported on web platform");
      return;
    }
    if (!editNoteTitle.trim() || !editNoteContent.trim()) {
      Alert.alert("Error", "Please fill in both title and content");
      return;
    }
    if (!editingNote?.id) {
      Alert.alert("Error", "No note selected for editing");
      return;
    }

    try {
      const success = await NotesService.updateNote(editingNote.id, {
        title: editNoteTitle.trim(),
        content: editNoteContent.trim(),
      });

      if (success) {
        handleCloseEditModal();
        // Refresh the notes list
        loadNotes(false);
      } else {
        Alert.alert("Error", "Failed to update note. Please try again.");
      }
    } catch (error) {
      console.error('Error updating note:', error);
      Alert.alert("Error", "Failed to update note. Please try again.");
    }
  }, [editNoteTitle, editNoteContent, editingNote, loadNotes]);

  const handleCopyNote = useCallback(async (note: Note) => {
    try {
      await Clipboard.setStringAsync(note.content);
      // Show a simple toast-like alert that dismisses automatically
      Alert.alert("Copied to clipboard", "", [{ text: "OK" }], { cancelable: true });
    } catch (error) {
      console.error('Error copying note:', error);
      Alert.alert("Error", "Failed to copy note content");
    }
  }, []);

  const handleDeleteNote = useCallback((noteId: number) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const anim = getNoteAnim(noteId);
            const noteIndex = notes.findIndex(n => n.id === noteId);

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
              await NotesService.deleteNote(noteId);
              
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
              setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
              
              // 4. Clean up animation state for deleted item
              setNoteAnims(prev => {
                const newAnims = { ...prev };
                delete newAnims[noteId];
                return newAnims;
              });

            } catch (error) {
              Alert.alert('Error', 'Failed to delete note');
              anim.opacity.setValue(1); // Restore on error
              anim.translateX.setValue(0); // Restore position
              anim.scaleY.setValue(1); // Restore scale
            }
          },
        },
      ]
    );
  }, [getNoteAnim, notes]);

  const memoizedRenderItem = useMemo(() => ({ item }: { item: Note }) => {
    const anim = noteAnims[item.id as number] || { opacity: 1, translateY: 0, translateX: 0, scaleY: 1 };
    return (
      <Animated.View
        style={{
          opacity: anim.opacity,
          transform: [
            { translateY: anim.translateY },
            { translateX: anim.translateX },
            { scaleY: anim.scaleY }
          ],
          overflow: 'hidden',
        }}
      >
        <TouchableOpacity style={styles.noteCard} onPress={() => handlePreviewNote(item)}>
          <View style={styles.noteHeader}>
            <View style={styles.noteIcon}>
              <Ionicons name="reader-outline" size={20} color="#fff" />
            </View>
            <View style={styles.noteInfo}>
              <Text style={styles.noteTitle}>{item.title}</Text>
              <Text style={styles.noteStats}>
                {item.content.split(' ').length} words · {item.content.length} chars
              </Text>
            </View>
            <TouchableOpacity style={styles.favoriteButton} onPress={(e) => { e.stopPropagation(); toggleFavorite(item.id!); }}>
              <Ionicons
                name={item.is_favorite ? "heart" : "heart-outline"}
                size={22}
                color={item.is_favorite ? "#FF6B6B" : "#8E9BA2"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.copyButton} onPress={(e) => { e.stopPropagation(); handleCopyNote(item); }}>
              <Ionicons name="copy-outline" size={20} color="#4FACFE" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.editButton} onPress={(e) => { e.stopPropagation(); handleEditNote(item); }}>
              <Ionicons name="create-outline" size={20} color="#68D391" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={(e) => { e.stopPropagation(); handleDeleteNote(item.id!); }}>
              <Ionicons name="trash" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
          <Text style={styles.noteContent} numberOfLines={3}>{item.content}</Text>
          <View style={styles.noteFooter}>
            <View style={styles.tags}>
              {(item.tags || []).map((tag, index) => (
                <Text key={index} style={styles.tag}>#{tag}</Text>
              ))}
            </View>
            <Text style={styles.noteCreatedAt}>{formatDate(item.updated_at || item.created_at || "")}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [noteAnims, toggleFavorite, handleCopyNote, handleEditNote, handleDeleteNote]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
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
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer} />
          ) : notes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="reader-outline" size={64} color="#4A5568" />
              <Text style={styles.emptyTitle}>No Notes Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? "Try a different search term" : "Create your first note to get started"}
              </Text>
            </View>
          ) : (
            <Animated.FlatList
              data={notes}
              renderItem={memoizedRenderItem}
              keyExtractor={(item) => item.id!.toString()}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Ionicons name="reader-outline" size={64} color="#4A5568" />
                  <Text style={styles.emptyTitle}>No Notes Found</Text>
                  <Text style={styles.emptyText}>
                    {searchQuery ? "Try a different search term" : "Create your first note to get started"}
                  </Text>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </View>

      <CommonModal visible={showNoteModal} onClose={handleCloseModal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add New Note</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
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

      <CommonModal visible={showEditModal} onClose={handleCloseEditModal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Note</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseEditModal}>
            <Ionicons name="close" size={24} color="#8E9BA2" />
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.titleInput}
          placeholder="Note title..."
          placeholderTextColor="#8E9BA2"
          value={editNoteTitle}
          onChangeText={setEditNoteTitle}
          autoFocus={true}
        />

        <TextInput
          style={styles.contentInput}
          placeholder="Write your thoughts, poetry, or ideas..."
          placeholderTextColor="#8E9BA2"
          value={editNoteContent}
          onChangeText={setEditNoteContent}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />

        <View style={styles.modalButtons}>
          <TouchableOpacity style={[styles.cancelButton, { flex: 0.4 }]} onPress={handleCloseEditModal}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveButton, { flex: 0.55 }]} onPress={handleSaveEditedNote}>
            <Text style={styles.saveButtonText}>Update Note</Text>
          </TouchableOpacity>
        </View>
      </CommonModal>

      <CommonModal visible={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{previewNote?.title}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowPreviewModal(false)}>
            <Ionicons name="close" size={24} color="#8E9BA2" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.previewContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.previewText} selectable={true}>
            {previewNote?.content}
          </Text>
        </ScrollView>

        <View style={styles.previewFooter}>
          <Text style={styles.previewDate}>
            Created: {previewNote?.created_at ? formatDate(previewNote.created_at) : ''}
          </Text>
          {previewNote?.updated_at && previewNote.updated_at !== previewNote.created_at && (
            <Text style={styles.previewDate}>
              Updated: {formatDate(previewNote.updated_at)}
            </Text>
          )}
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
  copyButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
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
    alignItems: "flex-end",
  },
  noteCreatedAt: {
    fontSize: 10,
    color: "#8E9BA2",
    textAlign: "right",
    flex: 0,
    marginLeft: 8,
    marginBottom: 2,
    alignSelf: "flex-end",
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
  previewContent: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 10,
  },
  previewText: {
    color: "#E8E8E8",
    fontSize: 16,
    lineHeight: 24,
    padding: 15,
    backgroundColor: "#1C2329",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A3441",
  },
  previewFooter: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#2A3441",
    marginTop: 10,
  },
  previewDate: {
    color: "#8E9BA2",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 5,
  },
});
