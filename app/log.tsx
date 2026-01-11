import React, { useEffect, useState ,useRef} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  useColorScheme,
  ScrollView
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db } from "../firebase"; // your firebase config file
import { collection, getDocs, setDoc, doc, deleteDoc, query, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext"; // to get current user
import { AntDesign, Feather } from "@expo/vector-icons";
import exerciseData from "../data/exercise.json";
import { Ionicons } from "@expo/vector-icons";
import Back from './back';
import dayjs from "dayjs";
import { useTheme } from "../context/ThemeContext";


interface SetDetail {
  set: number;
  reps: number;
  weight: number;
}

interface ExerciseLog {
  id: string;
  date: string;
  workout: string;
  region: string;
  level: string;
  exercise: string;
  sets: SetDetail[];
  tag?: string;
  intensity?: number;
}


interface ExerciseOption {
  name: string;
  equipment: string;
  level: string;
  focus: string;
  type: string;
}

const LogScreen = () => {
  const { isDarkMode } = useTheme();
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format('YYYY-MM-DD')
  );
  const [workout, setWorkout] = useState("");
  const [region, setRegion] = useState("");
  const [level, setLevel] = useState("");
  const [exercise, setExercise] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [data, setData] = useState<any[]>([]);
const [availableWorkouts, setAvailableWorkouts] = useState<string[]>([]);
const [availableRegions, setAvailableRegions] = useState<string[]>([]);
const [availableLevels, setAvailableLevels] = useState<string[]>([]);
const [availableExercises, setAvailableExercises] = useState<string[]>([]);
const [showAll, setShowAll] = useState(false);
const [setInputs, setSetInputs] = useState<SetDetail[]>([]);
const [sets, setSets] = useState<SetDetail[]>([]);
const [intensity, setIntensity] = useState<number>(0);
const [tag, setTag] = useState<string>("");
const [tempRegion, setTempRegion] = useState('');
const [tempLevel, setTempLevel] = useState('');
const [tempExercise, setTempExercise] = useState('');
const flatListRef = useRef<FlatList>(null);
const { user } = useAuth();

// Theme colors
const colors = {
  bg: isDarkMode ? "#121212" : "#ffffff",
  text: isDarkMode ? "#ffffff" : "#000000",
  subText: isDarkMode ? "#bbbbbb" : "#666666",
  border: isDarkMode ? "#2c2c2c" : "#e0e0e0",
  highlight: isDarkMode ? "#bb86fc" : "#6200EE",
  card: isDarkMode ? "#1E1E1E" : "#f5f5f5",
};


const changeDate = (days: number) => {
  const current = dayjs(selectedDate).add(days, 'day');
  setSelectedDate(current.format('YYYY-MM-DD'));
};

useEffect(() => {
  setData(exerciseData);
  const workouts = [...new Set(exerciseData.map((item) => item.workout))];
  setAvailableWorkouts(workouts);
}, []);

useEffect(() => {
  if (workout) {
    const regions = data
      .filter((item) => item.workout === workout)
      .map((item) => item.region);
    setAvailableRegions(regions);
    setRegion("");
    setLevel("");
    setExercise("");
  }
}, [workout]);

useEffect(() => {
  if (workout && region) {
    const selected = data.find(
      (item) => item.workout === workout && item.region === region
    );
    if (selected) {
      setAvailableLevels(Object.keys(selected.styles));
      setLevel("");
      setExercise("");
    }
  }
}, [region]);

useEffect(() => {
  if (workout && region && level) {
    const selected = data.find(
      (item) => item.workout === workout && item.region === region
    );
    if (selected) {
      const exerciseNames = selected.styles[level]?.map((ex: ExerciseOption) => ex.name) || [];
      setAvailableExercises(exerciseNames);
      setExercise("");
    }
  }
}, [level]);


  useEffect(() => {
    loadLogs();
  }, [user, selectedDate]);

  useEffect(() => {
    if (editId) {
      // After setting workout, region options will be ready
      setRegion(tempRegion);
    }
  }, [availableRegions]);
  
  useEffect(() => {
    if (editId) {
      // After setting region, level options will be ready
      setLevel(tempLevel);
    }
  }, [availableLevels]);
  
  useEffect(() => {
    if (editId) {
      // After setting level, exercise options will be ready
      setExercise(tempExercise);
    }
  }, [availableExercises]);

  const handleCloseModal = () => {
    setEditId(null);
    setTempRegion('');
    setTempLevel('');
    setTempExercise('');
    setModalVisible(false);
  };
  

  const loadLogs = async () => {
  if (!user) return;
  try {
    const userLogsRef = collection(db, "exerciseLogs", user.uid, "logs");
    // Query only logs for the selected date
    const q = query(userLogsRef, where("date", "==", selectedDate));
    const snapshot = await getDocs(q);
    const loadedLogs = snapshot.docs.map(doc => doc.data() as ExerciseLog);
    setLogs(loadedLogs);
  } catch (error) {
    console.error("Error loading logs from Firestore:", error);
  }
};



  const handleSave = () => {
    if (!workout || !region || !level || !exercise || setInputs.length === 0) {
      Alert.alert("Please fill in all fields");
      return;
    }

    const newLog: ExerciseLog = {
      id: editId || Date.now().toString(),
      date: selectedDate,
      workout,
      region,
      level,
      exercise,
      sets: setInputs,
      tag,
      intensity,
    };

    let updatedLogs = [...logs];
    const index = logs.findIndex((log) => log.id === newLog.id);
    if (index >= 0) {
      updatedLogs[index] = newLog;
    } else {
      updatedLogs.push(newLog);
    }

    setLogs(updatedLogs);
    saveLogs([newLog]);
    resetForm();
  };
  
  const saveLogs = async (newLogs: ExerciseLog[]) => {
    if (!user) return;
    try {
      for (const log of newLogs) {
        const logRef = doc(db, "exerciseLogs", user.uid, "logs", log.id);
        await setDoc(logRef, log);
      }
    } catch (error) {
      console.error("Error saving logs to Firestore:", error);
    }
  };


  const handleEdit = (log: ExerciseLog) => {
    console.log("Editing log:", log); 
  
    setSelectedDate(log.date);
    setWorkout(log.workout || "");
    setTempRegion(log.region || "");
    setTempLevel(log.level || "");
    setTempExercise(log.exercise || "");
    setSetInputs(log.sets || []);
    setTag(log.tag || "");
    setIntensity(log.intensity || 0);
    setEditId(log.id); // to indicate we're editing
    setModalVisible(true);
  };
  

  const handleDelete = (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this log?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!user) return;
          try {
            await deleteDoc(doc(db, "exerciseLogs", user.uid, "logs", id));
            setLogs(logs.filter((log) => log.id !== id));
          } catch (error) {
            console.error("Error deleting log:", error);
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setWorkout("");
    setRegion("");
    setLevel("");
    setExercise("");
    setSets([]);
    setSetInputs([]);
    setTag("");
    setIntensity(0);
    setEditId(null);
    setSelectedDate(dayjs().format('YYYY-MM-DD'));
    setModalVisible(false);
  };

  const handleDateChange = (event: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      setSelectedDate(dayjs(selected).format('YYYY-MM-DD'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Back />
      <FlatList
        ref={flatListRef}
        data={logs}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => {
          if (logs.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        renderItem={({ item }) => (
          <View style={[styles.logItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.text, { color: colors.text }]}>{item.date} - {item.workout}</Text>
            <Text style={[styles.text, { color: colors.text }]}>{item.region} | {item.level}</Text>
            <Text style={[styles.text, { color: colors.text }]}>{item.exercise}</Text>
  
            {Array.isArray(item.sets) ? (
              item.sets.map((s: SetDetail, idx: number) => (
                <Text key={idx} style={[styles.text, { color: colors.text }]}>
                  Set {s.set}: {s.reps} reps × {s.weight} kg
                </Text>
              ))
            ) : (
              <Text style={[styles.text, { color: colors.text }]}>Sets: {item.sets}</Text>
            )}
  
            {item.tag && <Text style={[styles.text, { color: colors.text }]}>🏷️ {item.tag}</Text>}
  
            {item.intensity && (
              <Text style={[styles.text, { color: colors.text }]}>
                Intensity: {"⭐".repeat(item.intensity)}{"☆".repeat(5 - item.intensity)}
              </Text>
            )}
  
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconButton}>
                <Feather name="edit" size={20} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconButton}>
                <AntDesign name="delete" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListHeaderComponent={
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
            <TouchableOpacity onPress={() => changeDate(-1)} style={{ padding: 10 }}>
              <Text style={{ color: colors.text, fontSize: 20 }}>⬅️</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.text, fontSize: 18, marginHorizontal: 10 }}>{selectedDate}</Text>
            <TouchableOpacity onPress={() => changeDate(1)} style={{ padding: 10 }}>
              <Text style={{ color: colors.text, fontSize: 20 }}>➡️</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.addButton, { backgroundColor: colors.highlight }]}>
            <Text style={styles.addButtonText}>+ Log Workout</Text>
          </TouchableOpacity>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
  
      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide">
  <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.datePicker, { backgroundColor: colors.card }]}>
        <Text style={[styles.text, { color: colors.text }]}>📅 {selectedDate}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dayjs(selectedDate).toDate()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
        />
      )}

      {/* Dropdowns */}
      <View style={[styles.picker, { backgroundColor: colors.card }]}>
        <Picker selectedValue={workout} onValueChange={setWorkout} dropdownIconColor={colors.text}>
          <Picker.Item label="Select Workout" value="" color={colors.text} />
          {availableWorkouts.map((item) => (
            <Picker.Item key={item} label={item} value={item} color={colors.text} />
          ))}
        </Picker>
      </View>

      <View style={[styles.picker, { backgroundColor: colors.card }]}>
        <Picker selectedValue={region} onValueChange={setRegion} enabled={!!workout} dropdownIconColor={colors.text}>
          <Picker.Item label="Select Region" value="" color={colors.text} />
          {availableRegions.map((item) => (
            <Picker.Item key={item} label={item} value={item} color={colors.text} />
          ))}
        </Picker>
      </View>

      <View style={[styles.picker, { backgroundColor: colors.card }]}>
        <Picker selectedValue={level} onValueChange={setLevel} enabled={!!region} dropdownIconColor={colors.text}>
          <Picker.Item label="Select Level" value="" color={colors.text} />
          {availableLevels.map((item) => (
            <Picker.Item key={item} label={item} value={item} color={colors.text} />
          ))}
        </Picker>
      </View>

      <View style={[styles.picker, { backgroundColor: colors.card }]}>
        <Picker selectedValue={exercise} onValueChange={setExercise} enabled={!!level} dropdownIconColor={colors.text}>
          <Picker.Item label="Select Exercise" value="" color={colors.text} />
          {availableExercises.map((item) => (
            <Picker.Item key={item} label={item} value={item} color={colors.text} />
          ))}
        </Picker>
      </View>

      {/* Sets */}
      <View style={{ marginBottom: 12 }}>
        {setInputs.map((setItem, index) => (
          <View key={index} style={{ marginBottom: 8 }}>
            <Text style={[styles.text, { color: colors.text }]}>Set {setItem.set}</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: colors.card, color: colors.text }]}
                placeholder="Reps"
                placeholderTextColor={colors.subText}
                keyboardType="numeric"
                value={setItem.reps.toString()}
                onChangeText={(text) => {
                  const updated = [...setInputs];
                  updated[index].reps = parseInt(text) || 0;
                  setSetInputs(updated);
                }}
              />
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: colors.card, color: colors.text }]}
                placeholder="Weight"
                placeholderTextColor={colors.subText}
                keyboardType="numeric"
                value={setItem.weight.toString()}
                onChangeText={(text) => {
                  const updated = [...setInputs];
                  updated[index].weight = parseFloat(text) || 0;
                  setSetInputs(updated);
                }}
              />
            </View>
          </View>
        ))}
        <TouchableOpacity
          onPress={() => setSetInputs(prev => [...prev, { set: prev.length + 1, reps: 0, weight: 0 }])}
          style={[styles.addButton, { marginTop: 8, backgroundColor: colors.highlight }]}
        >
          <Text style={styles.addButtonText}>+ Add Set</Text>
        </TouchableOpacity>
      </View>

      {/* Tag + Intensity */}
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
        placeholder="Tag (e.g., PR, Light Day)"
        placeholderTextColor={colors.subText}
        value={tag}
        onChangeText={setTag}
      />

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Text style={[styles.text, { marginRight: 8, color: colors.text }]}>Intensity:</Text>
        {[1, 2, 3, 4, 5].map((value) => (
          <TouchableOpacity key={value} onPress={() => setIntensity(value)}>
            <Text style={{ fontSize: 24 }}>{value <= intensity ? "⭐" : "☆"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Save + Cancel */}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <TouchableOpacity onPress={resetForm} style={[styles.addButton, { backgroundColor: "#aaa" }]}>
          <Text style={styles.addButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={[styles.addButton, { backgroundColor: "#4CAF50" }]}>
          <Text style={styles.addButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </View>
</Modal>

    </View>
  );
};
export default LogScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  logItem: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 2,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
  },
  iconButton: {
    marginLeft: 12,
  },
  addButton: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  datePicker: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F44336",
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  picker: {
    borderRadius: 10,
    marginBottom: 12,
  },
  scrollViewContent: {
    paddingBottom: 100, 
  },  
});
