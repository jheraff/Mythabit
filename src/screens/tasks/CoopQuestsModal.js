import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CoopQuestService from './CoopQuestService';
import { auth } from '../../firebase/config';

const CoopQuestsModal = ({ visible, onClose, partnerId, partnerName }) => {
  const [availableQuests, setAvailableQuests] = useState([]);
  const [activeQuests, setActiveQuests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('available'); // 'available' or 'active'
  const [initiatingQuestId, setInitiatingQuestId] = useState(null);
  
  const currentUserId = auth.currentUser?.uid;
  
  useEffect(() => {
    if (visible) {
      loadQuests();
    }
  }, [visible]);
  
  const loadQuests = async () => {
    setIsLoading(true);
    try {
      // Get available quests
      const questsData = CoopQuestService.getAvailableQuests();
      setAvailableQuests(questsData);
      
      // Get active quests with this partner
      if (currentUserId) {
        const userActiveQuests = await CoopQuestService.getUserActiveQuests(currentUserId);
        // Filter only quests with the selected partner
        const partnerQuests = userActiveQuests.filter(quest => 
          quest.participants.includes(partnerId)
        );
        setActiveQuests(partnerQuests);
      }
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const initiateQuest = async (questId) => {
    setInitiatingQuestId(questId);
    try {
      const result = await CoopQuestService.initiateQuest(
        questId,
        currentUserId,
        partnerId
      );
      
      if (result.success) {
        // Switch to active tab to show the new quest
        await loadQuests();
        setSelectedTab('active');
      } else {
        // Show error message (in a production app, add an error notification here)
        console.error(result.error);
      }
    } catch (error) {
      console.error('Error initiating quest:', error);
    } finally {
      setInitiatingQuestId(null);
    }
  };
  
  const formatDuration = (durationMs) => {
    const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };
  
  const renderQuestItem = ({ item }) => (
    <View style={styles.questCard}>
      <Text style={styles.questName}>{item.name}</Text>
      <Text style={styles.questDescription}>{item.description}</Text>
      
      <View style={styles.questDetails}>
        <Text style={styles.questDetail}>
          <Text style={styles.detailLabel}>Type: </Text>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </Text>
        <Text style={styles.questDetail}>
          <Text style={styles.detailLabel}>Target: </Text>
          {item.target} {item.type === 'xp' ? 'XP' : item.type === 'tasks' ? 'tasks' : 'points'}
        </Text>
        <Text style={styles.questDetail}>
          <Text style={styles.detailLabel}>Duration: </Text>
          {formatDuration(item.duration)}
        </Text>
      </View>
      
      <View style={styles.rewardsContainer}>
        <Text style={styles.rewardsTitle}>Rewards:</Text>
        <View style={styles.rewardsList}>
          <Text style={styles.rewardItem}>• {item.rewards.xp} XP</Text>
          <Text style={styles.rewardItem}>• {item.rewards.currency} Coins</Text>
          {item.rewards.statBonus && (
            <Text style={styles.rewardItem}>
              • +{item.rewards.statBonus.amount} {item.rewards.statBonus.type === 'random' 
                ? 'Random Stat' 
                : item.rewards.statBonus.type === 'all' 
                  ? 'All Stats'
                  : item.rewards.statBonus.type === 'chosen'
                    ? 'Stat of Your Choice'
                    : `${item.rewards.statBonus.type.charAt(0).toUpperCase() + item.rewards.statBonus.type.slice(1)}`}
            </Text>
          )}
          {item.rewards.achievement && (
            <Text style={styles.rewardItem}>• Special Achievement</Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.initiateButton,
          initiatingQuestId === item.id && styles.initiatingButton
        ]}
        onPress={() => initiateQuest(item.id)}
        disabled={initiatingQuestId !== null}
      >
        {initiatingQuestId === item.id ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.initiateButtonText}>
            Start Quest with {partnerName}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
  
  const renderActiveQuestItem = ({ item }) => {
    const totalProgress = item.progress?.total || 0;
    const targetValue = item.target || 1;
    const progressPercentage = Math.min((totalProgress / targetValue) * 100, 100);
    
    const userProgress = item.progress?.[currentUserId] || 0;
    const partnerProgress = item.progress?.[partnerId] || 0;
    
    return (
      <View style={styles.questCard}>
        <Text style={styles.questName}>{item.questName}</Text>
        <Text style={styles.questDescription}>{item.description}</Text>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Progress: {totalProgress}/{targetValue} ({Math.round(progressPercentage)}%)
          </Text>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar,
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.participantProgress}>
          <Text style={styles.participantLabel}>Your contribution:</Text>
          <Text style={styles.participantValue}>{userProgress} ({Math.round((userProgress / Math.max(totalProgress, 1)) * 100)}%)</Text>
          
          <Text style={styles.participantLabel}>{partnerName}'s contribution:</Text>
          <Text style={styles.participantValue}>{partnerProgress} ({Math.round((partnerProgress / Math.max(totalProgress, 1)) * 100)}%)</Text>
        </View>
        
        <View style={styles.rewardsContainer}>
          <Text style={styles.rewardsTitle}>Rewards upon completion:</Text>
          <View style={styles.rewardsList}>
            <Text style={styles.rewardItem}>• {item.rewards.xp} XP</Text>
            <Text style={styles.rewardItem}>• {item.rewards.currency} Coins</Text>
            {item.rewards.statBonus && (
              <Text style={styles.rewardItem}>
                • +{item.rewards.statBonus.amount} {item.rewards.statBonus.type === 'random' 
                  ? 'Random Stat' 
                  : item.rewards.statBonus.type === 'all' 
                    ? 'All Stats'
                    : item.rewards.statBonus.type === 'chosen'
                      ? 'Stat of Your Choice'
                      : `${item.rewards.statBonus.type.charAt(0).toUpperCase() + item.rewards.statBonus.type.slice(1)}`}
              </Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.abandonButton}
          onPress={() => abandonQuest(item.id)}
        >
          <Text style={styles.abandonButtonText}>Abandon Quest</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const abandonQuest = async (questId) => {
    // In a real app, you'd want to add a confirmation dialog here
    try {
      const result = await CoopQuestService.abandonQuest(questId);
      if (result.success) {
        await loadQuests();
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Error abandoning quest:', error);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Co-op Quests</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[
                styles.tab, 
                selectedTab === 'available' && styles.activeTab
              ]}
              onPress={() => setSelectedTab('available')}
            >
              <Text 
                style={[
                  styles.tabText,
                  selectedTab === 'available' && styles.activeTabText
                ]}
              >
                Available
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                selectedTab === 'active' && styles.activeTab
              ]}
              onPress={() => setSelectedTab('active')}
            >
              <Text 
                style={[
                  styles.tabText,
                  selectedTab === 'active' && styles.activeTabText
                ]}
              >
                Active with {partnerName}
              </Text>
              {activeQuests.length > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{activeQuests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Loading quests...</Text>
            </View>
          ) : (
            <>
              {selectedTab === 'available' && (
                <>
                  {availableQuests.length > 0 ? (
                    <FlatList
                      data={availableQuests}
                      renderItem={renderQuestItem}
                      keyExtractor={item => item.id}
                      contentContainerStyle={styles.questList}
                      showsVerticalScrollIndicator={false}
                    />
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No quests available</Text>
                    </View>
                  )}
                </>
              )}
              
              {selectedTab === 'active' && (
                <>
                  {activeQuests.length > 0 ? (
                    <FlatList
                      data={activeQuests}
                      renderItem={renderActiveQuestItem}
                      keyExtractor={item => item.id}
                      contentContainerStyle={styles.questList}
                      showsVerticalScrollIndicator={false}
                    />
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No active quests with {partnerName}</Text>
                      <Text style={styles.emptySubtext}>Go to the Available tab to start a new co-op quest!</Text>
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#6366f1',
  },
  badgeContainer: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
    paddingHorizontal: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  questList: {
    padding: 16,
  },
  questCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  questName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  questDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  questDetails: {
    marginBottom: 12,
  },
  questDetail: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: 'bold',
  },
  rewardsContainer: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  rewardsList: {
    paddingLeft: 8,
  },
  rewardItem: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  initiateButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initiatingButton: {
    backgroundColor: '#9b9ef0',
  },
  initiateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  abandonButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  abandonButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  progressContainer: {
    marginVertical: 12,
  },
  progressText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  participantProgress: {
    marginBottom: 16,
  },
  participantLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  participantValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
});

export default CoopQuestsModal;