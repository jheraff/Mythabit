import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { db, auth } from '../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
    const [userData, setUserData] = useState({
        username: '',
        level: 1,
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
            return () => {};
        }, [])
    );

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
            // Get the current showcased achievements
            let updatedShowcase = [...userData.showcasedAchievements];

            // If already showcased, remove it
            if (updatedShowcase.includes(achievementId)) {
                updatedShowcase = updatedShowcase.filter(id => id !== achievementId);
            } 
            // Otherwise add it if we have less than 3
            else if (updatedShowcase.length < 3) {
                updatedShowcase.push(achievementId);
            }
            // If we already have 3, replace the first one
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
                    <Text style={styles.statItemLabel}>{statName} <Text style={styles.statItemValue}>{value}</Text></Text>
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
            <ScrollView style={styles.scrollContainer}>
                <View style={styles.profileCard}>
                    <View style={styles.profileCardContent}>
                        {/* Left side: Avatar and user info */}
                        <View style={styles.profileLeft}>
                            <View style={styles.avatarContainer}>
                                {renderAvatar()}
                            </View>
                            <Text style={styles.username}>{userData.username}</Text>
                            <Text style={styles.level}>Level {userData.level}</Text>
                        </View>
                        
                        {/* Right side: Following and followers */}
                        <View style={styles.profileRight}>
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
                </View>

                {/* Stats Section */}
                <View style={styles.statsContainer}>
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
                        <Text style={styles.achievementsTitle}>Showcased Achievements</Text>
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
    scrollContainer: {
        flex: 1,
    },
    profileCard: {
        backgroundColor: '#f5f5f5',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 10,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#000000',
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
    },
    profileLeft: {
        alignItems: 'center',
        width: '40%',
    },
    avatarContainer: {
        marginBottom: 10,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 8, 
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000000',
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 8, 
        borderWidth: 2,
        borderColor: '#000000',
    },
    profileRight: {
        width: '55%',
        justifyContent: 'center',
    },
    followCounts: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    level: {
        fontSize: 16,
        color: '#000000',
        textAlign: 'center',
    },
    statButton: {
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
    statsContainer: {
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#000000',
        marginHorizontal: 20,
        marginBottom: 10,
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
        paddingVertical: 8,
        paddingHorizontal: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#000000',
        alignItems: 'center',
    },
    statItemLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    statItemValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#6366f1',
    },
    achievementsContainer: {
        marginHorizontal: 20,
        marginBottom: 10,
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#000000',
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
    achievementsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    editButton: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    editButtonText: {
        fontSize: 12,
        color: '#666',
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
        backgroundColor: '#6366f1',
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
    // New styles for the side-by-side action buttons
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 20,
        marginTop: 15,
        marginBottom: 10,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#007AFF',
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
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    // Modal styles
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
        color: '#333',
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
        backgroundColor: '#6366f1',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ProfileScreen;