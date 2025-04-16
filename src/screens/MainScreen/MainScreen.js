import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Platform } from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const MainScreen = () => {
  const navigation = useNavigation();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStart = () => {
    if (user) {
      navigation.replace('MainTab');
    } else {
      navigation.replace('Login');
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handleStart}>
      {/* Logo Placeholder */}
      <View style={styles.logoContainer}>
        {/* Replace this View with <Image source={require('your-path')} style={styles.logo} /> when ready */}
        <View style={styles.logoPlaceholder} />
      </View>

      {/* Pixel 3D Title */}
      <Text style={styles.shadowText}>Mythabit</Text>

      {/* Subtext */}
      <Text style={styles.subtitle}>Tap anywhere to start</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#333',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  shadowText: {
    fontSize: 48,
    color: '#a855f7', // Purple base
    textShadowColor: '#f97316', // Orange 3D glow
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 2,
    fontFamily: Platform.select({
      ios: 'Courier', // iOS monospace alternative
      android: 'monospace',
    }),
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: 30,
    fontSize: 16,
    color: '#ccc',
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#aaa',
  },
});

export default MainScreen;