// app/nutrition.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useNutrition } from "../context/NutritionContext";
import { getStyles } from "../styles/nutritionstyle";
import Back from './back';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

const meals = ["Breakfast", "Lunch", "Dinner"];

export default function NutritionScreen() {
  const { isDarkMode } = useTheme();
  const { updateMeal, updateData } = useNutrition();
  const router = useRouter();

const { styles: stylesSheet, colors } = getStyles(isDarkMode);

  const [log, setLog] = useState<any>({});
  const [macroTarget, setMacroTarget] = useState({
    calories: 2700,
    protein: 180,
    carbs: 300,
    fats: 75,
  });
  const [editIndex, setEditIndex] = useState<{ meal: string; index: number } | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const todayKey = new Date().toISOString().split("T")[0];

  const syncContextFromLog = (logData: any) => {
    for (const meal of meals) {
      const calories = logData[meal]?.reduce((sum: number, i: any) => sum + i.calories, 0) || 0;
      updateMeal(meal.toLowerCase() as "breakfast" | "lunch" | "dinner", calories);
    }

    updateData({
      protein: meals.reduce((sum, m) => sum + logData[m]?.reduce((s: number, i: any) => s + i.protein, 0) || 0, 0),
      carbs: meals.reduce((sum, m) => sum + logData[m]?.reduce((s: number, i: any) => s + i.carbs, 0) || 0, 0),
      fats: meals.reduce((sum, m) => sum + logData[m]?.reduce((s: number, i: any) => s + i.fats, 0) || 0, 0),
    });
  };
  const handleEdit = (meal: string, index: number) => {
  setEditIndex({ meal, index });
  setEditQuantity(log[meal][index].quantity.toString());
};

  const loadLog = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const docRef = doc(db, "meals", `${user.uid}_${todayKey}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLog(data);
        syncContextFromLog(data);
      }
    } catch (error) {
      console.error("Error loading meals log:", error);
    }
  };

  const handleDelete = async (meal: string, index: number) => {
    try {
      const updated = { ...log };
      updated[meal].splice(index, 1);
      setLog(updated);
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "meals", `${user.uid}_${todayKey}`);
        await setDoc(docRef, updated);
      }
      syncContextFromLog(updated);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const confirmEdit = async () => {
    if (!editIndex || !editQuantity) return;
    const { meal, index } = editIndex;
    const updated = { ...log };
    const item = updated[meal][index];
    const qty = parseFloat(editQuantity);
    const factor = qty / item.serving_size;
    item.quantity = qty;
    item.calories = +(item.calories / (item.quantity / item.serving_size) * factor).toFixed(1);
    item.protein = +(item.protein / (item.quantity / item.serving_size) * factor).toFixed(1);
    item.carbs = +(item.carbs / (item.quantity / item.serving_size) * factor).toFixed(1);
    item.fats = +(item.fats / (item.quantity / item.serving_size) * factor).toFixed(1);
    setLog(updated);

    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, "meals", `${user.uid}_${todayKey}`);
      await setDoc(docRef, updated);
    }

    syncContextFromLog(updated);
    setEditIndex(null);
    setEditQuantity("");
  };

  const getMealMacros = (meal: string, macro: string) => {
    return log[meal]?.reduce((sum: number, food: any) => sum + food[macro], 0).toFixed(1) || "0.0";
  };

  const getTotal = (macro: string) => {
    return meals.reduce((total, meal) => total + parseFloat(getMealMacros(meal, macro)), 0).toFixed(1);
  };

  const target = macroTarget;

  const getLeftover = (macro: keyof typeof target) => {
    return (target[macro] - parseFloat(getTotal(macro))).toFixed(1);
  };

  useEffect(() => {
    loadLog();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadLog();
    }, [])
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      
      <ScrollView contentContainerStyle={stylesSheet.container}>
        <Back />
        <View style={{ alignItems: "center" }}>
        <Text style={stylesSheet.title}>🥗 Nutrition Tracker</Text>
      </View>
        <View style={stylesSheet.summaryBox}>
          <Text style={stylesSheet.sectionTitle}>Remaining Macros</Text>
          <Text style={stylesSheet.logItemText}>🔥 Calories: {getLeftover("calories")} kcal</Text>
          <Text style={stylesSheet.logItemText}>💪 Protein: {getLeftover("protein")} g</Text>
          <Text style={stylesSheet.logItemText}>⚡ Carbs: {getLeftover("carbs")} g</Text>
          <Text style={stylesSheet.logItemText}>🥑 Fats: {getLeftover("fats")} g</Text>
        </View>

        {meals.map((meal, idx) => (
          <View key={idx} style={stylesSheet.mealSection}>
            <TouchableOpacity
              style={stylesSheet.mealButton}
              onPress={() => router.push({ pathname: "/meals", params: { meal } })}
            >
              <Text style={stylesSheet.mealText}>{meal}</Text>
            </TouchableOpacity>

            {log[meal]?.length > 0 && (
              <View style={stylesSheet.mealLogBox}>
                {log[meal].map((item: any, i: number) => (
                  <View key={i} style={stylesSheet.logItem}>
                    <Text style={stylesSheet.logItemText}>• {item.name} – {item.quantity}{item.serving_unit} ({item.calories} kcal)</Text>
                    <Text style={stylesSheet.subText}>P: {item.protein}g  C: {item.carbs}g  F: {item.fats}g</Text>
                    <View style={{ flexDirection: "row", marginTop: 4 }}>
                    <View style={{ flexDirection: "row", marginTop: 4 }}>
                    <TouchableOpacity onPress={() => handleEdit(meal, i)} style={stylesSheet.iconButton}>
                      <Ionicons name="create-outline" size={20} color={colors.icon} />
                      <Text style={[stylesSheet.subText, { marginLeft: 4 }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(meal, i)} style={stylesSheet.iconButton}>
                      <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                      <Text style={[stylesSheet.subText, { marginLeft: 4 }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                    </View>

                    {editIndex?.meal === meal && editIndex.index === i && (
                      <View style={{ marginTop: 6 }}>
                        <TextInput
                          placeholder="Edit Quantity"
                          keyboardType="numeric"
                          value={editQuantity}
                          onChangeText={setEditQuantity}
                          style={stylesSheet.input}
                          placeholderTextColor={colors.subText}
                        />
                        <TouchableOpacity style={stylesSheet.button} onPress={confirmEdit}>
                          <Text style={stylesSheet.buttonText}>✅ Save</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
                <Text style={stylesSheet.totalText}>
                  Total: {getMealMacros(meal, "calories")} kcal | P: {getMealMacros(meal, "protein")}g | C: {getMealMacros(meal, "carbs")}g | F: {getMealMacros(meal, "fats")}g
                </Text>
              </View>
            )}
          </View>
        ))}

        <View style={stylesSheet.summaryBox}>
          <Text style={stylesSheet.sectionTitle}>📊 Daily Totals</Text>
          <Text style={stylesSheet.logItemText}>Calories: {getTotal("calories")} kcal</Text>
          <Text style={stylesSheet.logItemText}>Protein: {getTotal("protein")}g</Text>
          <Text style={stylesSheet.logItemText}>Carbs: {getTotal("carbs")}g</Text>
          <Text style={stylesSheet.logItemText}>Fats: {getTotal("fats")}g</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}