import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
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
  const [linkAnims, setLinkAnims] = useState<{ [id: number]: { opacity: Animated.Value, translateY: Animated.Value, translateX: Animated.Value, scaleY: Animated.Value } }>({});
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLinkTitle, setEditLinkTitle] = useState("");
  const [editLinkUrl, setEditLinkUrl] = useState("");
  const [editLinkDescription, setEditLinkDescription] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLink, setPreviewLink] = useState<Link | null>(null);

  const getLinkAnim = useCallback((id: number) => {
    if (!linkAnims[id]) {
      const newAnim = {
        opacity: new Animated.Value(1),
        translateY: new Animated.Value(0),
        translateX: new Animated.Value(0),
        scaleY: new Animated.Value(1),
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

    // 1. Fade out the item
    await new Promise(res => Animated.timing(anim.opacity, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => res(null)));

    // 2. Update list immediately
    setLinks(prevLinks => {
      const newLinks = [...prevLinks];
      const [movedLink] = newLinks.splice(oldIdx, 1);
      newLinks.splice(newIdx, 0, movedLink);
      return newLinks;
    });

    // 3. Slide down animation for items that need to move
    await new Promise(resolve => {
      const slideAnimations = links
        .filter((link, index) => link.id !== linkId && index >= newIdx)
        .map(link => {
          const linkAnim = getLinkAnim(link.id as number);
          linkAnim.translateY.setValue(-CARD_HEIGHT);
          return Animated.timing(linkAnim.translateY, {
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

  }, [getLinkAnim, links]);

  const loadLinks = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      }
      const allLinks = await LinksService.getAllLinks();
      const sortedLinks = allLinks.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        const dateA = new Date(a.updated_at || a.created_at || '').getTime();
        const dateB = new Date(b.updated_at || b.created_at || '').getTime();
        return dateB - dateA;
      });

      setLinkAnims(prev => {
        const newAnims: { [id: number]: { opacity: Animated.Value, translateY: Animated.Value, translateX: Animated.Value, scaleY: Animated.Value } } = {};
        sortedLinks.forEach(link => {
          if (link.id) {
            newAnims[link.id] = prev[link.id] || {
              opacity: new Animated.Value(1),
              translateY: new Animated.Value(0),
              translateX: new Animated.Value(0),
              scaleY: new Animated.Value(1),
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
      if (isInitial) {
        setLoading(false);
      }
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
      loadLinks(true);
    }
  }, [searchQuery, loadLinks, searchLinks]);

  // Refresh links when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!searchQuery.trim()) {
        loadLinks(false); // Don't show loading indicator on focus refresh
      }
    }, [loadLinks, searchQuery])
  );


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

      // Create the new link object
      const newLink = {
        id: newLinkId,
        title: linkTitle.trim(),
        url: linkUrl.trim(),
        description: linkDescription.trim() || undefined,
        is_favorite: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: []
      };

      // Add animation for the new link
      const newAnim = {
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(0),
        translateX: new Animated.Value(0),
        scaleY: new Animated.Value(1),
      };
      setLinkAnims(prev => ({ ...prev, [newLinkId]: newAnim }));

      // Update the list by adding the new link at the top (it's not favorited so goes after favorites)
      setLinks(prevLinks => {
        const favoriteLinks = prevLinks.filter(link => link.is_favorite);
        const regularLinks = prevLinks.filter(link => !link.is_favorite);
        return [...favoriteLinks, newLink, ...regularLinks];
      });

      // Sequential add animation: slide down others → fade in new item
      setTimeout(async () => {
        const anim = getLinkAnim(newLinkId);
        if (anim) {
          // 1. Slide down items that are below the new item
          await new Promise(resolve => {
            const currentFavoriteCount = links.filter(link => link.is_favorite).length;
            const slideAnimations = links
              .filter((link, index) => index >= currentFavoriteCount) // Items after favorites
              .map(link => {
                const linkAnim = getLinkAnim(link.id as number);
                linkAnim.translateY.setValue(-CARD_HEIGHT);
                return Animated.timing(linkAnim.translateY, {
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

  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    setEditLinkTitle(link.title);
    setEditLinkUrl(link.url);
    setEditLinkDescription(link.description || "");
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingLink(null);
    setEditLinkTitle("");
    setEditLinkUrl("");
    setEditLinkDescription("");
  };

  const handleSaveEditedLink = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert("Not supported", "Database operations are not supported on web platform");
      return;
    }
    if (!editLinkTitle.trim() || !editLinkUrl.trim()) {
      Alert.alert("Error", "Please fill in both title and URL");
      return;
    }
    if (!editingLink?.id) {
      Alert.alert("Error", "No link selected for editing");
      return;
    }

    try {
      // Always include description field to ensure it can be cleared
      const updateData = {
        title: editLinkTitle.trim(),
        url: editLinkUrl.trim(),
        description: editLinkDescription.trim() || null // Use null for empty strings
      };
      
      console.log('Updating link with data:', updateData); // Debug log
      const success = await LinksService.updateLink(editingLink.id, updateData);

      if (success) {
        handleCloseEditModal();
        // Refresh the links list
        loadLinks(false);
      } else {
        Alert.alert("Error", "Failed to update link. Please try again.");
      }
    } catch (error) {
      console.error('Error updating link:', error);
      Alert.alert("Error", "Failed to update link. Please try again.");
    }
  }, [editLinkTitle, editLinkUrl, editLinkDescription, editingLink, loadLinks]);

  const handleCopyLink = useCallback(async (link: Link) => {
    try {
      await Clipboard.setStringAsync(link.url);
      // Show a simple toast-like alert that dismisses automatically
      Alert.alert("Copied to clipboard", "", [{ text: "OK" }], { cancelable: true });
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert("Error", "Failed to copy link URL");
    }
  }, []);

  const handlePreviewLink = useCallback((link: Link) => {
    console.log('Preview link clicked:', link); // Debug log
    setPreviewLink(link);
    setShowPreviewModal(true);
  }, []);

  const handleClosePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewLink(null);
  };

  const handleCopyLinkUrl = useCallback(async () => {
    if (!previewLink) return;
    try {
      await Clipboard.setStringAsync(previewLink.url);
      Alert.alert("Link copied", "", [{ text: "OK" }], { cancelable: true });
    } catch (error) {
      console.error('Error copying link URL:', error);
      Alert.alert("Error", "Failed to copy link URL");
    }
  }, [previewLink]);

  const handleCopyDescription = useCallback(async () => {
    if (!previewLink?.description) return;
    try {
      await Clipboard.setStringAsync(previewLink.description);
      Alert.alert("Description copied", "", [{ text: "OK" }], { cancelable: true });
    } catch (error) {
      console.error('Error copying description:', error);
      Alert.alert("Error", "Failed to copy description");
    }
  }, [previewLink]);

  const handleOpenLink = useCallback(async () => {
    if (!previewLink) return;
    try {
      const canOpen = await Linking.canOpenURL(previewLink.url);
      if (canOpen) {
        await Linking.openURL(previewLink.url);
      } else {
        Alert.alert("Error", "Cannot open this URL");
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert("Error", "Failed to open link");
    }
  }, [previewLink]);

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
            const linkIndex = links.findIndex(l => l.id === linkId);

            // 1. Fade out and slide the item simultaneously
            await new Promise(res => {
              Animated.parallel([
                Animated.timing(anim.opacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(anim.translateX, {
                  toValue: -300, // Slide left off screen
                  duration: 200,
                  useNativeDriver: true,
                })
              ]).start(() => res(null));
            });

            try {
              await LinksService.deleteLink(linkId);
              
              // 2. Collapse the item by animating its scaleY to 0
              // This creates the gap-closing effect without re-rendering the list
              await new Promise(resolve => {
                Animated.timing(anim.scaleY, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => resolve(null));
              });
              
              // 3. Now safely update the list - items are already in their final visual positions
              setLinks(prevLinks => prevLinks.filter(link => link.id !== linkId));
              
              // 4. Clean up animation state for deleted item
              setLinkAnims(prev => {
                const newAnims = { ...prev };
                delete newAnims[linkId];
                return newAnims;
              });

            } catch (error) {
              Alert.alert('Error', 'Failed to delete link');
              anim.opacity.setValue(1); // Restore on error
              anim.translateX.setValue(0); // Restore position
              anim.scaleY.setValue(1); // Restore scale
            }
          },
        },
      ]
    );
  }, [getLinkAnim, links]);

  const memoizedRenderItem = useMemo(() => ({ item }: { item: Link }) => {
    const anim = linkAnims[item.id as number] || { opacity: 1, translateY: 0, translateX: 0, scaleY: 1 };
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
        <View style={styles.linkCard}>
          <TouchableOpacity
            style={styles.linkCardContent}
            onPress={() => handlePreviewLink(item)}
            activeOpacity={0.7}
          >
            <View style={styles.linkHeader}>
              <View style={styles.linkIcon}>
                <Ionicons name="link" size={20} color="#fff" />
              </View>
              <View style={styles.linkInfo}>
                <Text style={styles.linkTitle}>{item.title}</Text>
                <Text style={styles.linkUrl} numberOfLines={1}>{item.url}</Text>
              </View>
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
          </TouchableOpacity>
          <View style={styles.linkActions}>
            <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(item.id!)}>
              <Ionicons
                name={item.is_favorite ? "heart" : "heart-outline"}
                size={22}
                color={item.is_favorite ? "#FF6B6B" : "#8E9BA2"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.copyButton} onPress={() => handleCopyLink(item)}>
              <Ionicons name="copy-outline" size={20} color="#4FACFE" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.editButton} onPress={() => handleEditLink(item)}>
              <Ionicons name="create-outline" size={20} color="#68D391" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteLink(item.id!)}>
              <Ionicons name="trash" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  }, [linkAnims, toggleFavorite, handleEditLink, handleDeleteLink, handleCopyLink, handlePreviewLink]);


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
          ) : links.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="link-outline" size={64} color="#4A5568" />
              <Text style={styles.emptyTitle}>No Links Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? "Try a different search term" : "Add your first link to get started"}
              </Text>
            </View>
          ) : (
            <Animated.FlatList
              data={links}
              renderItem={memoizedRenderItem}
              keyExtractor={(item) => item.id!.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </View>

      <CommonModal 
        visible={showPreviewModal} 
        onClose={handleClosePreviewModal}
        maxHeight={previewLink?.description && previewLink.description.trim() ? '85%' : '60%'}
        minHeight={previewLink?.description && previewLink.description.trim() ? 400 : 300}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Link Preview</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClosePreviewModal}>
            <Ionicons name="close" size={24} color="#8E9BA2" />
          </TouchableOpacity>
        </View>

        {previewLink ? (
          <ScrollView 
            style={styles.previewScrollContainer}
            contentContainerStyle={styles.previewContent} 
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            <Text style={styles.previewLabel}>Title</Text>
            <Text style={styles.previewText} selectable={true}>
              {previewLink.title}
            </Text>

            <Text style={styles.previewLabel}>URL</Text>
            <Text style={styles.previewText} selectable={true}>
              {previewLink.url}
            </Text>

            {previewLink.description && previewLink.description.trim() && (
              <>
                <Text style={styles.previewLabel}>Description</Text>
                <Text style={styles.previewText} selectable={true}>
                  {previewLink.description}
                </Text>
              </>
            )}

            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.previewActionButton} onPress={handleCopyLinkUrl}>
                <Ionicons name="copy-outline" size={18} color="#4FACFE" />
                <Text style={[styles.previewActionText, { color: "#4FACFE" }]}>Copy URL</Text>
              </TouchableOpacity>
              
              {previewLink.description && previewLink.description.trim() && (
                <TouchableOpacity style={styles.previewActionButton} onPress={handleCopyDescription}>
                  <Ionicons name="copy-outline" size={18} color="#68D391" />
                  <Text style={[styles.previewActionText, { color: "#68D391" }]}>Copy Description</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.previewActionButton} onPress={handleOpenLink}>
                <Ionicons name="open-outline" size={18} color="#9F7AEA" />
                <Text style={[styles.previewActionText, { color: "#9F7AEA" }]}>Open Link</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.previewEmptyState}>
            <Text style={styles.previewEmptyText}>No link data available</Text>
          </View>
        )}
      </CommonModal>

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

      <CommonModal visible={showEditModal} onClose={handleCloseEditModal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Link</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseEditModal}>
            <Ionicons name="close" size={24} color="#8E9BA2" />
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.titleInput}
          placeholder="Link title..."
          placeholderTextColor="#8E9BA2"
          value={editLinkTitle}
          onChangeText={setEditLinkTitle}
          autoFocus={true}
        />

        <TextInput
          style={styles.titleInput}
          placeholder="URL..."
          placeholderTextColor="#8E9BA2"
          value={editLinkUrl}
          onChangeText={setEditLinkUrl}
          autoCapitalize="none"
          keyboardType="url"
        />

        <TextInput
          style={styles.contentInput}
          placeholder="Description (optional)..."
          placeholderTextColor="#8E9BA2"
          value={editLinkDescription}
          onChangeText={setEditLinkDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={styles.modalButtons}>
          <TouchableOpacity style={[styles.cancelButton, { flex: 0.4 }]} onPress={handleCloseEditModal}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveButton, { flex: 0.55 }]} onPress={handleSaveEditedLink}>
            <Text style={styles.saveButtonText}>Update Link</Text>
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
  linkCardContent: {
    flex: 1,
  },
  linkActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#2D3748",
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
  // Preview modal styles
  previewScrollContainer: {
    flex: 1,
    minHeight: 0, // Allow ScrollView to shrink
  },
  previewContent: {
    paddingBottom: 20,
    flexGrow: 1,
    flexShrink: 0, // Don't allow content to shrink
  },
  previewEmptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  previewEmptyText: {
    color: '#A0AEC0',
    fontSize: 16,
    textAlign: 'center',
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A0AEC0",
    marginTop: 15,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 16,
    color: "#F7FAFC",
    backgroundColor: "#2D3748",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#4A5568",
    lineHeight: 22,
    minHeight: 44,
    textAlignVertical: "top",
  },
  previewActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
    gap: 10,
  },
  previewActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2D3748",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#4A5568",
  },
  previewActionText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
});
