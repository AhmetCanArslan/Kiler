import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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
  // Helper: get or create anim object for a note id
  const getNoteAnim = (id: number | undefined) => {
    if (typeof id !== 'number') return { opacity: new Animated.Value(1), translateY: new Animated.Value(0) };
    setNoteAnims(prev => {
      if (typeof id === 'number' && !prev[id]) {
        prev[id] = {
          opacity: new Animated.Value(1),
          translateY: new Animated.Value(0),
        };
      }
      return { ...prev };
    });
    return (typeof id === 'number' && noteAnims[id]) ? noteAnims[id] : { opacity: new Animated.Value(1), translateY: new Animated.Value(0) };
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  // Animation state for each note
  const [noteAnims, setNoteAnims] = useState<{ [id: number]: { opacity: Animated.Value, translateY: Animated.Value } }>({});

  // Helper to ensure anim objects exist for all notes
  const ensureNoteAnims = (noteList: Note[], newId?: number) => {
    setNoteAnims(prev => {
      const newAnims = { ...prev };
      noteList.forEach(note => {
        if (typeof note.id === 'number' && !newAnims[note.id]) {
          newAnims[note.id] = {
            opacity: new Animated.Value(newId === note.id ? 0 : 1),
            translateY: new Animated.Value(0),
          };
        }
      });
      // Remove anims for deleted notes
      Object.keys(newAnims).forEach(id => {
        if (!noteList.find(n => n.id === Number(id))) {
          delete newAnims[Number(id)];
        }
      });
      return newAnims;
    });
  };
  // Fade animations removed
  // const fadeAnim = useRef(new Animated.Value(0)).current;
  // const listAnim = useRef(new Animated.Value(0)).current;
  // const contentOpacityAnim = useRef(new Animated.Value(1)).current;


  // Load notes when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      searchNotes();
    } else {
      loadNotes();
    }
  }, [searchQuery]);

  // Fade in animation only on focus (tab switch)
  // Fade animation on focus removed

  const loadNotes = async (withAnim = false, newId?: number) => {
    try {
      setLoading(true);
      const allNotes = await NotesService.getAllNotes();
      const sortedNotes = allNotes.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        const dateA = new Date(a.updated_at || a.created_at || '').getTime();
        const dateB = new Date(b.updated_at || b.created_at || '').getTime();
        return dateB - dateA;
      });
      ensureNoteAnims(sortedNotes, newId);
      setNotes(sortedNotes);
      if (withAnim && newId) {
        setTimeout(() => {
          setNoteAnims(prev => {
            if (prev[newId]) {
              prev[newId].opacity.setValue(0);
              Animated.timing(prev[newId].opacity, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
              }).start();
            }
            return { ...prev };
          });
        }, 50);
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

  // Animate favorite: fade out at old position, slide others, fade in at new position
  // Yeni favori animasyonu: fade out, üsttekiler slide down, sonra fade in
  const animateFavoriteMove = async (oldIdx: number, newIdx: number, noteId: number, newOrder: Note[]) => {
    // 1. Fade out the note at old position
    await new Promise(res => {
      setNoteAnims(prev => {
        if (prev[noteId]) {
          Animated.timing(prev[noteId].opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start(() => res(null));
        } else {
          res(null);
        }
        return { ...prev };
      });
    });

    // 2. Slide only the items above oldIdx
    await new Promise(slideResAll => {
      setNoteAnims(prev => {
        const slidePromises: Promise<unknown>[] = [];
        for (let idx = 0; idx < oldIdx; idx++) {
          const note = notes[idx];
          if (note.id !== noteId && typeof note.id === 'number') {
            if (!prev[note.id]) {
              prev[note.id] = { opacity: new Animated.Value(1), translateY: new Animated.Value(0) };
            }
            if (typeof note.id === 'number' && prev[note.id]) {
              const anim = prev[note.id];
              anim.translateY.setValue(0);
              slidePromises.push(new Promise(slideRes => {
                Animated.timing(anim.translateY, {
                  toValue: CARD_HEIGHT + 15,
                  duration: 350,
                  useNativeDriver: true,
                }).start(() => slideRes(null));
              }));
            }
          }
        }
        Promise.all(slidePromises).then(() => slideResAll(null));
        return { ...prev };
      });
    });

    // 3. Update data: move note to top
    const newNotes = [...notes];
    const moved = newNotes.splice(oldIdx, 1)[0];
    newNotes.unshift(moved);
    setNotes(newNotes);

    // 4. Fade in the note at new position
    await new Promise(res => {
      setNoteAnims(prev => {
        if (prev[noteId]) {
          prev[noteId].opacity.setValue(0);
          Animated.timing(prev[noteId].opacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }).start(() => res(null));
        } else {
          res(null);
        }
        return { ...prev };
      });
    });

    // 5. Reset translateY for all
    setNoteAnims(prev => {
      Object.keys(prev).forEach(id => {
        if (prev[Number(id)]) {
          prev[Number(id)].translateY.setValue(0);
        }
      });
      return { ...prev };
    });
  };

  const toggleFavorite = async (noteId: number) => {
    try {
      // Find old and new index for the note
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
        await animateFavoriteMove(oldIdx, newIdx, noteId, sortedNotes);
        // Favori animasyonu bittikten sonra state'i güncelle ki, buton güncel olsun
        setNotes(sortedNotes);
      } else {
        setNotes(sortedNotes);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  // Sequential add animation: slide others, then fade in new note
  const handleAddNote = () => {
    setShowNoteModal(true);
  };

  const handleSaveNote = async () => {
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
      const allNotes = await NotesService.getAllNotes();
      const sortedNotes = allNotes.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        const dateA = new Date(a.updated_at || a.created_at || '').getTime();
        const dateB = new Date(b.updated_at || b.created_at || '').getTime();
        return dateB - dateA;
      });
      ensureNoteAnims(sortedNotes, newNoteId);
      // Slide others
      const prevPositions = notes.map((n, idx) => ({ id: n.id, idx }));
      await Promise.all(sortedNotes.map((note, idx) => {
        if (note.id !== newNoteId && typeof note.id === 'number') {
          const prev = prevPositions.find(p => p.id === note.id);
          setNoteAnims(prevAnims => {
            if (typeof note.id === 'number' && !prevAnims[note.id]) {
              prevAnims[note.id] = { opacity: new Animated.Value(1), translateY: new Animated.Value(0) };
            }
            return { ...prevAnims };
          });
          if (prev && prev.idx !== idx) {
            const anim = getNoteAnim(note.id);
            anim.translateY.setValue((prev.idx - idx) * (CARD_HEIGHT + 15));
            return new Promise(res => {
              Animated.spring(anim.translateY, {
                toValue: 0,
                useNativeDriver: true,
              }).start(() => res(null));
            });
          }
        }
        return Promise.resolve();
      }));
      setNotes(sortedNotes);
      setShowNoteModal(false);
      setNoteTitle("");
      setNoteContent("");
      setTimeout(() => {
        setNoteAnims(prev => {
          if (prev[newNoteId]) {
            prev[newNoteId].opacity.setValue(0);
            Animated.timing(prev[newNoteId].opacity, {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            }).start();
          }
          return { ...prev };
        });
      }, 50);
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

  // Sequential delete animation: fade out, slide, fade in rest
  const handleDeleteNote = (noteId: number) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // 1. Fade out the note
            await new Promise(res => {
              setNoteAnims(prev => {
                if (prev[noteId]) {
                  Animated.timing(prev[noteId].opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => res(null));
                } else {
                  res(null);
                }
                return { ...prev };
              });
            });
            try {
              await NotesService.deleteNote(noteId);
              const allNotes = await NotesService.getAllNotes();
              const sortedNotes = allNotes.sort((a, b) => {
                if (a.is_favorite && !b.is_favorite) return -1;
                if (!a.is_favorite && b.is_favorite) return 1;
                const dateA = new Date(a.updated_at || a.created_at || '').getTime();
                const dateB = new Date(b.updated_at || b.created_at || '').getTime();
                return dateB - dateA;
              });
              const filteredNotes = sortedNotes.filter(n => n.id !== noteId);
              ensureNoteAnims(filteredNotes);
              const prevPositions = notes.map((n, idx) => ({ id: n.id, idx }));
              // Defensive: check anim exists
              await Promise.all(filteredNotes.map((note, idx) => {
                if (typeof note.id === 'number') {
                  setNoteAnims(prevAnims => {
                    if (typeof note.id === 'number' && !prevAnims[note.id]) {
                      prevAnims[note.id] = { opacity: new Animated.Value(1), translateY: new Animated.Value(0) };
                    }
                    return { ...prevAnims };
                  });
                  const prev = prevPositions.find(p => p.id === note.id);
                  if (prev && prev.idx !== idx) {
                    const anim = getNoteAnim(note.id);
                    anim.translateY.setValue((prev.idx - idx) * (CARD_HEIGHT + 15));
                    return new Promise(res2 => {
                      Animated.timing(anim.translateY, {
                        toValue: 0,
                        duration: 350,
                        useNativeDriver: true,
                      }).start(() => res2(null));
                    });
                  }
                }
                return Promise.resolve();
              }));
              setNotes(filteredNotes);
              setTimeout(() => {
                setNoteAnims(prev => {
                  const copy = { ...prev };
                  delete copy[noteId];
                  return copy;
                });
              }, 50);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
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
            <View>
              {notes.map((note) => (
                <Animated.View
                  key={note.id}
                  style={{
                    opacity: typeof note.id === 'number' && noteAnims[note.id]?.opacity !== undefined ? noteAnims[note.id].opacity : 1,
                    transform: [
                      {
                        translateY:
                          typeof note.id === 'number' && noteAnims[note.id]?.translateY !== undefined
                            ? noteAnims[note.id].translateY
                            : 0,
                      },
                    ],
                  }}
                >
                  <TouchableOpacity style={styles.noteCard}>
                    <View style={styles.noteHeader}>
                      <View style={styles.noteIcon}>
                        <Ionicons name="document-text" size={20} color="#fff" style={{ textShadowColor: '#22543D', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }} />
                      </View>
                      <View style={styles.noteInfo}>
                        <Text style={styles.noteTitle}>{note.title}</Text>
                        <Text style={styles.noteStats}>
                          {note.word_count || 0} words • {formatDate(note.updated_at || note.created_at || "")}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
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
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteNote(note.id!)}
                        >
                          <Ionicons name="trash" size={18} color="#FF6B6B" />
                        </TouchableOpacity>
                      </View>
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
                      <Text style={styles.noteCreatedAt}>
                        {formatDate(note.created_at || "")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
        </View>
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
});
