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
    },
    inventory: {
      helmet: null,
      chestplate: null,
      leggings: null,
      boots: null,
      weapon: null,
      gear: null
    }
  });

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

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
            },
            inventory: {
              helmet: userData.inventory?.helmet || null,
              chestplate: userData.inventory?.chestplate || null,
              leggings: userData.inventory?.leggings || null,
              boots: userData.inventory?.boots || null,
              weapon: userData.inventory?.weapon || null,
              gear: userData.inventory?.gear || null
            }
          };
          setUserStats(completeUserStats);
        } else {
          initializeNewUser(userId);
        }
      },
      (error) => {
        console.error(error);
      }
    );

    return () => {
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
      inventory: {
        helmet: null,
        chestplate: null,
        leggings: null,
        boots: null,
        weapon: null,
        gear: null
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

      completedTasks.forEach(task => {
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

      await setDoc(userDocRef, {
        ...updatedStats,
        lastUpdated: new Date().toISOString()
      });

      const activeTasksDoc = await getDoc(activeTasksRef);
      if (!activeTasksDoc.exists()) return;

      const currentTasks = activeTasksDoc.data().tasks;
      const updatedTasks = currentTasks.map(task => ({
        ...task,
        processed: task.status === 'completed' ? true : task.processed
      }));

      await setDoc(activeTasksRef, { tasks: updatedTasks });

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
      return (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={80} color="#666" />
        </View>
      );
    }

    return (
      <Image
        source={require('../../../assets/avatars/default_pfp.jpg')}
        style={styles.avatarImage}
        resizeMode="contain"
      />
    );
  };

  const renderInventorySlot = (slotType, slotName) => {
    const item = userStats.inventory[slotType];
    
    return (
      <TouchableOpacity 
        style={styles.inventorySlot}
        onPress={() => navigation.navigate('ItemScreen', { activeSlot: slotType })}
      >
        {item ? (
          <Image 
            source={{ uri: item.imageUri }}
            style={styles.itemImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.emptySlot}>
            <Ionicons 
              name={getSlotIcon(slotType)} 
              size={24} 
              color="#aaa" 
            />
          </View>
        )}
        <Text style={styles.slotName}>{slotName}</Text>
      </TouchableOpacity>
    );
  };

  const getSlotIcon = (slotType) => {
    switch(slotType) {
      case 'helmet':
        return 'shield-outline';
      case 'chestplate':
        return 'shirt-outline';
      case 'leggings':
        return 'resize-outline';
      case 'boots':
        return 'footsteps-outline';
      case 'weapon':
        return 'flash-outline';
      case 'gear':
        return 'cog-outline';
      default:
        return 'help-outline';
    }
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
            <Ionicons name="person-circle-outline" size={30} color="#afe8ff" />
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

      {/* Avatar Box Section */}
      <View style={styles.avatarBoxContainer}>
        <View style={styles.avatarBox}>
          {renderAvatar()}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsHeader}>STATS</Text>
        {renderStatBar('Strength', userStats.stats.strength)}
        {renderStatBar('Intellect', userStats.stats.intellect)}
        {renderStatBar('Agility', userStats.stats.agility)}
        {renderStatBar('Arcane', userStats.stats.arcane)}
        {renderStatBar('Focus', userStats.stats.focus)}
      </View>

      {/* Inventory Section */}
      <View style={styles.inventoryContainer}>
        <Text style={styles.inventoryHeader}>Equipment</Text>
        <View style={styles.inventorySlotsContainer}>
          {renderInventorySlot('helmet', 'Helmet')}
          {renderInventorySlot('chestplate', 'Chest')}
          {renderInventorySlot('leggings', 'Legs')}
          {renderInventorySlot('boots', 'Boots')}
          {renderInventorySlot('weapon', 'Weapon')}
          {renderInventorySlot('gear', 'Gear')}
        </View>
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

  headerContainer: {
    backgroundColor: '#1c2d63',
    paddingVertical: 15,
    borderBottomWidth: 4,
    borderBottomColor: '#afe8ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
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
    backgroundColor: '#152551',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#afe8ff',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  levelContainer: {
    backgroundColor: '#152551',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#afe8ff',
  },
  levelText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  currencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#152551',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#afe8ff',
  },
  currencyIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#afe8ff', 
  },
  xpContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 5,
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
    backgroundColor: '#152551',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#afe8ff',
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#4287f5',
    position: 'absolute',
    left: 0,
    top: 0,
  },
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
    borderColor: '#1c2d63',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarBox: {
    width: 200,
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1c2d63',
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
    backgroundColor: '#528aae', 
  },
  statValue: {
    position: 'absolute',
    right: 8,
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inventoryContainer: {
    padding: 20,
    paddingTop: 0,
  },
  inventoryHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inventorySlotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  inventorySlot: {
    width: '16%',
    aspectRatio: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  emptySlot: {
    width: '100%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  itemImage: {
    width: '100%',
    height: '70%',
  },
  slotName: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
});

export default HomeScreen;