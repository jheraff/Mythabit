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
            
            let following = data.following || [];
            let followers = data.followers || [];
            
            let validFollowing = [];
            if (following.length > 0) {
                await Promise.all(following.map(async (followedUserId) => {
                    const followedUserDoc = await getDoc(doc(db, 'users', followedUserId));
                    if (followedUserDoc.exists()) {
                        validFollowing.push(followedUserId);
                    }
                }));
                
                if (validFollowing.length !== following.length) {
                    await updateDoc(doc(db, 'users', userId), {
                        following: validFollowing
                    });
                    following = validFollowing;
                }
            }
            
            let validFollowers = [];
            if (followers.length > 0) {
                await Promise.all(followers.map(async (followerUserId) => {
                    const followerUserDoc = await getDoc(doc(db, 'users', followerUserId));
                    if (followerUserDoc.exists()) {
                        validFollowers.push(followerUserId);
                    }
                }));
                
                if (validFollowers.length !== followers.length) {
                    await updateDoc(doc(db, 'users', userId), {
                        followers: validFollowers
                    });
                    followers = validFollowers;
                }
            }
            
            setUserData({
                id: userId,
                username: data.username,
                level: data.level,
                following: following,
                followers: followers,
                ...data
            });

            if (currentUserId) {
                const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
                if (currentUserDoc.exists()) {
                    const currentUserData = currentUserDoc.data();
                    let currentUserFollowing = currentUserData.following || [];
                    
                    let validCurrentUserFollowing = [];
                    if (currentUserFollowing.length > 0) {
                        await Promise.all(currentUserFollowing.map(async (followingId) => {
                            const followingDoc = await getDoc(doc(db, 'users', followingId));
                            if (followingDoc.exists()) {
                                validCurrentUserFollowing.push(followingId);
                            }
                        }));
                        
                        if (validCurrentUserFollowing.length !== currentUserFollowing.length) {
                            await updateDoc(doc(db, 'users', currentUserId), {
                                following: validCurrentUserFollowing
                            });
                            currentUserFollowing = validCurrentUserFollowing;
                        }
                    }
                    
                    setIsFollowing(currentUserFollowing.includes(userId) || false);
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
                <View style={styles.profileCardContent}>
                    {/* Username and level */}
                    <View style={styles.profileLeft}>
                        <Text style={styles.username}>{userData.username}</Text>
                        <Text style={styles.level}>Level {userData.level}</Text>
                    </View>
                    
                    {/* Following and followers counts */}
                    <View style={styles.profileRight}>
                        <View style={styles.statItem}>
                            <Text style={styles.statsNumber}>{userData.following?.length || 0}</Text>
                            <Text style={styles.statsLabel}>Following</Text>
                        </View>

                        <View style={styles.statItem}>
                            <Text style={styles.statsNumber}>{userData.followers?.length || 0}</Text>
                            <Text style={styles.statsLabel}>Followers</Text>
                        </View>
                    </View>
                </View>
                
                {/* Follow button */}
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
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    profileCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileLeft: {
        justifyContent: 'center',
    },
    profileRight: {
        flexDirection: 'row',
        gap: 20,
    },
    username: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    level: {
        fontSize: 22,
        color: '#666',
    },
    statItem: {
        alignItems: 'center',
    },
    statsNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    statsLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    followButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 20,
        alignSelf: 'center',
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