// styles/nutritionstyle.ts
import { StyleSheet } from "react-native";

export const getStyles = (isDarkMode: boolean) => {
  const colors = {
    background: "#121212",
    card: "#1E1E1E",
    input: "#2C2C2C",
    text: "#ffffff",
    subText: "#aaa",
    icon: "#0A84FF",
    save: "#4CAF50",
    cancel: "#F44336",
    add: "#6200EE",
    border: isDarkMode ? "#333" : "#ccc",
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 24,
      color: colors.text,
      fontWeight: "bold",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    mealSection: {
      marginVertical: 10,
    },
    mealButton: {
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 10,
    },
    mealText: {
      fontSize: 18,
      color: colors.text,
    },
    mealLogBox: {
      marginTop: 10,
    },
    logItem: {
      backgroundColor: colors.card,
      padding: 12,
      marginBottom: 10,
      borderRadius: 10,
    },
    logItemText: {
      color: colors.text,
      fontSize: 16,
      marginBottom: 2,
    },
    subText: {
      color: colors.subText,
      fontSize: 14,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 6,
    },
    iconButton: {
      marginLeft: 12,
    },
    input: {
      backgroundColor: colors.input,
      color: colors.text,
      padding: 12,
      borderRadius: 10,
      marginTop: 8,
    },
    button: {
      backgroundColor: colors.save,
      padding: 12,
      borderRadius: 10,
      marginTop: 10,
      alignItems: "center",
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
    },
    summaryBox: {
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 10,
      marginVertical: 10,
    },
    totalText: {
      fontWeight: "bold",
      color: colors.text,
      marginTop: 8,
    },
    scrollViewContent: {
      paddingBottom: 100,
    },
  });

  return { styles, colors };
};
