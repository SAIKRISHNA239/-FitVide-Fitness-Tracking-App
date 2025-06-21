import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import SleepTimePicker from "../context/timepicker"; 
import BottomNavBar from './BottomNavBar';
import { useTheme } from "../context/ThemeContext";
import Back from './back';
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "./firebase";

interface SleepLog {
  date: string;
  sleepTime: Date;
  wakeTime: Date;
  duration: string;
  quality: string;
  notes: string;
}

type TimeValue = {
  hour: string;
  minute: string;
  amPm: "AM" | "PM";
};

const screenWidth = Dimensions.get("window").width;

const convertToDate = (timeObj: TimeValue): Date => {
  const hour = parseInt(timeObj.hour);
  const minute = parseInt(timeObj.minute);
  let adjustedHour = hour % 12;
  if (timeObj.amPm === "PM") adjustedHour += 12;

  const now = new Date();
  now.setHours(adjustedHour);
  now.setMinutes(minute);
  now.setSeconds(0);
  now.setMilliseconds(0);
  return new Date(now);
};

const SleepScreen = () => {
  const { isDarkMode } = useTheme();
  const auth = getAuth();
  const user = auth.currentUser;
  const db = getFirestore(app);

  const [sleepTimeInput, setSleepTimeInput] = useState<TimeValue>({ hour: "10", minute: "00", amPm: "PM" });
  const [wakeTimeInput, setWakeTimeInput] = useState<TimeValue>({ hour: "6", minute: "00", amPm: "AM" });
  const [quality, setQuality] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  const saveLog = async () => {
    if (!user) return;
    const sleepTime = convertToDate(sleepTimeInput);
    const wakeTime = convertToDate(wakeTimeInput);
    const today = new Date().toISOString().split("T")[0];

    let sleepHours = (wakeTime.getTime() - sleepTime.getTime()) / 1000 / 60 / 60;
    if (sleepHours < 0) sleepHours += 24;

    if (!quality || isNaN(Number(quality)) || Number(quality) < 1 || Number(quality) > 5) {
      Alert.alert("Invalid Input", "Please enter a sleep quality between 1 and 5.");
      return;
    }

    const newLog: SleepLog = {
      date: today,
      sleepTime,
      wakeTime,
      duration: sleepHours.toFixed(2),
      quality,
      notes,
    };

    const updatedLogs = [...logs];
    const existingLogIndex = logs.findIndex(log => log.date === today);
    if (existingLogIndex !== -1) {
      updatedLogs[existingLogIndex] = newLog;
    } else {
      updatedLogs.push(newLog);
    }

    try {
      await setDoc(doc(db, "sleepLogs", user.uid), { logs: updatedLogs });
      setLogs(updatedLogs);
      resetForm();
    } catch (err) {
      console.error("Error saving log:", err);
    }
  };

  const loadLogs = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, "sleepLogs", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const rawLogs: SleepLog[] = docSnap.data().logs || [];
        const parsedLogs = rawLogs.map((log: any) => ({
          ...log,
          sleepTime: new Date(log.sleepTime),
          wakeTime: new Date(log.wakeTime),
        }));
        setLogs(parsedLogs);
      }
    } catch (err) {
      console.error("Error loading logs:", err);
    }
  };

  const resetForm = () => {
    setSleepTimeInput({ hour: "10", minute: "00", amPm: "PM" });
    setWakeTimeInput({ hour: "6", minute: "00", amPm: "AM" });
    setQuality("");
    setNotes("");
    setEditingIndex(-1);
  };

  const deleteLog = async (index: number) => {
    if (!user) return;
    Alert.alert("Confirm Delete", "Are you sure you want to delete this log?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = logs.filter((_, i) => i !== index);
          setLogs(updated);
          await setDoc(doc(db, "sleepLogs", user.uid), { logs: updated });
        },
      },
    ]);
  };

  const convertFromDate = (date: Date): TimeValue => {
    let hour = date.getHours();
    const minute = date.getMinutes();
    const amPm = (hour >= 12 ? "PM" : "AM") as "AM" | "PM";
    hour = hour % 12 || 12;
    return {
      hour: hour.toString().padStart(2, "0"),
      minute: minute.toString().padStart(2, "0"),
      amPm,
    };
  };

  const editLog = (index: number) => {
    const log = logs[index];
    setSleepTimeInput(convertFromDate(log.sleepTime));
    setWakeTimeInput(convertFromDate(log.wakeTime));
    setQuality(log.quality);
    setNotes(log.notes);
    setEditingIndex(index);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const chartData = {
    labels: logs.slice(-7).map((l) => l.date),
    datasets: [
      {
        data: logs.slice(-7).map((l) => parseFloat(l.duration)).map((val) => (isNaN(val) ? 0 : val)),
      },
    ],
  };

  const dynamicStyles = darkStyles;

  return (
    <View style={{ flex: 1 }}>
      <Back />
      <ScrollView style={dynamicStyles.container}>
        <Text style={dynamicStyles.header}>Sleep Tracker</Text>

        <SleepTimePicker label="Sleep Time" value={sleepTimeInput} onChange={setSleepTimeInput} />
        <Text style={dynamicStyles.ampmText}>
          Sleep: {sleepTimeInput.hour.padStart(2, "0")}:{sleepTimeInput.minute.padStart(2, "0")} {sleepTimeInput.amPm}
        </Text>

        <SleepTimePicker label="Wake Time" value={wakeTimeInput} onChange={setWakeTimeInput} />
        <Text style={dynamicStyles.ampmText}>
          Wake: {wakeTimeInput.hour.padStart(2, "0")}:{wakeTimeInput.minute.padStart(2, "0")} {wakeTimeInput.amPm}
        </Text>

        <Text style={dynamicStyles.label}>Sleep Quality (1-5)</Text>
        <TextInput style={dynamicStyles.input} keyboardType="numeric" value={quality} onChangeText={setQuality} placeholder="e.g., 4" />

        <Text style={dynamicStyles.label}>Notes</Text>
        <TextInput style={dynamicStyles.input} value={notes} onChangeText={setNotes} placeholder="e.g., Felt rested" />

        <Button title={editingIndex >= 0 ? "Update Log" : "Save Log"} onPress={saveLog} />

        <Text style={dynamicStyles.subHeader}>Saved Logs</Text>
        {logs.map((log, index) => (
          <View key={index} style={dynamicStyles.logCard}>
            <Text style={dynamicStyles.logText}>📅 {log.date} | 🛌 {log.duration} hrs | ⭐ {log.quality}</Text>
            <Text style={dynamicStyles.logText}>📝 {log.notes}</Text>
            <View style={dynamicStyles.logActions}>
              <TouchableOpacity onPress={() => editLog(index)}>
                <Text style={dynamicStyles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteLog(index)}>
                <Text style={[dynamicStyles.actionText, { color: "red" }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {logs.length > 0 && (
          <>
            <Text style={dynamicStyles.subHeader}>7-Day Sleep Duration</Text>
            <LineChart
              data={chartData}
              width={screenWidth - 20}
              height={220}
              yAxisSuffix="h"
              chartConfig={{
                backgroundGradientFrom: "#121212",
                backgroundGradientTo: "#121212",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(187, 134, 252, ${opacity})`,
                labelColor: () => "#fff",
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: "#bb86fc",
                },
              }}
              bezier
              style={{ marginVertical: 10, borderRadius: 10 }}
            />
          </>
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
    flex: 1,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#bb86fc',
  },
  section: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#333',
    borderColor: '#555',
    color: '#fff',
  },
  datePicker: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    borderColor: '#555',
    backgroundColor: '#333',
  },
  label: {
    fontSize: 16,
    color: '#bbb',
  },
  button: {
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#6200EE',
  },
  buttonText: {
    fontWeight: '700',
    color: '#fff',
  },
  summaryBox: {
    marginTop: 20,
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#3700b3',
  },
  summaryText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#fff',
  },
  logCard: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#555',
  },
  logText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#fff',
  },
  logActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionText: {
    color: '#bb86fc',
  },
  subHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 10,
    color: '#fff',
  },
  ampmText: {
    fontSize: 16,
    color: '#bbb',
    marginBottom: 20,
  },
});

export default SleepScreen;
