import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, StyleSheet, ScrollView } from "react-native";
import { db } from "../firebase";
import { collection, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import dayjs from "dayjs";
import Back from "./back";

const StepCountScreen = () => {
  const [todaySteps, setTodaySteps] = useState("");
  const [stepGoal, setStepGoal] = useState("10000");
  const [history, setHistory] = useState<{ date: string; steps: string }[]>([]);
  const todayDate = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    const docRef = doc(db, "stepCounts", todayDate);
    getDoc(docRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setTodaySteps(data.steps?.toString() || "0");
        setStepGoal(data.goal?.toString() || "10000");
      }
    });

    const unsubscribe = onSnapshot(collection(db, "stepCounts"), (snapshot) => {
      const logs: { date: string; steps: string }[] = [];
      snapshot.forEach((doc) => {
        logs.push({ date: doc.id, steps: doc.data().steps?.toString() || "0" });
      });
      const sorted = logs.sort((a, b) => (a.date > b.date ? -1 : 1));
      setHistory(sorted);
    });

    return () => unsubscribe();
  }, []);

  const saveSteps = async () => {
    if (!todaySteps) return Alert.alert("Enter step count");
    await setDoc(doc(db, "stepCounts", todayDate), {
      steps: parseInt(todaySteps),
      goal: parseInt(stepGoal),
      date: todayDate,
    });
    Alert.alert("Saved", "Steps updated for today");
  };

  return (
    <ScrollView style={darkStyles.container}>
      <Text style={darkStyles.header}>Step Count Tracker</Text>
        <Back />

      <Text style={darkStyles.label}>Today's Steps ({todayDate})</Text>
      <TextInput
        value={todaySteps}
        onChangeText={setTodaySteps}
        keyboardType="number-pad"
        placeholder="Enter today's steps"
        placeholderTextColor="#aaa"
        style={[darkStyles.label, { backgroundColor: "#1e1e1e", padding: 10, borderRadius: 8, marginTop: 6 }]}
      />

      <Text style={[darkStyles.label, { marginTop: 20 }]}>Daily Goal</Text>
      <TextInput
        value={stepGoal}
        onChangeText={setStepGoal}
        keyboardType="number-pad"
        placeholder="Enter goal"
        placeholderTextColor="#aaa"
        style={[darkStyles.label, { backgroundColor: "#1e1e1e", padding: 10, borderRadius: 8, marginTop: 6 }]}
      />

      <TouchableOpacity style={darkStyles.button} onPress={saveSteps}>
        <Text style={darkStyles.buttonText}>Save</Text>
      </TouchableOpacity>

      <Text style={[darkStyles.header, { fontSize: 22, marginTop: 40 }]}>Step History</Text>
      {history.length === 0 ? (
        <Text style={darkStyles.summaryText}>No history found</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <View style={{ marginVertical: 8 }}>
              <Text style={darkStyles.label}>
                {item.date}: <Text style={darkStyles.summaryText}>{item.steps} steps</Text>
              </Text>
            </View>
          )}
        />
      )}
    </ScrollView>
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

export default StepCountScreen;
