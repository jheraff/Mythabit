// CoopQuestService.js - Debug version
import { db, auth } from '../../firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion,
  arrayRemove,
  query,
  where,
  getDocs,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import coopQuestsData from '../../data/coop-quests.json';

class CoopQuestService {
  // Initialize a co-op quest between two users
  static async initiateQuest(questId, userId1, userId2) {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
      
      // Check if the current user is one of the participants
      if (currentUserId !== userId1 && currentUserId !== userId2) {
        throw new Error('You can only initiate quests you participate in');
      }
      
      // Find the quest definition
      const questDefinition = coopQuestsData.quests.find(quest => quest.id === questId);
      if (!questDefinition) {
        throw new Error('Quest not found');
      }
      
      // Verify both users exist
      const user1Doc = await getDoc(doc(db, 'users', userId1));
      const user2Doc = await getDoc(doc(db, 'users', userId2));
      
      if (!user1Doc.exists() || !user2Doc.exists()) {
        throw new Error('One or both users do not exist');
      }
      
      // Check if users are already on an active quest together
      const activeQuestsQuery = query(
        collection(db, 'coopQuests'),
        where('participants', 'array-contains', userId1),
        where('status', '==', 'active')
      );
      
      const activeQuestsSnapshot = await getDocs(activeQuestsQuery);
      
      for (const questDoc of activeQuestsSnapshot.docs) {
        const questData = questDoc.data();
        if (questData.participants.includes(userId2)) {
          throw new Error('Users already have an active quest together');
        }
      }
      
      // Create unique quest ID for this instance
      const coopQuestId = `${questId}-${userId1}-${userId2}-${Date.now()}`;
      const startTime = serverTimestamp();
      const endTime = new Date(Date.now() + questDefinition.duration);
      
      // Create initial progress object
      const newQuest = {
        questId: questId,
        questName: questDefinition.name,
        description: questDefinition.description,
        type: questDefinition.type,
        target: questDefinition.target,
        participants: [userId1, userId2],
        progress: {
          [userId1]: 0,
          [userId2]: 0,
          total: 0
        },
        rewards: questDefinition.rewards,
        startTime: startTime,
        endTime: Timestamp.fromDate(endTime),
        status: 'active',
        initialStates: {
          [userId1]: {
            xp: user1Doc.data().xp || 0,
            completedTasks: 0,
            stats: { ...user1Doc.data().stats }
          },
          [userId2]: {
            xp: user2Doc.data().xp || 0,
            completedTasks: 0,
            stats: { ...user2Doc.data().stats }
          }
        }
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'coopQuests', coopQuestId), newQuest);
      
      // Add reference to users' documents
      await updateDoc(doc(db, 'users', userId1), {
        activeCoopQuests: arrayUnion(coopQuestId)
      });
      
      await updateDoc(doc(db, 'users', userId2), {
        activeCoopQuests: arrayUnion(coopQuestId)
      });
      
      // Create a chat message to notify about quest initiation
      const chatId = this.getChatId(userId1, userId2);
      try {
        console.log("Attempting to send chat message...");
        console.log("db object type:", typeof db);
        console.log("collection function type:", typeof collection);
        console.log("addDoc function type:", typeof addDoc);
        
        const messageData = {
          chatId: chatId,
          text: `Co-op quest "${questDefinition.name}" initiated! Work together to complete it by ${endTime.toLocaleDateString()}.`,
          senderId: 'system',
          receiverId: 'both',
          isSystemMessage: true,
          questRelated: true,
          timestamp: serverTimestamp(),
        };
        console.log("Message data:", messageData);
        
        // Try an alternative approach with manual ID
        const chatRef = doc(collection(db, 'chats'));
        await setDoc(chatRef, messageData);
        
        console.log("Chat message sent successfully with setDoc");
      } catch (chatError) {
        console.error("Detailed error sending chat message:", chatError);
        console.error("Error name:", chatError.name);
        console.error("Error message:", chatError.message);
        console.error("Error stack:", chatError.stack);
        // Continue with the quest creation even if message fails
      }
      
