import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getAuth } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = ({ navigation }) => {
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error(error);
    }
  };

  const navigateToTaskCustomization = () => {
    navigation.navigate('TaskCustomizationSettings');
  };

  const navigateToProfileSettings = () => {
    navigation.navigate('ProfileSettings');
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.option} 
          onPress={navigateToProfileSettings}
        >
          <Ionicons name="person" size={24} color="#6366f1" />
          <Text style={styles.optionText}>Profile Settings</Text>
          <Ionicons name="chevron-forward" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <TouchableOpacity 
          style={styles.option} 
          onPress={navigateToTaskCustomization}
        >
          <Ionicons name="list" size={24} color="#6366f1" />
          <Text style={styles.optionText}>Task Preferences</Text>
          <Ionicons name="chevron-forward" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity 
          style={[styles.option, styles.logoutOption]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={24} color="#ef4444" />
          <Text style={[styles.optionText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    borderTopWidth: 45,
    borderTopColor: 'black'
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    color: '#1f2937',
  },
  logoutOption: {
    marginTop: 8,
  },
  logoutText: {
    color: '#ef4444',
  },
});

export default SettingsScreen;