// components/Back.tsx
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const Back = () => {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push('/')} // Navigates to index.tsx
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        padding: 10,
      }}
    >
      <Ionicons name="arrow-back" size={24} color="white" />
    </TouchableOpacity>
  );
};

export default Back;
