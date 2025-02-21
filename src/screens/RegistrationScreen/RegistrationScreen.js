import React, { useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View,
    StyleSheet, 
    SafeAreaView, 
    KeyboardAvoidingView,
    Pressable
 } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from './styles';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import LoadingModal from '../../utils/LoadingModal';
import { MaterialIcons } from '@expo/vector-icons';
import { AntDesign, Ionicons } from "@expo/vector-icons";
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { auth, db, initializeUserTasks } from '../../firebase/config';

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
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;
    
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
                createdAt: Date.now(),
            };
            
            await setDoc(doc(db, 'users', uid), userData);
    
            // Initialize tasks for the new user
            await initializeUserTasks(uid);
    
            // Navigate to Home screen or customization flow
            navigation.navigate('Home', { user: userData });
    
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

                {/* Main Container for form and title */}
                <View style={styles.boxContainer}>

                    {/* Application Title */}
                    <View style={{ alignItems: "center", marginBottom: 20 }}>
                        <Text style={styles.appTitle}>Productivity App</Text>
                    </View>

                    {/* Register Title */}
                    <View style={{ alignItems: "center" }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", marginTop: 20 }}>
                            Register your account
                        </Text>
                    </View>

                    <View style={{ marginTop: 40 }}>

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
                            <Pressable 
                                /*onPress={signInWithGoogle}*/
                                style={styles.circleButton}
                            >
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

