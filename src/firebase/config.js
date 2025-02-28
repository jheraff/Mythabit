import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  query, 
  where,
  addDoc,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Import task data
import fitnessTasks from '../data/fitness_tasks.json';
import careerTasks from '../data/career_tasks.json';
import healthTasks from '../data/health_tasks.json';
import creativityTasks from '../data/creativity_tasks.json';
import choresTasks from '../data/chores_tasks.json';
import mindTasks from '../data/mind_tasks.json';

const firebaseConfig = {
  apiKey: "AIzaSyCh6YkKO_FBWY-gjbL28dHDUKJjodUP4y4",
  authDomain: "mythabit-1ff5e.firebaseapp.com",
  projectId: "mythabit-1ff5e",
  storageBucket: "mythabit-1ff5e.firebasestorage.app",
  messagingSenderId: "501249558932",
  appId: "1:501249558932:web:11a565ded0d5dd3cf9a781",
  measurementId: "G-9LPBSNXDEV"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Set up analytics
isSupported().then((isAnalyticsSupported) => {
  if (isAnalyticsSupported) {
    const analytics = getAnalytics(app);
  }
});

// Set up authentication providers and Firestore
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Function to fetch avatar data
export const getAvatarFromFirebase = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data().avatar;
  } else {
    console.log("No avatar data found");
    return null;
  }
};

// Function to update avatar data
export const updateUserAvatar = async (userId, avatarData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      avatar: avatarData,
      lastUpdated: new Date().toISOString()
    });
    console.log('Avatar updated for user:', userId);
    return true;
  } catch (error) {
    console.error('Error updating avatar:', error);
    throw error;
  }
};

// Updated function to search users by username - case-insensitive with no character minimum
export const searchUsers = async (searchQuery, currentUserId) => {
  try {
    // Get all users from the collection
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    // Filter users client-side for case-insensitive matching
    const users = [];
    
    querySnapshot.forEach((doc) => {
      // Skip the current user
      if (doc.id === currentUserId) return;
      
      const userData = doc.data();
      // Case-insensitive search on the username
      if (userData.username && 
          userData.username.toLowerCase().includes(searchQuery.toLowerCase())) {
        users.push({
          id: doc.id,
          ...userData
        });
      }
    });
    
    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// Function to follow a user
export const followUser = async (currentUserId, userToFollowId) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const userToFollowRef = doc(db, 'users', userToFollowId);

    await updateDoc(currentUserRef, {
      following: arrayUnion(userToFollowId)
    });

    await updateDoc(userToFollowRef, {
      followers: arrayUnion(currentUserId)
    });

    return true;
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

// Function to unfollow a user
export const unfollowUser = async (currentUserId, userToUnfollowId) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const userToUnfollowRef = doc(db, 'users', userToUnfollowId);

    await updateDoc(currentUserRef, {
      following: arrayRemove(userToUnfollowId)
    });

    await updateDoc(userToUnfollowRef, {
      followers: arrayRemove(currentUserId)
    });

    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

// Function to get user profile data
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        ...userSnap.data()
      };
    } else {
      console.log("No user found");
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const initializeUserTasks = async (userId) => {
  try {
      const allTasks = [
          ...fitnessTasks.tasks,
          ...careerTasks.tasks,
          ...healthTasks.tasks,
          ...creativityTasks.tasks,
          ...choresTasks.tasks,
          ...mindTasks.tasks
      ];

      // Create a reference to the user's tasks collection
      const userTasksRef = doc(db, 'userTasks', userId);
      
      // Initialize user tasks with all available tasks
      await setDoc(userTasksRef, {
          availableTasks: allTasks,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
      });
      
      console.log('Tasks initialized for user:', userId);
      return true;
  } catch (error) {
      console.error('Error initializing tasks:', error);
      throw error;
  }
};

// Function to initialize a new user profile
export const initializeUserProfile = async (userId, username) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      username,
      level: 1,
      following: [],
      followers: [],
      createdAt: new Date(),
      avatar: {
        hair: 1,
        face: 1,
        outfit: 1,
        accessory: 0
      },
      xp: 0,
      stats: {
        strength: 1,
        intellect: 1,
        agility: 1,
        arcane: 1,
        focus: 1,
      },
      inventory: [],
      tasks: [],
      currency: 0,
      avatarCustomizationComplete: false,
      taskCustomizationComplete: false,
      lastUpdated: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error initializing user profile:', error);
    throw error;
  }
};

// Function to update user customization status
export const updateCustomizationStatus = async (userId, field, value) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [field]: value,
      lastUpdated: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error(`Error updating ${field}:`, error);
    throw error;
  }
};

// Function to fetch leaderboard data
export const fetchLeaderboardData = async (limit = 10) => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort by level in descending order, then by XP
    const sortedUsers = users.sort((a, b) => {
      // First compare by level
      if (b.level !== a.level) {
        return b.level - a.level;
      }
      // If levels are equal, compare by XP
      return (b.xp || 0) - (a.xp || 0);
    });
    
    // Get the top users based on the limit
    return sortedUsers.slice(0, limit);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    throw error;
  }
};

export default app;