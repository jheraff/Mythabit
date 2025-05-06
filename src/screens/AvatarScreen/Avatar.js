import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useAvatar } from '../AvatarScreen/AvatarContext';

const Avatar = ({ size = 50, style, userId, onPress }) => {
  const { avatar, loading: contextLoading } = useAvatar();
  const [localLoading, setLocalLoading] = useState(true);
  const [localAvatar, setLocalAvatar] = useState(null);
  
  // Predefined avatar images mapping
  const avatarImages = {
    'avatar1': require('../../../assets/avatars/bingus.jpg'),
    'avatar2': require('../../../assets/avatars/thumbs_up.jpg'),
    'avatar3': require('../../../assets/avatars/thumbs_up1.jpg'),
    'avatar4': require('../../../assets/avatars/male.png'),
    'avatar5': require('../../../assets/avatars/female.png'),
  };
  
  // If userId is provided, fetch that specific avatar
  // otherwise use the avatar from context
  useEffect(() => {
    const fetchSpecificAvatar = async () => {
      if (!userId || userId === auth.currentUser?.uid) {
        // If it's the current user, use the avatar from context
        setLocalAvatar(avatar);
        setLocalLoading(contextLoading);
        return;
      }
      
      try {
        setLocalLoading(true);
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().avatar) {
          setLocalAvatar(userSnap.data().avatar);
        } else {
          console.log('No avatar data found for user ID:', userId);
          setLocalAvatar(null);
        }
      } catch (error) {
        console.error('Error fetching avatar for specific user:', error);
      } finally {
        setLocalLoading(false);
      }
    };
    
    fetchSpecificAvatar();
  }, [userId, avatar, contextLoading]);
  
  // Show loading indicator while fetching avatar data
  if (localLoading) {
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
  
  // Check if we have avatar data
  const avatarData = localAvatar;
  
  // Show default placeholder if no avatar data is available
  if (!avatarData) {
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
  if (avatarData.useCustomAvatar && avatarData.avatarId && avatarImages[avatarData.avatarId]) {
    return (
      <Image
        source={avatarImages[avatarData.avatarId]}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
          style
        ]}
      />
    );
  }
  
  // If using custom uploaded image
  if (avatarData.useCustomImage && avatarData.imageUrl) {
    console.log("Rendering custom image avatar:", avatarData.imageUrl);
    return (
      <Image
        source={{ uri: avatarData.imageUrl }}
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
  console.log("Rendering generated avatar with properties:", 
    avatarData.hair, avatarData.face, avatarData.outfit, avatarData.accessory);
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