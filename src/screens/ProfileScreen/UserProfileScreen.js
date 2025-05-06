import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ActivityIndicator,
    Image,
    ScrollView
} from 'react-native';
import { 
    doc, 
    getDoc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove
} from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CoopQuestsModal from '../tasks/CoopQuestsModal';
import { globalStyles } from '../../../styles/globalStyles';

const UserProfileScreen = ({ route, navigation }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [achievements, setAchievements] = useState([]);
    const [showcasedAchievements, setShowcasedAchievements] = useState([]);
    const [showCoopQuestModal, setShowCoopQuestModal] = useState(false);
    
    const userId = route.params?.userId;
    const currentUserId = auth.currentUser?.uid;

    useFocusEffect(
        React.useCallback(() => {
            setLoading(true);
            loadUserData();
            loadUserAchievements();
            
            return () => {
                // Cleanup function
            };
        }, [userId])
    );

    // All existing functions (loadUserData, loadUserAchievements, etc.) remain the same
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
                
                const completeUserData = {
                    id: userId,
                    username: data.username || 'User',
                    level: data.level || 1,
                    xp: data.xp || 0,
                    currency: data.currency || 0,
                    avatar: data.avatar || null,
                    following: following,
                    followers: followers,
                    showcasedAchievements: data.showcasedAchievements || [],
                    stats: {
                        strength: data.stats?.strength || 1,
                        intellect: data.stats?.intellect || 1,
                        agility: data.stats?.agility || 1,
                        arcane: data.stats?.arcane || 1,
                        focus: data.stats?.focus || 1
                    },
                    ...data
                };
                
                setUserData(completeUserData);

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

    const loadUserAchievements = async () => {
        if (!userId) return;

        try {
            // Get user achievement data from Firestore
            const userAchievementsDoc = await getDoc(doc(db, 'userAchievements', userId));
            if (!userAchievementsDoc.exists()) {
                return;
            }

            const userAchievements = userAchievementsDoc.data().achievements || {};
            
            // Get achievement definitions from Firestore
            const achievementsSnapshot = await getDoc(doc(db, 'achievements', 'definitions'));
            if (!achievementsSnapshot.exists()) {
                console.log("No achievements definitions found");
                return;
            }
            
            const achievementsData = achievementsSnapshot.data().achievements || [];
            
            // Merge achievement definitions with user progress
            const mergedAchievements = achievementsData.map(achievement => {
                const userAchievement = userAchievements[achievement.id] || {};
                return {
                    ...achievement,
                    progress: userAchievement.progress || 0,
                    unlocked: userAchievement.unlocked || false,
                    rewardClaimed: userAchievement.rewardClaimed || false,
                    dateUnlocked: userAchievement.dateUnlocked || null
                };
            });
            
            // Only show unlocked achievements
            const unlockedAchievements = mergedAchievements.filter(a => a.unlocked);
            setAchievements(unlockedAchievements);

            // Get showcased achievements
            if (userData?.showcasedAchievements && userData.showcasedAchievements.length > 0) {
                const showcased = userData.showcasedAchievements
                    .map(id => unlockedAchievements.find(a => a.id === id))
                    .filter(Boolean);
                setShowcasedAchievements(showcased);
            }
        } catch (error) {
            console.error("Error loading user achievements:", error);
        }
    };

    // Update showcased achievements when userData changes
    useEffect(() => {
        if (userData?.showcasedAchievements && achievements.length > 0) {
            const showcased = userData.showcasedAchievements
                .map(id => achievements.find(a => a.id === id))
                .filter(Boolean);
            setShowcasedAchievements(showcased);
        }
    }, [userData, achievements]);

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

    const navigateToMessageScreen = () => {
        navigation.navigate('Message', { userId: userId });
    };

    // Add XP progress calculation function to match header
    const calculateXpProgress = () => {
        return ((userData?.xp || 0) / 1000) * 100;
    };

    const renderAvatar = () => {
        try {
            if (!userData || !userData.avatar) {
                return (
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={40} color="#666" />
                    </View>
                );
            }

            return (
                <Image
                    source={require('../../../assets/avatars/default_pfp.jpg')}
                    style={styles.avatarImage}
                    resizeMode="contain"
                />
            );
        } catch (error) {
            console.error("Error rendering avatar:", error);
            return (
                <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={40} color="#666" />
                </View>
            );
        }
    };

    const renderStatItem = (statName, value) => {
        try {
            return (
                <View style={styles.statItemBox}>
                    <Text style={styles.statItemLabel}>{statName}</Text>
                    <Text style={styles.statItemValue}>{value}</Text>
                </View>
            );
        } catch (error) {
            console.error(`Error rendering stat ${statName}:`, error);
            return null;
        }
    };

    const renderAchievementCard = (achievement) => {
        if (!achievement) return null;
        
        return (
            <View style={styles.achievementCard}>
                <View style={styles.achievementHeader}>
                    <Text style={styles.achievementName}>{achievement.name}</Text>
                </View>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
            </View>
        );
    };

    const renderShowcasedAchievements = () => {
        if (!showcasedAchievements || showcasedAchievements.length === 0) {
            return (
                <View style={styles.noAchievementsContainer}>
                    <Text style={styles.noAchievementsText}>No achievements showcased</Text>
                </View>
            );
        }

        return (
            <View style={styles.showcasedContainer}>
                {showcasedAchievements.map(achievement => (
                    <View key={achievement.id} style={styles.showcasedAchievementContainer}>
                        {renderAchievementCard(achievement)}
                    </View>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1c2d63" />
            </View>
        );
    }

    if (!userData) {
        return (
            <View style={globalStyles.container}>
                <Text>User not found</Text>
            </View>
        );
    }

    return (
        <View style={globalStyles.container}>
            {/* Header Container with updated styling */}
            <View style={globalStyles.headerContainer}>
                {/* Top row of header with back button, username, level */}
                <View style={globalStyles.headerTopRow}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#afe8ff" />
                    </TouchableOpacity>

                    <Text style={globalStyles.username}>{userData.username}</Text>

                    <View style={globalStyles.levelContainer}>
                        <Text style={globalStyles.levelText}>Level {userData.level}</Text>
                    </View>
                </View>

                {/* XP bar row with text inside */}
                <View style={globalStyles.xpContainer}>
                    <View style={globalStyles.xpBarContainer}>
                        <View
                            style={[
                                globalStyles.xpBar,
                                { width: `${calculateXpProgress()}%` }
                            ]}
                        />
                        <Text style={globalStyles.xpText}>XP: {userData.xp || 0} / 1000</Text>
                    </View>
                </View>
            </View>
            
            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileSection}>
                    {/* Left side: Avatar */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            {renderAvatar()}
                        </View>
                    </View>
                    
                    {/* Right side: Following and followers */}
                    <View style={styles.userInfoSection}>
                        <View style={styles.followCounts}>
                            <View style={styles.statFollowing}>
                                <Text style={styles.statsNumber}>{userData.following?.length || 0}</Text>
                                <Text style={styles.statsLabel}>Following</Text>
                            </View>

                            <View style={styles.statFollowers}>
                                <Text style={styles.statsNumber}>{userData.followers?.length || 0}</Text>
                                <Text style={styles.statsLabel}>Followers</Text>
                            </View>
                        </View>
                        
                        {/* Action buttons */}
                        {currentUserId !== userId && (
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.followButton, isFollowing && styles.followingButton]}
                                    onPress={toggleFollow}
                                >
                                    <Text style={styles.followButtonText} numberOfLines={1} ellipsizeMode="tail">
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.messageButton}
                                    onPress={navigateToMessageScreen}
                                >
                                    <Text style={styles.messageButtonText} numberOfLines={1} ellipsizeMode="tail">
                                        Message
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
                
                {/* Stats Section */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>Character Stats</Text>
                    <View style={styles.statsList}>
                        {renderStatItem('STR', userData.stats?.strength || 1)}
                        {renderStatItem('INT', userData.stats?.intellect || 1)}
                        {renderStatItem('AGI', userData.stats?.agility || 1)}
                        {renderStatItem('ARC', userData.stats?.arcane || 1)}
                        {renderStatItem('FOC', userData.stats?.focus || 1)}
                    </View>
                </View>
                
                {/* Achievements Section */}
                <View style={styles.achievementsContainer}>
                    <View style={styles.achievementsHeader}>
                        <Text style={styles.sectionTitle}>Showcased Achievements</Text>
                    </View>
                    
                    {renderShowcasedAchievements()}
                </View>

                {/* Co-op Quest Modal */}
                <CoopQuestsModal
                    visible={showCoopQuestModal}
                    onClose={() => setShowCoopQuestModal(false)}
                    partnerId={userId}
                    partnerName={userData?.username || 'Partner'}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    backButton: {
        padding: 5,
        marginRight: 10,
        backgroundColor: '#152551',
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#afe8ff',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    profileSection: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1, 
        borderBottomColor: '#e0e0e0',
    },
    avatarSection: {
        alignItems: 'center',
        marginRight: 20,
    },
    avatarContainer: {
        marginBottom: 5,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 8, 
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#1c2d63',
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 8, 
        borderWidth: 2,
        borderColor: '#1c2d63',
    },
    userInfoSection: {
        flex: 1,
        justifyContent: 'center',
    },
    followCounts: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    statFollowing: {
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#1c2d63',
        minWidth: 80,
    },
    statFollowers: {
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#1c2d63',
        minWidth: 80,
    },
    statsNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1c2d63',
    },
    statsLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1c2d63',
        marginBottom: 10,
    },
    statsContainer: {
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        marginHorizontal: 15,
        marginTop: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    statsList: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItemBox: {
        width: 55,
        height: 55,
        paddingVertical: 8,
        paddingHorizontal: 6,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#1c2d63',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statItemLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
        marginBottom: 3,
    },
    statItemValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1c2d63',
    },
    achievementsContainer: {
        marginHorizontal: 15,
        marginBottom: 15,
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    achievementsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    showcasedContainer: {
        marginBottom: 10,
    },
    showcasedAchievementContainer: {
        marginBottom: 8,
    },
    noAchievementsContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        marginBottom: 10,
    },
    noAchievementsText: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
    },
    achievementCard: {
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#1c2d63',
        borderLeftWidth: 3,
        borderLeftColor: '#1c2d63',
    },
    achievementHeader: {
        marginBottom: 4,
    },
    achievementName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1c2d63',
    },
    achievementDescription: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    followButton: {
        backgroundColor: '#1c2d63',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        marginRight: 5,
    },
    followingButton: {
        backgroundColor: '#34C759',
    },
    followButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    messageButton: {
        backgroundColor: '#152551',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        marginLeft: 5,
        borderWidth: 1,
        borderColor: '#afe8ff',
    },
    messageButtonText: {
        color: '#afe8ff',
        fontSize: 14,
        fontWeight: '500',
    }
});

export default UserProfileScreen;