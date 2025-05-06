import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { decode, encode } from 'base-64';
import { useNavigation, CommonActions } from '@react-navigation/native';

//Font importation
import * as Font from 'expo-font';

// Import directly without the AvatarProvider
import MainScreen from './src/screens/MainScreen/MainScreen';
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
import MessageScreen from './src/screens/ProfileScreen/MessageScreen.js';
import MessageListScreen from './src/screens/ProfileScreen/MessageListScreen';
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
import AchievementsScreen from './src/screens/AchievementsScreen/AchievementsScreen';
import SearchUsersScreen from './src/screens/ProfileScreen/SearchUsersScreen';
import GuildMenuScreen from './src/screens/GuildScreen/GuildMenuScreen.js';
import GuildScreen from './src/screens/GuildScreen/GuildScreen.js';

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
const GuildStack = createStackNavigator();
const MessageStack = createStackNavigator();
const AchievementStack = createStackNavigator(); 

// Firebase setup
const auth = getAuth();
const db = getFirestore();

const MoreOptionsMenu = ({ visible, onClose, navigation }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>More</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            // More Menu, Achievements
            style={styles.menuItem}
            onPress={() => {
              onClose();
              navigation.navigate('AchievementStack');
            }}
          >
            <Ionicons name="trophy-outline" size={24} color="#6366f1" />
            <Text style={styles.menuItemText}>Achievements</Text>
          </TouchableOpacity>

          <TouchableOpacity
            // More Menu, Messages
            style={styles.menuItem}
            onPress={() => {
              onClose();
              navigation.navigate('MessageStack');
            }}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#6366f1" />
            <Text style={styles.menuItemText}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            // More Menu, Guilds
            style={styles.menuItem}
            onPress={() => {
              onClose();
              navigation.navigate('GuildStack');
            }}
          >
            <Ionicons name="shield-half-outline" size={24} color="#6366f1" />
            <Text style={styles.menuItemText}>Guilds</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            // More Menu, Settings
            style={styles.menuItem}
            onPress={() => {
              onClose();
              navigation.navigate('SettingsStack');
            }}
          >
            <Ionicons name="settings-outline" size={24} color="#6366f1" />
            <Text style={styles.menuItemText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const HomeStackNavigator = ({ extraData }) => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeMain">
      {props => <HomeScreen {...props} extraData={extraData} />}
    </HomeStack.Screen>
    <HomeStack.Screen name="ProfileScreen" component={ProfileScreen} />
    <HomeStack.Screen name="UserProfile" component={UserProfileScreen} />
    <HomeStack.Screen name="Message" component={MessageScreen} />
    <HomeStack.Screen name="FollowList" component={FollowListScreen} />
    <HomeStack.Screen name="LeaderboardScreen" component={LeaderboardScreen} />
    <HomeStack.Screen name="AchievementsScreen" component={AchievementsScreen} />
    <HomeStack.Screen name="SearchUsers" component={SearchUsersScreen} />
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

const MessageStackNavigator = ({ extraData }) => (
  <MessageStack.Navigator screenOptions={{ headerShown: false }}>
    <MessageStack.Screen 
      name="MessageList" 
      component={MessageListScreen}
      initialParams={{ extraData }}
    />
    <MessageStack.Screen 
      name="MessageDetail" 
      component={MessageScreen}
    />
  </MessageStack.Navigator>
);

const AchievementStackNavigator = ({ extraData }) => (
  <AchievementStack.Navigator screenOptions={{ headerShown: false }}>
    <AchievementStack.Screen 
      name="AchievementsMain" 
      component={AchievementsScreen}
      initialParams={{ extraData }}
    />
  </AchievementStack.Navigator>
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

const GuildStackNavigator = ({ extraData }) => (
  <GuildStack.Navigator screenOptions={{ headerShown: false }}>
    <GuildStack.Screen name="GuildMenu">
      {props => <GuildMenuScreen {...props} extraData={extraData} />}
    </GuildStack.Screen>
    <GuildStack.Screen name="GuildScreen" component={GuildScreen} />
  </GuildStack.Navigator>
);

const TaskStackNavigator = ({ extraData }) => (
  <TaskStack.Navigator screenOptions={{ headerShown: false }}>
    <TaskStack.Screen name="TasksList">
      {props => <TasksScreen {...props} extraData={extraData} />}
    </TaskStack.Screen>
    <TaskStack.Screen name="Achievements">
      {props => <AchievementsScreen {...props} extraData={extraData} />}
    </TaskStack.Screen>
  </TaskStack.Navigator>
);

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

const MoreScreen = () => <View />;

const TabNavigator = ({ extraData, navigation }) => {
  const [moreOptionsVisible, setMoreOptionsVisible] = useState(false);

  return (
    <>
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
          name="Quests"
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
          name="More"
          component={MoreScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="ellipsis-horizontal" size={size} color={color} />
            ),
            tabBarButton: (props) => (
              <TouchableOpacity
                {...props}
                onPress={() => setMoreOptionsVisible(true)}
              />
            ),
          }}
          listeners={{
            tabPress: e => {
              e.preventDefault();
              setMoreOptionsVisible(true);
            },
          }}
        />
      </Tab.Navigator>

      <MoreOptionsMenu
        navigation={navigation}
        visible={moreOptionsVisible}
        onClose={() => setMoreOptionsVisible(false)}
      />
    </>
  );
};

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
    <ActivityIndicator size="large" color="#F67B7B" />
    <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>Loading...</Text>
  </View>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
});

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [needsAvatarSetup, setNeedsAvatarSetup] = useState(false);
  const [needsTaskSetup, setNeedsTaskSetup] = useState(false);
  const[fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        'pixel-regular': require('./assets/fonts/PressStart2P-Regular.ttf'),
        'beyond-wonderland': require('./assets/fonts/Beyond Wonderland.ttf'),
        'black-cherry': require('./assets/fonts/BLKCHCRY.ttf'),
        'morris-roman': require('./assets/fonts/MorrisRoman-Black.ttf'),
      });
      setFontsLoaded(true);
    };
  
    loadFonts();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = doc(db, 'users', user.uid);

          const unsubscribeDoc = onSnapshot(userDoc, (docSnapshot) => {
            if (docSnapshot.exists()) {
              const userData = { ...docSnapshot.data(), id: user.uid };

              const avatarComplete = userData.avatarCustomizationComplete === true;
              const taskComplete = userData.taskCustomizationComplete === true;

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

  if (loading || !fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/*<Stack.Screen name="MainScreen" component={MainScreen} />*/}
        {user ? (
          isFirstTimeUser ? (
            <Stack.Screen
              name="Onboarding"
              options={{ gestureEnabled: false }}>
              {props => <OnboardingStackNavigator {...props} userId={user.id} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="MainScreen" component={MainScreen} />
              <Stack.Screen name="MainTab">
                {props => <TabNavigator {...props} extraData={user} navigation={props.navigation} />}
              </Stack.Screen>
              
              <Stack.Group screenOptions={{ presentation: 'containedModal' }}>
                <Stack.Screen name="SettingsStack">
                  {props => <SettingsStackNavigator {...props} extraData={user} />}
                </Stack.Screen>
                <Stack.Screen name="GuildStack">
                  {props => <GuildStackNavigator {...props} extraData={user} />}
                </Stack.Screen>
                <Stack.Screen name="MessageStack">
                  {props => <MessageStackNavigator {...props} extraData={user} />}
                </Stack.Screen>
                <Stack.Screen name="AchievementStack">
                  {props => <AchievementStackNavigator {...props} extraData={user} />}
                </Stack.Screen>
              </Stack.Group>
            </>
          )
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