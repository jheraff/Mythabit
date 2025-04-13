import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { decode, encode } from 'base-64';

import LoginScreen from './src/screens/LoginScreen/LoginScreen';
import RegistrationScreen from './src/screens/RegistrationScreen/RegistrationScreen';
import HomeScreen from './src/screens/HomeScreen/HomeScreen';
import TasksScreen from './src/screens/tasks/TasksScreen';
import CalendarScreen from './src/screens/CalendarScreen/CalendarScreen';
import SettingsScreen from './src/screens/SettingsScreen/SettingsScreen';
import ProfileSettings from './src/screens/SettingsScreen/ProfileSettings';
import ActionScreen from './src/screens/ActionScreen/ActionScreen';
import AdventureScreen from './src/screens/ActionScreen/AdventureScreen';
import ItemScreen from './src/screens/ActionScreen/ItemScreen';
import TowerScreen from './src/screens/ActionScreen/TowerScreen.js';
import ConfirmationScreen from './src/screens/ActionScreen/ConfirmationScreen.js';
import ShopScreen from './src/screens/ActionScreen/ShopScreen';
import ProfileScreen from './src/screens/ProfileScreen/ProfileScreen';
import UserProfileScreen from './src/screens/ProfileScreen/UserProfileScreen';
import FollowListScreen from './src/screens/ProfileScreen/FollowListScreen';
import AvatarCustomizationRegisterScreen from './src/screens/AvatarScreen/AvatarCustomizationRegisterScreen';
import AvatarCustomizationSettingsScreen from './src/screens/AvatarScreen/AvatarCustomizationSettingsScreen';
import TaskCustomizationRegisterScreen from './src/screens/tasks/TaskCustomizationRegisterScreen';
import TaskCustomizationSettingsScreen from './src/screens/tasks/TaskCustomizationSettingsScreen';
import AboutScreen from './src/screens/SettingsScreen/AboutScreen';
import NotificationsScreen from './src/screens/SettingsScreen/NotificationsScreen';
import PreferencesScreen from './src/screens/SettingsScreen/PreferencesScreen';
import PrivacyScreen from './src/screens/SettingsScreen/PrivacyScreen';
import LeaderboardScreen from './src/screens/ProfileScreen/LeaderboardScreen';

// Base-64 polyfill
if (!global.btoa) { global.btoa = encode }
if (!global.atob) { global.atob = decode }

// Navigation setup
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const ActionStack = createStackNavigator();
const SettingsStack = createStackNavigator();
const TaskStack = createStackNavigator();
const OnboardingStack = createStackNavigator();

// Firebase setup
const auth = getAuth();
const db = getFirestore();

// Stack Navigators
const HomeStackNavigator = ({ extraData }) => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeMain">
      {props => <HomeScreen {...props} extraData={extraData} />}
    </HomeStack.Screen>
    <HomeStack.Screen name="ProfileScreen" component={ProfileScreen} />
    <HomeStack.Screen name="UserProfile" component={UserProfileScreen} />
    <HomeStack.Screen name="FollowList" component={FollowListScreen} />
    <HomeStack.Screen name="LeaderboardScreen" component={LeaderboardScreen} />
  </HomeStack.Navigator>
);

const ActionStackNavigator = ({ extraData }) => (
  <ActionStack.Navigator screenOptions={{ headerShown: false }}>
    <ActionStack.Screen name="ActionMain">
      {props => <ActionScreen {...props} extraData={extraData} />}
    </ActionStack.Screen>
    <ActionStack.Screen name="Adventure">
      {props => <AdventureScreen {...props} extraData={extraData} />}
    </ActionStack.Screen>
    <ActionStack.Screen name="Tower">
      {props => <TowerScreen {...props} extraData={extraData} />}
     </ActionStack.Screen>
    <ActionStack.Screen name="Confirmation">
      {props => <ConfirmationScreen {...props} extraData={extraData} />}
    </ActionStack.Screen>
    <ActionStack.Screen name="Items">
      {props => <ItemScreen {...props} extraData={extraData} />}
    </ActionStack.Screen>
    <ActionStack.Screen name="Shop">
      {props => <ShopScreen {...props} extraData={extraData} />}
    </ActionStack.Screen>
  </ActionStack.Navigator>
);

