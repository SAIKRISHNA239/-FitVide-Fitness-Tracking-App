import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useNutrition } from "../context/NutritionContext";
import CircularProgress from 'react-native-circular-progress-indicator';
import { getCalorieBudget } from "../context/getCalorieBudget";

const Index: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isDarkMode } = useTheme();
  const { data } = useNutrition();

  const [calorieBudget, setCalorieBudget] = useState(3200); // default
  const [waterIntake, setWaterIntake] = useState(1000); // default intake (example)
  const waterGoal = 3000;

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

  const colors = {
        bg: "#121212",
        text: "#ffffff",
        subText: "#bbbbbb",
        border: "#2c2c2c",
        highlight: "#bb86fc",
        card: "#333",
        activeNav: "#bb86fc",
        navIcon: "#888888",
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
          <Text style={[styles.waterLabel, { color: colors.text }]}>Water intake</Text>
          <View style={[styles.waterBarContainer, { backgroundColor: colors.border }]}>
            <View style={{ width: `${(waterIntake / waterGoal) * 100}%`, backgroundColor: colors.highlight }} />
            <View style={{ flex: 1 }} />
          </View>
          <Text style={[styles.waterSub, { color: colors.highlight }]}>
            {Math.max(waterGoal - waterIntake, 0)} ml left
          </Text>
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
  waterLabel: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  waterBarContainer: { height: 10, width: '100%', borderRadius: 6, flexDirection: 'row', overflow: 'hidden' },
  waterSub: { marginTop: 6, fontSize: 14, fontWeight: '500' },
  navBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1 },
  navButton: { alignItems: 'center' },
  navText: { fontSize: 12, marginTop: 4 },
});
