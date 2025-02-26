import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase/config';
import { updateProfile, updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

const ProfileSettings = ({ navigation }) => {
    const [newUsername, setNewUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const reauthenticate = async (currentPassword) => {
        const user = auth.currentUser;
        const credential = EmailAuthProvider.credential(
            user.email, 
            currentPassword
        );
        
        try {
            await reauthenticateWithCredential(user, credential);
            return true;
        } catch (error) {
            console.error("Reauthentication error:", error);
            Alert.alert("Authentication Failed", "Current password is incorrect");
            return false;
        }
    };

    const handleUsernameChange = async () => {
        if (newUsername.trim() === '') {
            Alert.alert("Invalid Input", "Please enter a valid username");
            return;
        }

        try {
            await updateProfile(auth.currentUser, {
                displayName: newUsername,
            });

            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, { username: newUsername });

            Alert.alert("Success", "Username updated successfully!");
            setNewUsername('');
        } catch (error) {
            console.error("Error updating username:", error);
            Alert.alert("Error", "Failed to update username. Please try again.");
        }
    };

    const handleEmailChange = async () => {
        if (newEmail.trim() === '') {
            Alert.alert("Invalid Input", "Please enter a valid email address");
            return;
        }

        if (currentPassword.trim() === '') {
            Alert.alert("Authentication Required", "Please enter your current password to change email");
            return;
        }

        try {
            const reauthSuccess = await reauthenticate(currentPassword);
            if (!reauthSuccess) return;

            await updateEmail(auth.currentUser, newEmail);

            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, { email: newEmail });

            Alert.alert("Success", "Email updated successfully!");
            setNewEmail('');
            setCurrentPassword('');
        } catch (error) {
            console.error("Error updating email:", error);
            Alert.alert("Error", "Failed to update email. Please try again.");
        }
    };

    const handlePasswordChange = async () => {
        if (newPassword.trim() === '' || confirmPassword.trim() === '' || currentPassword.trim() === '') {
            Alert.alert("Invalid Input", "Please fill all password fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Password Mismatch", "New passwords do not match!");
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert("Password Too Short", "Password must be at least 6 characters long");
            return;
        }

        try {
            const reauthSuccess = await reauthenticate(currentPassword);
            if (!reauthSuccess) return;

            await updatePassword(auth.currentUser, newPassword);
            Alert.alert("Success", "Password updated successfully!");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error("Error updating password:", error);
            Alert.alert("Error", "Failed to update password. Please try again.");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#6366f1" />
                </Pressable>
                <Text style={styles.headerTitle}>Profile Settings</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollContainer}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Change Username</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter new username"
                        value={newUsername}
                        onChangeText={setNewUsername}
                    />
                    <Pressable 
                        style={styles.button} 
                        onPress={handleUsernameChange}
                    >
                        <Text style={styles.buttonText}>Update Username</Text>
                    </Pressable>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Change Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter new email address"
                        keyboardType="email-address"
                        value={newEmail}
                        onChangeText={setNewEmail}
                        autoCapitalize="none"
                    />
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter current password"
                            secureTextEntry={!showCurrentPassword}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />
                        <Pressable 
                            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons 
                                name={showCurrentPassword ? "eye-off" : "eye"} 
                                size={24} 
                                color="#6b7280" 
                            />
                        </Pressable>
                    </View>
                    <Pressable 
                        style={styles.button} 
                        onPress={handleEmailChange}
                    >
                        <Text style={styles.buttonText}>Update Email</Text>
                    </Pressable>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Change Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter current password"
                            secureTextEntry={!showCurrentPassword}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />
                        <Pressable 
                            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons 
                                name={showCurrentPassword ? "eye-off" : "eye"} 
                                size={24} 
                                color="#6b7280" 
                            />
                        </Pressable>
                    </View>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter new password"
                            secureTextEntry={!showNewPassword}
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <Pressable 
                            onPress={() => setShowNewPassword(!showNewPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons 
                                name={showNewPassword ? "eye-off" : "eye"} 
                                size={24} 
                                color="#6b7280" 
                            />
                        </Pressable>
                    </View>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Confirm new password"
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <Pressable 
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons 
                                name={showConfirmPassword ? "eye-off" : "eye"} 
                                size={24} 
                                color="#6b7280" 
                            />
                        </Pressable>
                    </View>
                    <Pressable 
                        style={styles.button} 
                        onPress={handlePasswordChange}
                    >
                        <Text style={styles.buttonText}>Update Password</Text>
                    </Pressable>
                </View>
                
                {/* Add space at the bottom */}
                <View style={styles.bottomSpace}></View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1f2937',
    },
    backButton: {
        padding: 8,
    },
    placeholder: {
        width: 40,
    },
    scrollContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#1f2937',
    },
    input: {
        height: 50,
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 12,
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: '#f9fafb',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: '#f9fafb',
    },
    passwordInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 12,
        fontSize: 16,
    },
    eyeIcon: {
        padding: 10,
    },
    button: {
        backgroundColor: '#6366f1',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 4,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSpace: {
        height: 40,
    }
});

export default ProfileSettings;