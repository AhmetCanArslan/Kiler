import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function LinksScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const links = [
    {
      id: 1,
      title: "Poetry Foundation",
      url: "poetryfoundation.org",
      description: "Modern poetry collection and resources",
      tags: ["poetry", "literature"],
      date: "2 days ago",
    },
    {
      id: 2,
      title: "Writers & Writers",
      url: "writersandwriters.com",
      description: "Inspiring quotes and writing tips",
      tags: ["writing", "inspiration"],
      date: "1 week ago",
    },
    {
      id: 3,
      title: "The Academy of American Poets",
      url: "poets.org",
      description: "Poem-a-Day and poetry news",
      tags: ["poetry", "daily"],
      date: "2 weeks ago",
    },
  ];

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
        {links.map((link) => (
          <TouchableOpacity key={link.id} style={styles.linkCard}>
            <View style={styles.linkHeader}>
              <View style={styles.linkIcon}>
                <Ionicons name="link" size={20} color="#63B3ED" />
              </View>
              <View style={styles.linkInfo}>
                <Text style={styles.linkTitle}>{link.title}</Text>
                <Text style={styles.linkUrl}>{link.url}</Text>
              </View>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share" size={18} color="#8E9BA2" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.linkDescription}>{link.description}</Text>
            
            <View style={styles.linkFooter}>
              <View style={styles.tags}>
                {link.tags.map((tag, index) => (
                  <Text key={index} style={styles.tag}>
                    {tag}
                  </Text>
                ))}
              </View>
              <Text style={styles.linkDate}>{link.date}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
    backgroundColor: "#FF6B6B",
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
