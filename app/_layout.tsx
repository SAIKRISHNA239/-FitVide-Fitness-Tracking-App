// app/_layout.tsx
import { Slot } from "expo-router";
import { NutritionProvider } from "../context/NutritionContext";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { View, ActivityIndicator } from "react-native";
import LoginScreen from "./LoginScreen"; // Adjust path if needed

function RootLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#121212", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <Slot />;
}

export default function Layout() {
  return (
    <ThemeProvider>
      <NutritionProvider>
        <AuthProvider>
          <RootLayout />
        </AuthProvider>
      </NutritionProvider>
    </ThemeProvider>
  );
}

