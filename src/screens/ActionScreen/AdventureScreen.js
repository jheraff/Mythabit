import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const AdventureScreen = () => {
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

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

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
          setUserStats(completeUserStats);
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

  const calculateXpProgress = () => {
    return (userStats.xp / 1000) * 100;
  };

  const handleStartAdventure = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const updatedCurrency = userDoc.data().currency + 10;

        await updateDoc(userDocRef, {
          currency: updatedCurrency,
          lastUpdated: new Date().toISOString()
        });

        // The onSnapshot listener will update the userStats state automatically
      }
    } catch (error) {
      console.error('Error updating currency:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Container - Same as HomeScreen */}
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

      {/* Adventure Content */}
      <View style={styles.adventureContainer}>
        <Text style={styles.title}>Adventure</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartAdventure}
          >
            <Text style={styles.startButtonText}>Start An Adventure</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  adventureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '80%',
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default AdventureScreen;