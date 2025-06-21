import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

type BottomNavBarProps = {
  activeTab?: string;
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab }) => {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const colors = {
    background: isDarkMode ? '#121212' : '#fff',
    subText: isDarkMode ? '#aaa' : '#555',
    border: isDarkMode ? '#333' : '#ddd',
    active: '#0a84ff', // highlight color
  };

  const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});


  return (
    <View style={styles.navBar}>
      <TouchableOpacity 
        onPress={() => router.push('/')} 
        style={styles.navButton}
      >
        <Ionicons
          name="home-outline"
          size={24}
          color={activeTab === 'home' ? colors.active : colors.subText}
        />
        <Text
          style={[
            styles.navText,
            activeTab === 'home' && { color: colors.active },
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.push('/progress')} 
        style={styles.navButton}
      >
        <MaterialCommunityIcons
          name="chart-line"
          size={24}
          color={activeTab === 'progress' ? colors.active : colors.subText}
        />
        <Text
          style={[
            styles.navText,
            activeTab === 'progress' && { color: colors.active },
          ]}
        >
          Progress
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.push('/settings')} 
        style={styles.navButton}
      >
        <Feather
          name="settings"
          size={24}
          color={activeTab === 'settings' ? colors.active : colors.subText}
        />
        <Text
          style={[
            styles.navText,
            activeTab === 'settings' && { color: colors.active },
          ]}
        >
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default BottomNavBar;
