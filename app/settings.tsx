import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Image,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import jsPDF from 'jspdf';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useAuth } from '../context/AuthContext'; // Import useAuth

export default function SettingsScreen() {
  const { logout } = useAuth(); // Get logout function from context
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState("Loading...");
  const uid = auth.currentUser?.uid;

  const colors = {
    background: "#121212",
    text: "#fff",
    subText: "#aaa",
    border: "#333",
    icon: "#0a84ff",
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!uid) return;
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileImage(data.photoURL || null);
        setName(data.name || "No name");
      }
    };
    loadProfile();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profileImages/${uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      if (!uid) {
        console.error("User ID is undefined. Cannot update photoURL.");
        return;
      }
      await setDoc(doc(db, 'users', uid), { photoURL: downloadURL }, { merge: true });
      setProfileImage(downloadURL);
    }
  };

  const exportAsPDF = async () => {
    try {
      const doc = new jsPDF();
      doc.text("FitVide - User Summary", 20, 20);
      doc.text(`Name: ${name}`, 20, 40);
      doc.text(`Email: ${auth.currentUser?.email || 'N/A'}`, 20, 50);
      doc.text("Exported from FitVide", 20, 70);

      const pdfUri = FileSystem.documentDirectory + 'fitvide_summary.pdf';
      await FileSystem.writeAsStringAsync(pdfUri, doc.output(), { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(pdfUri);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const settingsItems = [
    { label: "Personal details" },
    { label: "Notifications" },
    { label: "Backup & Export" },
    { label: "Privacy & Security" },
    { label: "Reset Options" },
    { label: "Logout" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Settings</Text>

      <View style={styles.profileSection}>
        <TouchableOpacity onPress={pickImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.blankAvatar} />
          )}
        </TouchableOpacity>
        <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.username, { color: colors.subText }]}>@lucasscott3</Text>
      </View>

      <ScrollView style={styles.settingsList} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {settingsItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.settingRow, { borderBottomColor: colors.border }]}
            onPress={() => {
              switch (item.label) {
                case "Personal details":
                  router.push("/profile");
                  break;
                case "Backup & Export":
                  exportAsPDF();
                  break;
                case "Privacy & Security":
                  router.push("/privacy-security");
                  break;
                case "Reset Options":
                  router.push("/reset-options");
                  break;
                case "Logout":
                  Alert.alert("Logout", "Are you sure you want to logout?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Logout",
                      style: "destructive",
                      onPress: () => {
                        logout(); // Call the logout function
                        router.replace("/"); // This will trigger the auth check in _layout.tsx
                      },
                    },
                  ]);
                  break;
                default:
                  break;
              }
            }}
          >
            <Text style={[styles.settingText, { color: colors.text }]}>{item.label}</Text>
            <Feather name="chevron-right" size={20} color={colors.subText} />
          </TouchableOpacity>
        ))}

        <View style={{ marginTop: 30, borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 20 }}>
          <Text style={{ color: colors.text }}>App Name: FitVide</Text>
          <Text style={{ color: colors.text }}>Version: 1.0.0</Text>
          <Text style={{ color: colors.subText, marginVertical: 4 }}>Made by Sai Krishna</Text>
          <TouchableOpacity onPress={() => Linking.openURL("https://github.com/SAIKRISHNA239/-FitVide-Fitness-Tracking-App")}>
            <Text style={{ color: "skyblue" }}>GitHub Repository</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.navBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.push("/")} style={styles.navButton}>
          <Ionicons name="home-outline" size={24} color={colors.subText} />
          <Text style={[styles.navText, { color: colors.subText }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/progress")} style={styles.navButton}>
          <MaterialCommunityIcons name="chart-line" size={24} color={colors.subText} />
          <Text style={[styles.navText, { color: colors.subText }]}>Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Feather name="settings" size={24} color={colors.icon} />
          <Text style={[styles.navText, { color: colors.icon }]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { fontSize: 20, fontWeight: "600", textAlign: "center", marginBottom: 10 },
  profileSection: { alignItems: "center", marginVertical: 20 },
  blankAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#cce4ff",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  name: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  username: { fontSize: 14 },
  settingsList: { paddingHorizontal: 20 },
  settingRow: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingText: { fontSize: 16 },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  navButton: { alignItems: "center" },
  navText: { fontSize: 12, marginTop: 4 },
});
