import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    Alert,
    Animated,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function HomeScreen() {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const recentItems = [
    { id: 1, type: "note", title: "Poetry Collection Ideas", date: "Today" },
    { id: 2, type: "link", title: "Modern Poetry Website", date: "Yesterday" },
    { id: 3, type: "photo", title: "Sunset Inspiration", date: "2 days ago" },
    { id: 4, type: "note", title: "Verse about freedom", date: "3 days ago" },
  ];

  const getIconName = (type: string) => {
    switch (type) {
      case "note":
        return "document-text";
      case "link":
        return "link";
      case "photo":
        return "image";
      default:
        return "document";
    }
  };

  const handleAddNote = () => {
    setShowNoteModal(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSaveNote = () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      Alert.alert("Error", "Please fill in both title and content");
      return;
    }

    // Here you would typically save to your data store
    Alert.alert("Success", "Note saved successfully!", [
      {
        text: "OK",
        onPress: () => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShowNoteModal(false);
            setNoteTitle("");
            setNoteContent("");
          });
        },
      },
    ]);
  };

  const handleCloseModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowNoteModal(false);
      setNoteTitle("");
      setNoteContent("");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Kiler</Text>
          <Text style={styles.subtitle}>Your digital poetry archive</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="library" size={24} color="#FF6B6B" />
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="document-text" size={24} color="#68D391" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Notes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="link" size={24} color="#63B3ED" />
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Links</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="images" size={24} color="#F6AD55" />
            <Text style={styles.statNumber}>4</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Items</Text>
          {recentItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.itemCard}>
              <View style={styles.itemIcon}>              <Ionicons
                name={getIconName(item.type) as any}
                size={20}
                color="#FF6B6B"
              />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDate}>{item.date}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#8E9BA2" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={[styles.actionCard, { width: "22%" }]} onPress={handleAddNote}>
              <Ionicons name="add-circle" size={28} color="#FF6B6B" />
              <Text style={styles.actionText}>Add Note</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { width: "22%" }]}>
              <Ionicons name="camera" size={28} color="#FF6B6B" />
              <Text style={styles.actionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { width: "22%" }]}>
              <Ionicons name="share" size={28} color="#FF6B6B" />
              <Text style={styles.actionText}>Share Item</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { width: "22%" }]}>
              <Ionicons name="search" size={28} color="#FF6B6B" />
              <Text style={styles.actionText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Add Note Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={showNoteModal}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          {/* Fixed backdrop with fade animation */}
          <Animated.View 
            style={[
              styles.backdrop,
              {
                opacity: fadeAnim,
              }
            ]} 
          />
          
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  },
                ],
              }
            ]}
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
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1419",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#F7FAFC",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#A0AEC0",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#1A202C",
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F7FAFC",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#A0AEC0",
    marginTop: 4,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F7FAFC",
    marginBottom: 15,
  },
  itemCard: {
    backgroundColor: "#1A202C",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    color: "#F7FAFC",
    fontWeight: "500",
  },
  itemDate: {
    fontSize: 14,
    color: "#A0AEC0",
    marginTop: 2,
  },
  quickActions: {
    marginBottom: 30,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    backgroundColor: "#1A202C",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: "48%",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  actionText: {
    color: "#F7FAFC",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#1A202C",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
    borderTopWidth: 1,
    borderTopColor: "#2D3748",
  },
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
