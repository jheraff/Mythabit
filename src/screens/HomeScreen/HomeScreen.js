import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [userStats, setUserStats] = useState({
    username: '',
    level: 1,
    xp: 0,
    currency: 0,
    stats: {
      strength: 1,
      intellect: 1,
      agility: 1,
      arcane: 1,
      focus: 1
    }
  });

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Initial load of user stats
    const loadUserStats = async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserStats(userDoc.data());
      } else {
        // Initialize new user stats
        const initialStats = {
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
          }
        };
        await setDoc(doc(db, 'users', userId), initialStats);
        setUserStats(initialStats);
      }
    };

    loadUserStats();

    // Listen for completed tasks to update stats
    const unsubscribeTasks = onSnapshot(
      doc(db, 'activeTasks', userId),
      async (snapshot) => {
        if (!snapshot.exists()) return;

        const tasks = snapshot.data().tasks;
        const completedTasks = tasks.filter(
          task => task.status === 'completed' && !task.processed
        );

        if (completedTasks.length > 0) {
          await processCompletedTasks(completedTasks);
        }
      }
    );

    return () => unsubscribeTasks();
  }, []);

  const processCompletedTasks = async (completedTasks) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userDocRef = doc(db, 'users', userId);
    const activeTasksRef = doc(db, 'activeTasks', userId);

    try {
      // Get current user stats
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) return;

      const currentStats = userDoc.data();
      let updatedStats = { ...currentStats };
      let totalXpGained = 0;

      // Process each completed task
      completedTasks.forEach(task => {
        // Add XP
        totalXpGained += task.xpReward || 0;

        // Increase the corresponding stat based on statType
        const statToUpdate = task.statType.toLowerCase();
        if (updatedStats.stats && statToUpdate in updatedStats.stats) {
          updatedStats.stats[statToUpdate] += task.taskAmount || 1;
        }
      });

      // Add XP and check for level up
      updatedStats.xp += totalXpGained;
      const levelsGained = Math.floor(updatedStats.xp / 1000);
      if (levelsGained > 0) {
        updatedStats.level += levelsGained;
        updatedStats.xp = updatedStats.xp % 1000;
      }

      // Update user stats in Firestore
      await setDoc(userDocRef, updatedStats);

      // Mark tasks as processed
      const activeTasksDoc = await getDoc(activeTasksRef);
      if (!activeTasksDoc.exists()) return;

      const currentTasks = activeTasksDoc.data().tasks;
      const updatedTasks = currentTasks.map(task => ({
        ...task,
        processed: task.status === 'completed' ? true : task.processed
      }));

      await setDoc(activeTasksRef, { tasks: updatedTasks });

      // Update local state
      setUserStats(updatedStats);

    } catch (error) {
      console.error('Error processing completed tasks:', error);
    }
  };

  const calculateXpProgress = () => {
    return (userStats.xp / 1000) * 100;
  };

  const renderStatBar = (statName, value) => (
    <View style={styles.statContainer}>
      <Text style={styles.statLabel}>{statName}</Text>
      <View style={styles.statBarContainer}>
        <View
          style={[
            styles.statBar,
            { width: `${(value / 100) * 100}%` }
          ]}
        />
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}  // Shows scroll indicator
      bounces={true}  // Enables bounce effect when scrolling
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <Ionicons name="person-circle-outline" size={30} color="black" />
        </TouchableOpacity>

        <View style={styles.userInfoContainer}>
          <Text style={styles.username}>{userStats.username}</Text>
          <Text style={styles.levelText}>Level {userStats.level}</Text>
        </View>

        <View style={styles.currencyContainer}>
          <Image
            source={require('../../../assets/coin.png')} // Adjust the path to your image
            style={styles.currencyIcon}
          />
          <Text style={styles.currencyText}>{userStats.currency}</Text>
        </View>
      </View>

      <View style={styles.xpContainer}>
        <Text style={styles.xpText}>XP: {userStats.xp} / 1000</Text>
        <View style={styles.xpBarContainer}>
          <View
            style={[
              styles.xpBar,
              { width: `${calculateXpProgress()}%` }
            ]}
          />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsHeader}>Stats</Text>
        {renderStatBar('Strength', userStats.stats.strength)}
        {renderStatBar('Intellect', userStats.stats.intellect)}
        {renderStatBar('Agility', userStats.stats.agility)}
        {renderStatBar('Arcane', userStats.stats.arcane)}
        {renderStatBar('Focus', userStats.stats.focus)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopWidth: 45,
    borderTopColor: 'black'
  },
  contentContainer: {
    flexGrow: 1,  // This ensures content can grow and be scrollable
    paddingBottom: 20, // Adds padding at the bottom for better scrolling
  },
  header: {
    padding: 20,
    backgroundColor: '#444',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfoContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  profileButton: {
    padding: 5,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff',
  },
  levelText: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
  },
  currencyContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  currencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyIcon: {
    width: 24,  // Adjust size as needed
    height: 24, // Adjust size as needed
    marginRight: 5, // Space between icon and number
  },
  xpContainer: {
    padding: 20,
  },
  xpText: {
    fontSize: 12,
    marginBottom: 4,
  },
  xpBarContainer: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  statsContainer: {
    padding: 20,
  },
  statsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statContainer: {
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statBarContainer: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBar: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  statValue: {
    position: 'absolute',
    right: 8,
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HomeScreen;