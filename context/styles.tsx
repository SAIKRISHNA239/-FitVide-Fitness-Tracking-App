import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

type StyleType = {
  container: ViewStyle;
  header: TextStyle;
  section: TextStyle;
  input: TextStyle;
  datePicker: ViewStyle;
  label: TextStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  summaryBox: ViewStyle;
  summaryText: TextStyle;
};
const baseStyles = {
    container: {
      padding: 20,
      paddingBottom: 100,
    },
    header: {
      fontSize: 26,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
    },
    section: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 20,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 10,
      marginBottom: 12,
    },
    datePicker: {
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      marginBottom: 10,
    },
    label: {
      fontSize: 16,
    },
    button: {
      marginTop: 20,
      padding: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    buttonText: {
      fontWeight: '700', // ✅ Make sure this exists
    },
    summaryBox: {
      marginTop: 20,
      borderRadius: 10,
      padding: 12,
    },
    summaryText: {
      fontSize: 16,
      fontStyle: 'italic', // ✅ Make sure this exists
    },
  };
  
  const darkStyles: StyleType = StyleSheet.create({
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
      backgroundColor: '#1f1f1f',
      borderColor: '#444',
      color: '#fff',
    },
    datePicker: {
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      marginBottom: 10,
      borderColor: '#444',
      backgroundColor: '#1f1f1f',
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
    summaryBox: {
      marginTop: 20,
      borderRadius: 10,
      padding: 12,
      backgroundColor: '#2e2e2e',
    },
    summaryText: {
      fontSize: 16,
      fontStyle: 'italic',
      color: '#bb86fc',
    },
  });

  export { darkStyles };
