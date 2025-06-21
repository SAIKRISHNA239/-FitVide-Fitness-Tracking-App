import React, { useState, useEffect } from "react";
import BottomNavBar from "../app/BottomNavBar";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert
} from "react-native";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useTheme } from "../context/ThemeContext";
import { app } from "./firebase";

const db = getFirestore(app);
type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export default function ProfileScreen() {
  const { isDarkMode } = useTheme();
  const stylesSheet = darkStyles;
  const auth = getAuth();
  const user = auth.currentUser;

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState("moderate");
  const [goal, setGoal] = useState("maintain");
  const [isEditing, setIsEditing] = useState(false);

  const [macroTargets, setMacroTargets] = useState<Macros | null>(null);
  const [customMacroTargets, setCustomMacroTargets] = useState<Macros | null>(null);
  const [customMode, setCustomMode] = useState(false);

  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFats, setCustomFats] = useState("");


  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    const profileRef = doc(db, "users", user.uid);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      setAge(data.age);
      setGender(data.gender);
      setHeight(data.height);
      setWeight(data.weight);
      setActivity(data.activity);
      setGoal(data.goal);
      setMacroTargets(data.macroTargets || null);
      setCustomMacroTargets(data.customMacroTargets || null);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const calculateAndSave = async () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseInt(age);
    if (isNaN(a) || isNaN(h) || isNaN(w)) {
      return Alert.alert("Invalid input", "Please enter valid numeric values.");
    }

    const bmr = gender === "male"
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;

    const activityMultiplier =
      activity === "light" ? 1.375 :
      activity === "moderate" ? 1.55 :
      activity === "active" ? 1.725 : 1.2;

    let calories = bmr * activityMultiplier;
    if (goal === "cut") calories -= 300;
    else if (goal === "bulk") calories += 300;

    const macros = {
      calories: Math.round(calories),
      protein: Math.round(w * 2.2),
      fats: Math.round((calories * 0.25) / 9),
      carbs: Math.round((calories - w * 2.2 * 4 - calories * 0.25) / 4),
    };

    const data = {
      age, gender, height, weight, activity, goal,
      macroTargets: macros,
    };
    if (user) await setDoc(doc(db, "users", user.uid), data);

    setMacroTargets(macros);
    setIsEditing(false);
  };

  const saveCustomMacros = async () => {
    const custom = {
      calories: parseInt(customCalories),
      protein: parseInt(customProtein),
      carbs: parseInt(customCarbs),
      fats: parseInt(customFats),
    };
    if (user) await setDoc(doc(db, "users", user.uid), {
      customMacroTargets: custom
    }, { merge: true });

    setCustomMacroTargets(custom);
    setCustomMode(false);
  };

  const deleteProfile = async () => {
    if (user) await deleteDoc(doc(db, "users", user.uid));
    setAge(""); setHeight(""); setWeight("");
    setMacroTargets(null); setCustomMacroTargets(null);
    setIsEditing(true);
  };

  return (
    <View style={[{ flex: 1 }, { backgroundColor: stylesSheet.container.backgroundColor }]}>
    <ScrollView contentContainerStyle={[stylesSheet.container, { paddingBottom: 100 }]}>
      <Text style={stylesSheet.title}>👤 Profile</Text>

      {!isEditing && (
        <>
          <View style={stylesSheet.summaryBox}>
            <Text style={stylesSheet.label}>Your Info</Text>
            <Text style={stylesSheet.label}>Gender: {gender}</Text>
            <Text style={stylesSheet.label}>Age: {age}</Text>
            <Text style={stylesSheet.label}>Height: {height} cm</Text>
            <Text style={stylesSheet.label}>Weight: {weight} kg</Text>
            <Text style={stylesSheet.label}>Activity: {activity}</Text>
            <Text style={stylesSheet.label}>Goal: {goal}</Text>
          </View>

          {macroTargets && (
            <View style={stylesSheet.summaryBox}>
              <Text style={stylesSheet.label}>🎯 Daily Macro Targets</Text>
              <Text style={stylesSheet.label}>Calories: {macroTargets.calories} kcal</Text>
              <Text style={stylesSheet.label}>Protein: {macroTargets.protein} g</Text>
              <Text style={stylesSheet.label}>Carbs: {macroTargets.carbs} g</Text>
              <Text style={stylesSheet.label}>Fats: {macroTargets.fats} g</Text>
            </View>
          )}

          {customMacroTargets && !customMode && (
            <View style={stylesSheet.summaryBox}>
              <Text style={stylesSheet.label}>✨ Custom Macro Targets</Text>
              <Text style={stylesSheet.label}>Calories: {customMacroTargets.calories} kcal</Text>
              <Text style={stylesSheet.label}>Protein: {customMacroTargets.protein} g</Text>
              <Text style={stylesSheet.label}>Carbs: {customMacroTargets.carbs} g</Text>
              <Text style={stylesSheet.label}>Fats: {customMacroTargets.fats} g</Text>
              <View style={stylesSheet.row}>
                <TouchableOpacity style={[stylesSheet.button, { flex: 1 }]} onPress={() => {
                  setCustomCalories(customMacroTargets.calories.toString());
                  setCustomProtein(customMacroTargets.protein.toString());
                  setCustomCarbs(customMacroTargets.carbs.toString());
                  setCustomFats(customMacroTargets.fats.toString());
                  setCustomMode(true);
                }}>
                  <Text style={stylesSheet.buttonText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[stylesSheet.button, { flex: 1, backgroundColor: "#ff4d4f" }]} onPress={async () => {
                  if (user) {
                    await setDoc(doc(db, "users", user.uid), {
                      customMacroTargets: null,
                    }, { merge: true });
                  }
                  setCustomMacroTargets(null);
                }}>
                  <Text style={stylesSheet.buttonText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!customMacroTargets && !customMode && (
            <TouchableOpacity style={stylesSheet.button} onPress={() => setCustomMode(true)}>
              <Text style={stylesSheet.buttonText}>➕ Add Custom Macros</Text>
            </TouchableOpacity>
          )}
          {customMode && (
            <View style={stylesSheet.summaryBox}>
              <Text style={stylesSheet.label}>✨ Set Custom Macros</Text>

              <TextInput
                style={stylesSheet.input}
                placeholder="Calories"
                keyboardType="numeric"
                value={customCalories}
                onChangeText={(val) => {
                  setCustomCalories(val);
                  const cals = parseInt(val) || 0;
                  setCustomProtein(Math.round((cals * 0.3) / 4).toString());
                  setCustomFats(Math.round((cals * 0.25) / 9).toString());
                  setCustomCarbs(Math.round((cals * 0.45) / 4).toString());
                }}
              />
              <TextInput
                style={stylesSheet.input}
                placeholder="Protein (g)"
                keyboardType="numeric"
                value={customProtein}
                onChangeText={(val) => {
                  setCustomProtein(val);
                  const p = parseInt(val) || 0;
                  const f = parseInt(customFats) || 0;
                  const c = parseInt(customCarbs) || 0;
                  const calories = (p * 4) + (c * 4) + (f * 9);
                  setCustomCalories(Math.round(calories).toString());
                }}
              />
              <TextInput
                style={stylesSheet.input}
                placeholder="Carbs (g)"
                keyboardType="numeric"
                value={customCarbs}
                onChangeText={(val) => {
                  setCustomCarbs(val);
                  const p = parseInt(customProtein) || 0;
                  const f = parseInt(customFats) || 0;
                  const c = parseInt(val) || 0;
                  const calories = (p * 4) + (c * 4) + (f * 9);
                  setCustomCalories(Math.round(calories).toString());
                }}
              />
              <TextInput
                style={stylesSheet.input}
                placeholder="Fats (g)"
                keyboardType="numeric"
                value={customFats}
                onChangeText={(val) => {
                  setCustomFats(val);
                  const p = parseInt(customProtein) || 0;
                  const f = parseInt(val) || 0;
                  const c = parseInt(customCarbs) || 0;
                  const calories = (p * 4) + (c * 4) + (f * 9);
                  setCustomCalories(Math.round(calories).toString());
                }}
              />

              <TouchableOpacity style={stylesSheet.button} onPress={saveCustomMacros}>
                <Text style={stylesSheet.buttonText}>💾 Save Custom Macros</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={stylesSheet.row}>
            <TouchableOpacity style={[stylesSheet.button, { flex: 1 }]} onPress={() => setIsEditing(true)}>
              <Text style={stylesSheet.buttonText}>✏️ Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[stylesSheet.button, { flex: 1, backgroundColor: "#ff4d4f" }]} onPress={deleteProfile}>
              <Text style={stylesSheet.buttonText}>🗑️ Delete All</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {isEditing && (
        <>
          <TextInput style={stylesSheet.input} placeholder="Age" keyboardType="numeric" value={age} onChangeText={setAge} />
          <TextInput style={stylesSheet.input} placeholder="Height (cm)" keyboardType="numeric" value={height} onChangeText={setHeight} />
          <TextInput style={stylesSheet.input} placeholder="Weight (kg)" keyboardType="numeric" value={weight} onChangeText={setWeight} />

          <Text style={stylesSheet.label}>Gender</Text>
          <View style={stylesSheet.row}>
            <TouchableOpacity onPress={() => setGender("male")} style={[stylesSheet.chip, gender === "male" && stylesSheet.chipActive]}>
              <Text style={stylesSheet.chipText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGender("female")} style={[stylesSheet.chip, gender === "female" && stylesSheet.chipActive]}>
              <Text style={stylesSheet.chipText}>Female</Text>
            </TouchableOpacity>
          </View>

          <Text style={stylesSheet.label}>Activity</Text>
          <View style={stylesSheet.row}>
            <TouchableOpacity onPress={() => setActivity("light")} style={[stylesSheet.chip, activity === "light" && stylesSheet.chipActive]}>
              <Text style={stylesSheet.chipText}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActivity("moderate")} style={[stylesSheet.chip, activity === "moderate" && stylesSheet.chipActive]}>
              <Text style={stylesSheet.chipText}>Moderate</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActivity("active")} style={[stylesSheet.chip, activity === "active" && stylesSheet.chipActive]}>
              <Text style={stylesSheet.chipText}>Active</Text>
            </TouchableOpacity>
          </View>

          <Text style={stylesSheet.label}>Goal</Text>
          <View style={stylesSheet.row}>
            <TouchableOpacity onPress={() => setGoal("cut")} style={[stylesSheet.chip, goal === "cut" && stylesSheet.chipActive]}>
              <Text style={stylesSheet.chipText}>Fat Loss</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGoal("maintain")} style={[stylesSheet.chip, goal === "maintain" && stylesSheet.chipActive]}>
              <Text style={stylesSheet.chipText}>Maintain</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGoal("bulk")} style={[stylesSheet.chip, goal === "bulk" && stylesSheet.chipActive]}>
              <Text style={stylesSheet.chipText}>Muscle Gain</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={stylesSheet.button} onPress={calculateAndSave}>
            <Text style={stylesSheet.buttonText}>💾 Save Profile</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
    <BottomNavBar activeTab="profile" />
    </View>
  );
}
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#bb86fc',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ddd',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#bb86fc',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#121212',
    fontWeight: '700',
    fontSize: 16,
  },
  summaryBox: {
    backgroundColor: '#1f1f1f',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2c2c2c',
    borderColor: '#444',
    borderWidth: 1,
    marginHorizontal: 4,
  },
  chipActive: {
    backgroundColor: '#bb86fc',
    borderColor: '#bb86fc',
  },
  chipText: {
    color: '#fff',
    fontWeight: '600',
  },
});