      return { success: true, questId: coopQuestId };
    } catch (error) {
      console.error('Error initiating co-op quest:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Helper to send system messages to chat - Using setDoc instead of addDoc
  static async sendQuestChatMessage(chatId, senderId, receiverId, message) {
    try {
      console.log("Sending quest chat message with alternative method");
      
      // Create a document reference with a generated ID
      const chatRef = doc(collection(db, 'chats'));
      
      // Use setDoc instead of addDoc
      await setDoc(chatRef, {
        chatId: chatId,
        text: message,
        senderId: 'system',
        receiverId: 'both',
        isSystemMessage: true,
        questRelated: true,
        timestamp: serverTimestamp(),
      });
      
      console.log("Quest chat message sent successfully");
    } catch (error) {
      console.error('Error sending quest chat message:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
  
  // Helper to get chatId from two userIds
  static getChatId(userId1, userId2) {
    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
  }
  
  // Get all active co-op quests for a user
  static async getUserActiveQuests(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const activeQuestIds = userDoc.data().activeCoopQuests || [];
      const quests = [];
      
      for (const questId of activeQuestIds) {
        const questDoc = await getDoc(doc(db, 'coopQuests', questId));
        if (questDoc.exists() && questDoc.data().status === 'active') {
          quests.push({
            id: questId,
            ...questDoc.data()
          });
        } else {
          // Clean up references to non-existent or completed quests
          await updateDoc(doc(db, 'users', userId), {
            activeCoopQuests: arrayRemove(questId)
          });
        }
      }
      
      return quests;
    } catch (error) {
      console.error('Error getting user active quests:', error);
      return [];
    }
  }
  
  // Get details of a specific co-op quest
  static async getQuestDetails(questId) {
    try {
      const questDoc = await getDoc(doc(db, 'coopQuests', questId));
      if (!questDoc.exists()) {
        throw new Error('Quest not found');
      }
      
      return {
        id: questId,
        ...questDoc.data()
      };
    } catch (error) {
      console.error('Error getting quest details:', error);
      return null;
    }
  }
  
  // Update quest progress based on user activity
  static async updateQuestProgress(userId, activityType, amount) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return;
      }
      
      const activeQuestIds = userDoc.data().activeCoopQuests || [];
      
      for (const questId of activeQuestIds) {
        const questDoc = await getDoc(doc(db, 'coopQuests', questId));
        if (!questDoc.exists() || questDoc.data().status !== 'active') {
          continue;
        }
        
        const questData = questDoc.data();
        const questType = questData.type;
        
        // Check if this activity type is relevant to this quest
        if (
          (questType === 'xp' && activityType === 'xp') ||
          (questType === 'tasks' && activityType === 'task') ||
          (questType === 'streak' && activityType === 'streak') ||
          (questType === 'stats' && activityType === 'stat') ||
          (questType === 'achievements' && activityType === 'achievement')
        ) {
          // Get current progress values
          const currentUserProgress = questData.progress[userId] || 0;
          const currentTotalProgress = questData.progress.total || 0;
          
          // Calculate new progress values
          const newUserProgress = currentUserProgress + amount;
          const newTotalProgress = currentTotalProgress + amount;
          
          // Update quest document
          await updateDoc(doc(db, 'coopQuests', questId), {
            [`progress.${userId}`]: newUserProgress,
            'progress.total': newTotalProgress
          });
          
          // Check if quest is completed
          if (newTotalProgress >= questData.target) {
            await this.completeQuest(questId);
          }
        }
      }
    } catch (error) {
      console.error('Error updating quest progress:', error);
    }
  }
  
  // Complete a quest and award rewards
  static async completeQuest(questId) {
    try {
      const questDoc = await getDoc(doc(db, 'coopQuests', questId));
      if (!questDoc.exists() || questDoc.data().status !== 'active') {
        return;
      }
      
      const questData = questDoc.data();
      
      // Update quest status
      await updateDoc(doc(db, 'coopQuests', questId), {
        status: 'completed',
        completedAt: serverTimestamp()
      });
      
      // Award rewards to each participant
      for (const userId of questData.participants) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) continue;
        
        const userData = userDoc.data();
        
        // Award XP and currency
        const newXP = (userData.xp || 0) + questData.rewards.xp;
        const newCurrency = (userData.currency || 0) + questData.rewards.currency;
        
        // Handle level up if necessary
        let newLevel = userData.level || 1;
        let finalXP = newXP;
        
        if (newXP >= 1000) {
          const levelsGained = Math.floor(newXP / 1000);
          newLevel += levelsGained;
          finalXP = newXP % 1000;
        }
        
        // Handle stat bonus
        const userStats = { ...(userData.stats || {}) };
        const statBonus = questData.rewards.statBonus;
        
        if (statBonus) {
          if (statBonus.type === 'random') {
            // Choose a random stat to improve
            const stats = ['strength', 'intellect', 'agility', 'arcane', 'focus'];
            const randomStat = stats[Math.floor(Math.random() * stats.length)];
            userStats[randomStat] = (userStats[randomStat] || 1) + statBonus.amount;
          } else if (statBonus.type === 'all') {
            // Improve all stats
            userStats.strength = (userStats.strength || 1) + statBonus.amount;
            userStats.intellect = (userStats.intellect || 1) + statBonus.amount;
            userStats.agility = (userStats.agility || 1) + statBonus.amount;
            userStats.arcane = (userStats.arcane || 1) + statBonus.amount;
            userStats.focus = (userStats.focus || 1) + statBonus.amount;
          } else if (statBonus.type === 'chosen') {
            // User will choose which stat to improve (handled in UI)
            await setDoc(doc(db, 'pendingStatBonus', userId), {
              questId: questId,
              amount: statBonus.amount,
              createdAt: serverTimestamp()
            }, { merge: true });
          } else {
            // Specific stat
            userStats[statBonus.type] = (userStats[statBonus.type] || 1) + statBonus.amount;
          }
        }
        
        // Update user document
        await updateDoc(doc(db, 'users', userId), {
          xp: finalXP,
          level: newLevel,
          currency: newCurrency,
          stats: userStats,
          activeCoopQuests: arrayRemove(questId),
          completedCoopQuests: arrayUnion(questId),
          recentlyCompletedQuest: {
            name: questData.questName,
            completedAt: new Date().toISOString()
          }
        });
        
        // Handle achievement reward if present
        if (questData.rewards.achievement) {
          await this.awardAchievement(userId, questData.rewards.achievement);
        }
      }
      
      // Notify via chat
      const [userId1, userId2] = questData.participants;
      const chatId = this.getChatId(userId1, userId2);
      await this.sendQuestChatMessage(
        chatId,
        userId1,
        userId2,
        `Congratulations! You've completed the co-op quest "${questData.questName}"! Both of you have received ${questData.rewards.xp} XP and ${questData.rewards.currency} coins.`
      );
      
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  }
  
  // Award achievement to a user
  static async awardAchievement(userId, achievementId) {
    try {
      // Get user achievement data
      const userAchievementsDoc = await getDoc(doc(db, 'userAchievements', userId));
      const userAchievements = userAchievementsDoc.exists() 
        ? userAchievementsDoc.data().achievements || {} 
        : {};
      
      // Check if achievement already unlocked
      if (userAchievements[achievementId]?.unlocked) {
        return;
      }
      
      // Update achievement
      userAchievements[achievementId] = {
        progress: 100,
        unlocked: true,
        dateUnlocked: new Date().toISOString(),
        rewardClaimed: false
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'userAchievements', userId), {
        achievements: userAchievements
      }, { merge: true });
      
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  }
  
  // Subscribe to quest updates
  static subscribeToQuestUpdates(questId, callback) {
    const questRef = doc(db, 'coopQuests', questId);
    return onSnapshot(questRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        callback({
          id: questId,
          ...docSnapshot.data()
        });
      } else {
        callback(null);
      }
    });
  }
  
  // Abandon a quest
  static async abandonQuest(questId) {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
      
      const questDoc = await getDoc(doc(db, 'coopQuests', questId));
      if (!questDoc.exists()) {
        throw new Error('Quest not found');
      }
      
      const questData = questDoc.data();
      
      // Check if current user is a participant
      if (!questData.participants.includes(currentUserId)) {
        throw new Error('You are not a participant in this quest');
      }
      
      // Update quest status
      await updateDoc(doc(db, 'coopQuests', questId), {
        status: 'abandoned',
        abandonedBy: currentUserId,
        abandonedAt: serverTimestamp()
      });
      
      // Remove from active quests for both participants
      for (const userId of questData.participants) {
        await updateDoc(doc(db, 'users', userId), {
          activeCoopQuests: arrayRemove(questId)
        });
      }
      
      // Notify the other participant via chat
      const otherUserId = questData.participants.find(id => id !== currentUserId);
      if (otherUserId) {
        const chatId = this.getChatId(currentUserId, otherUserId);
        await this.sendQuestChatMessage(
          chatId,
          currentUserId,
          otherUserId,
          `Co-op quest "${questData.questName}" has been abandoned.`
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error abandoning quest:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Get available co-op quests
  static getAvailableQuests() {
    return coopQuestsData.quests;
  }
}

export default CoopQuestService;