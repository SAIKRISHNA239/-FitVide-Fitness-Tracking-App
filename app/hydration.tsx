import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch, Dimensions, ScrollView } from "react-native";
import { useTheme } from "../context/ThemeContext";
import CircularProgress from "react-native-circular-progress-indicator";
import { BarChart } from "react-native-chart-kit";
import dayjs from "dayjs";
import Back from "./back";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const screenWidth = Dimensions.get("window").width;
import { db as firestore } from "../firebase";


const WaterScreen = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [intake, setIntake] = useState(0);
  const [goal, setGoal] = useState(3000);
  const [usingCreatine, setUsingCreatine] = useState(false);
  const [recommendedIntake, setRecommendedIntake] = useState(0);
  const [bodyWeight, setBodyWeight] = useState<string>("");
  const [history, setHistory] = useState<any[]>([]);

  const todayKey = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    if (user) {
      loadProfileData();
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (parseFloat(bodyWeight) > 0) {
      let recommendedWater = parseFloat(bodyWeight) * 30;
      if (usingCreatine) {
        recommendedWater += 500;
      }
      setRecommendedIntake(recommendedWater);
      setGoal(recommendedWater);
    } else {
      setRecommendedIntake(0);
      setGoal(3000);
    }
  }, [bodyWeight, usingCreatine]);

  useEffect(() => {
    if (user) {
      saveTodayHydrationLog(intake, usingCreatine);
    }
  }, [intake, goal]);

  const loadProfileData = async () => {
    const ref = doc(firestore, `users/${user?.uid}/profile/data`);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      setBodyWeight(data.weight || "");
    }
  };

  const loadData = async () => {
    const ref = doc(firestore, `users/${user?.uid}/hydration/history`);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const logs = snap.data();
      const todayLog = logs[todayKey];
      setIntake(todayLog?.amount || 0);
      setUsingCreatine(todayLog?.creatine || false);
      const sixMonthsAgo = dayjs().subtract(6, "month");
      const filtered = Object.entries(logs)
        .filter(([date]) => dayjs(date).isAfter(sixMonthsAgo))
        .map(([date, data]: any) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setHistory(filtered);
    }
  };

  const saveTodayHydrationLog = async (intake: number, usingCreatine: boolean) => {
    const ref = doc(firestore, `users/${user?.uid}/hydration/history`);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data() : {};

    const updated = {
      ...existing,
      [todayKey]: { amount: intake, creatine: usingCreatine },
    };

    await setDoc(ref, updated);
    loadData();
  };

  const addIntake = (amount: number) => {
    setIntake(prev => prev + amount);
  };

  const barColors = (amount: number) => {
    if (amount >= goal) return "#4CAF50";
    if (amount >= goal / 2) return "#FF9800";
    return "#F44336";
  };

  const styles = darkStyles;

  return (
    <View style={{ flex: 1 }}>
      <Back />
      <ScrollView style={{ flex: 1, backgroundColor: styles.container.backgroundColor }} contentContainerStyle={{ paddingBottom: 140 }}>
        <Text style={styles.header}>Water Intake Tracker</Text>

        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <CircularProgress
            value={intake}
            maxValue={goal}
            radius={90}
            activeStrokeColor={styles.button.backgroundColor}
            inActiveStrokeColor={styles.container.backgroundColor}
            progressValueColor={styles.label.color}
            titleColor={styles.summaryText.color}
            title="ml"
          />
          <Text style={styles.label}>Recommended: {recommendedIntake} ml</Text>
          <Text style={{ color: styles.button.backgroundColor, marginTop: 10 }}>
            {Math.max(goal - intake, 0)} ml left
          </Text>
        </View>

        <View style={styles.buttonRow}>
          {[250, 500].map(amount => (
            <TouchableOpacity
              key={amount}
              style={styles.button}
              onPress={() => addIntake(amount)}
            >
              <Text style={styles.buttonText}>+{amount}ml</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.label}>Using Creatine</Text>
          <Switch value={usingCreatine} onValueChange={setUsingCreatine} />
        </View>

        <Text style={[styles.header, { marginTop: 30 }]}>Last 6 Months</Text>

        {history.length > 0 && (
          <BarChart
            data={{
              labels: history.map(h => dayjs(h.date).format("DD/MM")),
              datasets: [{ data: history.map(h => h.amount) }],
            }}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix="ml"
            chartConfig={{
              backgroundColor: styles.container.backgroundColor,
              backgroundGradientFrom: styles.container.backgroundColor,
              backgroundGradientTo: styles.container.backgroundColor,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
              labelColor: () => styles.label.color,
            }}
            style={{ borderRadius: 16, marginVertical: 8 }}
            withInnerLines={false}
            showValuesOnTopOfBars={true}
          />
        )}
      </ScrollView>
    </View>
  );
};

const darkStyles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
    backgroundColor: '#121212',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#bb86fc',
    marginTop: 40,
  },
  label: {
    fontSize: 16,
    color: '#fff',
  },
  button: {
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#bb86fc',
  },
  buttonText: {
    fontWeight: '700',
    color: '#121212',
  },
  summaryText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#bb86fc',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    alignItems: 'center',
  },
});

export default WaterScreen;
