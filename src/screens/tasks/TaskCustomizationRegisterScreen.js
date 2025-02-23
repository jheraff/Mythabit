import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet
} from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

import fitnessTasks from '../../data/fitness_tasks.json';
import careerTasks from '../../data/career_tasks.json';
import healthTasks from '../../data/health_tasks.json';
import creativityTasks from '../../data/creativity_tasks.json';
import choresTasks from '../../data/chores_tasks.json';
import mindTasks from '../../data/mind_tasks.json';

const TaskCustomizationRegisterScreen = ({ navigation }) => {
    const [selectedTypes, setSelectedTypes] = useState([]);
    const taskTypes = ['fitness', 'career', 'health', 'creativity', 'chores', 'mind'];

    const taskTypeData = {
        fitness: fitnessTasks.tasks,
        career: careerTasks.tasks,
        health: healthTasks.tasks,
        creativity: creativityTasks.tasks,
        chores: choresTasks.tasks,
        mind: mindTasks.tasks
    };

    const initializeUserTasks = async (userId) => {
        try {
            const allTasks = [
                ...fitnessTasks.tasks,
                ...careerTasks.tasks,
                ...healthTasks.tasks,
                ...creativityTasks.tasks,
                ...choresTasks.tasks,
                ...mindTasks.tasks
            ];

            const userTasksRef = doc(db, 'userTasks', userId);
            await setDoc(userTasksRef, {
                availableTasks: allTasks,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('Error initializing tasks:', error);
            throw error;
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
            alert('Please select at least one task type');
            return;
        }

        try {
            const userId = auth.currentUser.uid;
            const selectedTasks = getSelectedTasks();

            // Initialize tasks first
            await initializeUserTasks(userId);

            // Save preferences
            await setDoc(doc(db, 'userPreferences', userId), {
                taskTypes: selectedTypes,
                setupCompleted: true,
                availableTasks: selectedTasks,
                lastUpdated: new Date().toISOString()
            });

            // Mark customization as complete in user document
            await setDoc(doc(db, 'users', userId), {
                customizationComplete: true,
                selectedTaskTypes: selectedTypes,
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            // Let App.js handle the navigation by updating the user state
            // Don't try to navigate manually
            return;

        } catch (error) {
            console.error('Error saving preferences:', error);
            alert('Error saving preferences');
        }
    };

    return (
        <View style={styles.mainContainer}>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Welcome to MYTHABIT!</Text>
                <Text style={styles.subtitle}>Select your preferred task types to get started:</Text>

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
                                <Text style={styles.taskCount}>
                                    {` (${taskTypeData[type].length} tasks)`}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        selectedTypes.length === 0 && styles.disabledButton
                    ]}
                    onPress={savePreferences}
                    disabled={selectedTypes.length === 0}
                >
                    <Text style={styles.continueText}>Start Your Journey</Text>
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
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        paddingTop: 48,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
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
    continueButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    continueText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default TaskCustomizationRegisterScreen;