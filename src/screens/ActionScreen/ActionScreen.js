import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../../styles/globalStyles';

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
        <View style={globalStyles.container}>
            <View style={globalStyles.headerContainer}>
                <View style={globalStyles.headerTopRow}>
                    <TouchableOpacity
                        style={globalStyles.profileButton}
                        onPress={() => navigation.navigate('Home', { screen: 'ProfileScreen' })}
                    >
                        <Ionicons name="person-circle-outline" size={30} color="white" />
                    </TouchableOpacity>

                    <Text style={globalStyles.username}>{userStats.username}</Text>

                    <View style={globalStyles.levelContainer}>
                        <Text style={globalStyles.levelText}>Level {userStats.level}</Text>
                    </View>

                    <View style={globalStyles.currencyContainer}>
                        <Image
                            source={require('../../../assets/coin.png')}
                            style={globalStyles.currencyIcon}
                        />
                        <Text style={globalStyles.currencyText}>{userStats.currency}</Text>
                    </View>
                </View>

                <View style={globalStyles.xpContainer}>
                    <View style={globalStyles.xpBarContainer}>
                        <View
                            style={[
                                globalStyles.xpBar,
                                { width: `${calculateXpProgress()}%` }
                            ]}
                        />
                        <Text style={globalStyles.xpText}>XP: {userStats.xp} / 1000</Text>
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