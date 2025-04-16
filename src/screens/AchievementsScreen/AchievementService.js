import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import achievementsData from '../data/achievements.json';

/**
 * Service for handling user achievements
 */
const AchievementService = {
  /**
   * Check progress on all achievements and update if any conditions are met
   * @param {Object} userData - User data including stats, completed tasks, etc.
   * @returns {Array} - List of newly unlocked achievements
   */
  async checkAchievements(userData) {
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
  },
  
  /**
   * Update specific achievement progress
   * @param {string} achievementId - ID of the achievement to update
   * @param {number} progress - New progress value
   */
  async updateProgress(achievementId, progress) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    try {
      const userAchievementsDoc = await getDoc(doc(db, 'userAchievements', userId));
      const userAchievements = userAchievementsDoc.exists() 
        ? userAchievementsDoc.data().achievements || {} 
        : {};
      
      const achievement = achievementsData.achievements.find(a => a.id === achievementId);
      if (!achievement) return;
      
      // Check if achievement is already unlocked
      if (userAchievements[achievementId]?.unlocked) return;
      
      // Update progress
      const updatedAchievement = {
        ...userAchievements[achievementId],
        progress: progress
      };
      
      // Check if newly unlocked
      if (progress >= achievement.requirement.count) {
        updatedAchievement.unlocked = true;
        updatedAchievement.dateUnlocked = new Date().toISOString();
        updatedAchievement.rewardClaimed = false;
      }
      
      // Save to Firestore
      await setDoc(doc(db, 'userAchievements', userId), {
        achievements: {
          ...userAchievements,
          [achievementId]: updatedAchievement
        }
      }, { merge: true });
      
      return updatedAchievement.unlocked;
    } catch (error) {
      console.error("Error updating achievement progress:", error);
    }
  },
  
  /**
   * Get all user achievements
   * @returns {Array} - List of achievements with user progress
   */
  async getUserAchievements() {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];
    
    try {
      const userAchievementsDoc = await getDoc(doc(db, 'userAchievements', userId));
      const userAchievements = userAchievementsDoc.exists() 
        ? userAchievementsDoc.data().achievements || {} 
        : {};
      
      // Merge achievement data with user progress
      return achievementsData.achievements.map(achievement => {
        const userAchievement = userAchievements[achievement.id] || {};
        return {
          ...achievement,
          progress: userAchievement.progress || 0,
          unlocked: userAchievement.unlocked || false,
          rewardClaimed: userAchievement.rewardClaimed || false,
          dateUnlocked: userAchievement.dateUnlocked || null
        };
      });
    } catch (error) {
      console.error("Error getting user achievements:", error);
      return [];
    }
  }
};

export default AchievementService;