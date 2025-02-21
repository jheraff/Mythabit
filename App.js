import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LoginScreen, HomeScreen, RegistrationScreen } from './src/screens';
import LoadScreen from './src/screens/LoadScreen/LoadScreen';
import TasksScreen from './src/screens/TaskScreen/TasksScreen';

import { decode, encode } from 'base-64';
if (!global.btoa) { global.btoa = encode }
if (!global.atob) { global.atob = decode }

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const auth = getAuth();
const db = getFirestore();

// Create TabNavigator component for authenticated screens
const TabNavigator = ({ extraData }) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tab.Screen 
        name="Home" 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      >
        {props => <HomeScreen {...props} extraData={extraData} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="Tasks" 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      >
        {props => <TasksScreen {...props} extraData={extraData} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = doc(db, 'users', user.uid);
          const docSnapshot = await getDoc(userDoc);
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="MainApp">
            {props => <TabNavigator {...props} extraData={user} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registration" component={RegistrationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}