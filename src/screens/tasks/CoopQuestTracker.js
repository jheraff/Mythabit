import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Animated,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CoopQuestService from './CoopQuestService';
import { auth, db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';

const CoopQuestTracker = () => {
  const [activeQuests, setActiveQuests] = useState([]);
  const [expandedQuest, setExpandedQuest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  
  const heightAnim = React.useRef(new Animated.Value(0)).current;
  const currentUserId = auth.currentUser?.uid;
  
  useEffect(() => {
    if (!currentUserId) return;
    
    setIsLoading(true);
    
    // Listen to user document changes to catch any updates to activeCoopQuests array
    const userUnsubscribe = onSnapshot(doc(db, 'users', currentUserId), 
      async (userDoc) => {
        if (userDoc.exists()) {
          const activeQuestIds = userDoc.data().activeCoopQuests || [];
          
          if (activeQuestIds.length === 0) {
            setActiveQuests([]);
            setIsLoading(false);
            return;
          }
          
          // Instead of manually fetching each quest, use a query to listen for changes
          // to all active quests for this user
          const coopQuestsQuery = query(
            collection(db, 'coopQuests'),
            where('participants', 'array-contains', currentUserId),
            where('status', '==', 'active')
          );
          
          const questsUnsubscribe = onSnapshot(coopQuestsQuery, 
            async (snapshot) => {
              try {
                if (snapshot.empty) {
                  setActiveQuests([]);
                  setIsLoading(false);
                  return;
                }
                
                // Process the quest documents
                const questsWithPartners = await Promise.all(snapshot.docs.map(async (questDoc) => {
                  const questData = questDoc.data();
                  const partnerId = questData.participants.find(id => id !== currentUserId);
                  
                  if (partnerId) {
                    const partnerDoc = await getDoc(doc(db, 'users', partnerId));
                    const partnerName = partnerDoc.exists() 
                      ? partnerDoc.data().username || 'Partner' 
                      : 'Unknown User';
                    
                    return { 
                      id: questDoc.id,
                      ...questData,
                      partnerName 
                    };
                  }
                  
                  return { 
                    id: questDoc.id,
                    ...questData,
                    partnerName: 'Partner'
                  };
                }));
                
                setActiveQuests(questsWithPartners);
                
                // If we have exactly one quest, expand it by default
                if (questsWithPartners.length === 1 && !expandedQuest) {
                  setExpandedQuest(questsWithPartners[0].id);
                }
              } catch (error) {
                console.error('Error processing quests:', error);
              } finally {
                setIsLoading(false);
              }
            },
            (error) => {
              console.error('Error in quests listener:', error);
              setIsLoading(false);
            }
          );
          
          // Return cleanup function to unsubscribe from the quests listener
          return () => questsUnsubscribe();
        } else {
          setActiveQuests([]);
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Error in user listener:', error);
        setIsLoading(false);
      }
    );
    
    // Return cleanup function to unsubscribe from the user listener
    return () => userUnsubscribe();
  }, [currentUserId]);
  
  useEffect(() => {
    // Animate the height when collapsed state changes
    Animated.timing(heightAnim, {
      toValue: collapsed ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [collapsed, heightAnim]);
  
  // If there are no active quests, don't render anything
  if (activeQuests.length === 0 && !isLoading) {
    return null;
  }
  
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  
  const toggleQuestExpanded = (questId) => {
    setExpandedQuest(expandedQuest === questId ? null : questId);
  };
  
  const renderQuestItem = ({ item }) => {
    const isExpanded = expandedQuest === item.id;
    const totalProgress = item.progress?.total || 0;
    const targetValue = item.target || 1;
    const progressPercentage = Math.min((totalProgress / targetValue) * 100, 100);
    
    const userProgress = item.progress?.[currentUserId] || 0;
    const partnerId = item.participants.find(id => id !== currentUserId);
    const partnerProgress = partnerId ? (item.progress?.[partnerId] || 0) : 0;
    
    return (
      <TouchableOpacity 
        style={styles.questItem} 
        onPress={() => toggleQuestExpanded(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.questHeader}>
          <View style={styles.questTitleContainer}>
            <Ionicons 
              name="trophy-outline" 
              size={20} 
              color="#6366f1" 
              style={styles.questIcon}
            />
            <Text style={styles.questTitle}>{item.questName}</Text>
          </View>
          
          <View style={styles.progressDisplay}>
            <Text style={styles.progressText}>
              {Math.round(progressPercentage)}%
            </Text>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#666"
            />
          </View>
        </View>
        
        {isExpanded && (
          <View style={styles.questDetails}>
            <Text style={styles.questDescription}>{item.description}</Text>
            
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar,
                  { width: `${progressPercentage}%` }
                ]} 
              />
            </View>
            
            <Text style={styles.progressInfo}>
              Progress: {totalProgress}/{targetValue}
            </Text>
            
            <View style={styles.contributionsContainer}>
              <View style={styles.contributionItem}>
                <Text style={styles.contributionLabel}>Your contribution:</Text>
                <Text style={styles.contributionValue}>{userProgress}</Text>
              </View>
              
              <View style={styles.contributionItem}>
                <Text style={styles.contributionLabel}>{item.partnerName}'s contribution:</Text>
                <Text style={styles.contributionValue}>{partnerProgress}</Text>
              </View>
            </View>
            
            <View style={styles.rewardsSection}>
              <Text style={styles.rewardsTitle}>Rewards:</Text>
              <Text style={styles.rewardItem}>• {item.rewards.xp} XP</Text>
              <Text style={styles.rewardItem}>• {item.rewards.currency} Coins</Text>
              {item.rewards.statBonus && (
                <Text style={styles.rewardItem}>
                  • Stat Bonus: +{item.rewards.statBonus.amount} {item.rewards.statBonus.type}
                </Text>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.headerContainer}
        onPress={toggleCollapse}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="people" size={22} color="#fff" />
          <Text style={styles.headerTitle}>
            Co-op Quests {activeQuests.length > 0 ? `(${activeQuests.length})` : ''}
          </Text>
        </View>
        <Ionicons
          name={collapsed ? "chevron-down" : "chevron-up"}
          size={22}
          color="#fff"
        />
      </TouchableOpacity>
      
      <Animated.View
        style={[
          styles.contentContainer,
          {
            maxHeight: heightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 500]  // Adjust max height as needed
            }),
            opacity: heightAnim
          }
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.loadingText}>Loading co-op quests...</Text>
          </View>
        ) : (
          <FlatList
            data={activeQuests}
            renderItem={renderQuestItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.questList}
            scrollEnabled={false}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  contentContainer: {
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  questList: {
    paddingVertical: 8,
  },
  questItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  questIcon: {
    marginRight: 8,
  },
  questTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  progressDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366f1',
    marginRight: 4,
  },
  questDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  questDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  contributionsContainer: {
    marginBottom: 10,
  },
  contributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  contributionLabel: {
    fontSize: 13,
    color: '#666',
  },
  contributionValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  rewardsSection: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 4,
  },
  rewardsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  rewardItem: {
    fontSize: 13,
    color: '#444',
  },
});

export default CoopQuestTracker;