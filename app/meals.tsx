// app/meals.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../app/firebase"; // or correct relative path
import { auth } from "../app/firebase";
import foodDatabase from "../data/foodDatabase.json";
import { useTheme } from "../context/ThemeContext";
import { Ionicons, Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import BottomNavBar from './BottomNavBar';


const categories = [
  "Vegetables", "Fruits", "Grains", "Pulses/Legumes", "Nuts & Seeds",
  "Dairy", "Non-Veg", "Oils & Fats", "Supplements", "Snacks", "Beverages"
];

export default function MealsScreen() {
  const { meal } = useLocalSearchParams();
  const router = useRouter();
  const mealName = Array.isArray(meal) ? meal[0] : (meal || "");
  const { isDarkMode } = useTheme();

  const colors = {
    background: "#121212",
    text:  "#fff",
    subText: "#aaa" ,
    border: "#333",
    icon: "#0a84ff",
    card:  "#1e1e1e",
    highlight: "#bb86fc" ,
  };

  const styles = StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 16,
      paddingBottom: 100,
      backgroundColor:"#121212",
    },
    title: {
      fontSize: 26,
      fontWeight: "bold",
      color: "#ffffff",
      marginBottom: 16,
      textAlign: "center",
    },
    input: {
      backgroundColor: "#2C2C2C",
      color: "#fff",
      padding: 12,
      borderRadius: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor:"#333",
    },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: "#2b2b2b",
      marginRight: 8,
      marginVertical: 4,
    },
    chipActive: {
      backgroundColor: "#bb86fc",
    },
    chipText: {
      color: "#aaa",
    },
    chipTextActive: {
      color: "#fff",
      fontWeight: "bold",
    },
    card: {
      backgroundColor: "#1E1E1E",
      padding: 12,
      borderRadius: 10,
      marginBottom: 8,
    },
    foodName: {
      fontWeight: "bold",
      fontSize: 16,
      color: "#bb86fc" ,
    },
    subText: {
      color:  "#aaa",
    },
    modalBox: {
      backgroundColor: "#1E1E1E",
      padding: 16,
      borderRadius: 12,
      marginVertical: 10,
    },
    modalTitle: {
      fontWeight: "bold",
      marginBottom: 8,
      fontSize: 16,
      color: "#fff",
    },
    button: {
      backgroundColor: "#bb86fc",
      padding: 12,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 10,
    },
    buttonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
  });
  

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [quantity, setQuantity] = useState("");
  const todayKey = new Date().toISOString().split("T")[0];

  const handleAddToMeal = async () => {
  if (!selectedFood || !quantity) return;
  const qty = parseFloat(quantity);
  if (isNaN(qty) || qty <= 0) return Alert.alert("Enter a valid quantity");

  const factor = qty / selectedFood.serving_size;
  const entry = {
    ...selectedFood,
    quantity: qty,
    calories: +(selectedFood.calories * factor).toFixed(1),
    protein: +(selectedFood.protein * factor).toFixed(1),
    carbs: +(selectedFood.carbs * factor).toFixed(1),
    fats: +(selectedFood.fats * factor).toFixed(1),
    fiber: +(selectedFood.fiber * factor).toFixed(1)
  };

  const user = auth.currentUser;
  if (!user) return Alert.alert("User not logged in");

  const docRef = doc(db, "meals", `${user.uid}_${todayKey}`);
  const docSnap = await getDoc(docRef);
  let log = docSnap.exists() ? docSnap.data() : {};

  if (!log[mealName]) log[mealName] = [];
  log[mealName].push(entry);
  await setDoc(docRef, log);

  setSelectedFood(null);
  setQuantity("");
  Alert.alert("Success", `${entry.name} added to ${mealName}`);
};

  const filteredFoods = foodDatabase.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
    const matchesCat = selectedCategory ? item.category === selectedCategory : true;
    return matchesQuery && matchesCat;
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
  <View style={{ flex: 1, backgroundColor: colors.background }}>
    {/* 🔙 Back Button */}
    <TouchableOpacity
      onPress={() => router.push("/nutrition")}
      style={{ position: "absolute", top: 20, left: 20, zIndex: 10, padding: 10 }}
    >
      <Ionicons name="arrow-back" size={24} color={colors.text} />
    </TouchableOpacity>

    <FlatList
      ListHeaderComponent={
        <View style={styles.container}>
          <Text style={styles.title}>🍽️ Add to {mealName}</Text>

          <TextInput
            placeholder="Search food..."
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
            style={styles.input}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                style={[styles.chip, selectedCategory === cat && styles.chipActive]}
              >
                <Text style={selectedCategory === cat ? styles.chipTextActive : styles.chipText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedFood && (
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Add: {selectedFood.name}</Text>
              <TextInput
                placeholder={`Quantity in ${selectedFood.serving_unit}`}
                value={quantity}
                keyboardType="numeric"
                onChangeText={setQuantity}
                style={styles.input}
              />
              <TouchableOpacity style={styles.button} onPress={handleAddToMeal}>
                <Text style={styles.buttonText}>✅ Add to {mealName}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      }
      contentContainerStyle={{ paddingBottom: 100 }}
      data={filteredFoods}
      keyExtractor={(_, i) => i.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => setSelectedFood(item)}>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={{ color: colors.subText }}>
            {item.serving_size} {item.serving_unit} • {item.calories} kcal
          </Text>
        </TouchableOpacity>
      )}
    />
  </View>
</KeyboardAvoidingView>

  );
}