import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Image,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { collection, doc, getDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import fitnessTasks from '../../data/fitness_tasks.json';
import careerTasks from '../../data/career_tasks.json';
import healthTasks from '../../data/health_tasks.json';
import creativityTasks from '../../data/creativity_tasks.json';
import choresTasks from '../../data/chores_tasks.json';
import mindTasks from '../../data/mind_tasks.json';
import achievementsData from '../../data/achievements/achievements.json';
import CoopQuestTracker from './CoopQuestTracker';
import CoopQuestService from './CoopQuestService';

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

// Helper function to check achievement progress
const checkAchievements = async (userData) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  try {
    // Get current user achievements
    const userAchievementsDoc = await getDoc(doc(db, 'userAchievements', userId));
    const userAchievements = userAchievementsDoc.exists()
      ? userAchievementsDoc.data().achievements || {}
      : {};

    // For storing newly unlocked achievements to return
    const newlyUnlocked = [];

    // Process each achievement
    const updatedAchievements = { ...userAchievements };

    for (const achievement of achievementsData.achievements) {
      // Skip if already unlocked
      if (userAchievements[achievement.id]?.unlocked) {
        continue;
      }

      let progress = 0;
      let unlocked = false;

      // Calculate progress based on requirement type
      switch (achievement.requirement.type) {
        case 'tasks_completed':
          progress = userData.completedTasks || 0;
          unlocked = progress >= achievement.requirement.count;
          break;

        case 'player_level':
          progress = userData.level || 1;
          unlocked = progress >= achievement.requirement.count;
          break;

        case 'task_type_completed':
          const taskType = achievement.requirement.taskType.toLowerCase();
          progress = userData.completedTasksByType?.[taskType] || 0;
          unlocked = progress >= achievement.requirement.count;
          break;

        case 'consecutive_days':
          progress = userData.streak || 0;
          unlocked = progress >= achievement.requirement.count;
          break;

        case 'stat_level':
          const statType = achievement.requirement.statType.toLowerCase();
          progress = userData.stats?.[statType] || 1;
          unlocked = progress >= achievement.requirement.count;
          break;
      }

      // Update achievement
      updatedAchievements[achievement.id] = {
        ...userAchievements[achievement.id],
        progress,
        unlocked
      };

      // If newly unlocked, add timestamp and add to return array
      if (unlocked && !userAchievements[achievement.id]?.unlocked) {
        updatedAchievements[achievement.id].dateUnlocked = new Date().toISOString();
        updatedAchievements[achievement.id].rewardClaimed = false;
        newlyUnlocked.push({
          ...achievement,
          progress,
          unlocked: true,
          dateUnlocked: updatedAchievements[achievement.id].dateUnlocked
        });
      }
    }

    // Save updated achievements to Firestore
    await setDoc(doc(db, 'userAchievements', userId), {
      achievements: updatedAchievements
    }, { merge: true });

    return newlyUnlocked;
  } catch (error) {
    console.error("Error checking achievements:", error);
    return [];
  }
};

