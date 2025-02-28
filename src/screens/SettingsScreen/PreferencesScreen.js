import React, { useState } from 'react';
import { View, Text, Switch, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PreferencesScreen = ({ navigation }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [autoSaveInterval, setAutoSaveInterval] = useState('5 minutes');
  const [fontSize, setFontSize] = useState('Medium');
  const [language, setLanguage] = useState('English');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </Pressable>
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="moon" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Dark Mode</Text>
                <Text style={styles.optionDescription}>Use a darker color scheme</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={darkMode ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="contract" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Compact View</Text>
                <Text style={styles.optionDescription}>Show more content with less spacing</Text>
              </View>
            </View>
            <Switch
              value={compactView}
              onValueChange={setCompactView}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={compactView ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="contrast" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>High Contrast</Text>
                <Text style={styles.optionDescription}>Increase contrast for better visibility</Text>
              </View>
            </View>
            <Switch
              value={highContrastMode}
              onValueChange={setHighContrastMode}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={highContrastMode ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          <Pressable style={styles.selectionOption}>
            <View style={styles.optionInfo}>
              <Ionicons name="text" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Font Size</Text>
                <Text style={styles.optionDescription}>Adjust text size throughout the app</Text>
              </View>
            </View>
            <View style={styles.selectionValue}>
              <Text style={styles.selectionText}>{fontSize}</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Behavior</Text>
          
          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="sync" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Auto-Sync</Text>
                <Text style={styles.optionDescription}>Automatically sync data in background</Text>
              </View>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={autoSync ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          <View style={styles.optionContainer}>
            <View style={styles.optionInfo}>
              <Ionicons name="aperture" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Animations</Text>
                <Text style={styles.optionDescription}>Enable interface animations</Text>
              </View>
            </View>
            <Switch
              value={animationsEnabled}
              onValueChange={setAnimationsEnabled}
              trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
              thumbColor={animationsEnabled ? '#6366f1' : '#f3f4f6'}
            />
          </View>

          <Pressable style={styles.selectionOption}>
            <View style={styles.optionInfo}>
              <Ionicons name="save" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Auto-Save Interval</Text>
                <Text style={styles.optionDescription}>How often to save your work</Text>
              </View>
            </View>
            <View style={styles.selectionValue}>
              <Text style={styles.selectionText}>{autoSaveInterval}</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localization</Text>
          
          <Pressable style={styles.selectionOption}>
            <View style={styles.optionInfo}>
              <Ionicons name="language" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Language</Text>
                <Text style={styles.optionDescription}>Change the app language</Text>
              </View>
            </View>
            <View style={styles.selectionValue}>
              <Text style={styles.selectionText}>{language}</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          
          <Pressable style={styles.actionButton}>
            <View style={styles.optionInfo}>
              <Ionicons name="trash" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Clear Cache</Text>
                <Text style={styles.optionDescription}>Free up space by clearing temporary files</Text>
              </View>
            </View>
          </Pressable>

          <Pressable style={styles.actionButton}>
            <View style={styles.optionInfo}>
              <Ionicons name="cloud-download" size={22} color="#6366f1" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Download All Data</Text>
                <Text style={styles.optionDescription}>Download a backup of your information</Text>
              </View>
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Settings</Text>
          
          <Pressable style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset All Preferences</Text>
          </Pressable>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectionOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectionValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 14,
    color: '#6366f1',
    marginRight: 4,
  },
  actionButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resetButton: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    color: '#ef4444',
    fontWeight: '500',
  },
  bottomSpace: {
    height: 40,
  }
});

export default PreferencesScreen;