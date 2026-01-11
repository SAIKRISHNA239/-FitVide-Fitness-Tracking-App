// app/nutrition.tsx
import React, { useState } from "react";
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
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";

const meals = ["Breakfast", "Lunch", "Dinner"];

interface MealItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity: number;
  serving_size: number;
  serving_unit: string;
  fiber?: number;
}

interface DailyLog {
  Breakfast?: MealItem[];
  Lunch?: MealItem[];
  Dinner?: MealItem[];
}

export default function NutritionScreen() {
  const { isDarkMode } = useTheme();
  const { updateMeal, updateData } = useNutrition();
  const { user } = useAuth();
  const router = useRouter();

const { styles: stylesSheet, colors } = getStyles(isDarkMode);

  const [log, setLog] = useState<DailyLog>({});
  const [macroTarget, setMacroTarget] = useState({
    calories: 2700,
    protein: 180,
    carbs: 300,
    fats: 75,
  });
  const [editIndex, setEditIndex] = useState<{ meal: string; index: number } | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const todayKey = dayjs().format('YYYY-MM-DD');

  const syncContextFromLog = (logData: DailyLog) => {
    for (const meal of meals) {
      const calories = logData[meal as keyof DailyLog]?.reduce((sum: number, i: MealItem) => sum + i.calories, 0) || 0;
      updateMeal(meal.toLowerCase() as "breakfast" | "lunch" | "dinner", calories);
    }

    updateData({
      protein: meals.reduce((sum, m) => sum + (logData[m as keyof DailyLog]?.reduce((s: number, i: MealItem) => s + i.protein, 0) || 0), 0),
      carbs: meals.reduce((sum, m) => sum + (logData[m as keyof DailyLog]?.reduce((s: number, i: MealItem) => s + i.carbs, 0) || 0), 0),
      fats: meals.reduce((sum, m) => sum + (logData[m as keyof DailyLog]?.reduce((s: number, i: MealItem) => s + i.fats, 0) || 0), 0),
    });
  };
  const handleEdit = (meal: string, index: number) => {
    setEditIndex({ meal, index });
    const mealKey = meal as keyof DailyLog;
    if (log[mealKey] && log[mealKey]![index]) {
      setEditQuantity(log[mealKey]![index].quantity.toString());
    }
  };

  const loadLog = async () => {
    try {
      if (!user) return;
      
      // Fetch meals for today with their items
      const { data: mealsData, error } = await supabase
        .from('meals')
        .select(`
          id,
          meal_type,
          meal_items (*)
        `)
        .eq('user_id', user.id)
        .eq('date', todayKey);

      if (error) {
        console.error("Error loading meals:", error);
        return;
      }

      // Transform Supabase data to DailyLog format
      const dailyLog: DailyLog = {};
      
      mealsData?.forEach((meal: any) => {
        const mealType = meal.meal_type as keyof DailyLog;
        if (!dailyLog[mealType]) {
          dailyLog[mealType] = [];
        }
        
        meal.meal_items?.forEach((item: any) => {
          dailyLog[mealType]!.push({
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fats: item.fats,
            quantity: item.quantity,
            serving_size: item.serving_size,
            serving_unit: item.serving_unit,
            fiber: item.fiber || 0,
          });
        });
      });

      setLog(dailyLog);
      syncContextFromLog(dailyLog);
    } catch (error) {
      console.error("Error loading meals log:", error);
    }
  };

  const handleDelete = async (meal: string, index: number) => {
    try {
      if (!user) return;
      
      const mealKey = meal as keyof DailyLog;
      const mealItems = log[mealKey];
      if (!mealItems || !mealItems[index]) return;

      // Find the meal_id for this meal type
      const { data: mealsData } = await supabase
        .from('meals')
        .select('id, meal_items(id)')
        .eq('user_id', user.id)
        .eq('date', todayKey)
        .eq('meal_type', meal)
        .single();

      if (!mealsData) return;

      // Get the item to delete
      const itemToDelete = mealItems[index];
      
      // Find the meal_item id (we need to match by name and quantity)
      const { data: mealItemsData } = await supabase
        .from('meal_items')
        .select('id')
        .eq('meal_id', mealsData.id)
        .eq('name', itemToDelete.name)
        .eq('quantity', itemToDelete.quantity)
        .limit(1)
        .single();

      if (mealItemsData) {
        await supabase
          .from('meal_items')
          .delete()
          .eq('id', mealItemsData.id);
      }

      // Reload log
      await loadLog();
    } catch (error) {
      console.error("Error deleting item:", error);
      Alert.alert("Error", "Failed to delete item");
    }
  };

  const confirmEdit = async () => {
    if (!editIndex || !editQuantity || !user) return;
    const { meal, index } = editIndex;
    const mealKey = meal as keyof DailyLog;
    const mealItems = log[mealKey];
    if (!mealItems || !mealItems[index]) return;

    try {
      const item = mealItems[index];
      const qty = parseFloat(editQuantity);
      const factor = qty / item.serving_size;
      
      const updatedCalories = +(item.calories / (item.quantity / item.serving_size) * factor).toFixed(1);
      const updatedProtein = +(item.protein / (item.quantity / item.serving_size) * factor).toFixed(1);
      const updatedCarbs = +(item.carbs / (item.quantity / item.serving_size) * factor).toFixed(1);
      const updatedFats = +(item.fats / (item.quantity / item.serving_size) * factor).toFixed(1);

      // Find the meal_item to update
      const { data: mealsData } = await supabase
        .from('meals')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', todayKey)
        .eq('meal_type', meal)
        .single();

      if (!mealsData) return;

      // Find the meal_item id
      const { data: mealItemsData } = await supabase
        .from('meal_items')
        .select('id')
        .eq('meal_id', mealsData.id)
        .eq('name', item.name)
        .eq('quantity', item.quantity)
        .limit(1)
        .single();

      if (mealItemsData) {
        await supabase
          .from('meal_items')
          .update({
            quantity: qty,
            calories: updatedCalories,
            protein: updatedProtein,
            carbs: updatedCarbs,
            fats: updatedFats,
          })
          .eq('id', mealItemsData.id);
      }

      // Reload log
      await loadLog();
      setEditIndex(null);
      setEditQuantity("");
    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert("Error", "Failed to update item");
    }
  };

  const getMealMacros = (meal: string, macro: keyof MealItem) => {
    const mealKey = meal as keyof DailyLog;
    return log[mealKey]?.reduce((sum: number, food: MealItem) => sum + (food[macro] as number), 0).toFixed(1) || "0.0";
  };

  const getTotal = (macro: keyof MealItem) => {
    return meals.reduce((total, meal) => total + parseFloat(getMealMacros(meal, macro)), 0).toFixed(1);
  };

  const target = macroTarget;

  const getLeftover = (macro: keyof typeof target) => {
    return (target[macro] - parseFloat(getTotal(macro))).toFixed(1);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadLog();
    }, [todayKey])
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

            {log[meal as keyof DailyLog]?.length && log[meal as keyof DailyLog]!.length > 0 && (
              <View style={stylesSheet.mealLogBox}>
                {log[meal as keyof DailyLog]!.map((item: MealItem, i: number) => (
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