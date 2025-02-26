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

// Local implementation of the missing functions
const getAvatarFromFirebase = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data().avatar;
    } else {
      console.log("No avatar data found");
      return null;
    }
  } catch (error) {
    console.error("Error getting avatar:", error);
    throw error;
  }
};

const updateUserAvatar = async (userId, avatarData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      avatar: avatarData,
      lastUpdated: new Date().toISOString()
    });
    console.log('Avatar updated for user:', userId);
    return true;
  } catch (error) {
    console.error('Error updating avatar:', error);
    throw error;
  }
};

const AvatarCustomizationSettingsScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  
  // Avatar customization state
  const [selectedHair, setSelectedHair] = useState(1);
  const [selectedFace, setSelectedFace] = useState(1);
  const [selectedOutfit, setSelectedOutfit] = useState(1);
  const [selectedAccessory, setSelectedAccessory] = useState(0); // 0 means no accessory
  const [originalAvatarState, setOriginalAvatarState] = useState({});
  
  // Sample avatar options (you'll need your actual assets)
  const hairStyles = [1, 2, 3, 4, 5];
  const faceStyles = [1, 2, 3, 4];
  const outfitStyles = [1, 2, 3, 4, 5, 6];
  const accessoryStyles = [0, 1, 2, 3]; // 0 is no accessory
  
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
      const avatarData = await getAvatarFromFirebase(userId);
      
      if (avatarData) {
        setSelectedHair(avatarData.hair || 1);
        setSelectedFace(avatarData.face || 1);
        setSelectedOutfit(avatarData.outfit || 1);
        setSelectedAccessory(avatarData.accessory || 0);
        
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
      const newAvatarData = {
        hair: selectedHair,
        face: selectedFace,
        outfit: selectedOutfit,
        accessory: selectedAccessory,
        lastUpdated: new Date().toISOString()
      };
      
      // Update avatar in Firestore
      await updateUserAvatar(userId, newAvatarData);
      
      // Update original state
      setOriginalAvatarState(newAvatarData);
      
      Alert.alert('Success', 'Your avatar has been updated!');
      
      // Navigate back
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
    return (
      selectedHair !== (originalAvatarState.hair || 1) ||
      selectedFace !== (originalAvatarState.face || 1) ||
      selectedOutfit !== (originalAvatarState.outfit || 1) ||
      selectedAccessory !== (originalAvatarState.accessory || 0)
    );
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
      <Image 
        source={require('../../../assets/avatars/placeholder.png')} // Replace with your actual avatar generation logic
        style={styles.previewImage}
      />
      <Text style={styles.previewText}>Your Avatar</Text>
    </View>
  );
  
  // Option selector component
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
      
      <AvatarPreview />
      
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