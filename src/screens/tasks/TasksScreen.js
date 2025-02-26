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
    processed: task.processed || false,
    rewardClaimed: task.rewardClaimed || false
  };
};

const TasksScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [userPrefs, setUserPrefs] = useState([]);
  const [usedTaskIds, setUsedTaskIds] = useState(new Set());
  const [userStats, setUserStats] = useState(null);
  const [processingTask, setProcessingTask] = useState(null); // Track which task is being processed
  const timerRefs = useRef({});

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setUserStats(docSnapshot.data());
        }
      },
      (error) => {}
    );

    return () => unsubscribe();
  }, []);

  const clearActiveTasks = async (userId) => {
    try {
      await setDoc(doc(db, 'activeTasks', userId), { tasks: [] });
      await setDoc(doc(db, 'usedTasks', userId), { taskIds: [] });
    } catch (error) {}
  };

  const loadInitialTasks = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const activeTasksDoc = await getDoc(doc(db, 'activeTasks', userId));

      if (activeTasksDoc.exists() && activeTasksDoc.data().tasks?.length > 0) {
        setTasks(activeTasksDoc.data().tasks);

        activeTasksDoc.data().tasks.forEach(task => {
          if (task.status === 'in-progress') {
            startTimer(task.id);
          }
        });

        const usedTasksDoc = await getDoc(doc(db, 'usedTasks', userId));
        if (usedTasksDoc.exists()) {
          setUsedTaskIds(new Set(usedTasksDoc.data().taskIds || []));
        }

        return;
      }

      const userPrefsDoc = await getDoc(doc(db, 'userPreferences', userId));
      if (!userPrefsDoc.exists()) return;

      const preferredTypes = userPrefsDoc.data().taskTypes || [];

      if (JSON.stringify(preferredTypes) !== JSON.stringify(userPrefs)) {
        await clearActiveTasks(userId);
      }

      setUserPrefs(preferredTypes);

      const currentTasks = await generateNewTasks(preferredTypes, new Set());
      setTasks(currentTasks);

      await setDoc(doc(db, 'activeTasks', userId), {
        tasks: currentTasks.map(validateTask)
      });

    } catch (error) {}
  };

  const generateNewTasks = async (preferredTypes, existingUsedIds) => {
    const allAvailableTasks = getTasksForType(preferredTypes);

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
        rewardClaimed: false
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

      // For timer updates, only update the time remaining field
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
        // For non-timer updates, ensure we're using the latest task states
        firestoreTasks = updatedTasks.map(validateTask);
      }

      // Write to Firestore with setDoc (overwrites the entire document)
      await setDoc(doc(db, 'activeTasks', userId), {
        tasks: firestoreTasks
      });
      return firestoreTasks;
    } catch (error) {
      return updatedTasks;
    }
  };

  const updateUserStats = async (taskId) => {
    // Prevent multiple simultaneous calls for the same task
    if (processingTask === taskId) {
      return;
    }
    
    setProcessingTask(taskId);
    
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setProcessingTask(null);
      return;
    }

    try {
      // 1. Get the fresh task data from Firestore
      const activeTasksDoc = await getDoc(doc(db, 'activeTasks', userId));
      if (!activeTasksDoc.exists()) {
        setProcessingTask(null);
        return;
      }

      const firestoreTasks = activeTasksDoc.data().tasks || [];
      const firestoreTask = firestoreTasks.find(t => t.id === taskId);

      if (!firestoreTask) {
        setProcessingTask(null);
        return;
      }

      // 2. Task already processed? Update local state and exit
      if (firestoreTask.rewardClaimed) {
        const updatedLocalTasks = tasks.map(t =>
          t.id === taskId ? {
            ...t,
            rewardClaimed: true,
            processed: true,
            status: 'completed'
          } : t
        );
        setTasks(updatedLocalTasks);
        setProcessingTask(null);
        return;
      }

      // 3. Make sure the task is completed before awarding XP
      if (firestoreTask.status !== 'completed') {
        setProcessingTask(null);
        return;
      }

      // 4. Get or create user document
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create default user if it doesn't exist
        const defaultUser = {
          username: auth.currentUser?.displayName || 'New User',
          level: 1,
          xp: 0,
          currency: 0,
          stats: {
            strength: 1,
            intellect: 1,
            agility: 1,
            arcane: 1,
            focus: 1
          },
          lastUpdated: new Date().toISOString()
        };

        await setDoc(userRef, defaultUser);
        
        // Try again after user is created
        setTimeout(() => {
          setProcessingTask(null);
          updateUserStats(taskId);
        }, 500);
        return;
      }

      // 5. Update user stats
      const userData = userDoc.data();
      const currentXP = userData.xp || 0;
      const xpReward = firestoreTask.xpReward || 0;
      const newXP = currentXP + xpReward;

      const statType = firestoreTask.statType ? firestoreTask.statType.toLowerCase() : null;

      // Ensure all stats exist with defaults
      const stats = {
        strength: userData.stats?.strength || 1,
        intellect: userData.stats?.intellect || 1,
        agility: userData.stats?.agility || 1,
        arcane: userData.stats?.arcane || 1,
        focus: userData.stats?.focus || 1
      };

      // Increment the specific stat if valid
      if (statType && stats[statType] !== undefined) {
        stats[statType] += 1;
      }

      // Calculate level up
      let level = userData.level || 1;
      let finalXP = newXP;

      if (newXP >= 1000) {
        const levelsGained = Math.floor(newXP / 1000);
        const newLevel = level + levelsGained;
        const remainingXP = newXP % 1000;
        level = newLevel;
        finalXP = remainingXP;
      }

      // 6. Update user document in Firestore
      const updatedUserData = {
        ...userData,
        xp: finalXP,
        level: level,
        stats: stats,
        lastUpdated: new Date().toISOString()
      };

      await setDoc(userRef, updatedUserData);

      // 7. Mark task as claimed in BOTH local state and Firestore
      
      // Update local state
      const updatedLocalTasks = tasks.map(t =>
        t.id === taskId ? {
          ...t,
          rewardClaimed: true,
          processed: true,
          status: 'completed'
        } : t
      );
      
      setTasks(updatedLocalTasks);

      // Update Firestore
      const updatedFirestoreTasks = firestoreTasks.map(t =>
        t.id === taskId ? {
          ...t,
          rewardClaimed: true,
          processed: true,
          status: 'completed'
        } : t
      );

      await setDoc(doc(db, 'activeTasks', userId), {
        tasks: updatedFirestoreTasks
      });

    } catch (error) {
      // Error handling without console logs or alerts
    } finally {
      // Always clear the processing flag when done
      setProcessingTask(null);
    }
  };

  useEffect(() => {
    loadInitialTasks();
    return () => {
      Object.values(timerRefs.current).forEach(timer => clearInterval(timer));
    };
  }, []);

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
          if (task.id === taskId && task.status === 'in-progress') {
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

    if (taskToRefresh?.status === 'in-progress') {
      return;
    }

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return;
      }

      const userPrefsDoc = await getDoc(doc(db, 'userPreferences', userId));
      if (!userPrefsDoc.exists()) {
        return;
      }

      const preferredTypes = userPrefsDoc.data().taskTypes || [];
      if (!preferredTypes || preferredTypes.length === 0) {
        return;
      }

      const allAvailableTasks = getTasksForType(preferredTypes);
      if (!allAvailableTasks || allAvailableTasks.length === 0) {
        return;
      }

      const usedTasksDoc = await getDoc(doc(db, 'usedTasks', userId));
      const currentUsedIds = new Set(usedTasksDoc.exists() ? usedTasksDoc.data().taskIds : []);

      let eligibleTasks = allAvailableTasks.filter(task =>
        preferredTypes.map(t => t.toLowerCase()).includes(task.taskType.toLowerCase()) &&
        !currentUsedIds.has(task.taskName)
      );

      if (eligibleTasks.length === 0) {
        const newUsedIds = new Set();
        setUsedTaskIds(newUsedIds);

        eligibleTasks = allAvailableTasks.filter(task =>
          preferredTypes.map(t => t.toLowerCase()).includes(task.taskType.toLowerCase())
        );

        await setDoc(doc(db, 'usedTasks', userId), {
          taskIds: []
        });
      }

      if (!eligibleTasks || eligibleTasks.length === 0) {
        return;
      }

      const randomIndex = Math.floor(Math.random() * eligibleTasks.length);
      const selectedTask = eligibleTasks[randomIndex];

      if (!selectedTask) {
        return;
      }

      const duration = selectedTask.duration || 5;

      const newTask = validateTask({
        ...selectedTask,
        id: `task-${Date.now()}`,
        status: 'pending',
        timeRemaining: duration * 60,
        rewardClaimed: false,
        processed: false,
        currentProgress: 0
      });

      const newUsedIds = new Set(currentUsedIds);
      newUsedIds.add(selectedTask.taskName);
      setUsedTaskIds(newUsedIds);

      await setDoc(doc(db, 'usedTasks', userId), {
        taskIds: Array.from(newUsedIds)
      });

      // Get the latest version of tasks from the state
      const latestTasks = [...tasks];
      const updatedTasks = latestTasks.map(task =>
        task.id === taskId ? newTask : task
      );

      // Update local state
      setTasks(updatedTasks);

      // Update Firestore
      await setDoc(doc(db, 'activeTasks', userId), {
        tasks: updatedTasks
      });

    } catch (error) {}
  };

  const skipTask = async (taskId) => {
    await refreshSingleTask(taskId);
  };

  const acceptTask = async (taskId) => {
    try {
      // Prevent accepting a task that's being processed
      if (processingTask === taskId) return;
      
      const updatedTasks = tasks.map(task =>
        task.id === taskId
          ? validateTask({ ...task, status: 'in-progress' })
          : task
      );
      
      setTasks(updatedTasks);
      await updateFirestore(updatedTasks, false);
      startTimer(taskId);
    } catch (error) {}
  };

  const completeTask = async (taskId) => {
    // Prevent completing a task that's being processed
    if (processingTask === taskId) return;
    
    const taskToComplete = tasks.find(task => task.id === taskId);
    if (!taskToComplete) {
      return;
    }

    if (taskToComplete.status === 'completed') {
      if (!taskToComplete.rewardClaimed) {
        await updateUserStats(taskId);
      }
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      return;
    }

    // Stop the timer if it's running
    if (timerRefs.current[taskId]) {
      clearInterval(timerRefs.current[taskId]);
      delete timerRefs.current[taskId];
    }

    try {
      // Get the latest data from Firestore
      const activeTasksDoc = await getDoc(doc(db, 'activeTasks', userId));
      if (!activeTasksDoc.exists()) {
        return;
      }

      const firestoreTasks = activeTasksDoc.data().tasks || [];
      const firestoreTaskIndex = firestoreTasks.findIndex(t => t.id === taskId);
      
      if (firestoreTaskIndex === -1) {
        return;
      }

      // Create a copy of the tasks array
      const updatedFirestoreTasks = [...firestoreTasks];
      
      // Update the specific task
      updatedFirestoreTasks[firestoreTaskIndex] = {
        ...updatedFirestoreTasks[firestoreTaskIndex],
        status: 'completed',
        processed: false,
        rewardClaimed: false
      };

      // Update local state
      const updatedLocalTasks = tasks.map(task =>
        task.id === taskId ? {
          ...task,
          status: 'completed',
          processed: false,
          rewardClaimed: false
        } : task
      );
      
      setTasks(updatedLocalTasks);

      // Update Firestore first
      await setDoc(doc(db, 'activeTasks', userId), {
        tasks: updatedFirestoreTasks
      });

      // Wait for Firestore update to complete before updating stats
      setTimeout(() => {
        updateUserStats(taskId);
      }, 300);

    } catch (error) {}
  };

  const incrementProgress = async (taskId) => {
    try {
      // Prevent incrementing progress on a task being processed
      if (processingTask === taskId) return;
      
      // Find the task
      const taskToUpdate = tasks.find(task => task.id === taskId);
      if (!taskToUpdate || taskToUpdate.status !== 'in-progress') {
        return;
      }
      
      const currentProgress = taskToUpdate.currentProgress || 0;
      const taskAmount = taskToUpdate.taskAmount || 1;
      
      // Calculate new progress
      const newProgress = Math.min(currentProgress + 1, taskAmount);
      
      // Update the tasks array
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return validateTask({
            ...task,
            currentProgress: newProgress
          });
        }
        return task;
      });
      
      // Update local state
      setTasks(updatedTasks);
      
      // Update Firestore
      await updateFirestore(updatedTasks);
      
      // If we reached the total amount, complete the task
      if (newProgress >= taskAmount) {
        // Use setTimeout to ensure state updates are complete
        setTimeout(() => {
          completeTask(taskId);
        }, 300);
      }
    } catch (error) {}
  };

  const quitTask = async (taskId) => {
    // Prevent quitting a task that's being processed
    if (processingTask === taskId) return;
    
    const taskToQuit = tasks.find(task => task.id === taskId);
    if (!taskToQuit) {
      return;
    }

    if (taskToQuit.status !== 'in-progress') {
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      return;
    }

    if (timerRefs.current[taskId]) {
      clearInterval(timerRefs.current[taskId]);
      delete timerRefs.current[taskId];
    }

    try {
      const updatedTask = validateTask({
        ...taskToQuit,
        status: 'failed',
        timeRemaining: 0,
        processed: true,
        rewardClaimed: false
      });

      const updatedTasks = tasks.map(task =>
        task.id === taskId ? updatedTask : task
      );

      setTasks(updatedTasks);

      await setDoc(doc(db, 'activeTasks', userId), {
        tasks: updatedTasks.map(validateTask)
      });

    } catch (error) {}
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      <Text style={[
        styles.taskStatus,
        item.status === 'completed' && styles.completedStatus,
        item.status === 'failed' && styles.failedStatus
      ]}>
        Status: {item.status}
      </Text>

      <Text style={styles.progressText}>
        Progress: {item.currentProgress || 0}/{item.taskAmount}
      </Text>

      <View style={styles.buttonContainer}>
        {item.status === 'pending' && !item.rewardClaimed && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => acceptTask(item.id)}
            >
              <Text style={styles.buttonText}>Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => refreshSingleTask(item.id)}
            >
              <Text style={styles.buttonText}>New Task</Text>
            </TouchableOpacity>
          </>
        )}

        {item.status === 'in-progress' && !item.rewardClaimed && (
          <>
            <TouchableOpacity
              style={styles.progressButton}
              onPress={() => incrementProgress(item.id)}
              disabled={processingTask === item.id}
            >
              <Text style={styles.buttonText}>Count Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => completeTask(item.id)}
              disabled={processingTask === item.id}
            >
              <Text style={styles.buttonText}>Complete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.failButton}
              onPress={() => quitTask(item.id)}
              disabled={processingTask === item.id}
            >
              <Text style={styles.buttonText}>Quit</Text>
            </TouchableOpacity>
          </>
        )}

        {(item.status === 'completed' || item.status === 'failed' || item.rewardClaimed) && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => refreshSingleTask(item.id)}
            disabled={processingTask === item.id}
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
  completedStatus: {
    color: '#4CAF50',
  },
  failedStatus: {
    color: '#F44336',
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
  skipButton: {
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
  debugSection: {
    marginTop: 12,
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  debugText: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
  failButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
});

export default TasksScreen;