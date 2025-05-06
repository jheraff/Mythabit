import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    SafeAreaView,
    Alert
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import LoadingModal from '../../utils/LoadingModal';

// Import the function to update customization status
import { updateUserAvatar, updateCustomizationStatus } from '../../firebase/config';

const AvatarCustomizationRegisterScreen = ({ navigation, route }) => {
    const { userId } = route.params;
    const [isLoading, setIsLoading] = useState(false);

    // Avatar customization state
    const [selectedHair, setSelectedHair] = useState(1);
    const [selectedFace, setSelectedFace] = useState(1);
    const [selectedOutfit, setSelectedOutfit] = useState(1);
    const [selectedAccessory, setSelectedAccessory] = useState(0);
    
    // Changed initial state to default to predefined avatars
    const [selectedAvatar, setSelectedAvatar] = useState('avatar1');
    const [useCustomAvatar, setUseCustomAvatar] = useState(true);

    // Sample avatar options for the character builder
    const hairStyles = [1, 2, 3, 4, 5];
    const faceStyles = [1, 2, 3, 4];
    const outfitStyles = [1, 2, 3, 4, 5, 6];
    const accessoryStyles = [0, 1, 2, 3]; 

    // Predefined avatar options from assets
    const predefinedAvatars = [
        { id: 'avatar1', source: require('../../../assets/avatars/bingus.jpg') },
        { id: 'avatar2', source: require('../../../assets/avatars/thumbs_up.jpg') },
        { id: 'avatar3', source: require('../../../assets/avatars/thumbs_up1.jpg') },
        { id: 'avatar4', source: require('../../../assets/avatars/male.png') },
        { id: 'avatar5', source: require('../../../assets/avatars/female.png') },
    ];

    // Save avatar choices and navigate to task customization
    const handleContinue = async () => {
        setIsLoading(true);

        try {
            let avatarData = {
                lastUpdated: new Date().toISOString()
            };

            if (useCustomAvatar && selectedAvatar) {
                // Using predefined avatar
                avatarData.useCustomAvatar = true;
                avatarData.avatarId = selectedAvatar;
            } else {
                // Using avatar generator
                avatarData.useCustomAvatar = false;
                avatarData.hair = selectedHair;
                avatarData.face = selectedFace;
                avatarData.outfit = selectedOutfit;
                avatarData.accessory = selectedAccessory;
            }

            // Update avatar in Firestore
            await updateUserAvatar(userId, avatarData);

            // Mark avatar customization as complete
            await updateCustomizationStatus(userId, 'avatarCustomizationComplete', true);

            console.log('Avatar customization completed successfully');

            console.log('Navigating to TaskCustomizationRegister with userId:', userId);
            
            // From looking at your App.js, I can see TaskCustomizationRegister 
            // is defined in the same OnboardingStack as AvatarCustomizationRegister
            navigation.navigate('TaskCustomizationRegister', { userId });
        } catch (error) {
            console.error('Error saving avatar:', error);
            Alert.alert('Error', 'Failed to save avatar. Please try again.');
        } finally {
            setIsLoading(false);
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
                // Show the generated avatar placeholder
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
            <Text style={styles.title}>Customize Your Avatar</Text>
            <Text style={styles.subtitle}>This will be your character in the app</Text>

            {/* Toggle between avatar types - Swapped order to make Choose Avatar first */}
            <View style={styles.avatarTypeSelector}>
                <TouchableOpacity 
                    style={[styles.avatarTypeButton, useCustomAvatar && styles.activeAvatarTypeButton]}
                    onPress={() => setUseCustomAvatar(true)}
                >
                    <Text style={[styles.avatarTypeText, useCustomAvatar && styles.activeAvatarTypeText]}>
                        Choose Avatar
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.avatarTypeButton, !useCustomAvatar && styles.activeAvatarTypeButton]}
                    onPress={() => setUseCustomAvatar(false)}
                >
                    <Text style={[styles.avatarTypeText, !useCustomAvatar && styles.activeAvatarTypeText]}>
                        Use Avatar Builder
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

            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={[styles.button, useCustomAvatar && !selectedAvatar && styles.disabledButton]} 
                    onPress={handleContinue}
                    disabled={useCustomAvatar && !selectedAvatar}
                >
                    <Text style={styles.buttonText}>Continue to Task Setup</Text>
                </TouchableOpacity>
            </View>

            <LoadingModal visible={isLoading} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
    },
    avatarTypeSelector: {
        flexDirection: 'row',
        marginBottom: 16,
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
    },
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    avatarGridItem: {
        width: '30%',
        aspectRatio: 1,
        marginBottom: 16,
        borderRadius: 8,
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
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
    buttonContainer: {
        marginVertical: 16,
    },
    button: {
        backgroundColor: '#F67B7B',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AvatarCustomizationRegisterScreen;