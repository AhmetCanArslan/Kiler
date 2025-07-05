import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { CommonModal } from "../../components/CommonModal";
import { Link, LinksService } from "../../database/linksService";

const CARD_HEIGHT = 110; // Approximate height of a link card (adjust if needed)

export default function LinksScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [linkAnims, setLinkAnims] = useState<{ [id: number]: { opacity: Animated.Value, translateY: Animated.Value } }>({});

  const getLinkAnim = useCallback((id: number) => {
    if (!linkAnims[id]) {
      const newAnim = {
        opacity: new Animated.Value(1),
        translateY: new Animated.Value(0),
      };
      setLinkAnims(prev => ({ ...prev, [id]: newAnim }));
      return newAnim;
    }
    return linkAnims[id];
  }, [linkAnims]);

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

  const animateFavoriteMove = useCallback(async (oldIdx: number, newIdx: number, linkId: number) => {
    const anim = getLinkAnim(linkId);

    // 1. Fade out
    await new Promise(res => Animated.timing(anim.opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => res(null)));

    // 2. Update state to get new positions, but keep item invisible
    setLinks(prevLinks => {
      const newLinks = [...prevLinks];
      const [movedLink] = newLinks.splice(oldIdx, 1);
      newLinks.splice(newIdx, 0, movedLink);
      return newLinks;
    });

    // 3. Animate other items sliding
    await new Promise(resolve => {
      Animated.stagger(50,
        links
          .filter(l => l.id !== linkId)
          .map(l => {
            const lAnim = getLinkAnim(l.id as number);
            lAnim.translateY.setValue(CARD_HEIGHT); // Move down initially
            return Animated.spring(lAnim.translateY, {
              toValue: 0,
              useNativeDriver: true,
            });
          })
      ).start(() => resolve(null));
    });


    // 4. Fade in at new position
    anim.translateY.setValue(0); // Reset position before fade in
    await new Promise(res => Animated.timing(anim.opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => res(null)));

  }, [getLinkAnim, links]);

  const loadLinks = useCallback(async () => {
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

      setLinkAnims(prev => {
        const newAnims: { [id: number]: { opacity: Animated.Value, translateY: Animated.Value } } = {};
        sortedLinks.forEach(link => {
          if (link.id) {
            newAnims[link.id] = prev[link.id] || {
              opacity: new Animated.Value(1),
              translateY: new Animated.Value(0),
            };
          }
        });
        return newAnims;
      });

      setLinks(sortedLinks);
    } catch (error) {
      console.error('Error loading links:', error);
      Alert.alert('Error', 'Failed to load links');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchLinks = useCallback(async () => {
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
  }, [searchQuery]);


  useEffect(() => {
    if (searchQuery.trim()) {
      searchLinks();
    } else {
      loadLinks();
    }
  }, [searchQuery, loadLinks, searchLinks]);


  const toggleFavorite = useCallback(async (linkId: number) => {
    try {
      const oldIdx = links.findIndex(l => l.id === linkId);
      await LinksService.toggleFavorite(linkId);

      const allLinks = await LinksService.getAllLinks();
      const sortedLinks = allLinks.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        const dateA = new Date(a.updated_at || a.created_at || '').getTime();
        const dateB = new Date(b.updated_at || b.created_at || '').getTime();
        return dateB - dateA;
      });
      const newIdx = sortedLinks.findIndex(l => l.id === linkId);

      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        await animateFavoriteMove(oldIdx, newIdx, linkId);
      }
      loadLinks();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  }, [links, animateFavoriteMove, loadLinks]);

  const handleAddLink = () => {
    setShowLinkModal(true);
  };

  const handleSaveLink = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert("Not supported", "Database operations are not supported on web platform");
      return;
    }
    if (!linkTitle.trim() || !linkUrl.trim()) {
      Alert.alert("Error", "Please fill in both title and URL");
      return;
    }
    try {
      const newLinkId = await LinksService.createLink({
        title: linkTitle.trim(),
        url: linkUrl.trim(),
        description: linkDescription.trim() || undefined,
      });

      handleCloseModal();
      await loadLinks();

      setTimeout(() => {
        const anim = getLinkAnim(newLinkId);
        if (anim) {
          anim.opacity.setValue(0);
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }).start();
        }
      }, 100);


    } catch (error) {
      console.error('Error saving link:', error);
      Alert.alert("Error", "Failed to save link. Please try again.");
    }
  }, [linkTitle, linkUrl, linkDescription, loadLinks, getLinkAnim]);

  const handleCloseModal = () => {
    setShowLinkModal(false);
    setLinkTitle("");
    setLinkUrl("");
    setLinkDescription("");
  };

  const handleDeleteLink = useCallback((linkId: number) => {
    Alert.alert(
      'Delete Link',
      'Are you sure you want to delete this link?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const anim = getLinkAnim(linkId);
            await new Promise(res => Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start(() => res(null)));

            try {
              await LinksService.deleteLink(linkId);
              await loadLinks();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete link');
              anim.opacity.setValue(1); // Restore on error
            }
          },
        },
      ]
    );
  }, [getLinkAnim, loadLinks]);

  const memoizedRenderItem = useMemo(() => ({ item }: { item: Link }) => {
    const anim = linkAnims[item.id as number] || { opacity: 1, translateY: 0 };
    return (
      <Animated.View
        style={{
          opacity: anim.opacity,
          transform: [{ translateY: anim.translateY }],
        }}
      >
        <View style={styles.linkCard}>
          <View style={styles.linkHeader}>
            <View style={styles.linkIcon}>
              <Ionicons name="link" size={20} color="#fff" />
            </View>
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>{item.title}</Text>
              <Text style={styles.linkUrl} numberOfLines={1}>{item.url}</Text>
            </View>
            <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(item.id!)}>
              <Ionicons
                name={item.is_favorite ? "heart" : "heart-outline"}
                size={22}
                color={item.is_favorite ? "#FF6B6B" : "#8E9BA2"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteLink(item.id!)}>
              <Ionicons name="trash" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
          {item.description && <Text style={styles.linkDescription}>{item.description}</Text>}
          <View style={styles.linkFooter}>
            <View style={styles.tags}>
              {(item.tags || []).map((tag, index) => (
                <Text key={index} style={styles.tag}>#{tag}</Text>
              ))}
            </View>
            <Text style={styles.linkDate}>{formatDate(item.updated_at || item.created_at || "")}</Text>
          </View>
        </View>
      </Animated.View>
    );
  }, [linkAnims, toggleFavorite, handleDeleteLink]);


  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
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
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading Links...</Text>
            </View>
          ) : (
            <Animated.FlatList
              data={links}
              renderItem={memoizedRenderItem}
              keyExtractor={(item) => item.id!.toString()}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Ionicons name="link-outline" size={64} color="#4A5568" />
                  <Text style={styles.emptyTitle}>No Links Found</Text>
                  <Text style={styles.emptyText}>
                    {searchQuery ? "Try a different search term" : "Add your first link to get started"}
                  </Text>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </View>

      <CommonModal visible={showLinkModal} onClose={handleCloseModal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add New Link</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
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
