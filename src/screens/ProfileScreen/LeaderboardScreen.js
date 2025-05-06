import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useFocusEffect } from '@react-navigation/native';
import { globalStyles } from '../../../styles/globalStyles';

const LeaderboardScreen = ({ navigation }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserRank, setCurrentUserRank] = useState(null);
    const currentUserId = auth.currentUser?.uid;

    useFocusEffect(
        React.useCallback(() => {
            fetchLeaderboard();
            return () => {};
        }, [])
    );

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const usersRef = collection(db, 'users');
            const querySnapshot = await getDocs(usersRef);
            
            const fetchedUsers = [];
            querySnapshot.forEach((doc) => {
                fetchedUsers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            

            const sorted = fetchedUsers.sort((a, b) => b.level - a.level || 
                                                         (b.xp || 0) - (a.xp || 0));
            
            const rankedUsers = sorted.map((user, index) => ({
                ...user,
                rank: index + 1
            }));
            
            const currentUser = rankedUsers.find(user => user.id === currentUserId);
            if (currentUser) {
                setCurrentUserRank(currentUser.rank);
            }
            
            const top10Users = rankedUsers.slice(0, 10);
            
            setUsers(top10Users);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeaderboard();
    };

    const navigateToUserProfile = (userId) => {
        navigation.navigate('UserProfile', { userId });
    };

    const renderUserItem = ({ item }) => {
        const isCurrentUser = item.id === currentUserId;
        
        return (
            <TouchableOpacity 
                style={[styles.userItem, isCurrentUser && styles.currentUserItem]}
                onPress={() => navigateToUserProfile(item.id)}
            >
                <View style={[styles.rankContainer, getRankStyle(item.rank)]}>
                    <Text style={styles.rankText}>#{item.rank}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={[styles.username, isCurrentUser && styles.currentUserText]}>
                        {item.username}
                        {isCurrentUser ? ' (You)' : ''}
                    </Text>
                    <View style={styles.statsRow}>
                        <Text style={styles.levelText}>Level {item.level}</Text>
                        {item.xp !== undefined && (
                            <Text style={styles.xpText}>{item.xp} XP</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const getRankStyle = (rank) => {
        switch(rank) {
            case 1:
                return styles.firstRank;
            case 2:
                return styles.secondRank;
            case 3:
                return styles.thirdRank;
            default:
                return null;
        }
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Leaderboard</Text>
            <Text style={styles.subTitle}>Top 10 Players</Text>
            {currentUserRank && currentUserRank > 10 && (
                <Text style={styles.currentRankText}>Your Rank: #{currentUserRank}</Text>
            )}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </View>
        );
    }

    return (
        <View style={globalStyles.container}>
            <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#007AFF"]}
                    />
                }
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No users found</Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 16,
    },
    headerContainer: {
        padding: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
        color: '#333',
    },
    subTitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    currentRankText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
        marginTop: 5,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    userItem: {
        flexDirection: 'row',
        padding: 15,
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    currentUserItem: {
        backgroundColor: '#e6f7ff',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    rankContainer: {
        width: 30,
        height: 30,
        backgroundColor: '#6366f1',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    firstRank: {
        backgroundColor: '#FFD700', 
    },
    secondRank: {
        backgroundColor: '#C0C0C0',
    },
    thirdRank: {
        backgroundColor: '#CD7F32',
    },
    rankText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    currentUserText: {
        color: '#007AFF',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    levelText: {
        fontSize: 16,
        color: '#444',
        fontWeight: '500',
    },
    xpText: {
        fontSize: 14,
        color: '#666',
    },
    emptyText: {
        textAlign: 'center',
        padding: 20,
        color: '#666',
    }
});

export default LeaderboardScreen;