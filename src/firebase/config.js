// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { 
  getAuth, 
  GoogleAuthProvider, 
  initializeAuth, 
  getReactNativePersistence 
} from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
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

// Ensure auth persistence using React Native AsyncStorage
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

export default app;

// Function to fetch avatar data for a given userId
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
