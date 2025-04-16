import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    Image,
    ScrollView
} from 'react-native';
import { 
    doc, 
    getDoc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove,
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CoopQuestsModal from '../tasks/CoopQuestsModal';
import CoopQuestService from '../tasks/CoopQuestService';

const UserProfileScreen = ({ route, navigation }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showMessageOptions, setShowMessageOptions] = useState(false);
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState('');
    const [achievements, setAchievements] = useState([]);
    const [showcasedAchievements, setShowcasedAchievements] = useState([]);
    const [showCoopQuestModal, setShowCoopQuestModal] = useState(false);
    const flatListRef = useRef(null);
    
    const predefinedMessages = [
        "Hey, how are you?",
        "Hello!",
        "I'm great",
        "Nice to meet you!",
        "Do you want to quest together?",
        "Congratulations on leveling up!",
        "/quest", // Command to start co-op quests
    ];

    const userId = route.params?.userId;
    const currentUserId = auth.currentUser?.uid;

    useFocusEffect(
        React.useCallback(() => {
            setLoading(true);
            loadUserData();
            loadUserAchievements();
            
            return () => {
                
            };
        }, [userId])
    );

    useEffect(() => {
        if (!showChat || !currentUserId || !userId) return;
        
        const chatId = getChatId();
        
        try {
            console.log("Load messages for chatId:", chatId);
            
            const q = query(
                collection(db, 'chats'),
                where('chatId', '==', chatId)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                console.log("Messages count:", snapshot.docs.length);
                
                const messageList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a, b) => {
                    if (!a.timestamp) return -1;
                    if (!b.timestamp) return 1;
                    return a.timestamp.toDate() - b.timestamp.toDate();
                });
                
                setMessages(messageList);
                
                if (messageList.length > 0 && flatListRef.current) {
                    setTimeout(() => {
                        flatListRef.current.scrollToEnd({ animated: false });
                    }, 100);
                }
            }, error => {
                console.error("Error loading messages:", error);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Error:", error);
            return () => {};
        }
    }, [showChat, currentUserId, userId]);

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

    const getChatId = () => {
        const sortedIds = [currentUserId, userId].sort();
        return `${sortedIds[0]}_${sortedIds[1]}`;
    };

    const toggleChat = () => {
        setShowChat(!showChat);
    };

    // Function to handle quest commands from chat
    const handleQuestCommand = (message) => {
        if (message.toLowerCase().startsWith('/quest')) {
            // The user is trying to initiate a quest
            setShowCoopQuestModal(true);
            return true; // Message was handled as a command
        }
        return false; // Not a command
    };

    const sendMessage = async () => {
        if (!selectedMessage || !currentUserId || !userId) return;

        // Check if this is a quest command before sending
        if (handleQuestCommand(selectedMessage)) {
            return; // Don't send the message if it was a command
        }

        const chatId = getChatId();
        
        try {
            console.log("Sending message:", {
                chatId,
                text: selectedMessage,
                senderId: currentUserId,
                receiverId: userId
            });
            
            const timestamp = new Date();
            
            await addDoc(collection(db, 'chats'), {
                chatId: chatId,
                text: selectedMessage,
                senderId: currentUserId,
                receiverId: userId,
                timestamp: timestamp,
            });
            
            console.log("Message sent successfully");
            
            setSelectedMessage('');
            setShowMessageOptions(false);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const renderMessage = ({ item }) => {
        const isCurrentUser = item.senderId === currentUserId;
        const isSystemMessage = item.senderId === 'system' && item.questRelated;
        
        let timeDisplay = '';
        try {
            if (item.timestamp) {
                if (typeof item.timestamp.toDate === 'function') {
                    timeDisplay = new Date(item.timestamp.toDate()).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                } else {
                    timeDisplay = new Date(item.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                }
            }
        } catch (error) {
            console.error("Error formatting message time:", error);
            timeDisplay = '';
        }
        
        if (isSystemMessage) {
            return (
                <View style={styles.systemMessageContainer}>
                    <View style={styles.systemMessageBubble}>
                        <Ionicons name="trophy" size={16} color="#6366f1" style={styles.systemMessageIcon} />
                        <Text style={styles.systemMessageText}>{item.text}</Text>
                    </View>
                    <Text style={styles.systemMessageTime}>{timeDisplay}</Text>
                </View>
            );
        }
        
        return (
            <View style={[
                styles.messageBubble,
                isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
            ]}>
                <Text style={[
                    styles.messageText,
                    isCurrentUser ? styles.currentUserMessageText : styles.otherUserMessageText
                ]}>
                    {item.text}
                </Text>
                <Text style={[
                    styles.timeText,
                    isCurrentUser ? styles.currentUserTimeText : styles.otherUserTimeText
                ]}>
                    {timeDisplay}
                </Text>
            </View>
        );
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
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : null}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
                        
                        {/* Right side: Following, followers and action buttons */}
                        <View style={styles.profileRight}>
                            {/* Follow counts */}
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
                                        style={[styles.messageButton, showChat && styles.activeMessageButton]}
                                        onPress={toggleChat}
                                    >
                                        <Text style={styles.messageButtonText} numberOfLines={1} ellipsizeMode="tail">
                                            {showChat ? 'Hide' : 'Message'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
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
                    </View>
                    
                    {renderShowcasedAchievements()}
                </View>
            </ScrollView>

            {/* Chat section */}
            {showChat && currentUserId !== userId && (
                <View style={styles.chatContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.messageList}
                        ListEmptyComponent={
                            <View style={styles.emptyChat}>
                                <Text style={styles.emptyChatText}>
                                    No messages yet.
                                </Text>
                                <TouchableOpacity
                                    style={styles.startQuestButton}
                                    onPress={() => setShowCoopQuestModal(true)}
                                >
                                    <Ionicons name="trophy" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.startQuestButtonText}>Start a Co-op Quest</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                    
                    <View style={styles.messageOptionsContainer}>
                        <TouchableOpacity 
                            style={styles.questButton}
                            onPress={() => setShowCoopQuestModal(true)}
                        >
                            <Ionicons name="trophy" size={20} color="#fff" />
                            <Text style={styles.questButtonText}>Start Co-op Quest</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.toggleMessagesButton}
                            onPress={() => setShowMessageOptions(!showMessageOptions)}
                        >
                            <Text style={styles.toggleMessagesButtonText}>
                                {showMessageOptions ? "Hide Message Options" : "Show Message Options"}
                            </Text>
                        </TouchableOpacity>
                        
                        {showMessageOptions && (
                            <View style={styles.messageGrid}>
                                <View style={styles.messageColumn}>
                                    {predefinedMessages.slice(0, Math.ceil(predefinedMessages.length / 2)).map((message, index) => (
                                        <TouchableOpacity 
                                            key={`message-option-left-${index}`}
                                            style={[
                                                styles.messageOption,
                                                selectedMessage === message && styles.selectedMessageOption
                                            ]}
                                            onPress={() => setSelectedMessage(message)}
                                        >
                                            <Text 
                                                style={[
                                                    styles.messageOptionText,
                                                    selectedMessage === message && styles.selectedMessageOptionText
                                                ]}
                                            >
                                                {message}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                
                                <View style={styles.messageColumn}>
                                    {predefinedMessages.slice(Math.ceil(predefinedMessages.length / 2)).map((message, index) => (
                                        <TouchableOpacity 
                                            key={`message-option-right-${index}`}
                                            style={[
                                                styles.messageOption,
                                                selectedMessage === message && styles.selectedMessageOption
                                            ]}
                                            onPress={() => setSelectedMessage(message)}
                                        >
                                            <Text 
                                                style={[
                                                    styles.messageOptionText,
                                                    selectedMessage === message && styles.selectedMessageOptionText
                                                ]}
                                            >
                                                {message}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                        
                        <View style={styles.sendButtonContainer}>
                            <TouchableOpacity 
                                style={[
                                    styles.sendButton,
                                    !selectedMessage && styles.disabledButton
                                ]}
                                onPress={sendMessage}
                                disabled={!selectedMessage}
                            >
                                <Text style={styles.sendButtonText}>
                                    {selectedMessage ? "Send" : "Choose a Message"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Co-op Quest Modal */}
            <CoopQuestsModal
                visible={showCoopQuestModal}
                onClose={() => setShowCoopQuestModal(false)}
                partnerId={userId}
                partnerName={userData?.username || 'Partner'}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
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
        borderColor: '#6366f1',
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 8, 
        borderWidth: 2,
        borderColor: '#6366f1',
    },
    profileRight: {
        width: '55%',
        justifyContent: 'space-between',
    },
    followCounts: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    level: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    statFollowing: {
        alignItems: 'center',
    },
    statFollowers: {
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
        borderColor: '#000000',
        borderLeftWidth: 3,
        borderLeftColor: '#000000',
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
    errorText: {
        color: 'red',
        textAlign: 'center',
        padding: 10,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    followButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 16,
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
        backgroundColor: '#009500',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 16,
        flex: 1,
        alignItems: 'center',
        marginLeft: 5,
    },
    activeMessageButton: {
        backgroundColor: '#FF3B30',
    },
    messageButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    chatContainer: {
        flex: 1,
        marginHorizontal: 20,
        marginTop: 8,
        marginBottom: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#000000',
        overflow: 'hidden',
        backgroundColor: '#f9f9f9',
    },
    messageList: {
        padding: 10,
        flexGrow: 1,
    },
    emptyChat: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyChatText: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
    },
    messageBubble: {
        padding: 12,
        marginVertical: 5,
        borderWidth: 2,
        borderColor: '#000000',
    },
    currentUserMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
    },
    messageText: {
        fontSize: 16,
    },
    currentUserMessageText: {
        color: '#fff',
    },
    otherUserMessageText: {
        color: '#000',
    },
    timeText: {
        fontSize: 10,
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    currentUserTimeText: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    otherUserTimeText: {
        color: 'rgba(0, 0, 0, 0.5)',
    },
    messageOptionsContainer: {
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    toggleMessagesButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    toggleMessagesButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    messageGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    messageColumn: {
        width: '48%', 
    },
    messageOption: {
        padding: 10,
        marginBottom: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    selectedMessageOption: {
        backgroundColor: '#E1F5FE',
        borderColor: '#007AFF',
    },
    messageOptionText: {
        fontSize: 14,
        color: '#333',
    },
    selectedMessageOptionText: {
        color: '#007AFF',
        fontWeight: '500',
    },
    sendButtonContainer: {
        marginTop: 10,
        alignItems: 'center',
    },
    sendButton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        borderRadius: 20,
        paddingHorizontal: 25,
        paddingVertical: 10,
        width: 120,
    },
    disabledButton: {
        backgroundColor: '#B0C4DE',
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    // New styles for co-op quest integration
    questButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366f1',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    questButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 8,
    },
    systemMessageContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    systemMessageBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f4ff',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        maxWidth: '80%',
        borderWidth: 1,
        borderColor: '#e0e7ff',
    },
    systemMessageIcon: {
        marginRight: 8,
    },
    systemMessageText: {
        color: '#4b5563',
        fontSize: 14,
    },
    systemMessageTime: {
        fontSize: 10,
        color: '#9ca3af',
        marginTop: 4,
    },
    startQuestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366f1',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginTop: 10,
    },
    startQuestButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default UserProfileScreen;