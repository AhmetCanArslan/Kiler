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

export default function NotesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const notes = [
    {
      id: 1,
      title: "Morning Thoughts",
      content: "The way the light breaks through the curtains reminds me of hope finding its way through darkness...",
      tags: ["morning", "light", "hope"],
      date: "Today",
      wordCount: 156,
    },
    {
      id: 2,
      title: "City Symphony",
      content: "Cars humming melodies on asphalt strings, horns creating jazz in the urban evening...",
      tags: ["city", "music", "evening"],
      date: "Yesterday",
      wordCount: 89,
    },
    {
      id: 3,
      title: "Ocean Memory",
      content: "Salt air carries stories of distant shores, waves whisper secrets to the listening sand...",
      tags: ["ocean", "memory", "nature"],
      date: "3 days ago",
      wordCount: 234,
    },
    {
      id: 4,
      title: "Winter's Last Breath",
      content: "Frost melting into spring's warm embrace, each droplet a promise of renewal...",
      tags: ["winter", "spring", "renewal"],
      date: "1 week ago",
      wordCount: 78,
    },
  ];

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
        {notes.map((note) => (
          <TouchableOpacity key={note.id} style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <View style={styles.noteIcon}>
                <Ionicons name="document-text" size={20} color="#68D391" />
              </View>
              <View style={styles.noteInfo}>
                <Text style={styles.noteTitle}>{note.title}</Text>
                <Text style={styles.noteStats}>
                  {note.wordCount} words • {note.date}
                </Text>
              </View>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share" size={18} color="#8E9BA2" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.noteContent} numberOfLines={3}>
              {note.content}
            </Text>
            
            <View style={styles.noteFooter}>
              <View style={styles.tags}>
                {note.tags.map((tag, index) => (
                  <Text key={index} style={styles.tag}>
                    #{tag}
                  </Text>
                ))}
              </View>
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
