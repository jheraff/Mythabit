// src/config/firebase.js
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
  getDocs 
} from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

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

// New function to initialize tasks for a user
export const initializeUserTasks = async (userId) => {
  try {
    const tasksRef = collection(db, 'tasks');
    
    // Check if user already has tasks
    const existingTasks = await getDocs(
      query(tasksRef, where('userId', '==', userId))
    );
    
    if (existingTasks.empty) {
      // Import tasks dynamically
      const defaultTasks = require('../data/tasks.json');
      
      // Add tasks for new user
      const taskPromises = defaultTasks.defaultTasks.map(task => {
        return addDoc(tasksRef, {
          ...task,
          userId,
          createdAt: new Date(),
        });
      });
      
      await Promise.all(taskPromises);
      console.log('Tasks initialized for user:', userId);
    }
  } catch (error) {
    console.error('Error initializing tasks:', error);
    throw error;
  }
};

export default app;