// Create a memoized task item component with optimized rendering (time removed)
const TaskItem = memo(({ item, onPress, processingTask }) => (
  <TouchableOpacity 
    style={[
      styles.taskCard,
      item.status === 'completed' && styles.completedTaskCard,
      item.status === 'failed' && styles.failedTaskCard,
      item.status === 'in-progress' && styles.inProgressTaskCard,
    ]} 
    onPress={() => onPress(item)}
    disabled={processingTask === item.id}
  >
    <Text style={styles.taskName}>{item.taskName}</Text>
    
    <View style={styles.taskBasicInfo}>
      <View style={styles.taskInfoItem}>
        <Text style={styles.taskInfoLabel}>Type</Text>
        <Text style={styles.taskInfoValue}>{item.taskType}</Text>
      </View>
      
      <View style={styles.taskInfoItem}>
        <Text style={styles.taskInfoLabel}>Stat</Text>
        <Text style={styles.taskInfoValue}>{item.statType}</Text>
      </View>
      
      <View style={styles.taskInfoItem}>
        <Text style={styles.taskInfoLabel}>XP</Text>
        <Text style={styles.taskInfoValue}>{item.xpReward}</Text>
      </View>
      
      {/* Time display removed from card */}
    </View>
    
    {item.status !== 'pending' && (
      <Text style={[
        styles.taskStatusBadge,
        item.status === 'completed' && styles.completedStatus,
        item.status === 'failed' && styles.failedStatus,
        item.status === 'in-progress' && styles.inProgressStatus,
      ]}>
        {item.status.toUpperCase()}
      </Text>
    )}
    
    {item.status === 'in-progress' && (
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${(item.currentProgress / item.taskAmount) * 100}%` }
          ]} 
        />
        <Text style={styles.progressText}>
          {item.currentProgress}/{item.taskAmount}
        </Text>
      </View>
    )}
  </TouchableOpacity>
), (prevProps, nextProps) => {
  // Only re-render if key properties change
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.status === nextProps.item.status && 
    prevProps.item.currentProgress === nextProps.item.currentProgress &&
    prevProps.processingTask === nextProps.processingTask
  );
});

const TasksScreen = () => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([]);
  const [userPrefs, setUserPrefs] = useState([]);
  const [usedTaskIds, setUsedTaskIds] = useState(new Set());
  const [userStats, setUserStats] = useState({
    username: '',
    level: 1,
    xp: 0,
    currency: 0,
    avatar: null,
    stats: {
      strength: 1,
      intellect: 1,
      agility: 1,
      arcane: 1,
      focus: 1
    }
  });
  const [processingTask, setProcessingTask] = useState(null);
  const timerRefs = useRef({});
  const [completedQuestName, setCompletedQuestName] = useState('');
  
  // Modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();

          const completeUserStats = {
            username: userData.username || auth.currentUser?.displayName || 'New User',
            level: userData.level || 1,
            xp: userData.xp || 0,
            currency: userData.currency || 0,
            avatar: userData.avatar || null,
            stats: {
              strength: userData.stats?.strength || 1,
              intellect: userData.stats?.intellect || 1,
              agility: userData.stats?.agility || 1,
              arcane: userData.stats?.arcane || 1,
              focus: userData.stats?.focus || 1
            }
          };
          setUserStats(completeUserStats);
          
          // Check if there's a recently completed quest
          if (userData.recentlyCompletedQuest) {
            setCompletedQuestName(userData.recentlyCompletedQuest.name || 'Co-op Quest');
            
            // Clear the recent completion flag
            updateDoc(doc(db, 'users', userId), {
              recentlyCompletedQuest: null
            });
          }
        }
      },
      (error) => { }
    );

    return () => unsubscribe();
  }, []);

  // New effect to handle task updates without causing modal jitters
  // Only update selected task when important properties change
  useEffect(() => {
    if (selectedTask) {
      const currentTask = tasks.find(task => task.id === selectedTask.id);
      
      // Only update the selectedTask if a significant property has changed (like status)
      if (currentTask && (
        currentTask.status !== selectedTask.status ||
        currentTask.currentProgress !== selectedTask.currentProgress
      )) {
        setSelectedTask(currentTask);
      }
    }
  }, [tasks, selectedTask]);

  const calculateXpProgress = useCallback(() => {
    return (userStats.xp / 1000) * 100;
  }, [userStats.xp]);

  const clearActiveTasks = useCallback(async (userId) => {
    try {
      await setDoc(doc(db, 'activeTasks', userId), { tasks: [] });
      await setDoc(doc(db, 'usedTasks', userId), { taskIds: [] });
    } catch (error) { }
  }, []);

  const updateFirestore = useCallback(async (updatedTasks, isTimerUpdate = false) => {
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
      return updatedTasks;
    }
  }, []);

  // Modified startTimer to avoid updating the selectedTask with every tick
  const startTimer = useCallback((taskId) => {
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

        // DON'T update the selectedTask with every tick, this causes modal jitters
        // The separate useEffect will handle updating the modal when important properties change

        updateFirestore(updatedTasks, true);
        return updatedTasks;
      });
    }, 1000);
  }, [updateFirestore]);

  const generateNewTasks = useCallback(async (preferredTypes, existingUsedIds) => {
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
  }, []);

  const loadInitialTasks = useCallback(async () => {
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

    } catch (error) { }
  }, [userPrefs, clearActiveTasks, startTimer, generateNewTasks]);

  const updateUserStats = useCallback(async (taskId) => {
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

      if (firestoreTask.status !== 'completed') {
        setProcessingTask(null);
        return;
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
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

        setTimeout(() => {
          setProcessingTask(null);
          updateUserStats(taskId);
        }, 500);
        return;
      }

      const userData = userDoc.data();
      const currentXP = userData.xp || 0;
      const xpReward = firestoreTask.xpReward || 0;
      const newXP = currentXP + xpReward;

      const statType = firestoreTask.statType ? firestoreTask.statType.toLowerCase() : null;

      const stats = {
        strength: userData.stats?.strength || 1,
        intellect: userData.stats?.intellect || 1,
        agility: userData.stats?.agility || 1,
        arcane: userData.stats?.arcane || 1,
        focus: userData.stats?.focus || 1
      };

      if (statType && stats[statType] !== undefined) {
        stats[statType] += 1;
      }

      let level = userData.level || 1;
      let finalXP = newXP;

      if (newXP >= 1000) {
        const levelsGained = Math.floor(newXP / 1000);
        const newLevel = level + levelsGained;
        const remainingXP = newXP % 1000;
        level = newLevel;
        finalXP = remainingXP;
      }

      const updatedUserData = {
        ...userData,
        xp: finalXP,
        level: level,
        stats: stats,
        lastUpdated: new Date().toISOString()
      };

      await setDoc(userRef, updatedUserData);

      const updatedLocalTasks = tasks.map(t =>
        t.id === taskId ? {
          ...t,
          rewardClaimed: true,
          processed: true,
          status: 'completed'
        } : t
      );

      setTasks(updatedLocalTasks);

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

      // ACHIEVEMENT SYSTEM INTEGRATION: Track completed tasks
      // Get the task type of the completed task
      const completedTask = tasks.find(t => t.id === taskId);
      const taskType = completedTask?.taskType?.toLowerCase();

      // Get completed tasks count
      const completedTasksDoc = await getDoc(doc(db, 'userStats', userId));
      let completedTasks = 0;
      let completedTasksByType = {};
      let streak = 0;

      if (completedTasksDoc.exists()) {
        const statsData = completedTasksDoc.data();
        completedTasks = (statsData.completedTasks || 0) + 1;
        completedTasksByType = statsData.completedTasksByType || {};
        streak = statsData.streak || 0;

        // Update completed tasks by type
        if (taskType) {
          completedTasksByType[taskType] = (completedTasksByType[taskType] || 0) + 1;
        }
      } else {
        completedTasks = 1;
        completedTasksByType = taskType ? { [taskType]: 1 } : {};
      }

      // Check if task was completed today
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Update user stats
      await setDoc(doc(db, 'userStats', userId), {
        completedTasks,
        completedTasksByType,
        lastCompletedDate: today,
        streak,
        lastUpdated: now.toISOString()
      }, { merge: true });

      // Update daily streak
      await updateDailyStreak();

      // Create an object with all the data needed for achievement checking
      const achievementUserData = {
        ...updatedUserData,
        completedTasks,
        completedTasksByType,
        streak
      };

      // Check if any achievements were unlocked
      await checkAchievements(achievementUserData);
      
      // Update co-op quest progress for XP gain
      if (xpReward > 0) {
        await CoopQuestService.updateQuestProgress(userId, 'xp', xpReward);
      }

      // Update co-op quest progress for stat gains
      if (statType) {
        await CoopQuestService.updateQuestProgress(userId, 'stat', 1);
      }

    } catch (error) {
    } finally {
      setProcessingTask(null);
    }
  }, [tasks, processingTask, updateDailyStreak]);

  // Add this function to update daily streak
  const updateDailyStreak = useCallback(async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const userStatsDoc = await getDoc(doc(db, 'userStats', userId));
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      if (userStatsDoc.exists()) {
        const statsData = userStatsDoc.data();
        const lastDate = statsData.lastCompletedDate;
        let streak = statsData.streak || 0;
        
        // Check if last completion was yesterday
        if (lastDate) {
          const lastDateObj = new Date(lastDate);
          const oneDayAgo = new Date(now);
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          
          if (lastDateObj.toISOString().split('T')[0] === oneDayAgo.toISOString().split('T')[0]) {
            // Increment streak
            streak += 1;
            
            // Update co-op quest progress for streak
            await CoopQuestService.updateQuestProgress(userId, 'streak', 1);
          } else if (lastDate !== today) {
            // Reset streak if not consecutive and not already logged today
            streak = 1;
          }
        } else {
          // First time logging
          streak = 1;
        }
        
        // Update streak in Firestore
        await setDoc(doc(db, 'userStats', userId), {
          lastCompletedDate: today,
          streak: streak,
          lastUpdated: now.toISOString()
        }, { merge: true });
      } else {
        // First time logging ever
        await setDoc(doc(db, 'userStats', userId), {
          lastCompletedDate: today,
          streak: 1,
          lastUpdated: now.toISOString()
        });
      }
    } catch (error) {
      console.error("Error updating streak:", error);
    }
  }, []);

  useEffect(() => {
    loadInitialTasks();
    return () => {
      Object.values(timerRefs.current).forEach(timer => clearInterval(timer));
    };
  }, [loadInitialTasks]);

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
  }, [userPrefs, loadInitialTasks]);

  const refreshSingleTask = useCallback(async (taskId) => {
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

      const latestTasks = [...tasks];
      const updatedTasks = latestTasks.map(task =>
        task.id === taskId ? newTask : task
      );

      setTasks(updatedTasks);

      await setDoc(doc(db, 'activeTasks', userId), {
        tasks: updatedTasks
      });

    } catch (error) { }
  }, [tasks]);

  const skipTask = useCallback(async (taskId) => {
    await refreshSingleTask(taskId);
  }, [refreshSingleTask]);

  const acceptTask = useCallback(async (taskId) => {
    try {
      if (processingTask === taskId) return;

      // Immediately update UI state
      setTasks(currentTasks => 
        currentTasks.map(task =>
          task.id === taskId
            ? validateTask({ ...task, status: 'in-progress' })
            : task
        )
      );
      
      // If the selected task in the modal is being started, also update its status
      setSelectedTask(currentSelectedTask => {
        if (currentSelectedTask && currentSelectedTask.id === taskId) {
          return {
            ...currentSelectedTask,
            status: 'in-progress'
          };
        }
        return currentSelectedTask;
      });

      // Now handle background updates
      startTimer(taskId);
      await updateFirestore(tasks.map(task =>
        task.id === taskId
          ? validateTask({ ...task, status: 'in-progress' })
          : task
      ), false);
      
      // Close the modal after accepting the task
      setModalVisible(false);
    } catch (error) { }
  }, [processingTask, tasks, updateFirestore, startTimer]);

  // Modified completeTask to update UI immediately for better feedback
  const completeTask = useCallback(async (taskId) => {
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

    // Immediately update UI state
    setTasks(currentTasks => 
      currentTasks.map(task =>
        task.id === taskId ? {
          ...task,
          status: 'completed',
          processed: false,
          rewardClaimed: false
        } : task
      )
    );
    
    // If the selected task in the modal is being completed, also update its status
    setSelectedTask(currentSelectedTask => {
      if (currentSelectedTask && currentSelectedTask.id === taskId) {
        return {
          ...currentSelectedTask,
          status: 'completed',
          processed: false,
          rewardClaimed: false
        };
      }
      return currentSelectedTask;
    });

    const userId = auth.currentUser?.uid;
    if (!userId) {
      return;
    }

    if (timerRefs.current[taskId]) {
      clearInterval(timerRefs.current[taskId]);
      delete timerRefs.current[taskId];
    }

    // Process backend updates
    setProcessingTask(taskId);

    try {
      const activeTasksDoc = await getDoc(doc(db, 'activeTasks', userId));
      if (!activeTasksDoc.exists()) {
        setProcessingTask(null);
        return;
      }

      const firestoreTasks = activeTasksDoc.data().tasks || [];
      const firestoreTaskIndex = firestoreTasks.findIndex(t => t.id === taskId);

      if (firestoreTaskIndex === -1) {
        setProcessingTask(null);
        return;
      }

      const updatedFirestoreTasks = [...firestoreTasks];

      updatedFirestoreTasks[firestoreTaskIndex] = {
        ...updatedFirestoreTasks[firestoreTaskIndex],
        status: 'completed',
        processed: false,
        rewardClaimed: false
      };

      await setDoc(doc(db, 'activeTasks', userId), {
        tasks: updatedFirestoreTasks
      });

      // Update co-op quest progress for completed task
      await CoopQuestService.updateQuestProgress(userId, 'task', 1);

      setTimeout(() => {
        updateUserStats(taskId);
      }, 300);

    } catch (error) {
      console.error("Error completing task:", error);
    } finally {
      setProcessingTask(null);
    }
  }, [tasks, updateUserStats]);

  const incrementProgress = useCallback(async (taskId) => {
    try {
      if (processingTask === taskId) return;

      const taskToUpdate = tasks.find(task => task.id === taskId);
      if (!taskToUpdate || taskToUpdate.status !== 'in-progress') {
        return;
      }

      const currentProgress = taskToUpdate.currentProgress || 0;
      const taskAmount = taskToUpdate.taskAmount || 1;

      const newProgress = Math.min(currentProgress + 1, taskAmount);

      // Immediately update UI
      setTasks(currentTasks => 
        currentTasks.map(task => {
          if (task.id === taskId) {
            return validateTask({
              ...task,
              currentProgress: newProgress
            });
          }
          return task;
        })
      );
      
      // Update selected task in modal if applicable
      setSelectedTask(currentSelectedTask => {
        if (currentSelectedTask && currentSelectedTask.id === taskId) {
          return {
            ...currentSelectedTask,
            currentProgress: newProgress
          };
        }
        return currentSelectedTask;
      });

      await updateFirestore(tasks.map(task => {
        if (task.id === taskId) {
          return validateTask({
            ...task,
            currentProgress: newProgress
          });
        }
        return task;
      }));

      if (newProgress >= taskAmount) {
        setTimeout(() => {
          completeTask(taskId);
        }, 300);
      }
    } catch (error) { }
  }, [processingTask, tasks, updateFirestore, completeTask]);

  const quitTask = useCallback(async (taskId) => {
    if (processingTask === taskId) return;

    const taskToQuit = tasks.find(task => task.id === taskId);
    if (!taskToQuit) {
      return;
    }

    if (taskToQuit.status !== 'in-progress') {
      return;
    }

    // Immediately update UI
    setTasks(currentTasks => 
      currentTasks.map(task =>
        task.id === taskId ? validateTask({
          ...task,
          status: 'failed',
          timeRemaining: 0,
          processed: true,
          rewardClaimed: false
        }) : task
      )
    );
    
    // Update selected task in modal if applicable
    setSelectedTask(currentSelectedTask => {
      if (currentSelectedTask && currentSelectedTask.id === taskId) {
        return validateTask({
          ...currentSelectedTask,
          status: 'failed',
          timeRemaining: 0,
          processed: true,
          rewardClaimed: false
        });
      }
      return currentSelectedTask;
    });

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

      await setDoc(doc(db, 'activeTasks', userId), {
        tasks: tasks.map(task =>
          task.id === taskId ? updatedTask : task
        ).map(validateTask)
      });

    } catch (error) { }
  }, [processingTask, tasks]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // New function to handle task card press
  const handleTaskPress = useCallback((task) => {
    setSelectedTask(task);
    setModalVisible(true);
  }, []);

  // Create a memoized render function for FlatList
  const renderTask = useCallback(({ item }) => (
    <TaskItem 
      item={item} 
      onPress={handleTaskPress} 
      processingTask={processingTask}
    />
  ), [handleTaskPress, processingTask]);

  // Optimize FlatList by providing item layout dimensions
  const getItemLayout = useCallback((_, index) => ({
    length: 150, // approximate height of task item
    offset: 150 * index,
    index,
  }), []);
  
  // Extract key from task item
  const keyExtractor = useCallback(item => item.id, []);

  // Simplified Modal component with minimal dependencies to prevent jitters
  const TaskDetailModal = useCallback(() => {
    if (!selectedTask) return null;
    
    return (
      <Modal
        animationType="none" // Changed from "fade" to prevent animation re-renders
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{selectedTask.taskName}</Text>
                
                <View style={styles.modalInfoRow}>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>Type</Text>
                    <Text style={styles.modalInfoValue}>{selectedTask.taskType}</Text>
                  </View>
                  
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>Stat</Text>
                    <Text style={styles.modalInfoValue}>{selectedTask.statType}</Text>
                  </View>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>Difficulty</Text>
                    <Text style={styles.modalInfoValue}>{selectedTask.difficulty}</Text>
                  </View>
                  
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>XP Reward</Text>
                    <Text style={styles.modalInfoValue}>{selectedTask.xpReward}</Text>
                  </View>
                </View>
                
                {/* Time display removed */}
                
                <View style={styles.modalStatusRow}>
                  <Text style={styles.modalInfoLabel}>Status</Text>
                  <Text style={[
                    styles.modalStatusValue,
                    selectedTask.status === 'completed' && styles.completedText,
                    selectedTask.status === 'failed' && styles.failedText,
                    selectedTask.status === 'in-progress' && styles.inProgressText,
                  ]}>
                    {selectedTask.status.toUpperCase()}
                  </Text>
                </View>
                
                {selectedTask.status === 'in-progress' && (
                  <View style={styles.modalProgressContainer}>
                    <Text style={styles.modalProgressLabel}>
                      Progress: {selectedTask.currentProgress}/{selectedTask.taskAmount}
                    </Text>
                    <View style={styles.modalProgressBarContainer}>
                      <View 
                        style={[
                          styles.modalProgressBar, 
                          { width: `${(selectedTask.currentProgress / selectedTask.taskAmount) * 100}%` }
                        ]} 
                      />
                    </View>
                  </View>
                )}
                
                <View style={styles.modalButtonsContainer}>
                  {selectedTask.status === 'pending' && !selectedTask.rewardClaimed && (
                    <>
                      <TouchableOpacity
                        style={styles.modalPrimaryButton}
                        onPress={() => acceptTask(selectedTask.id)}
                        disabled={processingTask === selectedTask.id}
                      >
                        <Text style={styles.buttonText}>Start Task</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.modalSecondaryButton}
                        onPress={() => {
                          refreshSingleTask(selectedTask.id);
                          setModalVisible(false);
                        }}
                        disabled={processingTask === selectedTask.id}
                      >
                        <Text style={styles.buttonText}>New Task</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {selectedTask.status === 'in-progress' && !selectedTask.rewardClaimed && (
                    <>
                      <TouchableOpacity
                        style={styles.modalProgressButton}
                        onPress={() => incrementProgress(selectedTask.id)}
                        disabled={processingTask === selectedTask.id}
                      >
                        <Text style={styles.buttonText}>Count Progress</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.modalPrimaryButton}
                        onPress={() => completeTask(selectedTask.id)}
                        disabled={processingTask === selectedTask.id}
                      >
                        <Text style={styles.buttonText}>Complete</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.modalFailButton}
                        onPress={() => {
                          quitTask(selectedTask.id);
                          setModalVisible(false);
                        }}
                        disabled={processingTask === selectedTask.id}
                      >
                        <Text style={styles.buttonText}>Quit</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {(selectedTask.status === 'completed' || selectedTask.status === 'failed' || selectedTask.rewardClaimed) && (
                    <TouchableOpacity
                      style={styles.modalRefreshButton}
                      onPress={() => {
                        refreshSingleTask(selectedTask.id);
                        setModalVisible(false);
                      }}
                      disabled={processingTask === selectedTask.id}
                    >
                      <Text style={styles.buttonText}>New Task</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }, [selectedTask, modalVisible]); // Minimized dependencies to prevent re-renders

  return (
    <View style={styles.container}>
      {/* Header Container */}
      <View style={styles.headerContainer}>
        {/* Top row of header with profile, username, level, and currency */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Home', { screen: 'ProfileScreen' })}
          >
            <Ionicons name="person-circle-outline" size={30} color="white" />
          </TouchableOpacity>

          <Text style={styles.username}>{userStats.username}</Text>

          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>Level {userStats.level}</Text>
          </View>

          <TouchableOpacity
            style={styles.achievementsButton}
            onPress={() => navigation.navigate('Achievements')}
          >
            <Ionicons name="trophy" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.currencyContainer}>
            <Image
              source={require('../../../assets/coin.png')}
              style={styles.currencyIcon}
            />
            <Text style={styles.currencyText}>{userStats.currency}</Text>
          </View>
        </View>

        <View style={styles.xpContainer}>
          <View style={styles.xpBarContainer}>
            <View
              style={[
                styles.xpBar,
                { width: `${calculateXpProgress()}%` }
              ]}
            />
            <Text style={styles.xpText}>XP: {userStats.xp} / 1000</Text>
          </View>
        </View>
      </View>

      {/* Co-op Quest Tracker */}
      <CoopQuestTracker />

      {/* Task List with optimization */}
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.listContainer}
        windowSize={5}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
      />
      
      {/* Task Detail Modal */}
      <TaskDetailModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: '#434',
    paddingVertical: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  profileButton: {
    padding: 5,
    marginRight: 10,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  levelContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 10,
  },
  levelText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  currencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  currencyIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  xpContainer: {
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  xpText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    padding: 2,
    zIndex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  xpBarContainer: {
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 20,
  },
  
  // Redesigned task card styles
  taskCard: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 2,
    borderColor: '#6366f1',
    position: 'relative',
  },
  completedTaskCard: {
    borderColor: '#4CAF50',
  },
  failedTaskCard: {
    borderColor: '#F44336',
  },
  inProgressTaskCard: {
    borderColor: '#2196F3',
  },
  taskName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  taskBasicInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  taskInfoItem: {
    width: '48%', 
    marginBottom: 8,
  },
  taskInfoLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  taskInfoValue: {
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
  },
  taskStatusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 'bold',
    overflow: 'hidden',
    color: 'white',
    backgroundColor: '#888',
  },
  completedStatus: {
    backgroundColor: '#4CAF50',
  },
  failedStatus: {
    backgroundColor: '#F44336',
  },
  inProgressStatus: {
    backgroundColor: '#2196F3',
  },
  progressBarContainer: {
    height: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 7,
    marginTop: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressText: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  modalInfoItem: {
    width: '48%',
  },
  modalInfoLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    marginBottom: 2,
  },
  modalInfoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  // New style for status row
  modalStatusRow: {
    marginBottom: 15,
  },
  modalStatusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedText: {
    color: '#4CAF50',
  },
  failedText: {
    color: '#F44336',
  },
  inProgressText: {
    color: '#2196F3',
  },
  modalProgressContainer: {
    marginVertical: 15,
  },
  modalProgressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#444',
  },
  modalProgressBarContainer: {
    height: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 9,
    overflow: 'hidden',
    position: 'relative',
  },
  modalProgressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  modalButtonsContainer: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalPrimaryButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
  },
  modalSecondaryButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
  },
  modalProgressButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
  },
  modalFailButton: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
  },
  modalRefreshButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  modalCloseButton: {
    backgroundColor: '#888',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  achievementsButton: {
    padding: 5,
    marginRight: 10,
  },
});

export default TasksScreen;