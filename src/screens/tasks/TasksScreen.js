import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { collection, doc, getDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import fitnessTasks from '../../data/fitness_tasks.json';
import careerTasks from '../../data/career_tasks.json';
import healthTasks from '../../data/health_tasks.json';
import creativityTasks from '../../data/creativity_tasks.json';
import choresTasks from '../../data/chores_tasks.json';
import mindTasks from '../../data/mind_tasks.json';

const getTasksForType = (preferredTypes) => {
  const allTasks = [];
  const types = preferredTypes.map(type => type.toLowerCase());
  
  if (types.includes('fitness')) {
    allTasks.push(...fitnessTasks.tasks);
  }
  if (types.includes('career')) {
    allTasks.push(...careerTasks.tasks);
  }
  if (types.includes('health')) {
    allTasks.push(...healthTasks.tasks);
  }
  if (types.includes('creativity')) {
    allTasks.push(...creativityTasks.tasks);
  }
  if (types.includes('chores')) {
    allTasks.push(...choresTasks.tasks);
  }
  if (types.includes('mind')) {
    allTasks.push(...mindTasks.tasks);
  }
  
  return allTasks;
};

const validateTask = (task) => {
  return {
    id: task.id || `task-${Date.now()}`,
    taskName: task.taskName || '',
    difficulty: task.difficulty || 'Easy',
    duration: task.duration || 0,
    statType: task.statType || '',
    status: task.status || 'pending',
    taskAmount: task.taskAmount || 1,
    currentProgress: task.currentProgress || 0,
    taskType: task.taskType || '',
    xpReward: task.xpReward || 0,
    timeRemaining: task.timeRemaining || (task.duration || 0) * 60,
    processed: task.processed || false
  };
};

const TasksScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [userPrefs, setUserPrefs] = useState([]);
  const [usedTaskIds, setUsedTaskIds] = useState(new Set());
  const timerRefs = useRef({});

  const clearActiveTasks = async (userId) => {
    try {
      await setDoc(doc(db, 'activeTasks', userId), { tasks: [] });
      await setDoc(doc(db, 'usedTasks', userId), { taskIds: [] });
    } catch (error) {
      console.error('Error clearing tasks:', error);
    }
  };

  const loadInitialTasks = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const userPrefsDoc = await getDoc(doc(db, 'userPreferences', userId));
      if (!userPrefsDoc.exists()) return;
      
      const preferredTypes = userPrefsDoc.data().taskTypes || [];
      console.log('User preferred types:', preferredTypes);
      
      // Clear existing tasks when preferences change
      if (JSON.stringify(preferredTypes) !== JSON.stringify(userPrefs)) {
        await clearActiveTasks(userId);
      }
      
      setUserPrefs(preferredTypes);

      // Generate new tasks
      const currentTasks = await generateNewTasks(preferredTypes, new Set());
      setTasks(currentTasks);
      
      // Save new tasks to Firestore
      await setDoc(doc(db, 'activeTasks', userId), { 
        tasks: currentTasks.map(validateTask)
      });

    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const generateNewTasks = async (preferredTypes, existingUsedIds) => {
    console.log('Generating new tasks for types:', preferredTypes);
    const allAvailableTasks = getTasksForType(preferredTypes);
    console.log('Available tasks:', allAvailableTasks);
    
    let eligibleTasks = allAvailableTasks.filter(task => 
      preferredTypes.map(t => t.toLowerCase()).includes(task.taskType.toLowerCase()) && 
      !existingUsedIds.has(task.taskName)
    );

    if (eligibleTasks.length === 0) {
      existingUsedIds.clear();
      eligibleTasks = allAvailableTasks.filter(task => 
        preferredTypes.map(t => t.toLowerCase()).includes(task.taskType.toLowerCase())
      );
    }

    const randomTasks = [];
    while (randomTasks.length < 3 && eligibleTasks.length > 0) {
      const randomIndex = Math.floor(Math.random() * eligibleTasks.length);
      const selectedTask = eligibleTasks[randomIndex];
      
      randomTasks.push(validateTask({
        ...selectedTask,
        id: `task-${Date.now()}-${randomTasks.length}`,
        status: 'pending',
        timeRemaining: selectedTask.duration * 60,
      }));
      
      existingUsedIds.add(selectedTask.taskName);
      eligibleTasks.splice(randomIndex, 1);
    }

    const userId = auth.currentUser?.uid;
    if (userId) {
      await setDoc(doc(db, 'usedTasks', userId), {
        taskIds: Array.from(existingUsedIds)
      });
    }

    return randomTasks;
  };

  const updateFirestore = async (updatedTasks, isTimerUpdate = false) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return updatedTasks;

    try {
      let firestoreTasks;
      
      if (isTimerUpdate) {
        const currentDoc = await getDoc(doc(db, 'activeTasks', userId));
        const currentTasks = currentDoc.exists() ? currentDoc.data().tasks : [];
        
        firestoreTasks = currentTasks.map(currentTask => {
          const updatedTask = updatedTasks.find(t => t.id === currentTask.id);
          if (updatedTask) {
            return {
              ...currentTask,
              timeRemaining: updatedTask.timeRemaining
            };
          }
          return currentTask;
        });
      } else {
        firestoreTasks = updatedTasks.map(validateTask);
      }

      await setDoc(doc(db, 'activeTasks', userId), { 
        tasks: firestoreTasks 
      });
      return firestoreTasks;
    } catch (error) {
      console.error('Error updating Firestore:', error);
      return updatedTasks;
    }
  };

  // Initial load
  useEffect(() => {
    loadInitialTasks();
    return () => {
      Object.values(timerRefs.current).forEach(timer => clearInterval(timer));
    };
  }, []);

  // Listen for preference changes
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const unsubscribe = onSnapshot(doc(db, 'userPreferences', userId), (doc) => {
        if (doc.exists()) {
          const newPrefs = doc.data().taskTypes || [];
          if (JSON.stringify(newPrefs) !== JSON.stringify(userPrefs)) {
            loadInitialTasks();
          }
        }
      });
      return () => unsubscribe();
    }
  }, [userPrefs]);

  const startTimer = (taskId) => {
    if (timerRefs.current[taskId]) return;

    timerRefs.current[taskId] = setInterval(async () => {
      setTasks(currentTasks => {
        const updatedTasks = currentTasks.map(task => {
          if (task.id === taskId) {
            const newTimeRemaining = task.timeRemaining - 1;
            
            if (newTimeRemaining <= 0) {
              clearInterval(timerRefs.current[taskId]);
              delete timerRefs.current[taskId];
              return validateTask({ ...task, timeRemaining: 0, status: 'failed' });
            }
            
            return validateTask({ ...task, timeRemaining: newTimeRemaining });
          }
          return task;
        });

        updateFirestore(updatedTasks, true);
        return updatedTasks;
      });
    }, 1000);
  };

  const refreshSingleTask = async (taskId) => {
    const taskToRefresh = tasks.find(task => task.id === taskId);
    if (taskToRefresh?.status === 'in-progress') return;

    try {
      const allAvailableTasks = getTasksForType(userPrefs);
      
      let eligibleTasks = allAvailableTasks.filter(task => 
        userPrefs.map(t => t.toLowerCase()).includes(task.taskType.toLowerCase()) && 
        !usedTaskIds.has(task.taskName)
      );

      if (eligibleTasks.length === 0) {
        const newUsedIds = new Set();
        setUsedTaskIds(newUsedIds);
        eligibleTasks = allAvailableTasks.filter(task => 
          userPrefs.map(t => t.toLowerCase()).includes(task.taskType.toLowerCase())
        );

        const userId = auth.currentUser?.uid;
        if (userId) {
          await setDoc(doc(db, 'usedTasks', userId), {
            taskIds: []
          });
        }
      }

      const randomIndex = Math.floor(Math.random() * eligibleTasks.length);
      const selectedTask = eligibleTasks[randomIndex];
      const newTask = validateTask({
        ...selectedTask,
        id: `task-${Date.now()}`,
        status: 'pending',
        timeRemaining: selectedTask.duration * 60,
      });

      const newUsedIds = new Set(usedTaskIds);
      newUsedIds.add(selectedTask.taskName);
      setUsedTaskIds(newUsedIds);

      const userId = auth.currentUser?.uid;
      if (userId) {
        await setDoc(doc(db, 'usedTasks', userId), {
          taskIds: Array.from(newUsedIds)
        });
      }

      const updatedTasks = tasks.map(task =>
        task.id === taskId ? newTask : task
      );
      setTasks(updatedTasks);
      await updateFirestore(updatedTasks, false);
    } catch (error) {
      console.error('Error refreshing task:', error);
    }
  };

  const acceptTask = async (taskId) => {
    try {
      const updatedTasks = tasks.map(task =>
        task.id === taskId
          ? validateTask({ ...task, status: 'in-progress' })
          : task
      );
      setTasks(updatedTasks);
      await updateFirestore(updatedTasks, false);
      startTimer(taskId);
    } catch (error) {
      console.error('Error accepting task:', error);
    }
  };

  const completeTask = async (taskId) => {
    const taskToComplete = tasks.find(task => task.id === taskId);
    if (!taskToComplete || taskToComplete.processed) return;

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    if (timerRefs.current[taskId]) {
      clearInterval(timerRefs.current[taskId]);
      delete timerRefs.current[taskId];
    }

    try {
      const updatedTasks = tasks.map(task =>
        task.id === taskId
          ? validateTask({ 
              ...task, 
              status: 'completed', 
              processed: false
            })
          : task
      );
      
      await setDoc(doc(db, 'activeTasks', userId), {
        tasks: updatedTasks.map(validateTask)
      });

      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const incrementProgress = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status !== 'in-progress') return;
  
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const currentProgress = (t.currentProgress || 0) + 1;
        const newTask = {
          ...t,
          currentProgress: Math.min(currentProgress, t.taskAmount)
        };
        
        // Auto-complete task if progress reaches taskAmount
        if (currentProgress >= t.taskAmount) {
          newTask.status = 'completed';
          if (timerRefs.current[taskId]) {
            clearInterval(timerRefs.current[taskId]);
            delete timerRefs.current[taskId];
          }
        }
        
        return newTask;
      }
      return t;
    });
  
    setTasks(updatedTasks);
    await updateFirestore(updatedTasks, false);
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <Text style={styles.taskName}>{item.taskName}</Text>
      <Text style={styles.taskInfo}>Type: {item.taskType}</Text>
      <Text style={styles.taskInfo}>Stat: {item.statType}</Text>
      <Text style={styles.taskInfo}>Difficulty: {item.difficulty}</Text>
      <Text style={styles.taskInfo}>XP Reward: {item.xpReward}</Text>
      <Text style={styles.taskInfo}>
        Time Remaining: {formatTime(item.timeRemaining)}
      </Text>
      <Text style={styles.taskStatus}>Status: {item.status}</Text>
      
      <Text style={styles.progressText}>
        Progress: {item.currentProgress || 0}/{item.taskAmount}
      </Text>
  
      <View style={styles.buttonContainer}>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => acceptTask(item.id)}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'in-progress' && (
          <>
            <TouchableOpacity
              style={styles.progressButton}
              onPress={() => incrementProgress(item.id)}
            >
              <Text style={styles.buttonText}>Count Progress</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => completeTask(item.id)}
            >
              <Text style={styles.buttonText}>Complete</Text>
            </TouchableOpacity>
          </>
        )}
  
        {item.status !== 'in-progress' && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => refreshSingleTask(item.id)}
          >
            <Text style={styles.buttonText}>New Task</Text>
          </TouchableOpacity>
        )}
      </View>
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
    borderTopWidth: 45,
    borderTopColor: 'black'
  },
  listContainer: {
    padding: 16,
    flexGrow: 16,
    paddingBottom: 20,
  },
  taskCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  taskName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  taskInfo: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  taskStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#6366f1',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#2196F3',
  },
  
  progressButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
});

export default TasksScreen;