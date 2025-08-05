import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as LocalAuthentication from 'expo-local-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import Checkbox from 'expo-checkbox';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const redirectUri = makeRedirectUri({ native: 'fitlog-app://' });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '743430946246-6kvv5ngjvu7o644ekmbin0nc4828ajd1.apps.googleusercontent.com',
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => navigation.navigate('index' as never))
        .catch((error) => Alert.alert('Google Auth Error', error.message));
    }
  }, [response]);

  const validatePassword = (pw: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/.test(pw);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match.');
        return;
      }
      if (!validatePassword(password)) {
        Alert.alert('Error', 'Password must be 8+ chars with at least 1 uppercase, 1 lowercase, and 1 special character.');
        return;
      }
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigation.navigate('index' as never);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert('Success', 'Account created! You can now log in.');
        setIsLogin(true);
      }
    } catch (error: any) {
      Alert.alert('Auth Error', error.message);
    }
  };

  const handleBiometricLogin = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || supported.length === 0 || !enrolled) {
      Alert.alert('Biometric Login not supported');
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login with Biometrics',
    });

    if (result.success) {
      navigation.navigate('index' as never);
    } else {
      Alert.alert('Authentication failed');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <Text style={styles.appTitle}>FitVide</Text>
        <Text style={styles.tagline}>Your Personal Workout Logger</Text>
        <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />

        {!isLogin && (
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
          />
        )}

        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={{ color: '#aaa', marginBottom: 10 }}>
            {showPassword ? 'Hide Password' : 'Show Password'}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Checkbox value={rememberMe} onValueChange={setRememberMe} color={rememberMe ? '#6200EE' : undefined} />
          <Text style={{ color: '#aaa', marginLeft: 8 }}>Remember Me</Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAuth}>
          <Text style={styles.addButtonText}>{isLogin ? 'Login' : 'Register'}</Text>
        </TouchableOpacity>

        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>OR</Text>
          <View style={styles.separatorLine} />
        </View>

        <TouchableOpacity style={styles.googleButton} disabled={!request} onPress={() => promptAsync()}>
          <Text style={styles.addButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {isLogin && (
        <TouchableOpacity style={styles.googleButton} onPress={handleBiometricLogin}>
            <Text style={styles.addButtonText}>Login with Biometrics</Text>
        </TouchableOpacity>
        )}


        <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: '#aaa' }}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: '#aaa' }}>
            {isLogin ? 'Don’t have an account? Register' : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version: 1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: { backgroundColor: "#2C2C2C", color: "#fff", padding: 12, borderRadius: 10, marginBottom: 12 },
  addButton: { backgroundColor: "#6200EE", padding: 12, borderRadius: 10, alignItems: "center" },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  container: { flex: 1, padding: 16, backgroundColor: "#121212" },
  appTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
  tagline: { fontSize: 16, color: '#aaa', textAlign: 'center', marginBottom: 24 },
  versionText: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 12 },
  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  separatorLine: { flex: 1, height: 1, backgroundColor: '#333' },
  separatorText: { color: '#aaa', marginHorizontal: 12 },
  googleButton: { backgroundColor: '#4285F4', padding: 12, borderRadius: 10, alignItems: 'center' },
});
