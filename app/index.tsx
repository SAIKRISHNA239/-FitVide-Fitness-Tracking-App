import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useNutrition } from "../context/NutritionContext";
import CircularProgress from 'react-native-circular-progress-indicator';
import { getCalorieBudget } from "../context/getCalorieBudget";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const Index: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isDarkMode } = useTheme();
  const { data } = useNutrition();

  const [calorieBudget, setCalorieBudget] = useState(3200); // default
  const [waterIntake, setWaterIntake] = useState(1000); // default intake (example)
  const waterGoal = 3000;
  const todayKey = dayjs().format('YYYY-MM-DD');

  const totalCalories =
    (data.calories.breakfast || 0) +
    (data.calories.lunch || 0) +
    (data.calories.dinner || 0);

  useEffect(() => {
    const fetchBudget = async () => {
      const budget = await getCalorieBudget();
      setCalorieBudget(budget || 2000);
    };
    fetchBudget();
  }, []);

  const { user } = useAuth();

  useEffect(() => {
    const loadWaterIntake = async () => {
      if (!user) return;
      
      try {
        // Load from daily_logs table for today's date
        const { data, error } = await supabase
          .from('daily_logs')
          .select('water_intake')
          .eq('user_id', user.id)
          .eq('date', todayKey)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 means no rows found, which is fine
          console.error("Error loading water intake:", error);
          return;
        }

        if (data?.water_intake !== undefined && data.water_intake !== null) {
          setWaterIntake(data.water_intake);
        } else {
          // No log exists for today, default to 0
          setWaterIntake(0);
        }
      } catch (error) {
        console.error("Error loading water intake:", error);
      }
    };
    
    if (user) {
      loadWaterIntake();
    }
  }, [todayKey, user]);

  const updateWaterIntake = async (newIntake: number) => {
    if (!user) return;
    
    setWaterIntake(newIntake);
    
    try {
      // Use upsert to create or update daily_logs entry
      // This ensures we don't overwrite other fields like weight, sleep, mood
      const { error } = await supabase
        .from('daily_logs')
        .upsert({
          user_id: user.id,
          date: todayKey,
          water_intake: newIntake,
        }, {
          onConflict: 'user_id,date',
        });

      if (error) {
        console.error("Error saving water intake:", error);
        // Revert state on error
        const { data } = await supabase
          .from('daily_logs')
          .select('water_intake')
          .eq('user_id', user.id)
          .eq('date', todayKey)
          .single();
        
        if (data?.water_intake !== undefined) {
          setWaterIntake(data.water_intake);
        }
      }
    } catch (error) {
      console.error("Error saving water intake:", error);
    }
  };

  const colors = {
        bg: isDarkMode ? "#121212" : "#ffffff",
        text: isDarkMode ? "#ffffff" : "#000000",
        subText: isDarkMode ? "#bbbbbb" : "#666666",
        border: isDarkMode ? "#2c2c2c" : "#e0e0e0",
        highlight: isDarkMode ? "#bb86fc" : "#6200EE",
        card: isDarkMode ? "#333" : "#f5f5f5",
        activeNav: isDarkMode ? "#bb86fc" : "#6200EE",
        navIcon: isDarkMode ? "#888888" : "#666666",
      };

  const today = dayjs();
  const [selectedDate, setSelectedDate] = useState(today);
  const weekdays = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  const generateWeek = () => {
    const startOfWeek = today.startOf("week");
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, "day"));
  };

  const weekDates = generateWeek();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Top Bar */}
      <View style={[styles.topBarFixed, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            if (pathname === "/") {
              router.push("/menu");
            } else {
              router.replace("/");
            }
          }}
        >
          <Ionicons name="menu" size={28} color={colors.highlight} />
        </TouchableOpacity>
        <Text style={[styles.calendarText, { color: colors.text }]}>Today’s task...</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Calendar */}
      <View style={[styles.dateRow, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        {weekDates.map((date, index) => {
          const isSelected = selectedDate.isSame(date, "date");
          return (
            <TouchableOpacity
              key={index}
              style={[styles.dateItem, isSelected && { backgroundColor: colors.highlight }]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dateText, { color: isSelected ? "#fff" : colors.subText, fontWeight: isSelected ? "bold" : "normal" }]}>
                {date.date()}
              </Text>
              <Text style={[styles.dateText, { color: isSelected ? "#fff" : colors.subText, fontWeight: isSelected ? "bold" : "normal" }]}>
                {weekdays[date.day()]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Scrollable Body */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.mainContent}>
          <View style={styles.macroInfo}>
            <View style={{ alignItems: "center", marginBottom: 10 }}>
              <Text style={[styles.macroLabel, { color: colors.subText }]}>Protein</Text>
              <Text style={[styles.macroValue, { color: colors.highlight }]}>{data.protein.toFixed(1)}</Text>
            </View>
            <View style={{ alignItems: "center", marginBottom: 10 }}>
              <Text style={[styles.macroLabel, { color: colors.subText }]}>Carbs</Text>
              <Text style={[styles.macroValue, { color: colors.highlight }]}>{data.carbs.toFixed(1)}</Text>
            </View>
            <View style={{ alignItems: "center", marginBottom: 10 }}>
              <Text style={[styles.macroLabel, { color: colors.subText }]}>Fats</Text>
              <Text style={[styles.macroValue, { color: colors.highlight }]}>{data.fats.toFixed(1)}</Text>
            </View>
          </View>

          {/* Calorie Chart */}
          <TouchableOpacity onPress={() => router.push('/nutrition')} activeOpacity={0.8} style={{ justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress
              value={totalCalories}
              radius={80}
              maxValue={calorieBudget}
              activeStrokeColor={colors.highlight}
              inActiveStrokeColor={colors.border}
              inActiveStrokeOpacity={0.3}
              showProgressValue={false}
              progressValueColor="transparent"
            />
            <View style={{ position: 'absolute', alignItems: 'center' }}>
              <Text style={[styles.circleMiddle, { color: colors.text }]}>{calorieBudget}</Text>
              <Text style={[styles.circleLeft, { color: colors.highlight }]}>{calorieBudget - totalCalories} left</Text>
              <Text style={[styles.circleBottom, { color: colors.subText }]}>{totalCalories}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.mealInfo}>
            {["Breakfast", "Lunch", "Dinner"].map((meal, i) => (
              <View key={meal} style={{ alignItems: "center", marginBottom: 10 }}>
                <Text style={[styles.macroLabel, { color: colors.subText }]}>{meal}</Text>
                <Text style={[styles.macroValue, { color: colors.highlight }]}>
                  {data.calories[meal.toLowerCase() as "breakfast" | "lunch" | "dinner"] || 0}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Water Intake */}
        <View style={styles.waterSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[styles.waterLabel, { color: colors.text }]}>Water intake</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => updateWaterIntake(Math.max(0, waterIntake - 250))}
                style={[styles.waterButton, { backgroundColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontSize: 16 }}>-250ml</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateWaterIntake(waterIntake + 250)}
                style={[styles.waterButton, { backgroundColor: colors.highlight }]}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>+250ml</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.waterBarContainer, { backgroundColor: colors.border }]}>
            <View style={{ width: `${Math.min((waterIntake / waterGoal) * 100, 100)}%`, backgroundColor: colors.highlight, height: '100%' }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={[styles.waterSub, { color: colors.highlight }]}>
              {waterIntake}ml / {waterGoal}ml
            </Text>
            <Text style={[styles.waterSub, { color: colors.subText }]}>
              {Math.max(waterGoal - waterIntake, 0)} ml left
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={[styles.navBar, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace("/")} style={styles.navButton}>
          <Ionicons name="home-outline" size={24} color={colors.activeNav} />
          <Text style={[styles.navText, { color: colors.activeNav }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/progress")} style={styles.navButton}>
          <MaterialCommunityIcons name="chart-line" size={24} color={colors.navIcon} />
          <Text style={[styles.navText, { color: colors.navIcon }]}>Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/settings")} style={styles.navButton}>
          <Ionicons name="settings-outline" size={24} color={colors.navIcon} />
          <Text style={[styles.navText, { color: colors.navIcon }]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Index;

// Styles remain the same
const styles = StyleSheet.create({
  topBarFixed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  calendarText: { fontSize: 18, fontWeight: '600' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, borderBottomWidth: 1 },
  dateItem: { padding: 10, borderRadius: 10, alignItems: 'center' },
  dateText: { fontSize: 14 },
  scrollContainer: { padding: 16 },
  mainContent: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  macroInfo: { flex: 1, justifyContent: 'center', gap: 8 },
  macroLabel: { fontSize: 14 },
  macroValue: { fontSize: 18, fontWeight: 'bold' },
  circleMiddle: { fontSize: 18, fontWeight: 'bold' },
  circleLeft: { fontSize: 12, fontWeight: '600' },
  circleBottom: { fontSize: 14, marginTop: 4 },
  mealInfo: { flex: 1, justifyContent: 'center', gap: 8 },
  waterSection: { marginTop: 20 },
  waterLabel: { fontSize: 18, fontWeight: '600' },
  waterBarContainer: { height: 10, width: '100%', borderRadius: 6, overflow: 'hidden' },
  waterSub: { fontSize: 14, fontWeight: '500' },
  waterButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  navBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1 },
  navButton: { alignItems: 'center' },
  navText: { fontSize: 12, marginTop: 4 },
});
