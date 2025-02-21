// src/navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';  // Assuming you're using Expo

import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import HomeScreen from '../screens/HomeScreen';
import TasksScreen from '../screens/TasksScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// This component holds our authenticated screens with the tab bar
const TabNavigator = () => {
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
        tabBarActiveTintColor: '#6366f1',  // Active tab color
        tabBarInactiveTintColor: '#6b7280', // Inactive tab color
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main navigator that handles both authenticated and non-authenticated flows
const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Auth Stack */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registration" component={RegistrationScreen} />
      
      {/* Main App Stack - Notice this just loads our TabNavigator */}
      <Stack.Screen name="MainApp" component={TabNavigator} />
    </Stack.Navigator>
  );
};

export default AppNavigator;