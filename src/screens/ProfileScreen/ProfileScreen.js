import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { db, auth } from '../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../AvatarScreen/Avatar';
import { useAvatar } from '../AvatarScreen/AvatarContext';

const ProfileScreen = () => {
    const navigation = useNavigation();
    const { avatar, refreshAvatar } = useAvatar();
    const [userData, setUserData] = useState({
        username: '',
        level: 1,
        xp: 0,
        following: [],
        followers: [],
        avatar: null,
        stats: {
            strength: 1,
            intellect: 1,
            agility: 1,
            arcane: 1,
            focus: 1
        },
        showcasedAchievements: []
    });
    const [achievements, setAchievements] = useState([]);
    const [showAchievementModal, setShowAchievementModal] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            loadUserData();
            loadUserAchievements();
            refreshAvatar();
            return () => {};
        }, [])
    );

    // Existing functions (loadUserData, loadUserAchievements, etc.) remain the same
    const loadUserData = async () => {
        const userId = auth.currentUser?.uid;
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
              username: data.username || 'User',
              level: data.level || 1,
              xp: data.xp || 0,
              following: following,
              followers: followers,
              avatar: data.avatar || null,
              stats: {
                strength: data.stats?.strength || 1,
                intellect: data.stats?.intellect || 1,
                agility: data.stats?.agility || 1,
                arcane: data.stats?.arcane || 1,
                focus: data.stats?.focus || 1
              },
              showcasedAchievements: data.showcasedAchievements || []
            });
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
    };

    const loadUserAchievements = async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        try {
            // Get user achievement data from Firestore
            const userAchievementsDoc = await getDoc(doc(db, 'userAchievements', userId));
            if (!userAchievementsDoc.exists()) {
                return;
            }

            const userAchievements = userAchievementsDoc.data().achievements || {};
            
            // Get achievement definitions from achievements.json
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
            setAchievements(mergedAchievements.filter(a => a.unlocked));
        } catch (error) {
            console.error("Error loading user achievements:", error);
        }
    };

    const navigateToFollowList = (type) => {
        navigation.navigate('FollowList', {
            type,
            userId: userData.id
        });
    };

    const navigateToAchievements = () => {
        navigation.navigate('Quests', { screen: 'Achievements' });
    };

    const navigateToSearchUsers = () => {
        navigation.navigate('SearchUsers');
    };

    const toggleAchievementSelection = async (achievementId) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        try {
            let updatedShowcase = [...userData.showcasedAchievements];

            if (updatedShowcase.includes(achievementId)) {
                updatedShowcase = updatedShowcase.filter(id => id !== achievementId);
            } 
            else if (updatedShowcase.length < 3) {
                updatedShowcase.push(achievementId);
            }
            else {
                updatedShowcase.shift();
                updatedShowcase.push(achievementId);
            }

            // Update Firestore
            await updateDoc(doc(db, 'users', userId), {
                showcasedAchievements: updatedShowcase
            });

            // Update local state
            setUserData(prev => ({
                ...prev,
                showcasedAchievements: updatedShowcase
            }));
        } catch (error) {
            console.error('Error updating showcased achievements:', error);
        }
    };

    // Add XP progress calculation function to match header
    const calculateXpProgress = () => {
        return (userData.xp / 1000) * 100;
    };

    const renderAvatar = () => {
        const userId = auth.currentUser?.uid;
        return (
            <View style={styles.avatarWrapper}>
                <Avatar 
                    size={80}
                    style={styles.profileAvatar}
                    userId={userId}
                    // Force refresh with a key that changes when avatar updates
                    key={avatar ? JSON.stringify(avatar) : 'no-avatar'}
                />
            </View>
        );
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
        
        const isShowcased = userData.showcasedAchievements.includes(achievement.id);
        
        return (
            <View style={[styles.achievementCard, isShowcased && styles.showcasedAchievement]}>
                <View style={styles.achievementHeader}>
                    <Text style={styles.achievementName}>{achievement.name}</Text>
                </View>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
            </View>
        );
    };

    const renderShowcasedAchievements = () => {
        if (!userData.showcasedAchievements || userData.showcasedAchievements.length === 0) {
            return (
                <View style={styles.noAchievementsContainer}>
                    <Text style={styles.noAchievementsText}>No achievements showcased</Text>
                </View>
            );
        }

        const showcased = userData.showcasedAchievements
            .map(id => achievements.find(a => a.id === id))
            .filter(Boolean);

        return (
            <View style={styles.showcasedContainer}>
                {showcased.map(achievement => (
                    <View key={achievement.id} style={styles.showcasedAchievementContainer}>
                        {renderAchievementCard(achievement)}
                    </View>
                ))}
            </View>
        );
    };

    const renderAchievementModal = () => {
        return (
            <Modal
                visible={showAchievementModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowAchievementModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Achievements to Showcase</Text>
                            <TouchableOpacity onPress={() => setShowAchievementModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.modalSubtitle}>
                            Select up to 3 achievements to display on your profile
                        </Text>
                        
                        <ScrollView style={styles.achievementsList}>
                            {achievements.length > 0 ? (
                                achievements.map(achievement => (
                                    <TouchableOpacity 
                                        key={achievement.id}
                                        style={[
                                            styles.achievementSelectItem,
                                            userData.showcasedAchievements.includes(achievement.id) && 
                                            styles.achievementSelectItemActive
                                        ]}
                                        onPress={() => toggleAchievementSelection(achievement.id)}
                                    >
                                        <View style={styles.achievementSelectContent}>
                                            <Text style={styles.achievementSelectName}>{achievement.name}</Text>
                                            <Text style={styles.achievementSelectDescription}>
                                                {achievement.description}
                                            </Text>
                                        </View>
                                        
                                        {userData.showcasedAchievements.includes(achievement.id) && (
                                            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                                        )}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.noAchievementsText}>
                                    Complete achievements to showcase them on your profile!
                                </Text>
                            )}
                        </ScrollView>
                        
                        <TouchableOpacity 
                            style={styles.modalButton}
                            onPress={() => setShowAchievementModal(false)}
                        >
                            <Text style={styles.modalButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header Container with updated styling */}
            <View style={styles.headerContainer}>
                {/* Top row of header with profile, username, level, and currency */}
                <View style={styles.headerTopRow}>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#afe8ff" />
                    </TouchableOpacity>

                    <Text style={styles.headerUsername}>{userData.username}</Text>

                    <View style={styles.levelContainer}>
                        <Text style={styles.levelText}>Level {userData.level}</Text>
                    </View>
                </View>

                {/* XP bar row with text inside */}
                <View style={styles.xpContainer}>
                    <View style={styles.xpBarContainer}>
                        <View
                            style={[
                                styles.xpBar,
                                { width: `${calculateXpProgress()}%` }
                            ]}
                        />
                        <Text style={styles.xpText}>XP: {userData.xp} / 1000</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.scrollContainer}>
                <View style={styles.profileSection}>
                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            {renderAvatar()}
                        </View>
                    </View>
                    
                    {/* User Info Section */}
                    <View style={styles.userInfoSection}>
                        <View style={styles.followCounts}>
                            <TouchableOpacity 
                                style={styles.statButton}
                                onPress={() => navigateToFollowList('following')}
                            >
                                <Text style={styles.statsNumber}>{userData.following.length}</Text>
                                <Text style={styles.statsLabel}>Following</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.statButton}
                                onPress={() => navigateToFollowList('followers')}
                            >
                                <Text style={styles.statsNumber}>{userData.followers.length}</Text>
                                <Text style={styles.statsLabel}>Followers</Text>
                            </TouchableOpacity>
                        </View>
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
                        <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => setShowAchievementModal(true)}
                        >
                            <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {renderShowcasedAchievements()}
                    
                    <TouchableOpacity 
                        style={styles.viewAllButton}
                        onPress={navigateToAchievements}
                    >
                        <Text style={styles.viewAllButtonText}>View All Achievements</Text>
                    </TouchableOpacity>
                </View>
                
                {/* Action buttons - Now side by side and part of the scrollable content */}
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={navigateToSearchUsers}
                    >
                        <Text style={styles.buttonText}>Search Users</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('LeaderboardScreen')}
                    >
                        <Text style={styles.buttonText}>View Leaderboard</Text>
                    </TouchableOpacity>
                </View>
                
                {/* Add padding at bottom for better scrolling */}
                <View style={{ height: 40 }} />
            </ScrollView>
            
            {renderAchievementModal()}
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
    headerUsername: {
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
    scrollContainer: {
        flex: 1,
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
    },
    statButton: {
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
    editButton: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        backgroundColor: '#152551',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#afe8ff',
    },
    editButtonText: {
        fontSize: 12,
        color: '#afe8ff',
        fontWeight: '500',
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
        borderColor: '#ddd',
    },
    showcasedAchievement: {
        borderColor: '#4CAF50',
        borderWidth: 2,
    },
    achievementHeader: {
        marginBottom: 4,
    },
    achievementName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    achievementDescription: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
    },
    viewAllButton: {
        backgroundColor: '#1c2d63',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    viewAllButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 15,
        marginTop: 15,
        marginBottom: 10,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#1c2d63',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginHorizontal: 5,
    },
    buttonText: {
        color: '#afe8ff',
        fontSize: 14,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1c2d63',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
    },
    achievementsList: {
        maxHeight: 400,
    },
    achievementSelectItem: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    achievementSelectItemActive: {
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 2,
    },
    achievementSelectContent: {
        flex: 1,
        marginRight: 10,
    },
    achievementSelectName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    achievementSelectDescription: {
        fontSize: 12,
        color: '#666',
    },
    modalButton: {
        backgroundColor: '#1c2d63',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    modalButtonText: {
        color: '#afe8ff',
        fontSize: 16,
        fontWeight: '600',
    },
    avatarWrapper: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileAvatar: {
        borderWidth: 2,
        borderColor: '#1c2d63',
    },
});

export default ProfileScreen;