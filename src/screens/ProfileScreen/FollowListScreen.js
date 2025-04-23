import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';

const FollowListScreen = ({ route, navigation }) => {
    const { type, userId } = route.params;
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
                <Text style={styles.level}>Level {item.level || 1}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#1c2d63" />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1c2d63" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header Container with updated styling */}
            <View style={styles.headerContainer}>
                {/* Top row of header with back button and title */}
                <View style={styles.headerTopRow}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#afe8ff" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>
                        {type === 'following' ? 'Following' : 'Followers'}
                    </Text>
                    
                    <View style={styles.countContainer}>
                        <Text style={styles.countText}>{users.length}</Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={users}
                renderItem={renderUser}
                keyExtractor={item => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons 
                            name={type === 'following' ? "people-outline" : "person-outline"} 
                            size={50} 
                            color="#1c2d63" 
                        />
                        <Text style={styles.emptyText}>
                            {type === 'following' 
                                ? "Not following anyone yet"
                                : "No followers yet"}
                        </Text>
                    </View>
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
    backButton: {
        padding: 5,
        marginRight: 10,
        backgroundColor: '#152551',
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#afe8ff',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        flex: 1,
    },
    countContainer: {
        backgroundColor: '#152551',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginRight: 5,
        borderWidth: 2,
        borderColor: '#afe8ff',
    },
    countText: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingTop: 10,
    },
    userItem: {
        flexDirection: 'row',
        padding: 15,
        marginHorizontal: 15,
        marginBottom: 10,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    userInfo: {
        flex: 1
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1c2d63',
    },
    level: {
        fontSize: 14,
        color: '#666',
        marginTop: 2
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 15,
        color: '#666',
        fontSize: 16
    }
});

export default FollowListScreen;