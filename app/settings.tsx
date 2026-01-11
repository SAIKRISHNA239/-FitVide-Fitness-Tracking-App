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
  Platform,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const { logout, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState("Loading...");

  const colors = {
    background: "#121212",
    text: "#fff",
    subText: "#aaa",
    border: "#333",
    icon: "#0a84ff",
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('photo_url, name')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
          return;
        }

        if (data) {
          setProfileImage(data.photo_url || null);
          setName(data.name || user.email?.split('@')[0] || "User");
        } else {
          setName(user.email?.split('@')[0] || "User");
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setName(user.email?.split('@')[0] || "User");
      }
    };
    
    if (user) {
      loadProfile();
    }
  }, [user]);

  const pickImage = async () => {
    if (!user) return;
    
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      
      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Upload to Supabase Storage
        const fileExt = uri.split('.').pop() || 'jpg';
        const fileName = `${user.id}.${fileExt}`;
        const filePath = `profile-images/${fileName}`;

        // Check if storage bucket exists, if not, create it or use a fallback
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          // If bucket doesn't exist, try 'profile_images' or show helpful error
          if (uploadError.message?.includes('Bucket') || uploadError.message?.includes('not found')) {
            Alert.alert(
              'Storage Error', 
              'Storage bucket not configured. Please create an "avatars" bucket in Supabase Storage, or update the bucket name in settings.tsx'
            );
            return;
          }
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ photo_url: publicUrl })
          .eq('id', user.id);

        if (updateError) {
          // If profile doesn't exist, create it
          if (updateError.code === 'PGRST116' || updateError.message?.includes('No rows')) {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({ id: user.id, photo_url: publicUrl });
            
            if (insertError) throw insertError;
          } else {
            throw updateError;
          }
        }

        setProfileImage(publicUrl);
        Alert.alert('Success', 'Profile image updated!');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error.message || 'Failed to upload image. Please try again.');
    }
  };

  const exportAsPDF = async () => {
    try {
      const doc = new jsPDF();
      doc.text("FitVide - User Summary", 20, 20);
      doc.text(`Name: ${name}`, 20, 40);
      doc.text(`Email: ${user?.email || 'N/A'}`, 20, 50);
      doc.text("Exported from FitVide", 20, 70);

      // Check if we're on web or native
      if (Platform.OS === 'web') {
        // For web, download directly
        doc.save('fitvide_summary.pdf');
        Alert.alert("Success", "PDF downloaded successfully!");
      } else {
        // For native, use FileSystem and Sharing
        const pdfUri = FileSystem.documentDirectory + 'fitvide_summary.pdf';
        await FileSystem.writeAsStringAsync(pdfUri, doc.output(), { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(pdfUri);
      }
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      Alert.alert("Error", error.message || "Failed to export PDF");
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
        <Text style={[styles.username, { color: colors.subText }]}>@{name.toLowerCase().replace(/\s/g, '')}</Text>
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
                  Alert.alert("Privacy & Security", "This feature is coming soon!");
                  break;
                case "Reset Options":
                  Alert.alert("Reset Options", "This feature is coming soon!");
                  break;
                case "Notifications":
                  Alert.alert("Notifications", "This feature is coming soon!");
                  break;
                case "Logout":
                  Alert.alert("Logout", "Are you sure you want to logout?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Logout",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await logout();
                          // Navigation will be handled automatically by _layout.tsx
                          // when user becomes null
                        } catch (error: any) {
                          Alert.alert("Error", error.message || "Failed to logout");
                        }
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
