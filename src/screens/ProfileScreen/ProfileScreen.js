import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { db, auth, searchUsers } from '../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

const ProfileScreen = ({ navigation }) => {
    const [userData, setUserData] = useState({
        username: '',
        level: 1,
        following: [],
        followers: []
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            loadUserData();
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
              username: data.username,
              level: data.level,
              following: following,
              followers: followers
            });
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      };

    const handleSearch = async (text) => {
        setSearchQuery(text);
        
        if (text.trim() === '') {
            setSuggestedUsers([]);
            return;
        }

        setLoading(true);
        try {
            const users = await searchUsers(text, auth.currentUser?.uid);
            setSuggestedUsers(users);
        } catch (error) {
            console.error('Error searching users:', error);
        }
        setLoading(false);
    };

    const navigateToProfile = (userId) => {
        navigation.navigate('UserProfile', { userId });
    };

    const navigateToFollowList = (type) => {
        navigation.navigate('FollowList', {
            type,
            userId: userData.id
        });
    };

    const renderUserItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.userItem}
            onPress={() => navigateToProfile(item.id)}
        >
            <View style={styles.userInfo}>
                <Text style={styles.userItemUsername}>{item.username}</Text>
                <Text style={styles.userItemLevel}>Level {item.level}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.profileCard}>
                <View style={styles.profileCardContent}>
                    {/* Username and level */}
                    <View style={styles.profileLeft}>
                        <Text style={styles.username}>{userData.username}</Text>
                        <Text style={styles.level}>Level {userData.level}</Text>
                    </View>
                    
                    {/* Following and followers */}
                    <View style={styles.profileRight}>
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

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search users..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                {loading && <ActivityIndicator style={styles.loader} />}
            </View>

            <View style={styles.contentContainer}>
                <FlatList
                    data={suggestedUsers}
                    renderItem={renderUserItem}
                    keyExtractor={item => item.id}
                    style={styles.userList}
                    ListEmptyComponent={searchQuery ? <Text style={styles.noResults}>No users found</Text> : null}
                />

                <View style={styles.leaderboardButtonContainer}>
                    <TouchableOpacity 
                        style={styles.leaderboardButton}
                        onPress={() => navigation.navigate('LeaderboardScreen')}
                    >
                        <Text style={styles.leaderboardButtonText}>View Leaderboard</Text>
                    </TouchableOpacity>
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
    contentContainer: {
        flex: 1,
        position: 'relative', 
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
    searchContainer: {
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        backgroundColor: '#f9f9f9',
    },
    loader: {
        marginLeft: 10,
    },
    userList: {
        flex: 1,
        marginBottom: 80,
    },
    userItem: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
    },
    userItemUsername: {
        fontSize: 16,
        fontWeight: '500',
    },
    userItemLevel: {
        fontSize: 14,
        color: '#666',
    },
    noResults: {
        padding: 20,
        textAlign: 'center',
        color: '#666',
    },
    leaderboardButtonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    leaderboardButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
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
        width: '100%',
    },
    leaderboardButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ProfileScreen;