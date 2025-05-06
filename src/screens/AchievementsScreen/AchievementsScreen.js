import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import achievementsData from '../../data/achievements/achievements.json';
import { globalStyles } from '../../../styles/globalStyles';

const AchievementsScreen = () => {
  const navigation = useNavigation();
  const [achievements, setAchievements] = useState([]);
  const [filteredAchievements, setFilteredAchievements] = useState([]);
  const [showOnlyCompleted, setShowOnlyCompleted] = useState(false);
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
  const [loading, setLoading] = useState(true);

  // Calculate XP progress for progress bar
  const calculateXpProgress = () => {
    return (userStats.xp / 1000) * 100;
  };

  // Toggle filter between all and completed achievements
  const toggleCompletedFilter = () => {
    setShowOnlyCompleted(!showOnlyCompleted);
  };

  // Filter achievements based on current filter state
  useEffect(() => {
    if (showOnlyCompleted) {
      setFilteredAchievements(achievements.filter(a => a.unlocked && !a.rewardClaimed));
    } else {
      setFilteredAchievements(achievements);
    }
  }, [achievements, showOnlyCompleted]);

  // Load user stats
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
        }
      },
      (error) => {
        console.error("Error fetching user data:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Load achievements
  useEffect(() => {
    const loadAchievements = async () => {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // Get user achievement data from Firestore
        const userAchievementsDoc = await getDoc(doc(db, 'userAchievements', userId));
        const userAchievements = userAchievementsDoc.exists() 
          ? userAchievementsDoc.data().achievements || {} 
          : {};

        // Merge achievement data from achievements.json with user progress
        const mergedAchievements = achievementsData.achievements.map(achievement => {
          const userAchievement = userAchievements[achievement.id] || {};
          return {
            ...achievement,
            progress: userAchievement.progress || 0,
            unlocked: userAchievement.unlocked || false,
            rewardClaimed: userAchievement.rewardClaimed || false,
            dateUnlocked: userAchievement.dateUnlocked || null
          };
        });

        setAchievements(mergedAchievements);
      } catch (error) {
        console.error("Error loading achievements:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, []);

  // Listen for achievement updates
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'userAchievements', userId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userAchievements = docSnapshot.data().achievements || {};
          
          setAchievements(prevAchievements => 
            prevAchievements.map(achievement => {
              const userAchievement = userAchievements[achievement.id] || {};
              return {
                ...achievement,
                progress: userAchievement.progress || 0,
                unlocked: userAchievement.unlocked || false,
                rewardClaimed: userAchievement.rewardClaimed || false,
                dateUnlocked: userAchievement.dateUnlocked || null
              };
            })
          );
        }
      },
      (error) => {
        console.error("Error listening to achievement updates:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const claimAchievementReward = async (achievementId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || !achievement.unlocked || achievement.rewardClaimed) {
      return;
    }

    try {
      // Update user stats with rewards
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return;
      }

      const userData = userDoc.data();
      const currentXP = userData.xp || 0;
      const currentCurrency = userData.currency || 0;
      
      const newXP = currentXP + achievement.xpReward;
      const newCurrency = currentCurrency + achievement.currencyReward;

      let level = userData.level || 1;
      let finalXP = newXP;

      // Level up logic
      if (newXP >= 1000) {
        const levelsGained = Math.floor(newXP / 1000);
        const newLevel = level + levelsGained;
        const remainingXP = newXP % 1000;
        level = newLevel;
        finalXP = remainingXP;
      }

      // Update user document
      await setDoc(userRef, {
        ...userData,
        xp: finalXP,
        level: level,
        currency: newCurrency,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      // Mark achievement reward as claimed
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      const userAchievementsDoc = await getDoc(userAchievementsRef);
      
      const userAchievements = userAchievementsDoc.exists() 
        ? userAchievementsDoc.data().achievements || {} 
        : {};

      await setDoc(userAchievementsRef, {
        achievements: {
          ...userAchievements,
          [achievementId]: {
            ...userAchievements[achievementId],
            rewardClaimed: true
          }
        }
      }, { merge: true });

      // Update local state
      setAchievements(prevAchievements => 
        prevAchievements.map(a => 
          a.id === achievementId 
            ? { ...a, rewardClaimed: true } 
            : a
        )
      );
    } catch (error) {
      console.error("Error claiming achievement reward:", error);
    }
  };

  const renderAchievement = ({ item }) => {
    const progressPercentage = item.requirement && item.requirement.count > 0
      ? Math.min((item.progress / item.requirement.count) * 100, 100)
      : 0;

    return (
      <View style={[
        styles.achievementCard,
        item.unlocked ? styles.unlockedCard : styles.lockedCard
      ]}>
        <View style={styles.achievementHeader}>
          <View style={styles.achievementTitleContainer}>
            <Text style={styles.achievementName}>{item.name}</Text>
            <Text style={styles.achievementDescription}>{item.description}</Text>
          </View>
        </View>

        <View style={styles.achievementContent}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar,
                  { width: `${progressPercentage}%` },
                  item.unlocked ? styles.progressCompleted : {}
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {item.progress || 0}/{item.requirement.count}
            </Text>
          </View>

          <View style={styles.rewardsContainer}>
            {item.xpReward > 0 && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardLabel}>XP:</Text>
                <Text style={styles.rewardValue}>{item.xpReward}</Text>
              </View>
            )}
            {item.currencyReward > 0 && (
              <View style={styles.rewardItem}>
                <Image
                  source={require('../../../assets/coin.png')}
                  style={globalStyles.currencyIcon}
                />
                <Text style={styles.rewardValue}>{item.currencyReward}</Text>
              </View>
            )}
          </View>

          {item.unlocked && !item.rewardClaimed && (
            <TouchableOpacity
              style={styles.claimButton}
              onPress={() => claimAchievementReward(item.id)}
            >
              <Text style={styles.claimButtonText}>Claim Reward</Text>
            </TouchableOpacity>
          )}

          {item.unlocked && item.rewardClaimed && (
            <View style={styles.claimedBadge}>
              <Text style={styles.claimedText}>Claimed</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={globalStyles.container}>
      {/* Header Container */}
      <View style={[globalStyles.headerContainer, { backgroundColor: '#434', borderBottomColor: 'rgb(238, 198, 182)' }]}>
        {/* Top row of header with profile, username, level, and currency */}
        <View style={globalStyles.headerTopRow}>
          <TouchableOpacity
            style={[globalStyles.backButton, { backgroundColor: 'rgb(109, 85, 109)', borderColor: 'rgb(238, 198, 182)' }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>

          <Text style={globalStyles.username}>{userStats.username}</Text>

          <View style={[globalStyles.levelContainer, { backgroundColor: 'rgb(109, 85, 109)', borderColor: 'rgb(238, 198, 182)' }]}>
            <Text style={globalStyles.levelText}>Level {userStats.level}</Text>
          </View>

          <View style={[globalStyles.currencyContainer, { backgroundColor: 'rgb(109, 85, 109)', borderColor: 'rgb(238, 198, 182)' }]}>
            <Image
              source={require('../../../assets/coin.png')}
              style={globalStyles.currencyIcon}
            />
            <Text style={globalStyles.currencyText}>{userStats.currency}</Text>
          </View>
        </View>

        <View style={globalStyles.xpContainer}>
          <View style={[globalStyles.xpBarContainer, { backgroundColor: 'rgba(255, 255, 255, 0.3)', borderColor: 'rgb(92, 255, 113)' }]}>
            <View
              style={[
                globalStyles.xpBar,
                { width: `${calculateXpProgress()}%`, backgroundColor: '#4CAF50' }
              ]}
            />
            <Text style={[globalStyles.xpText, { color: '#f3f3f3' }]}>XP: {userStats.xp} / 1000</Text>
          </View>
        </View>
      </View>

      {/* Title and Filter */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>Achievements</Text>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            showOnlyCompleted && styles.filterButtonActive
          ]} 
          onPress={toggleCompletedFilter}
        >
          <Text style={[
            styles.filterButtonText,
            showOnlyCompleted && styles.filterButtonTextActive
          ]}>
            {showOnlyCompleted ? "Show All" : "Show Claimable"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Achievement List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      ) : filteredAchievements.length > 0 ? (
        <FlatList
          data={filteredAchievements}
          renderItem={renderAchievement}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {showOnlyCompleted 
              ? "No claimable achievements yet. Keep completing tasks!" 
              : "No achievements found."}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  titleContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 30,
    //fontWeight: 'bold',
    fontFamily: 'morris-roman',
    color: '#f3f3f3',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  achievementCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
  },
  unlockedCard: {
    backgroundColor: '#f8f9fa',
    borderColor: '#4CAF50',
  },
  lockedCard: {
    backgroundColor: '#f8f9fa',
    borderColor: '#9e9e9e',
    opacity: 0.8,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementTitleContainer: {
    flex: 1,
  },
  achievementName: {
    fontSize: 22,
    //fontWeight: 'bold',
    fontFamily: 'morris-roman',
    color: '#333',
  },
  achievementDescription: {
    fontSize: 18,
    fontFamily: 'morris-roman',
    color: '#666',
    marginTop: 2,
  },
  achievementContent: {
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  progressCompleted: {
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  rewardsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  rewardLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  rewardValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  claimButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  claimedBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  claimedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default AchievementsScreen;