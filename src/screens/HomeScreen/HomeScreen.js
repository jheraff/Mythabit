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
    avatar: null,
    stats: {
      strength: 1,
      intellect: 1,
      agility: 1,
      arcane: 1,
      focus: 1
    }
  });

  // Add this improved useEffect to your HomeScreen.js
  // Replace the existing useEffect that sets up the user stats listener

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    console.log("🏠 Setting up user stats listener in HomeScreen");

    // Set up a real-time listener with improved error handling
    const unsubscribeUserStats = onSnapshot(
      doc(db, 'users', userId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();

          // Create complete user stats object, ensuring all fields exist
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

          console.log("🏠 Setting userStats state with:", completeUserStats);
          setUserStats(completeUserStats);
        } else {
          console.log("🏠 No user document found, initializing new user");
          initializeNewUser(userId);
        }
      },
      (error) => {
        console.error("🏠 Error listening to user stats:", error);
      }
    );

    return () => {
      console.log("🏠 Cleaning up user stats listener");
      unsubscribeUserStats();
    };
  }, []);

  const initializeNewUser = async (userId) => {
    // Initialize new user stats
    const initialStats = {
      username: auth.currentUser?.displayName || 'New User',
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
      },
      lastUpdated: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', userId), initialStats);
      setUserStats(initialStats);
    } catch (error) {
      console.error('Error initializing new user:', error);
    }
  };

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

      // Update user document
      await setDoc(userDocRef, {
        ...updatedStats,
        lastUpdated: new Date().toISOString()
      });

      // Mark tasks as processed
      const activeTasksDoc = await getDoc(activeTasksRef);
      if (!activeTasksDoc.exists()) return;

      const currentTasks = activeTasksDoc.data().tasks;
      const updatedTasks = currentTasks.map(task => ({
        ...task,
        processed: task.status === 'completed' ? true : task.processed
      }));

      await setDoc(activeTasksRef, { tasks: updatedTasks });

      // The onSnapshot listener will update the userStats state automatically

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

  // Function to render the avatar based on the customization options
  const renderAvatar = () => {
    if (!userStats.avatar) {
      // Default placeholder when no avatar is set
      return (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={80} color="#666" />
        </View>
      );
    }

    // If there's avatar data, render just the avatar image
    return (
      <Image
        source={require('../../../assets/avatars/placeholder.png')}
        style={styles.avatarImage}
        resizeMode="contain"
      />
    );
  };

  return (
    <ScrollView style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
      bounces={true}
    >
      <View style={styles.headerContainer}>
        {/* Top row of header with profile, username, level, and currency */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('ProfileScreen')}
          >
            <Ionicons name="person-circle-outline" size={30} color="white" />
          </TouchableOpacity>

          <Text style={styles.username}>{userStats.username}</Text>

          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>Level {userStats.level}</Text>
          </View>

          <View style={styles.currencyContainer}>
            <Image
              source={require('../../../assets/coin.png')}
              style={styles.currencyIcon}
            />
            <Text style={styles.currencyText}>{userStats.currency}</Text>
          </View>
        </View>

        {/* XP bar row */}
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
      </View>

      {/* Avatar Box Section */}
      <View style={styles.avatarBoxContainer}>
        <View style={styles.avatarBox}>
          {renderAvatar()}
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
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  // Updated header styles
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
  // XP bar styles - now part of header
  xpContainer: {
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  xpText: {
    fontSize: 12,
    marginBottom: 4,
    color: '#ffffff',
  },
  xpBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  // Avatar styles
  avatarBoxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  avatarBox: {
    width: 200,
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F67B7B',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  // Stats styles
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