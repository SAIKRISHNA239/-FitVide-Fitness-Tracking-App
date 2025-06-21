import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import {
  getExerciseLogs,
  getHydrationLogs,
  getDailyNutritionLogs,
  getSleepLogs,
} from "../data/getLog";
import { format, parseISO } from "date-fns";
import Back from "./back";
import BottomNavBar from "./BottomNavBar";

export type ExerciseLog = {
  id: string;
  date: string;
  workout: string;
  region: string;
  level: string;
  exercise: string;
  sets: any[];
  tag?: string;
  intensity?: number;
};

export type HydrationLog = {
  date: string;
  amount: number;
  creatine?: boolean;
};

export type NutritionLog = {
  date: string;
  Calories: number;
  Protein: number;
  Carbs: number;
  Fats: number;
};

export type SleepLog = {
  date: string;
  duration: number;
  quality: number;
};

export type CombinedLog = {
  date: string;
  hydration?: HydrationLog;
  nutrition?: NutritionLog;
  exercises: ExerciseLog[];
  sleep?: SleepLog;
};

const ProgressScreen = () => {
  const [combinedLogs, setCombinedLogs] = useState<CombinedLog[]>([]);

  useEffect(() => {
    const fetchAllLogs = async () => {
      const hydrationRaw = await getHydrationLogs();
      const hydrationLogs: HydrationLog[] = Array.isArray(hydrationRaw) ? hydrationRaw : [];

      const nutritionRaw = await getDailyNutritionLogs();
      const nutritionLogs: NutritionLog[] = Array.isArray(nutritionRaw) ? nutritionRaw : [];

      const exerciseRaw = await getExerciseLogs();
      const exerciseLogs: ExerciseLog[] = Array.isArray(exerciseRaw) ? exerciseRaw : [];

      const sleepRaw = await getSleepLogs();
      const sleepLogs: SleepLog[] = Array.isArray(sleepRaw) ? sleepRaw : [];

      // Optional debug logging
      console.log("hydrationLogs", hydrationLogs);
      console.log("nutritionLogs", nutritionLogs);
      console.log("exerciseLogs", exerciseLogs);
      console.log("sleepLogs", sleepLogs);

      const allDatesSet = new Set<string>([
        ...hydrationLogs.map((l) => l.date),
        ...nutritionLogs.map((l) => l.date),
        ...exerciseLogs.map((l) => l.date),
        ...sleepLogs.map((l) => l.date),
      ]);

      const merged = Array.from(allDatesSet)
        .sort((a, b) => b.localeCompare(a))
        .map((date) => {
          const hydration = hydrationLogs.find((l) => l.date === date);
          const nutrition = nutritionLogs.find((l) => l.date === date);
          const exercises = exerciseLogs.filter((l) => l.date === date);
          const sleep = sleepLogs.find((l) => l.date === date);

          return { date, hydration, nutrition, exercises, sleep };
        });

      setCombinedLogs(merged);
    };

    fetchAllLogs();
  }, []);

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={styles.container}>
      <Back />
      <View style={{ alignItems: "center" }}>
      <Text style={styles.header}>Progress Summary</Text>
      </View>
      {combinedLogs.map(({ date, hydration, nutrition, exercises, sleep }) => (
        <View key={date} style={styles.logItem}>
          <Text style={styles.date}>{format(parseISO(date), "eeee, MMM d")}</Text>

          {nutrition && (
            <Text style={styles.text}>
              📊 {nutrition.Calories} kcal | P: {nutrition.Protein}g C: {nutrition.Carbs}g F: {nutrition.Fats}g
            </Text>
          )}

          {hydration && (
            <Text style={styles.text}>
              💧 {hydration.amount} ml {hydration.creatine ? "| Creatine ✅" : ""}
            </Text>
          )}

          {exercises.length > 0 && (
            <Text style={styles.text}> 
              🏋️‍♂️ {exercises.length} exercises | Tags:{" "}
              {exercises.map((e) => e.tag).filter(Boolean).join(", ")}
            </Text>
          )}

          {sleep && (
            <Text style={styles.text}>
              🛌 {sleep.duration} hrs | Quality: {sleep.quality}/5
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
      <BottomNavBar activeTab="progress" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  logItem: {
    backgroundColor: '#1f1f1f',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  date: {
    fontWeight: 'bold',
    color: '#bb86fc',
    marginBottom: 6,
  },
  text: {
    color: '#dddddd',
    marginBottom: 4,
  },
});


export default ProgressScreen;
