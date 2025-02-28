import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

import fitnessTasks from '../../data/fitness_tasks.json';
import careerTasks from '../../data/career_tasks.json';
import healthTasks from '../../data/health_tasks.json';
import creativityTasks from '../../data/creativity_tasks.json';
import choresTasks from '../../data/chores_tasks.json';
import mindTasks from '../../data/mind_tasks.json';

const TaskCustomizationSettingsScreen = ({ navigation }) => {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const taskTypes = ['fitness', 'career', 'health', 'creativity', 'chores', 'mind'];

  const taskTypeData = {
    fitness: fitnessTasks.tasks,
    career: careerTasks.tasks,
    health: healthTasks.tasks,
    creativity: creativityTasks.tasks,
    chores: choresTasks.tasks,
    mind: mindTasks.tasks
  };

  useEffect(() => {
    loadCurrentPreferences();
  }, []);

  const loadCurrentPreferences = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userPrefsDoc = await getDoc(doc(db, 'userPreferences', userId));
      if (userPrefsDoc.exists()) {
        const prefs = userPrefsDoc.data();
        setSelectedTypes(prefs.taskTypes || []);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load your preferences');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskType = (type) => {
    setSelectedTypes(prevSelected =>
      prevSelected.includes(type)
        ? prevSelected.filter(t => t !== type)
        : [...prevSelected, type]
    );
  };

  const getSelectedTasks = () => {
    return selectedTypes.reduce((acc, type) => {
      return [...acc, ...taskTypeData[type]];
    }, []);
  };

  const savePreferences = async () => {
    if (selectedTypes.length === 0) {
      Alert.alert('Error', 'Please select at least one task type');
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const selectedTasks = getSelectedTasks();

      // Update preferences
      await setDoc(doc(db, 'userPreferences', userId), {
        taskTypes: selectedTypes,
        availableTasks: selectedTasks,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      // Update user document
      await setDoc(doc(db, 'users', userId), {
        selectedTaskTypes: selectedTypes,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      Alert.alert(
        'Success',
        'Your task preferences have been updated',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save your preferences');
    }
  };

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <Text style={styles.loadingText}>Loading your preferences...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Preferences</Text>
      </View>

      <ScrollView style={styles.container}>
        <Text style={styles.title}>Customize your task types:</Text>
        <Text style={styles.subtitle}>Select the types of tasks you want to focus on</Text>

        <View style={styles.typesContainer}>
          {taskTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                selectedTypes.includes(type) && styles.selectedType
              ]}
              onPress={() => toggleTaskType(type)}
            >
              <Text style={[
                styles.typeText,
                selectedTypes.includes(type) && styles.selectedTypeText
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
                <Text style={[
                  styles.taskCount,
                  selectedTypes.includes(type) && styles.selectedTaskCount
                ]}>
                  {` (${taskTypeData[type].length})`}
                </Text>
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            selectedTypes.length === 0 && styles.disabledButton
          ]}
          onPress={savePreferences}
          disabled={selectedTypes.length === 0}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: '45%',
    alignItems: 'center',
  },
  selectedType: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTypeText: {
    color: '#fff',
  },
  taskCount: {
    fontSize: 14,
    color: '#666',
  },
  selectedTaskCount: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TaskCustomizationSettingsScreen;