const SettingsStackNavigator = ({ extraData }) => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="Settings">
      {props => <SettingsScreen {...props} extraData={extraData} />}
    </SettingsStack.Screen>
    <SettingsStack.Screen
      name="AvatarCustomizationSettings"
      component={AvatarCustomizationSettingsScreen}
    />
    <SettingsStack.Screen
      name="TaskCustomizationSettings"
      component={TaskCustomizationSettingsScreen}
    />
    <SettingsStack.Screen
      name="ProfileSettings"
      component={ProfileSettings}
    />
    <SettingsStack.Screen
      name="About"
      component={AboutScreen}
    />
    <SettingsStack.Screen
      name="Notifications"
      component={NotificationsScreen}
    />
    <SettingsStack.Screen
      name="Preferences"
      component={PreferencesScreen}
    />
    <SettingsStack.Screen
      name="Privacy"
      component={PrivacyScreen}
    />
  </SettingsStack.Navigator>
);

const TaskStackNavigator = ({ extraData }) => (
  <TaskStack.Navigator screenOptions={{ headerShown: false }}>
    <TaskStack.Screen name="TasksList">
      {props => <TasksScreen {...props} extraData={extraData} />}
    </TaskStack.Screen>
  </TaskStack.Navigator>
);

// Onboarding Stack for first-time user flow
const OnboardingStackNavigator = ({ userId }) => (
  <OnboardingStack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false }}>
    <OnboardingStack.Screen 
      name="AvatarCustomizationRegister" 
      component={AvatarCustomizationRegisterScreen}
      initialParams={{ userId }}
    />
    <OnboardingStack.Screen 
      name="TaskCustomizationRegister" 
      component={TaskCustomizationRegisterScreen}
      initialParams={{ userId }}
    />
  </OnboardingStack.Navigator>
);

// Tab Navigator
const TabNavigator = ({ extraData }) => (
  <Tab.Navigator
    initialRouteName="Home"
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
      {props => <HomeStackNavigator {...props} extraData={extraData} />}
    </Tab.Screen>

    <Tab.Screen
      name="Calendar"
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="calendar" size={size} color={color} />
        ),
      }}
    >
      {props => <CalendarScreen {...props} extraData={extraData} />}
    </Tab.Screen>

    <Tab.Screen
      name="Tasks"
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="alert-outline" size={size} color={color} />
        ),
      }}
    >
      {props => <TaskStackNavigator {...props} extraData={extraData} />}
    </Tab.Screen>

    <Tab.Screen
      name="Action"
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="share-social-outline" size={size} color={color} />
        ),
      }}
    >
      {props => <ActionStackNavigator {...props} extraData={extraData} />}
    </Tab.Screen>

    <Tab.Screen
      name="SettingsTab"
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="settings" size={size} color={color} />
        ),
        tabBarLabel: 'Settings'
      }}
    >
      {props => <SettingsStackNavigator {...props} extraData={extraData} />}
    </Tab.Screen>
  </Tab.Navigator>
);

// Loading Component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
    <ActivityIndicator size="large" color="#F67B7B" />
    <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>Loading...</Text>
  </View>
);

// Main App Component
export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [needsAvatarSetup, setNeedsAvatarSetup] = useState(false);
  const [needsTaskSetup, setNeedsTaskSetup] = useState(false);

  // In your App.js useEffect:
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = doc(db, 'users', user.uid);

          // Set up a real-time listener for the user document
          const unsubscribeDoc = onSnapshot(userDoc, (docSnapshot) => {
            if (docSnapshot.exists()) {
              const userData = { ...docSnapshot.data(), id: user.uid };
              
              // Check customization status
              const avatarComplete = userData.avatarCustomizationComplete === true;
              const taskComplete = userData.taskCustomizationComplete === true;
              
              // Determine if this is a first-time user
              const isFirstTimer = !avatarComplete || !taskComplete;
              
              console.log('Avatar complete:', avatarComplete);
              console.log('Task complete:', taskComplete);
              console.log('Is first timer:', isFirstTimer);
              
              setNeedsAvatarSetup(!avatarComplete);
              setNeedsTaskSetup(!taskComplete);
              setIsFirstTimeUser(isFirstTimer);
              setUser(userData);
            } else {
              console.log('No user document found');
              setUser(null);
            }
            setLoading(false);
          });

          return () => unsubscribeDoc();
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
          setLoading(false);
        }
      } else {
        console.log('No authenticated user');
        setUser(null);
        setIsFirstTimeUser(false);
        setNeedsAvatarSetup(false);
        setNeedsTaskSetup(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          isFirstTimeUser ? (
            // First-time user flow - use a dedicated onboarding stack
            <Stack.Screen 
              name="Onboarding" 
              options={{ gestureEnabled: false }}>
              {props => <OnboardingStackNavigator {...props} userId={user.id} />}
            </Stack.Screen>
          ) : (
            // Regular user flow
            <Stack.Screen name="MainTab">
              {props => <TabNavigator {...props} extraData={user} />}
            </Stack.Screen>
          )
        ) : (
          // Authentication flow
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registration" component={RegistrationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}