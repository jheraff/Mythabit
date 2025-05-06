import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  TouchableWithoutFeedback,
  Animated
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
import { globalStyles } from '../../../styles/globalStyles';

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

const checkAchievements = async (userData) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  try {
    const userAchievementsDoc = await getDoc(doc(db, 'userAchievements', userId));
    const userAchievements = userAchievementsDoc.exists()
      ? userAchievementsDoc.data().achievements || {}
      : {};

    const newlyUnlocked = [];

    const updatedAchievements = { ...userAchievements };

    for (const achievement of achievementsData.achievements) {
      if (userAchievements[achievement.id]?.unlocked) {
        continue;
      }

      let progress = 0;
      let unlocked = false;

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

      updatedAchievements[achievement.id] = {
        ...userAchievements[achievement.id],
        progress,
        unlocked
      };

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

    await setDoc(doc(db, 'userAchievements', userId), {
      achievements: updatedAchievements
    }, { merge: true });

    return newlyUnlocked;
  } catch (error) {
    console.error("Error checking achievements:", error);
    return [];
  }
};

const TaskItem = memo(({ item, processingTask, isExpanded, onToggleExpand, 
                        acceptTask, completeTask, incrementProgress, quitTask, refreshSingleTask, formatTime }) => {
  const expandAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(expandAnimation, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false
    }).start();
  }, [isExpanded, expandAnimation]);

  const maxHeight = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500]
  });

  return (
    <View style={styles.taskItemContainer}>
      <TouchableOpacity
        style={[
          styles.taskCard,
          item.status === 'completed' && styles.completedTaskCard,
          item.status === 'failed' && styles.failedTaskCard,
          item.status === 'in-progress' && styles.inProgressTaskCard,
        ]}
        onPress={() => onToggleExpand(item.id)}
        disabled={processingTask === item.id}
      >
        <View style={styles.taskHeaderRow}>
          <Text style={styles.taskName}>{item.taskName}</Text>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color="#444" />
        </View>
      </TouchableOpacity>

      {/* Dropdown content */}
      <Animated.View style={[styles.taskDetailsContainer, { maxHeight }]}>
        <View style={styles.taskDetailsContent}>
          {/* Task Details */}
          <View style={styles.taskInfoRow}>
            <View style={styles.taskInfoItem}>
              <Text style={styles.taskInfoLabel}>Type</Text>
              <Text style={styles.taskInfoValue}>{item.taskType}</Text>
            </View>

            <View style={styles.taskInfoItem}>
              <Text style={styles.taskInfoLabel}>Stat</Text>
              <Text style={styles.taskInfoValue}>{item.statType}</Text>
            </View>
          </View>

          <View style={styles.taskInfoRow}>
            <View style={styles.taskInfoItem}>
              <Text style={styles.taskInfoLabel}>Difficulty</Text>
              <Text style={styles.taskInfoValue}>{item.difficulty}</Text>
            </View>

            <View style={styles.taskInfoItem}>
              <Text style={styles.taskInfoLabel}>XP Reward</Text>
              <Text style={styles.taskInfoValue}>{item.xpReward}</Text>
            </View>
          </View>

          <View style={styles.taskInfoRow}>
            <View style={styles.taskInfoItem}>
              <Text style={styles.taskInfoLabel}>Time to Complete</Text>
              <Text style={styles.taskInfoValue}>{item.duration} minutes</Text>
            </View>

            <View style={styles.taskInfoItem}>
              <Text style={styles.taskInfoLabel}>Status</Text>
              <Text style={[
                styles.taskInfoValue,
                item.status === 'completed' && styles.completedText,
                item.status === 'failed' && styles.failedText,
                item.status === 'in-progress' && styles.inProgressText,
              ]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {item.status === 'in-progress' && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>
                Progress: {item.currentProgress}/{item.taskAmount}
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${(item.currentProgress / item.taskAmount) * 100}%` }
                  ]}
                />
              </View>
            </View>
          )}

          {/* Task Action Buttons */}
          <View style={styles.taskButtonsContainer}>
            {item.status === 'pending' && !item.rewardClaimed && (
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => acceptTask(item.id)}
                  disabled={processingTask === item.id}
                >
                  <Text style={styles.buttonText}>Start Task</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => refreshSingleTask(item.id)}
                  disabled={processingTask === item.id}
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
                  style={styles.primaryButton}
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
      </Animated.View>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.status === nextProps.item.status &&
    prevProps.item.currentProgress === nextProps.item.currentProgress &&
    prevProps.processingTask === nextProps.processingTask &&
    prevProps.isExpanded === nextProps.isExpanded
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
  const [expandedTaskId, setExpandedTaskId] = useState(null);

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

          if (userData.recentlyCompletedQuest) {
            setCompletedQuestName(userData.recentlyCompletedQuest.name || 'Co-op Quest');

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

    } catch (error) {
      console.error("Error loading initial tasks:", error);
    }
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

      const stats = {
        strength: userData.stats?.strength || 1,
        intellect: userData.stats?.intellect || 1,
        agility: userData.stats?.agility || 1,
        arcane: userData.stats?.arcane || 1,
        focus: userData.stats?.focus || 1
      };

      const statType = firestoreTask.statType;

      if (statType) {
        if (Array.isArray(statType)) {
          statType.forEach(type => {
            const normalizedType = type.toLowerCase();
            if (stats[normalizedType] !== undefined) {
              stats[normalizedType] += 1;
            }
          });
        } else if (typeof statType === 'string') {
          const normalizedType = statType.toLowerCase();
          if (stats[normalizedType] !== undefined) {
            stats[normalizedType] += 1;
          }
        }
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


      const completedTask = tasks.find(t => t.id === taskId);
      const taskType = completedTask?.taskType?.toLowerCase();

      const completedTasksDoc = await getDoc(doc(db, 'userStats', userId));
      let completedTasks = 0;
      let completedTasksByType = {};
      let streak = 0;

      if (completedTasksDoc.exists()) {
        const statsData = completedTasksDoc.data();
        completedTasks = (statsData.completedTasks || 0) + 1;
        completedTasksByType = statsData.completedTasksByType || {};
        streak = statsData.streak || 0;

        if (taskType) {
          completedTasksByType[taskType] = (completedTasksByType[taskType] || 0) + 1;
        }
      } else {
        completedTasks = 1;
        completedTasksByType = taskType ? { [taskType]: 1 } : {};
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];

      await setDoc(doc(db, 'userStats', userId), {
        completedTasks,
        completedTasksByType,
        lastCompletedDate: today,
        streak,
        lastUpdated: now.toISOString()
      }, { merge: true });

      await updateDailyStreak();

      const achievementUserData = {
        ...updatedUserData,
        completedTasks,
        completedTasksByType,
        streak
      };

      await checkAchievements(achievementUserData);

      if (xpReward > 0) {
        await CoopQuestService.updateQuestProgress(userId, 'xp', xpReward);
      }

      if (statType) {
        let statGainCount = 0;

        if (Array.isArray(statType)) {
          statGainCount = statType.length;
        } else {
          statGainCount = 1;
        }

        await CoopQuestService.updateQuestProgress(userId, 'stat', statGainCount);
      }

    } catch (error) {
      console.error("Error updating user stats:", error);
    } finally {
      setProcessingTask(null);
    }
  }, [tasks, processingTask, updateDailyStreak]);

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

        if (lastDate) {
          const lastDateObj = new Date(lastDate);
          const oneDayAgo = new Date(now);
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);

          if (lastDateObj.toISOString().split('T')[0] === oneDayAgo.toISOString().split('T')[0]) {
            streak += 1;

            await CoopQuestService.updateQuestProgress(userId, 'streak', 1);
          } else if (lastDate !== today) {
            streak = 1;
          }
        } else {
          streak = 1;
        }

        await setDoc(doc(db, 'userStats', userId), {
          lastCompletedDate: today,
          streak: streak,
          lastUpdated: now.toISOString()
        }, { merge: true });
      } else {
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
      return null;
    }

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return null;
      }

      const userPrefsDoc = await getDoc(doc(db, 'userPreferences', userId));
      if (!userPrefsDoc.exists()) {
        return null;
      }

      const preferredTypes = userPrefsDoc.data().taskTypes || [];
      if (!preferredTypes || preferredTypes.length === 0) {
        return null;
      }

      const allAvailableTasks = getTasksForType(preferredTypes);
      if (!allAvailableTasks || allAvailableTasks.length === 0) {
        return null;
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
        return null;
      }

      const randomIndex = Math.floor(Math.random() * eligibleTasks.length);
      const selectedTask = eligibleTasks[randomIndex];

      if (!selectedTask) {
        return null;
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

      return newTask;

    } catch (error) {
      console.error("Error refreshing task:", error);
      return null;
    }
  }, [tasks]);

  const skipTask = useCallback(async (taskId) => {
    await refreshSingleTask(taskId);
  }, [refreshSingleTask]);

  const acceptTask = useCallback(async (taskId) => {
    try {
      if (processingTask === taskId) return;

      setTasks(currentTasks =>
        currentTasks.map(task =>
          task.id === taskId
            ? validateTask({ ...task, status: 'in-progress' })
            : task
        )
      );

      startTimer(taskId);
      await updateFirestore(tasks.map(task =>
        task.id === taskId
          ? validateTask({ ...task, status: 'in-progress' })
          : task
      ), false);
    } catch (error) { }
  }, [processingTask, tasks, updateFirestore, startTimer]);

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

    const userId = auth.currentUser?.uid;
    if (!userId) {
      return;
    }

    if (timerRefs.current[taskId]) {
      clearInterval(timerRefs.current[taskId]);
      delete timerRefs.current[taskId];
    }

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

  const toggleTaskExpand = useCallback((taskId) => {
    setExpandedTaskId(prevId => (prevId === taskId ? null : taskId));
  }, []);

  const renderTask = useCallback(({ item }) => (
    <TaskItem
      item={item}
      processingTask={processingTask}
      isExpanded={expandedTaskId === item.id}
      onToggleExpand={toggleTaskExpand}
      acceptTask={acceptTask}
      completeTask={completeTask}
      incrementProgress={incrementProgress}
      quitTask={quitTask}
      refreshSingleTask={refreshSingleTask}
      formatTime={formatTime}
    />
  ), [
    processingTask, 
    expandedTaskId, 
    toggleTaskExpand, 
    acceptTask, 
    completeTask, 
    incrementProgress, 
    quitTask, 
    refreshSingleTask, 
    formatTime
  ]);

  const getItemLayout = useCallback((_, index) => ({
    length: 150,
    offset: 150 * index,
    index,
  }), []);

  const keyExtractor = useCallback(item => item.id, []);

  return (
    <View style={globalStyles.container}>
      {/* Header Container */}
      <View style={globalStyles.headerContainer}>
        {/* Top row of header with profile, username, level, and currency */}
        <View style={globalStyles.headerTopRow}>
          <TouchableOpacity
            style={globalStyles.profileButton}
            onPress={() => navigation.navigate('Home', { screen: 'ProfileScreen' })}
          >
            <Ionicons name="person-circle-outline" size={30} color="white" />
          </TouchableOpacity>

          <Text style={globalStyles.username}>{userStats.username}</Text>

          <View style={styles.levelContainer}>
            <Text style={globalStyles.levelText}>Level {userStats.level}</Text>
          </View>

          <TouchableOpacity
            style={styles.achievementsButton}
            onPress={() => navigation.navigate('Achievements')}
          >
            <Ionicons name="trophy" size={24} color="white" />
          </TouchableOpacity>

          <View style={globalStyles.currencyContainer}>
            <Image
              source={require('../../../assets/coin.png')}
              style={globalStyles.currencyIcon}
            />
            <Text style={globalStyles.currencyText}>{userStats.currency}</Text>
          </View>
        </View>

        <View style={globalStyles.xpContainer}>
          <View style={globalStyles.xpBarContainer}>
            <View
              style={[
                globalStyles.xpBar,
                { width: `${calculateXpProgress()}%` }
              ]}
            />
            <Text style={globalStyles.xpText}>XP: {userStats.xp} / 1000</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  levelContainer: {
    backgroundColor: '#152551',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#afe8ff',
  },
  achievementsButton: {
    padding: 5,
    marginRight: 10,
    backgroundColor: '#152551',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#afe8ff',
  },
  taskItemContainer: {
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  taskCard: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 2,
    borderColor: '#1c2d63',
  },
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: '#333',
    flex: 1,
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
  taskDetailsContainer: {
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#1c2d63',
  },
  taskDetailsContent: {
    padding: 16,
  },
  taskInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  taskInfoItem: {
    width: '48%',
  },
  taskInfoLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    marginBottom: 4,
  },
  taskInfoValue: {
    fontSize: 16,
    color: '#444',
    fontWeight: '600',
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
  progressContainer: {
    marginVertical: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#444',
  },
  progressBarContainer: {
    height: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 9,
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
  taskButtonsContainer: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#1c2d63', 
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
  },
  progressButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
  },
  failButton: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 20,
  },
});

export default TasksScreen;