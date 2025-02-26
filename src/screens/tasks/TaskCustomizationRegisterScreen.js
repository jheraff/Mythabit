import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert
} from 'react-native';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import LoadingModal from '../../utils/LoadingModal';

import fitnessTasks from '../../data/fitness_tasks.json';
import careerTasks from '../../data/career_tasks.json';
import healthTasks from '../../data/health_tasks.json';
import creativityTasks from '../../data/creativity_tasks.json';
import choresTasks from '../../data/chores_tasks.json';
import mindTasks from '../../data/mind_tasks.json';

const TaskCustomizationRegisterScreen = ({ navigation, route }) => {
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const taskTypes = ['fitness', 'career', 'health', 'creativity', 'chores', 'mind'];
    const { userId } = route.params || { userId: auth.currentUser?.uid };

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

    // Update customization status function
    const updateCustomizationStatus = async (userId, field, value) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                [field]: value,
                lastUpdated: new Date().toISOString()
            });
            console.log(`${field} updated for user:`, userId);
            return true;
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            throw error;
        }
    };

    const savePreferences = async () => {
        if (selectedTypes.length === 0) {
            Alert.alert('Selection Required', 'Please select at least one task type');
            return;
        }

        setIsLoading(true);

        try {
            const currentUserId = userId || auth.currentUser.uid;
            
            if (!currentUserId) {
                throw new Error('No user ID available');
            }
            
            console.log('Saving preferences for user ID:', currentUserId);
            const selectedTasks = getSelectedTasks();

            // Initialize tasks first
            await initializeUserTasks(currentUserId);
            console.log('User tasks initialized');

            // Save preferences
            await setDoc(doc(db, 'userPreferences', currentUserId), {
                taskTypes: selectedTypes,
                setupCompleted: true,
                availableTasks: selectedTasks,
                lastUpdated: new Date().toISOString()
            });
            console.log('User preferences saved');

            // Mark task customization as complete
            await updateCustomizationStatus(currentUserId, 'taskCustomizationComplete', true);
            console.log('Task customization marked as complete');

            // Update selected task types
            await updateDoc(doc(db, 'users', currentUserId), {
                selectedTaskTypes: selectedTypes,
            });
            console.log('Selected task types updated');

            Alert.alert(
                'Setup Complete',
                'Your preferences have been saved!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Navigate home or wait for App.js to handle navigation
                            // Refresh the auth state by setting a temporary flag
                            auth.currentUser.getIdToken(true).then(() => {
                                console.log('User token refreshed, waiting for auth state change');
                            });
                        }
                    }
                ]
            );

        } catch (error) {
            console.error('Error saving preferences:', error);
            Alert.alert('Error', 'Failed to save preferences. Please try again.');
        } finally {
            setIsLoading(false);
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
                                <Text style={[
                                    styles.taskCount,
                                    selectedTypes.includes(type) && styles.selectedTaskCount
                                ]}>
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
            <LoadingModal visible={isLoading} />
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
        justifyContent: 'space-between',
    },
    typeButton: {
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        width: '48%',
        alignItems: 'center',
        marginBottom: 10,
    },
    selectedType: {
        backgroundColor: '#F67B7B',
        borderColor: '#F67B7B',
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
    continueButton: {
        backgroundColor: '#F67B7B',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
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