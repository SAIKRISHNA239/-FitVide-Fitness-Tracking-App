import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

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

    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Navigation will be handled by AuthContext
        router.replace('/');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        Alert.alert('Success', 'Account created! Please check your email to verify your account.');
        setIsLogin(true);
      }
    } catch (error: any) {
      Alert.alert('Auth Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // Navigation will be handled by AuthContext when session is established
    } catch (error: any) {
      Alert.alert('Google Sign-In Error', error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      // Check if biometrics are available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || supported.length === 0 || !enrolled) {
        Alert.alert(
          'Biometric Login Unavailable',
          'Biometric authentication is not available on this device. Please use email/password or Google sign-in.'
        );
        return;
      }

      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to login',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Check if there's an existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Session exists, navigate to home
          Alert.alert('Success', 'Biometrics verified!');
          router.replace('/');
        } else {
          // No session, prompt to sign in normally
          Alert.alert(
            'No Active Session',
            'Please sign in with email/password or Google first. Biometric login will be available for future sessions.'
          );
        }
      } else {
        if (result.error !== 'UserCancel') {
          Alert.alert('Authentication Failed', 'Biometric authentication was not successful.');
        }
      }
    } catch (error: any) {
      console.error('Biometric login error:', error);
      Alert.alert('Error', 'An error occurred during biometric authentication.');
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first.');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'fitlog-app://reset-password',
      });

      if (error) throw error;

      Alert.alert('Success', 'Password reset email sent! Check your inbox.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
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
          editable={!loading}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!loading}
        />

        {!isLogin && (
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
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

        <TouchableOpacity 
          style={[styles.addButton, loading && styles.buttonDisabled]} 
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>{loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}</Text>
        </TouchableOpacity>

        {isLogin && (
          <>
            {/* Google Sign-In Button */}
            <TouchableOpacity 
              style={[styles.googleButton, loading && styles.buttonDisabled]} 
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.addButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Biometric Login Button */}
            <TouchableOpacity 
              style={[styles.biometricButton, (loading || biometricLoading) && styles.buttonDisabled]} 
              onPress={handleBiometricLogin}
              disabled={loading || biometricLoading}
            >
              <Ionicons 
                name={Platform.OS === 'ios' ? 'finger-print' : 'finger-print-outline'} 
                size={20} 
                color="#fff" 
                style={{ marginRight: 8 }} 
              />
              <Text style={styles.addButtonText}>
                {biometricLoading ? 'Authenticating...' : `Login with ${Platform.OS === 'ios' ? 'FaceID/TouchID' : 'Biometrics'}`}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {isLogin && (
          <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }} onPress={handleForgotPassword}>
            <Text style={{ color: '#aaa' }}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: '#aaa' }}>
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
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
  buttonDisabled: { opacity: 0.6 },
  container: { flex: 1, padding: 16, backgroundColor: "#121212" },
  appTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
  tagline: { fontSize: 16, color: '#aaa', textAlign: 'center', marginBottom: 24 },
  versionText: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 12 },
  googleButton: { 
    backgroundColor: '#4285F4', 
    padding: 12, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  biometricButton: { 
    backgroundColor: '#34C759', 
    padding: 12, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
