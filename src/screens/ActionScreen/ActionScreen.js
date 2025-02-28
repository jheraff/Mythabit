import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';

const ActionScreen = () => {
    const navigation = useNavigation();
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

        // Set up a real-time listener with improved error handling
        const unsubscribeUserStats = onSnapshot(
            doc(db, 'users', userId),
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();

                    // Create complete user stats object, ensuring all fields exist
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
        { name: 'Adventure', route: 'Adventure' },
        { name: 'Items', route: 'Items' },
        { name: 'Shop', route: 'Shop' }
    ];

    return (
        <View style={styles.container}>
            {/* Header Container */}
            <View style={styles.headerContainer}>
                {/* Top row of header with profile, username, level, and currency */}
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

            {/* Action Screen Content */}
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
        backgroundColor: '#434',
        paddingVertical: 10,
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
    },
    username: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
    },
    levelContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginRight: 10,
    },
    levelText: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '500',
    },
    currencyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    currencyIcon: {
        width: 20,
        height: 20,
        marginRight: 5,
    },
    currencyText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    xpContainer: {
        paddingHorizontal: 16,
        paddingVertical: 5,
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
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
      },
      xpBar: {
        height: '100%',
        backgroundColor: '#4CAF50',
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
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: 'black',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
    }
});

export default ActionScreen;