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
import { AntDesign } from "@expo/vector-icons";
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
    loginButton: {
        width: 200,
        backgroundColor: "#F67B7B",
        padding: 15,
        borderRadius: 6,
        marginLeft: "auto",
        marginRight: "auto",
        alignItems: 'center',
    },
    loginButtonText: {
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

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const onFooterLinkPress = () => {
        navigation.navigate('Registration');
    };

    const onLoginPress = async () => {
        if (!email || !password) {
            alert("Please fill in all fields.");
            return;
        }

        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;
            
            const userDoc = await getDoc(doc(db, 'users', uid));
            
            if (!userDoc.exists()) {
                alert("User does not exist anymore.");
                return;
            }
            const userData = userDoc.data();
            
            // Initialize tasks for the user
            await initializeUserTasks(uid);
            
            // Save user data to AsyncStorage
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            
            // Clear form
            setEmail('');
            setPassword('');
            
        } catch (error) {
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "white", alignItems: "center" }}>
            <KeyboardAvoidingView>
                <View style={styles.boxContainer}>
                    {/* Application Title */}
                    <View style={{ alignItems: "center", marginBottom: 5 }}>
                        <Text style={styles.appTitle}>MYTHABIT</Text>
                    </View>

                    {/* Login Title */}
                    <View style={{ alignItems: "center" }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", marginTop: 20 }}>
                            Login to your account
                        </Text>
                    </View>

                    <View style={{ marginTop: 20 }}>
                        {/* Email Input Field */}
                        <View style={styles.inputContainer}>
                            <MaterialIcons style={styles.iconStyle} name="email" size={24} color="gray" />
                            <TextInput
                                value={email}
                                onChangeText={(text) => setEmail(text)}
                                style={styles.textInput}
                                placeholder="Enter your email"
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
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Login Button */}
                        <View style={{ marginTop: 20, alignItems: 'center' }}>
                            <Pressable
                                onPress={onLoginPress}
                                style={styles.loginButton}
                            >
                                <Text style={styles.loginButtonText}>
                                    Login
                                </Text>
                            </Pressable>
                        </View>

                        {/* Social Media Login Buttons */}
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

                        {/* Link to Registration Screen */}
                        <View style={styles.footerView}>
                            <Text style={styles.footerText}>
                                Don't have an account?{' '}
                                <Text onPress={onFooterLinkPress} style={styles.footerLink}>
                                    Sign up
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