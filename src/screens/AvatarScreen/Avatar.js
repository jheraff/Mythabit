import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

const Avatar = ({ size = 50, style, userId, onPress }) => {
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Predefined avatar images mapping
  const avatarImages = {
    'avatar1': require('../../../assets/avatars/bingus.jpg'),
    // Add as many avatars as you have in your assets folder
  };
  
  // Fetch the user's avatar data when the component mounts
  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        setLoading(true);
        // If no userId is provided, use the current user's ID
        const uid = userId || (auth.currentUser ? auth.currentUser.uid : null);
        
        if (!uid) {
          console.log('No user ID available to fetch avatar');
          setLoading(false);
          return;
        }
        
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().avatar) {
          setAvatar(userSnap.data().avatar);
        } else {
          console.log('No avatar data found');
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvatar();
  }, [userId]);
  
  // Show loading indicator while fetching avatar data
  if (loading) {
    return (
      <View 
        style={[
          styles.placeholder, 
          { width: size, height: size, borderRadius: size / 2 },
          style
        ]}
      >
        <ActivityIndicator size="small" color="#F67B7B" />
      </View>
    );
  }
  
  // Show default placeholder if no avatar data is available
  if (!avatar) {
    return (
      <View 
        style={[
          styles.placeholder, 
          { width: size, height: size, borderRadius: size / 2 },
          style
        ]}
      >
        <MaterialIcons name="person" size={size * 0.6} color="#ccc" />
      </View>
    );
  }
  
  // Render predefined avatar if selected
  if (avatar.useCustomAvatar && avatar.avatarId && avatarImages[avatar.avatarId]) {
    return (
      <Image
        source={avatarImages[avatar.avatarId]}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
          style
        ]}
      />
    );
  }
  
  // Render generated avatar (when implementation is available)
  // For now, use the placeholder image
  return (
    <Image
      source={require('../../../assets/avatars/placeholder.png')}
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        style
      ]}
    />
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#f0f0f0',
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Avatar;