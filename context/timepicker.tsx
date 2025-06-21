import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";

type TimeValue = {
  hour: string;
  minute: string;
  amPm: "AM" | "PM";
};

type SleepTimePickerProps = {
  label: string;
  value: TimeValue;
  onChange: (value: TimeValue) => void;
};

const sanitizeHour = (text: string) => {
  const onlyNums = text.replace(/[^0-9]/g, "");
  if (onlyNums === "") return "";
  const num = parseInt(onlyNums, 10);
  if (num >= 1 && num <= 12) return num.toString();
  return text;
};

const sanitizeMinute = (text: string) => {
  const onlyNums = text.replace(/[^0-9]/g, "");
  if (onlyNums === "") return "";
  const num = parseInt(onlyNums, 10);
  if (num >= 0 && num <= 59) return num.toString();
  return text;
};

export default function SleepTimePicker({
  label,
  value,
  onChange,
}: SleepTimePickerProps) {
  const [hour, setHour] = useState<string>(value.hour);
  const [minute, setMinute] = useState<string>(value.minute);
  const [amPm, setAmPm] = useState<"AM" | "PM">(value.amPm || "AM");

  useEffect(() => {
    onChange({ hour, minute, amPm });
  }, [hour, minute, amPm]);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>

      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        maxLength={2}
        value={hour}
        onChangeText={(text) => setHour(sanitizeHour(text))}
        onBlur={() => {
          const num = parseInt(hour, 10);
          if (!isNaN(num) && num >= 1 && num <= 12) {
            setHour(num.toString().padStart(2, "0"));
          }
        }}
      />

      <Text style={styles.colon}>:</Text>

      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        maxLength={2}
        value={minute}
        onChangeText={(text) => setMinute(sanitizeMinute(text))}
        onBlur={() => {
          const num = parseInt(minute, 10);
          if (!isNaN(num) && num >= 0 && num <= 59) {
            setMinute(num.toString().padStart(2, "0"));
          }
        }}
      />

      <TouchableOpacity
        onPress={() => setAmPm(amPm === "AM" ? "PM" : "AM")}
        style={styles.amPmBtn}
      >
        <Text style={styles.amPmText}>{amPm}</Text>
      </TouchableOpacity>
    </View>
  );
}

type Style = {
  row: ViewStyle;
  label: TextStyle;
  input: TextStyle;
  colon: TextStyle;
  amPmBtn: ViewStyle;
  amPmText: TextStyle;
};

const styles = StyleSheet.create<Style>({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    width: 100,
    color: "#bbb",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    width: 50,
    textAlign: "center",
    borderRadius: 6,
    backgroundColor: "#fff",
    color: "#000",
  },
  colon: {
    fontSize: 20,
    marginHorizontal: 6,
    color: "#000",
  },
  amPmBtn: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: "#eee",
    borderRadius: 6,
  },
  amPmText: {
    fontSize: 16,
    color: "#000",
  },
});
