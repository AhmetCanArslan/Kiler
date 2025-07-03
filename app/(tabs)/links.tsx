import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Link, LinksService } from "../../database/linksService";

export default function LinksScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const listAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Load links when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (searchQuery.trim()) {
        searchLinks();
      } else {
        loadLinks();
      }
    }, [searchQuery])
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      searchLinks();
    } else {
      loadLinks();
    }
  }, [searchQuery]);

  const loadLinks = async () => {
    try {
      setLoading(true);
      // Reset animations
      listAnim.setValue(0);
      slideAnim.setValue(50);
      
      const allLinks = await LinksService.getAllLinks();
      // Sort links: favorites first, then by updated_at desc
      const sortedLinks = allLinks.sort((a, b) => {
        // First sort by favorite status (favorites first)
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        // Then sort by updated_at (most recent first)
        const dateA = new Date(a.updated_at || a.created_at || '').getTime();
        const dateB = new Date(b.updated_at || b.created_at || '').getTime();
        return dateB - dateA;
      });
      setLinks(sortedLinks);
      
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
    } catch (error) {
      console.error('Error loading links:', error);
      Alert.alert('Error', 'Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  const searchLinks = async () => {
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

  const toggleFavorite = async (linkId: number) => {
    try {
      await LinksService.toggleFavorite(linkId);
      // Refresh the links to show updated favorite status
      if (searchQuery.trim()) {
        searchLinks();
      } else {
        loadLinks();
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
            placeholder="Search links..."
            placeholderTextColor="#8E9BA2"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.addButton}>
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
            {links.map((link, index) => (
              <Animated.View
                key={link.id}
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
                <TouchableOpacity style={styles.linkCard}>
              <View style={styles.linkHeader}>
                <View style={styles.linkIcon}>
                  <Ionicons name="link" size={20} color="#63B3ED" />
                </View>
                <View style={styles.linkInfo}>
                  <Text style={styles.linkTitle}>{link.title}</Text>
                  <Text style={styles.linkUrl}>{link.url}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.favoriteButton}
                  onPress={() => toggleFavorite(link.id!)}
                >
                  <Ionicons 
                    name={link.is_favorite ? "heart" : "heart-outline"} 
                    size={18} 
                    color={link.is_favorite ? "#FF6B6B" : "#8E9BA2"} 
                  />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.linkDescription}>{link.description || "No description available"}</Text>
              
              <View style={styles.linkFooter}>
                <View style={styles.tags}>
                  {(link.tags || []).map((tag, index) => (
                    <Text key={index} style={styles.tag}>
                      #{tag}
                    </Text>
                  ))}
                </View>
                <Text style={styles.linkDate}>
                  {formatDate(link.updated_at || link.created_at || "")}
                </Text>
              </View>
            </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>
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
});
