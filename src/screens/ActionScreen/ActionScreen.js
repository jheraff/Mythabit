import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';

const ActionScreen = ({ navigation }) => {
    //const navigation = useNavigation();
    const primaryColor = 'black';
    const secondaryColor = 'white';
    const [userStats, setUserStats] = useState({
        username: '',
        level: 1,
        xp: 0,
        currency: 0,
        avatar: null,
        stats: {
            strength: 1,
            intellect: 1,
            agility: 1,
            arcane: 1,
            focus: 1
        }
    });

    useEffect(() => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const unsubscribeUserStats = onSnapshot(
            doc(db, 'users', userId),
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();

                    const completeUserStats = {
                        username: userData.username || auth.currentUser?.displayName || 'New User',
                        level: userData.level || 1,
                        xp: userData.xp || 0,
                        currency: userData.currency || 0,
                        avatar: userData.avatar || null,
                        stats: {
                            strength: userData.stats?.strength || 1,
                            intellect: userData.stats?.intellect || 1,
                            agility: userData.stats?.agility || 1,
                            arcane: userData.stats?.arcane || 1,
                            focus: userData.stats?.focus || 1
                        }
                    };
                    setUserStats(completeUserStats);
                }
            },
            (error) => {
                console.error(error);
            }
        );

        return () => {
            unsubscribeUserStats();
        };
    }, []);

    const calculateXpProgress = () => {
        return (userStats.xp / 1000) * 100;
    };

    const routes = [
        { name: 'Adventure', route: 'Tower' },
        { name: 'Items', route: 'Items' },
        { name: 'Shop', route: 'Shop' }
    ];

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('Home', { screen: 'ProfileScreen' })}
                    >
                        <Ionicons name="person-circle-outline" size={30} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.username}>{userStats.username}</Text>

                    <View style={styles.levelContainer}>
                        <Text style={styles.levelText}>Level {userStats.level}</Text>
                    </View>

                    <View style={styles.currencyContainer}>
                        <Image
                            source={require('../../../assets/coin.png')}
                            style={styles.currencyIcon}
                        />
                        <Text style={styles.currencyText}>{userStats.currency}</Text>
                    </View>
                </View>

                <View style={styles.xpContainer}>
                    <View style={styles.xpBarContainer}>
                        <View
                            style={[
                                styles.xpBar,
                                { width: `${calculateXpProgress()}%` }
                            ]}
                        />
                        <Text style={styles.xpText}>XP: {userStats.xp} / 1000</Text>
                    </View>
                </View>
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.title}>Action</Text>
                <View style={styles.buttonContainer}>
                    {routes.map((item) => (
                        <TouchableOpacity
                            key={item.route}
                            style={[
                                styles.button,
                                { backgroundColor: secondaryColor }
                            ]}
                            onPress={() => navigation.navigate(item.route)}
                        >
                            <Text
                                style={[
                                    styles.buttonText,
                                    { color: primaryColor }
                                ]}
                            >
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerContainer: {
        backgroundColor: '#1c2d63',
        paddingVertical: 15,
        borderBottomWidth: 4,
        borderBottomColor: '#afe8ff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 5,
    },
    profileButton: {
        padding: 5,
        marginRight: 10,
        backgroundColor: '#152551',
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#afe8ff',
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
    },
    levelContainer: {
        backgroundColor: '#152551',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginRight: 10,
        borderWidth: 2,
        borderColor: '#afe8ff',
    },
    levelText: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: '700',
    },
    currencyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#152551',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#afe8ff',
    },
    currencyIcon: {
        width: 20,
        height: 20,
        marginRight: 5,
    },
    currencyText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#afe8ff', 
    },
    xpContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginTop: 5,
    },
    xpText: {
        fontSize: 12,
        color: '#ffffff',
        fontWeight: 'bold',
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        textAlign: 'center',
        textAlignVertical: 'center',
        padding: 2,
        zIndex: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    xpBarContainer: {
        height: 20,
        backgroundColor: '#152551',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 2,
        borderColor: '#afe8ff',
    },
    xpBar: {
        height: '100%',
        backgroundColor: '#4287f5',
        position: 'absolute',
        left: 0,
        top: 0,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 16,
    },
    buttonContainer: {
        width: '80%',
        alignItems: 'stretch',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#1c2d63', 
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginVertical: 10,
        borderWidth: 2, 
        borderColor: '#1c2d63',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
    }
});

export default ActionScreen;