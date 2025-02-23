import React, { useState } from 'react';
import {
    Text,
    TextInput,
    StyleSheet,
    View,
    SafeAreaView,
    KeyboardAvoidingView,
    Pressable
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AntDesign, Ionicons } from "@expo/vector-icons";
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import LoadingModal from '../../utils/LoadingModal';
import { auth, db, initializeUserTasks } from '../../firebase/config';

const styles = StyleSheet.create({
    boxContainer: {
        backgroundColor: '#f9f9f9',
        padding: 20,
        borderRadius: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        width: 350,
        elevation: 5,
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
        marginTop: 40,
        alignItems: 'center',
    },
    appTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#F67B7B",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "#E0E0E0",
        paddingVertical: 5,
        borderRadius: 5,
        marginTop: 20,
    },
    iconStyle: {
        marginLeft: 8,
    },
    textInput: {
        color: "gray",
        marginVertical: 10,
        width: 300,
        fontSize: 17,
    },
    registerButton: {
        width: 200,
        backgroundColor: "#F67B7B",
        padding: 15,
        borderRadius: 6,
        marginLeft: "auto",
        marginRight: "auto",
        alignItems: 'center',
    },
    registerButtonText: {
        textAlign: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: 20,
        width: '100%',
    },
    circleButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
    },
    socialIcon: {
        width: 30,
        height: 30,
    },
    footerView: {
        flex: 1,
        alignItems: "center",
        marginTop: 20
    },
    footerText: {
        fontSize: 16,
        color: '#2e2e2d'
    },
    footerLink: {
        color: "#788eec",
        fontWeight: "bold",
        fontSize: 16
    }
});

export default function RegistrationScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const onFooterLinkPress = () => {
        navigation.navigate('Login');
    };

    const onRegisterPress = async () => {
        if (!email || !password || !username) {
            alert("Please fill in all fields.");
            return;
        }

        setIsLoading(true);
        try {
            console.log("Starting registration process...");

            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;
            console.log("User created with ID:", uid);

            // Create user document in Firestore with additional properties
            const userData = {
                id: uid,
                username,
                email,
                xp: 0,
                level: 1,
                stats: {
                    strength: 1,
                    intellect: 1,
                    agility: 1,
                    arcane: 1,
                    focus: 1,
                },
                inventory: [],
                tasks: [],
                currency: 0,
                customizationComplete: false,
                personalSetupComplete: false,
                following: [],
                followers: [],
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };

            console.log("Creating user document...");
            await setDoc(doc(db, 'users', uid), userData);
            console.log("User document created");

            console.log("Initializing user preferences...");
            // Initialize user preferences
            await setDoc(doc(db, 'userPreferences', uid), {
                setupCompleted: false,
                taskTypes: [],
                availableTasks: [],
                lastUpdated: new Date().toISOString()
            });
            console.log("User preferences initialized");

            // Initialize user tasks
            console.log("Starting task initialization...");
            await initializeUserTasks(uid);
            console.log("Tasks initialized");

            // Clear form
            setUsername('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');

        } catch (error) {
            console.error("Registration error:", error);
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "white", alignItems: "center" }}>
            <KeyboardAvoidingView>
                <View style={styles.boxContainer}>
                    <View style={{ alignItems: "center", marginBottom: 5 }}>
                        <Text style={styles.appTitle}>MYTHABIT</Text>
                    </View>

                    <View style={{ alignItems: "center" }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", marginTop: 20 }}>
                            Register your account
                        </Text>
                    </View>

                    <View style={{ marginTop: 20 }}>
                        {/* Username Input Field */}
                        <View style={styles.inputContainer}>
                            <Ionicons style={styles.iconStyle} name="person" size={24} color="gray" />
                            <TextInput
                                value={username}
                                onChangeText={(text) => setUsername(text)}
                                style={styles.textInput}
                                placeholder="Username"
                            />
                        </View>

                        {/* Email Input Field */}
                        <View style={styles.inputContainer}>
                            <MaterialIcons style={styles.iconStyle} name="email" size={24} color="gray" />
                            <TextInput
                                value={email}
                                onChangeText={(text) => setEmail(text)}
                                style={styles.textInput}
                                placeholder="Enter your email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Password Input Field */}
                        <View style={styles.inputContainer}>
                            <AntDesign style={styles.iconStyle} name="lock1" size={24} color="gray" />
                            <TextInput
                                value={password}
                                onChangeText={(text) => setPassword(text)}
                                style={styles.textInput}
                                placeholder="Enter your password"
                                secureTextEntry
                            />
                        </View>

                        {/* Confirm Password Input Field */}
                        <View style={styles.inputContainer}>
                            <AntDesign style={styles.iconStyle} name="lock1" size={24} color="gray" />
                            <TextInput
                                value={confirmPassword}
                                onChangeText={(text) => setConfirmPassword(text)}
                                style={styles.textInput}
                                placeholder="Confirm your password"
                                secureTextEntry
                            />
                        </View>

                        {/* Register Button */}
                        <View style={{ marginTop: 20, alignItems: 'center' }}>
                            <Pressable
                                onPress={onRegisterPress}
                                style={styles.registerButton}
                            >
                                <Text style={styles.registerButtonText}>
                                    Register
                                </Text>
                            </Pressable>
                        </View>

                        {/* Social Media Registration Buttons */}
                        <View style={styles.socialContainer}>
                            <Pressable style={styles.circleButton}>
                                <AntDesign name="google" size={24} color="black" />
                            </Pressable>

                            <Pressable style={styles.circleButton}>
                                <Entypo name="facebook-with-circle" size={24} color="black" />
                            </Pressable>

                            <Pressable style={styles.circleButton}>
                                <FontAwesome6 name="x-twitter" size={24} color="black" />
                            </Pressable>
                        </View>

                        {/* Link to Login Screen */}
                        <View style={styles.footerView}>
                            <Text style={styles.footerText}>
                                Already have an account?{' '}
                                <Text onPress={onFooterLinkPress} style={styles.footerLink}>
                                    Log in
                                </Text>
                            </Text>
                        </View>
                    </View>
                </View>
                <LoadingModal visible={isLoading} />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}