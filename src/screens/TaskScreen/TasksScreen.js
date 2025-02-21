import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native'; // Added Text import
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

const TasksScreen = () => {
  const [tasks, setTasks] = useState([]);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    const tasksRef = collection(db, 'tasks');
    const userTasksQuery = query(tasksRef, where('userId', '==', userId));

    const unsubscribe = onSnapshot(userTasksQuery, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(taskList);
    });

    return () => unsubscribe();
  }, [userId]);

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <Text style={styles.taskName}>{item.taskName}</Text>
      <Text>Difficulty: {item.difficulty}</Text>
      <Text>Duration: {item.duration} minutes</Text>
      <Text>XP Reward: {item.xpReward}</Text>
      <Text>Status: {item.status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  taskName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default TasksScreen;