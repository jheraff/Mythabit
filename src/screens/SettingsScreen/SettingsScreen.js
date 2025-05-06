import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';
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

  const navigateToAbout = () => {
    navigation.navigate('About');
  };

  const navigateToNotifications = () => {
    navigation.navigate('Notifications');
  };

  const navigateToPreferences = () => {
    navigation.navigate('Preferences');
  };

  const navigateToPrivacy = () => {
    navigation.navigate('Privacy');
  };

  const navigateToAvatarCustomization = () => {
    navigation.navigate('AvatarCustomizationSettings');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity 
            style={styles.option} 
            onPress={navigateToProfileSettings}
          >
            <Ionicons name="person" size={24} color="#6366f1" />
            <Text style={styles.optionText}>Profile Settings</Text>
            <Ionicons name="chevron-forward" size={24} color="#6b7280" />
          </TouchableOpacity>
{/*
          <TouchableOpacity 
            style={styles.option} 
            onPress={navigateToPreferences}
          >
            <Ionicons name="options" size={24} color="#6366f1" />
            <Text style={styles.optionText}>Preferences</Text>
            <Ionicons name="chevron-forward" size={24} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.option} 
            onPress={navigateToNotifications}
          >
            <Ionicons name="notifications" size={24} color="#6366f1" />
            <Text style={styles.optionText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={24} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.option} 
            onPress={navigateToPrivacy}
          >
            <Ionicons name="lock-closed" size={24} color="#6366f1" />
            <Text style={styles.optionText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={24} color="#6b7280" />
          </TouchableOpacity>
*/}
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

          <TouchableOpacity 
            style={styles.option} 
            onPress={navigateToAvatarCustomization}
          >
            <Ionicons name="list" size={24} color="#6366f1" />
            <Text style={styles.optionText}>Avatar Customization</Text>
            <Ionicons name="chevron-forward" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <TouchableOpacity 
            style={styles.option} 
            onPress={navigateToAbout}
          >
            <Ionicons name="information-circle" size={24} color="#6366f1" />
            <Text style={styles.optionText}>About Mythabit</Text>
            <Ionicons name="chevron-forward" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logout</Text>
          <TouchableOpacity 
            style={styles.option} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={24} color="#ef4444" />
            <Text style={[styles.optionText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    marginBottom: 24,
    marginTop: 8,
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
    borderColor: '#e5e7eb',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    color: '#1f2937',
  },
  logoutText: {
    color: '#ef4444',
  },
  bottomSpace: {
    height: 50,
  }
});

export default SettingsScreen;