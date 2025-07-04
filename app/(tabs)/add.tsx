import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from "react";
import {
  Animated, Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function AddScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  // Home ekranındaki gibi fade animasyonu
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Ekran mount olduğunda ve focus olduğunda animasyonu başlat

  // Her ekrana gelindiğinde animasyon çalışsın
  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, [fadeAnim])
  );

  // Eğer tab focus animasyonu da istenirse aşağıdaki kodu açabilirsiniz:
  // import { useFocusEffect } from '@react-navigation/native';
  // useFocusEffect(
  //   useCallback(() => {
  //     fadeAnim.setValue(0);
  //     require('react-native').Animated.timing(fadeAnim, {
  //       toValue: 1,
  //       duration: 400,
  //       useNativeDriver: true,
  //     }).start();
  //   }, [fadeAnim])
  // );

  const addOptions = [
    {
      id: "note",
      title: "Create Note",
      description: "Write poetry, thoughts, or ideas",
      icon: "create",
      color: "#68D391",
    },
    {
      id: "link",
      title: "Save Link",
      description: "Bookmark inspiring websites",
      icon: "link",
      color: "#63B3ED",
    },
    {
      id: "photo",
      title: "Add Photo",
      description: "Capture moments and inspiration",
      icon: "camera",
      color: "#F6AD55",
    },
    {
      id: "import",
      title: "Import Content",
      description: "Share from other apps",
      icon: "share",
      color: "#D53F8C",
    },
  ];

  const handleOptionPress = (type: string) => {
    setSelectedType(type);
    setModalVisible(true);
  };

  const renderAddForm = () => {
    switch (selectedType) {
      case "note":
        return <NoteForm onClose={() => setModalVisible(false)} />;
      case "link":
        return <LinkForm onClose={() => setModalVisible(false)} />;
      case "photo":
        return <PhotoForm onClose={() => setModalVisible(false)} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <Text style={styles.title}>Add to Archive</Text>
          <Text style={styles.subtitle}>Choose what you'd like to add</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.optionsContainer}>
            {addOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionCard}
                onPress={() => handleOptionPress(option.id)}
              >
                <View style={[styles.optionIcon, { backgroundColor: option.color }]}> 
                  <Ionicons name={option.icon as any} size={32} color="#fff" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8E9BA2" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                style={[styles.quickAction, { width: "23%" }]}
                onPress={() => handleOptionPress("note")}
              > 
                <Ionicons name="copy" size={28} color="#FF6B6B" />
                <Text style={styles.quickActionText}>Paste from Clipboard</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickAction, { width: "23%" }]}
                onPress={() => handleOptionPress("note")}
              > 
                <Ionicons name="mic" size={28} color="#FF6B6B" />
                <Text style={styles.quickActionText}>Voice Note</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickAction, { width: "23%" }]}
                onPress={() => handleOptionPress("note")}
              > 
                <Ionicons name="scan" size={28} color="#FF6B6B" />
                <Text style={styles.quickActionText}>Scan Text</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickAction, { width: "23%" }]}
                onPress={() => handleOptionPress("photo")}
              > 
                <Ionicons name="library" size={28} color="#FF6B6B" />
                <Text style={styles.quickActionText}>From Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {renderAddForm()}
            </View>
          </View>
        </Modal>
      </Animated.View>
    </SafeAreaView>
  );
}

// Simple form components for different content types
const NoteForm = ({ onClose }: { onClose: () => void }) => (
  <View style={styles.formContainer}>
    <View style={styles.formHeader}>
      <Text style={styles.formTitle}>Create Note</Text>
      <TouchableOpacity onPress={onClose}>
        <Ionicons name="close" size={24} color="#8E9BA2" />
      </TouchableOpacity>
    </View>
    <TextInput
      style={styles.titleInput}
      placeholder="Note title..."
      placeholderTextColor="#8E9BA2"
    />
    <TextInput
      style={styles.contentInput}
      placeholder="Write your thoughts, poetry, or ideas..."
      placeholderTextColor="#8E9BA2"
      multiline
      numberOfLines={10}
    />
    <TouchableOpacity style={styles.saveButton}>
      <Text style={styles.saveButtonText}>Save Note</Text>
    </TouchableOpacity>
  </View>
);

const LinkForm = ({ onClose }: { onClose: () => void }) => (
  <View style={styles.formContainer}>
    <View style={styles.formHeader}>
      <Text style={styles.formTitle}>Save Link</Text>
      <TouchableOpacity onPress={onClose}>
        <Ionicons name="close" size={24} color="#8E9BA2" />
      </TouchableOpacity>
    </View>
    <TextInput
      style={styles.titleInput}
      placeholder="Link title..."
      placeholderTextColor="#8E9BA2"
    />
    <TextInput
      style={styles.titleInput}
      placeholder="URL..."
      placeholderTextColor="#8E9BA2"
    />
    <TextInput
      style={styles.contentInput}
      placeholder="Description (optional)..."
      placeholderTextColor="#8E9BA2"
      multiline
      numberOfLines={4}
    />
    <TouchableOpacity style={styles.saveButton}>
      <Text style={styles.saveButtonText}>Save Link</Text>
    </TouchableOpacity>
  </View>
);

const PhotoForm = ({ onClose }: { onClose: () => void }) => (
  <View style={styles.formContainer}>
    <View style={styles.formHeader}>
      <Text style={styles.formTitle}>Add Photo</Text>
      <TouchableOpacity onPress={onClose}>
        <Ionicons name="close" size={24} color="#8E9BA2" />
      </TouchableOpacity>
    </View>
    <View style={styles.photoOptions}>
      <TouchableOpacity style={styles.photoOption}>
        <Ionicons name="camera" size={32} color="#FF6B6B" />
        <Text style={styles.photoOptionText}>Take Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.photoOption}>
        <Ionicons name="library" size={32} color="#FF6B6B" />
        <Text style={styles.photoOptionText}>Choose from Gallery</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1419",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#F7FAFC",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#A0AEC0",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: "#1A202C",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F7FAFC",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#A0AEC0",
  },
  recentSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F7FAFC",
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickAction: {
    backgroundColor: "#1A202C",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: "48%",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2D3748",
  },
  quickActionText: {
    color: "#F7FAFC",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1A202C",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: "60%",
  },
  formContainer: {
    padding: 20,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F7FAFC",
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#4A5568",
  },
  saveButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  photoOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 30,
  },
  photoOption: {
    alignItems: "center",
    padding: 20,
  },
  photoOptionText: {
    color: "#F7FAFC",
    marginTop: 10,
    fontSize: 16,
  },
});
