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
import { Link, LinksService } from "../../database/linksService";

export default function LinksScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const listAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentOpacityAnim = useRef(new Animated.Value(1)).current;

  // Load links when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      searchLinks();
    } else {
      loadLinks();
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
      
      // Only load links if we don't have any yet or search is empty
      if (links.length === 0 || !searchQuery.trim()) {
        loadLinks();
      }
    }, [])
  );

  async function loadLinks() {
    try {
      setLoading(true);
      
      const allLinks = await LinksService.getAllLinks();
      const sortedLinks = allLinks.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        const dateA = new Date(a.updated_at || a.created_at || '').getTime();
        const dateB = new Date(b.updated_at || b.created_at || '').getTime();
        return dateB - dateA;
      });
      setLinks(sortedLinks);
      
      // Only animate if this is the first load or we don't have links yet
      if (links.length === 0) {
        // Reset animation for initial load
        listAnim.setValue(0);
        Animated.timing(listAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } else {
        // If we already have links, just set the animation value to completed state
        listAnim.setValue(1);
      }
    } catch (error) {
      console.error('Error loading links:', error);
      Alert.alert('Error', 'Failed to load links');
    } finally {
      setLoading(false);
    }
  }

  async function searchLinks() {
    try {
      setLoading(true);
      const searchResults = await LinksService.searchLinks(searchQuery.trim());
      setLinks(searchResults);
    } catch (error) {
      console.error('Error searching links:', error);
      Alert.alert('Error', 'Failed to search links');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  }

  async function toggleFavorite(linkId: number) {
    try {
      await LinksService.toggleFavorite(linkId);
      if (searchQuery.trim()) {
        searchLinks();
      } else {
        loadLinks();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  }

  const handleAddLink = () => {
    // Animate content fade out smoothly before showing modal
    Animated.timing(contentOpacityAnim, {
      toValue: 0.7,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowLinkModal(true);
    });
  };

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
        description: linkDescription.trim() || undefined,
      });

      Alert.alert("Success", "Link saved successfully!", [
        {
          text: "OK",
          onPress: () => {
            setShowLinkModal(false);
            setLinkTitle("");
            setLinkUrl("");
            setLinkDescription("");
            loadLinks(); // Refresh data after saving
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving link:', error);
      Alert.alert("Error", "Failed to save link. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setShowLinkModal(false);
    setLinkTitle("");
    setLinkUrl("");
    setLinkDescription("");
    
    // Animate content back to full opacity smoothly
    Animated.timing(contentOpacityAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  // Add delete handler
  const handleDeleteLink = (linkId: number) => {
    Alert.alert(
      'Delete Link',
      'Are you sure you want to delete this link?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await LinksService.deleteLink(linkId);
              setLinks((prev) => prev.filter((l) => l.id !== linkId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete link');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <Animated.View 
          style={{ 
            flex: 1, 
            opacity: contentOpacityAnim 
          }}
        >
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8E9BA2" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search links..."
              placeholderTextColor="#8E9BA2"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddLink}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
            </View>
          ) : links.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="link-outline" size={64} color="#4A5568" />
              <Text style={styles.emptyTitle}>No Links Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? "Try a different search term" : "Start saving your first link"}
              </Text>
            </View>
          ) : (
            <Animated.View
              style={{ opacity: listAnim }}
            >
              {links.map((link) => (
                <Animated.View
                  key={link.id}
                  style={{ opacity: listAnim }}
                >
                  <TouchableOpacity style={styles.linkCard}>
                <View style={styles.linkHeader}>
                  <View style={styles.linkIcon}>
                    <Ionicons name="link" size={20} color="#fff" style={{ textShadowColor: '#1A365D', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }} />
                  </View>
                  <View style={styles.linkInfo}>
                    <Text style={styles.linkTitle}>{link.title}</Text>
                    <Text style={styles.linkUrl}>{link.url}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={() => toggleFavorite(link.id!)}
                    >
                      <Ionicons
                        name={link.is_favorite ? "heart" : "heart-outline"}
                        size={16}
                        color={link.is_favorite ? "#FF6B6B" : "#8E9BA2"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteLink(link.id!)}
                    >
                      <Ionicons name="trash" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.linkDescription} numberOfLines={2}>
                  {link.description || "No description"}
                </Text>
                <View style={styles.linkFooter}>
                  <View style={styles.tags}>
                    {(link.tags || []).slice(0, 2).map((tag, index) => (
                      <Text key={index} style={styles.tag}>
                        #{tag}
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.linkDate}>
                    {formatDate(
                      link.updated_at ||
                        link.created_at ||
                        ""
                    )}
                  </Text>
                </View>
              </TouchableOpacity>
                </Animated.View>
              ))}
            </Animated.View>
          )}
        </ScrollView>
        </Animated.View>
      </Animated.View>

      {/* Add Link Modal */}
      <CommonModal
        visible={showLinkModal}
        onClose={handleCloseModal}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Save Link</Text>
          <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
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
          <TouchableOpacity style={[styles.cancelButton, { flex: 0.4 }]} onPress={handleCloseModal}>
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
    backgroundColor: "#63B3ED",
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
  linkCard: {
    backgroundColor: "#1A202C",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  linkHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#63B3ED", 
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F7FAFC",
    marginBottom: 4,
  },
  linkUrl: {
    fontSize: 14,
    color: "#63B3ED",
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
  linkDescription: {
    fontSize: 14,
    color: "#A0AEC0",
    lineHeight: 20,
    marginBottom: 12,
  },
  linkFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tags: {
    flexDirection: "row",
    flex: 1,
  },
  tag: {
    backgroundColor: "#2D3748",
    color: "#63B3ED",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  linkDate: {
    fontSize: 12,
    color: "#8E9BA2",
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
    backgroundColor: "#63B3ED",
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
