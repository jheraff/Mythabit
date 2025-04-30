import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    Image, 
    Alert, 
    SafeAreaView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import LoadingModal from '../../utils/LoadingModal';

// Import the function to update user avatar
import { updateUserAvatar } from '../../firebase/config';

const AvatarCustomizationSettingsScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  
  // Avatar customization state
  const [selectedHair, setSelectedHair] = useState(1);
  const [selectedFace, setSelectedFace] = useState(1);
  const [selectedOutfit, setSelectedOutfit] = useState(1);
  const [selectedAccessory, setSelectedAccessory] = useState(0);
  
  // Predefined avatar state
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [useCustomAvatar, setUseCustomAvatar] = useState(false);
  
  const [originalAvatarState, setOriginalAvatarState] = useState({});
  
  // Sample avatar options
  const hairStyles = [1, 2, 3, 4, 5];
  const faceStyles = [1, 2, 3, 4];
  const outfitStyles = [1, 2, 3, 4, 5, 6];
  const accessoryStyles = [0, 1, 2, 3];
  
  // Predefined avatar options from assets
  const predefinedAvatars = [
    { id: 'avatar1', source: require('../../../assets/avatars/bingus.jpg') },
    // Add as many avatars as you have in your assets folder
  ];
  
  // Load saved avatar settings on component mount
  useEffect(() => {
    loadSavedAvatarSettings();
  }, []);
  
  const loadSavedAvatarSettings = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No user is signed in');
        setIsLoading(false);
        return;
      }
      
      const userId = currentUser.uid;
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists() && userSnap.data().avatar) {
        const avatarData = userSnap.data().avatar;
        
        // If using predefined avatar
        if (avatarData.useCustomAvatar) {
          setUseCustomAvatar(true);
          setSelectedAvatar(avatarData.avatarId || null);
        } else {
          // Using avatar generator
          setUseCustomAvatar(false);
          setSelectedHair(avatarData.hair || 1);
          setSelectedFace(avatarData.face || 1);
          setSelectedOutfit(avatarData.outfit || 1);
          setSelectedAccessory(avatarData.accessory || 0);
        }
        
        // Store original state to detect changes
        setOriginalAvatarState(avatarData);
      } else {
        console.log('No avatar data found, using defaults');
      }
    } catch (error) {
      console.error('Error loading avatar settings:', error);
      Alert.alert('Error', 'Failed to load avatar settings.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save avatar changes
  const handleSaveChanges = async () => {
    setIsLoading(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is signed in');
      }
      
      const userId = currentUser.uid;
      
      // Prepare new avatar data
      let newAvatarData = {
        lastUpdated: new Date().toISOString()
      };
      
      if (useCustomAvatar && selectedAvatar) {
        // Using predefined avatar
        newAvatarData.useCustomAvatar = true;
        newAvatarData.avatarId = selectedAvatar;
      } else {
        // Using avatar generator
        newAvatarData.useCustomAvatar = false;
        newAvatarData.hair = selectedHair;
        newAvatarData.face = selectedFace;
        newAvatarData.outfit = selectedOutfit;
        newAvatarData.accessory = selectedAccessory;
      }
      
      // Update avatar in Firestore
      await updateUserAvatar(userId, newAvatarData);
      
      // Update original state
      setOriginalAvatarState(newAvatarData);
      
      Alert.alert('Success', 'Your avatar has been updated!');
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving avatar changes:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if changes have been made
  const hasChanges = () => {
    if (useCustomAvatar !== (originalAvatarState.useCustomAvatar || false)) {
      return true;
    }
    
    if (useCustomAvatar) {
      // If using predefined avatar, check if selection changed
      return selectedAvatar !== (originalAvatarState.avatarId || null);
    } else {
      // If using avatar generator, check if any options changed
      return (
        selectedHair !== (originalAvatarState.hair || 1) ||
        selectedFace !== (originalAvatarState.face || 1) ||
        selectedOutfit !== (originalAvatarState.outfit || 1) ||
        selectedAccessory !== (originalAvatarState.accessory || 0)
      );
    }
  };
  
  // Cancel changes and go back
  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };
  
  // Preview component to show the current avatar selection
  const AvatarPreview = () => (
    <View style={styles.previewContainer}>
      {useCustomAvatar && selectedAvatar ? (
        // Show the selected predefined avatar
        <Image
          source={predefinedAvatars.find(avatar => avatar.id === selectedAvatar).source}
          style={styles.previewImage}
        />
      ) : (
        // Show generated avatar
        <Image 
          source={require('../../../assets/avatars/placeholder.png')}
          style={styles.previewImage}
        />
      )}
      <Text style={styles.previewText}>Your Avatar</Text>
    </View>
  );
  
  // Option selector component for character builder
  const OptionSelector = ({ title, options, selectedOption, setSelectedOption, renderOption }) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionItem,
              selectedOption === option && styles.selectedOptionItem,
            ]}
            onPress={() => setSelectedOption(option)}
          >
            {renderOption ? renderOption(option) : (
              <Text style={styles.optionText}>{option === 0 && title === 'Accessories' ? 'None' : `Style ${option}`}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Avatar</Text>
        <TouchableOpacity 
          onPress={handleSaveChanges} 
          style={[styles.headerButton, !hasChanges() && styles.disabledButton]}
          disabled={!hasChanges()}
        >
          <Text style={[styles.headerButtonText, !hasChanges() && styles.disabledButtonText]}>Save</Text>
        </TouchableOpacity>
      </View>
      
      {/* Toggle between avatar types */}
      <View style={styles.avatarTypeSelector}>
        <TouchableOpacity 
          style={[styles.avatarTypeButton, !useCustomAvatar && styles.activeAvatarTypeButton]}
          onPress={() => setUseCustomAvatar(false)}
        >
          <Text style={[styles.avatarTypeText, !useCustomAvatar && styles.activeAvatarTypeText]}>
            Avatar Builder
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.avatarTypeButton, useCustomAvatar && styles.activeAvatarTypeButton]}
          onPress={() => setUseCustomAvatar(true)}
        >
          <Text style={[styles.avatarTypeText, useCustomAvatar && styles.activeAvatarTypeText]}>
            Choose Avatar
          </Text>
        </TouchableOpacity>
      </View>
      
      <AvatarPreview />
      
      {useCustomAvatar ? (
        // Show predefined avatars grid
        <ScrollView style={styles.predefinedAvatarsContainer}>
          <View style={styles.avatarGrid}>
            {predefinedAvatars.map((avatar) => (
              <TouchableOpacity
                key={avatar.id}
                style={[
                  styles.avatarGridItem,
                  selectedAvatar === avatar.id && styles.selectedAvatarGridItem,
                ]}
                onPress={() => setSelectedAvatar(avatar.id)}
              >
                <Image
                  source={avatar.source}
                  style={styles.avatarGridImage}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        // Show character builder options
        <ScrollView style={styles.scrollContainer}>
          <OptionSelector 
            title="Hair Style" 
            options={hairStyles} 
            selectedOption={selectedHair} 
            setSelectedOption={setSelectedHair} 
          />
          
          <OptionSelector 
            title="Face" 
            options={faceStyles} 
            selectedOption={selectedFace} 
            setSelectedOption={setSelectedFace} 
          />
          
          <OptionSelector 
            title="Outfit" 
            options={outfitStyles} 
            selectedOption={selectedOutfit} 
            setSelectedOption={setSelectedOutfit} 
          />
          
          <OptionSelector 
            title="Accessories" 
            options={accessoryStyles} 
            selectedOption={selectedAccessory} 
            setSelectedOption={setSelectedAccessory} 
          />
        </ScrollView>
      )}
      
      <LoadingModal visible={isLoading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    color: '#F67B7B',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#c0c0c0',
  },
  avatarTypeSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F67B7B',
  },
  avatarTypeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeAvatarTypeButton: {
    backgroundColor: '#F67B7B',
  },
  avatarTypeText: {
    fontWeight: '500',
    color: '#F67B7B',
  },
  activeAvatarTypeText: {
    color: 'white',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f0f0',
  },
  previewText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  predefinedAvatarsContainer: {
    flex: 1,
    padding: 16,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarGridItem: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
    backgroundColor: '#f0f0f0',
  },
  selectedAvatarGridItem: {
    borderWidth: 3,
    borderColor: '#F67B7B',
    backgroundColor: '#e0f0ff',
  },
  avatarGridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  selectorContainer: {
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optionsScroll: {
    flexDirection: 'row',
  },
  optionItem: {
    width: 80,
    height: 80,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  selectedOptionItem: {
    backgroundColor: '#e0f0ff',
    borderWidth: 2,
    borderColor: '#F67B7B',
  },
  optionText: {
    textAlign: 'center',
  },
});

export default AvatarCustomizationSettingsScreen;