import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useFocusEffect } from '@react-navigation/native';

const UserProfileScreen = ({ route, navigation }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const userId = route.params?.userId;
    const currentUserId = auth.currentUser?.uid;

    useFocusEffect(
        React.useCallback(() => {
            setLoading(true);
            loadUserData();
            
            return () => {
            };
        }, [userId])
    );

    const loadUserData = async () => {
        if (!userId) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserData({
                    id: userId,
                    ...data
                });

                if (currentUserId) {
                    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
                    if (currentUserDoc.exists()) {
                        setIsFollowing(currentUserDoc.data().following?.includes(userId) || false);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFollow = async () => {
        if (!currentUserId || !userId) return;

        const currentUserRef = doc(db, 'users', currentUserId);
        const userToFollowRef = doc(db, 'users', userId);

        try {
            if (isFollowing) {
                // Unfollow
                await updateDoc(currentUserRef, {
                    following: arrayRemove(userId)
                });
                await updateDoc(userToFollowRef, {
                    followers: arrayRemove(currentUserId)
                });
                setIsFollowing(false);
            } else {
                // Follow
                await updateDoc(currentUserRef, {
                    following: arrayUnion(userId)
                });
                await updateDoc(userToFollowRef, {
                    followers: arrayUnion(currentUserId)
                });
                setIsFollowing(true);
            }
            loadUserData();
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (!userData) {
        return (
            <View style={styles.container}>
                <Text>User not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.profileCard}>
                <Text style={styles.username}>{userData.username}</Text>
                <Text style={styles.level}>Level {userData.level}</Text>
                <View style={styles.statsContainer}>
                    <Text style={styles.statsText}>
                        Following: {userData.following?.length || 0}
                    </Text>
                    <Text style={styles.statsText}>
                        Followers: {userData.followers?.length || 0}
                    </Text>
                </View>
                {currentUserId !== userId && (
                    <TouchableOpacity
                        style={[styles.followButton, isFollowing && styles.followingButton]}
                        onPress={toggleFollow}
                    >
                        <Text style={styles.followButtonText}>
                            {isFollowing ? 'Following' : 'Follow'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    profileCard: {
        backgroundColor: '#f5f5f5',
        margin: 20,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    username: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    level: {
        fontSize: 22,
        color: '#666',
    },
    statsContainer: {
        flexDirection: 'row',
        marginTop: 15,
        gap: 20,
    },
    statsText: {
        fontSize: 16,
        color: '#444',
    },
    followButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 20,
    },
    followingButton: {
        backgroundColor: '#34C759',
    },
    followButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default UserProfileScreen;