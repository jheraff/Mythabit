import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import defaultTasks from '../tasks.json';

export const initializeUserTasks = async (userId) => {
  try {
    const userTasksRef = collection(db, 'tasks');
    
    // Check if user already has tasks
    const existingTasks = await getDocs(
      query(userTasksRef, where('userId', '==', userId))
    );
    
    if (existingTasks.empty) {
      // Add default tasks for new user
      const taskPromises = defaultTasks.defaultTasks.map(task => {
        return addDoc(userTasksRef, {
          ...task,
          userId,
          createdAt: new Date(),
        });
      });
      
      await Promise.all(taskPromises);
      console.log('Default tasks initialized for user');
    }
  } catch (error) {
    console.error('Error initializing tasks:', error);
    throw error;
  }
};