import React, { useState, useEffect } from 'react';
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

// Local implementation of the missing functions
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

const updateCustomizationStatus = async (userId, field, value) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            [field]: value,
            lastUpdated: new Date().toISOString()
        });
        console.log(`${field} updated for user:`, userId);
        return true;
    } catch (error) {
        console.error(`Error updating ${field}:`, error);
        throw error;
    }
};

const AvatarCustomizationRegisterScreen = ({ navigation, route }) => {
    const { userId } = route.params;
    const [isLoading, setIsLoading] = useState(false);

    // Avatar customization state
    const [selectedHair, setSelectedHair] = useState(1);
    const [selectedFace, setSelectedFace] = useState(1);
    const [selectedOutfit, setSelectedOutfit] = useState(1);
    const [selectedAccessory, setSelectedAccessory] = useState(0); // 0 means no accessory

    // Sample avatar options (you'll need your actual assets)
    const hairStyles = [1, 2, 3, 4, 5];
    const faceStyles = [1, 2, 3, 4];
    const outfitStyles = [1, 2, 3, 4, 5, 6];
    const accessoryStyles = [0, 1, 2, 3]; // 0 is no accessory

    // Save avatar choices and navigate to task customization
    // In handleContinue function of AvatarCustomizationRegisterScreen.js
    const handleContinue = async () => {
        setIsLoading(true);

        try {
            // Prepare avatar data
            const avatarData = {
                hair: selectedHair,
                face: selectedFace,
                outfit: selectedOutfit,
                accessory: selectedAccessory,
                lastUpdated: new Date().toISOString()
            };

            // Update avatar in Firestore
            await updateUserAvatar(userId, avatarData);

            // Mark avatar customization as complete
            await updateCustomizationStatus(userId, 'avatarCustomizationComplete', true);

            console.log('Avatar customization completed successfully');

            // Navigate to the next screen in the Onboarding stack
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
            <Text style={styles.title}>Customize Your Avatar</Text>
            <Text style={styles.subtitle}>This will be your character in the app</Text>

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

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleContinue}>
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
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AvatarCustomizationRegisterScreen;