import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const FollowListScreen = ({ route, navigation }) => {
    const { type, userId } = route.params; // type is either 'following' or 'followers'
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            // Get the user's document
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) return;

            const userData = userDoc.data();
            const userIds = type === 'following' ? userData.following : userData.followers;

            // Fetch details for each user
            const userPromises = userIds.map(id => getDoc(doc(db, 'users', id)));
            const userDocs = await Promise.all(userPromises);

            const userList = userDocs
                .filter(doc => doc.exists())
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

            setUsers(userList);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const navigateToProfile = (userId) => {
        navigation.navigate('UserProfile', { userId });
    };

    const renderUser = ({ item }) => (
        <TouchableOpacity 
            style={styles.userItem}
            onPress={() => navigateToProfile(item.id)}
        >
            <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.level}>Level {item.level}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    {type === 'following' ? 'Following' : 'Followers'}
                </Text>
                <Text style={styles.count}>{users.length}</Text>
            </View>

            <FlatList
                data={users}
                renderItem={renderUser}
                keyExtractor={item => item.id}
                style={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {type === 'following' 
                            ? "Not following anyone yet"
                            : "No followers yet"}
                    </Text>
                }
            />
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
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold'
    },
    count: {
        fontSize: 20,
        color: '#666'
    },
    list: {
        flex: 1
    },
    userItem: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center'
    },
    userInfo: {
        flex: 1
    },
    username: {
        fontSize: 16,
        fontWeight: '500'
    },
    level: {
        fontSize: 14,
        color: '#666',
        marginTop: 2
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#666',
        fontSize: 16
    }
});

export default FollowListScreen;