import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

type MenuItemPath =
  | '/log'
  | '/nutrition'
  | '/hydration'
  | '/sleep'
  | '/progress'
  | '/week'
  | '/settings';

interface MenuItem {
  label: string;
  path: MenuItemPath;
}

const menuItems: MenuItem[] = [
  { label: 'My Workouts', path: '/log' },
  { label: 'My Nutrition', path: '/nutrition' },
  { label: 'Water & Hydration', path: '/hydration' },
  { label: 'Sleep Tracker', path: '/sleep' },
  { label: 'My Progress', path: '/progress' },
  { label: 'Weekly Check-in', path: '/week' },
  { label: 'Settings', path: '/settings' },
];

const menuIcons: Record<MenuItemPath, keyof typeof Ionicons.glyphMap> = {
  '/log': 'barbell',
  '/nutrition': 'nutrition',
  '/hydration': 'water',
  '/sleep': 'bed',
  '/progress': 'stats-chart',
  '/week': 'calendar',
  '/settings': 'settings',
};

const MenuScreen = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isDarkMode } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={[
          styles.container,
          { backgroundColor:'#000'},
        ]}
      >
        {/* Top Bar */}
        <View
          style={[
            styles.topBar,
            { backgroundColor: '#121212'},
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              if (pathname === '/menu') {
                router.replace('/');
              } else {
                router.push('/menu');
              }
            }}
          >
            <Ionicons
              name="menu"
              size={28}
              color={ '#fff'}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: '#fff'}]}>
            Menu
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <FlatList
          data={menuItems}
          keyExtractor={(item) => item.path}
          renderItem={({ item }) => {
            const isActive = pathname === item.path;

            return (
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  {
                    borderBottomColor:'#333',
                    backgroundColor: isActive
                      ? '#444'
                      : 'transparent',
                  },
                ]}
                onPress={() => router.push(item.path)}
              >
                <Ionicons
                  name={menuIcons[item.path]}
                  size={22}
                  color={isActive ? '#0a84ff' : '#fff' }
                />
                <Text
                  style={{
                    marginLeft: 12,
                    fontSize: 16,
                    color: isActive ? '#0a84ff' : '#fff',
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingTop: 20 }}
        />
      </View>
    </SafeAreaView>
  );
};

export default MenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 5,
  },
});
