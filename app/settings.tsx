// Expo Router/React Navigation ekran opsiyonları ile kart arka planını koyulaştır
export const options = {
  cardStyle: { backgroundColor: "#0F1419" },
  presentation: "transparentModal",
};

import React, { useState } from "react";
import { Platform, SafeAreaView, StatusBar, StyleSheet, Switch, Text, View } from "react-native";


export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);

  // This is just a placeholder. You can connect this to your theme provider later.
  const toggleTheme = () => setDarkMode((prev) => !prev);

  // Status bar height for top padding
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: statusBarHeight }]}> 
      <View style={styles.innerBgFix}>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.settingRow}>
          <Text style={styles.label}>Dark Theme</Text>
          <Switch value={darkMode} onValueChange={toggleTheme} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1419",
    padding: 0,
  },
  innerBgFix: {
    flex: 1,
    backgroundColor: "#0F1419",
    padding: 24,
    minHeight: '100%',
    minWidth: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#F7FAFC",
    marginBottom: 30,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2D3748",
  },
  label: {
    color: "#F7FAFC",
    fontSize: 18,
  },
});
