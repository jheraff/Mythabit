import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Modal,
    Alert
} from 'react-native';
import {
    collection,
    getDocs,
    query,
    orderBy,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    arrayUnion,
    serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useFocusEffect } from '@react-navigation/native';

const GuildMenuScreen = ({ navigation }) => {
    const [guilds, setGuilds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [newGuildName, setNewGuildName] = useState('');
    const [newGuildDescription, setNewGuildDescription] = useState('');
    const [userGuildId, setUserGuildId] = useState(null);

    const currentUserId = auth.currentUser?.uid;

    useFocusEffect(
        React.useCallback(() => {
            fetchGuilds();
            fetchUserGuildInfo();
            return () => { };
        }, [])
    );

    const fetchUserGuildInfo = async () => {
        try {
            if (!currentUserId) return;

            const userRef = doc(db, 'users', currentUserId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists() && userDoc.data().guildId) {
                setUserGuildId(userDoc.data().guildId);
            } else {
                setUserGuildId(null);
            }
        } catch (error) {
            console.error('Error fetching user guild info:', error);
        }
    };

    const fetchGuilds = async () => {
        try {
            setLoading(true);
            const guildsRef = collection(db, 'guilds');
            const q = query(guildsRef, orderBy('memberCount', 'desc'));
            const querySnapshot = await getDocs(q);

            const fetchedGuilds = [];
            querySnapshot.forEach((doc) => {
                fetchedGuilds.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            setGuilds(fetchedGuilds);
        } catch (error) {
            console.error('Error fetching guilds:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchGuilds();
        fetchUserGuildInfo();
    };

    const navigateToGuildDetails = (guildId) => {
        navigation.navigate('GuildScreen', { guildId });
    };

    const handleCreateGuild = async () => {
        if (!newGuildName.trim()) {
            Alert.alert('Error', 'Please enter a guild name');
            return;
        }

        try {
            setLoading(true);

            if (userGuildId) {
                Alert.alert(
                    'Already in a Guild',
                    'You must leave your current guild before creating a new one',
                    [{ text: 'OK' }]
                );
                setModalVisible(false);
                setLoading(false);
                return;
            }

            const userRef = doc(db, 'users', currentUserId);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data();

            const currentTimestamp = new Date();
            const newMember = {
                id: currentUserId,
                username: userData.username,
                role: 'member',
                joinedAt: currentTimestamp, 
                level: userData.level || 1,
                xp: userData.xp || 0
            };

            const newGuild = {
                name: newGuildName.trim(),
                description: newGuildDescription.trim() || 'No description provided',
                createdAt: serverTimestamp(),
                createdBy: currentUserId,
                memberCount: 1,
                members: [{
                    id: currentUserId,
                    username: userData.username,
                    role: 'leader',
                    joinedAt: currentTimestamp, 
                    level: userData.level || 1,
                    xp: userData.xp || 0
                }],
                totalXP: userData.xp || 0,
                avgLevel: userData.level || 1,
                maxMembers: 25 
            };

            const guildRef = await addDoc(collection(db, 'guilds'), newGuild);

            await updateDoc(userRef, {
                guildId: guildRef.id,
                guildRole: 'leader'
            });

            setModalVisible(false);
            setNewGuildName('');
            setNewGuildDescription('');
            setUserGuildId(guildRef.id);

            navigation.navigate('GuildScreen', { guildId: guildRef.id });

        } catch (error) {
            console.error('Error creating guild:', error);
            Alert.alert('Error', 'Failed to create guild. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGuild = async (guild) => {
        try {
            setLoading(true);

            if (userGuildId) {
                Alert.alert(
                    'Already in a Guild',
                    'You must leave your current guild before joining another one',
                    [{ text: 'OK' }]
                );
                setLoading(false);
                return;
            }

            if (guild.memberCount >= guild.maxMembers) {
                Alert.alert('Guild Full', 'This guild has reached its maximum member capacity');
                setLoading(false);
                return;
            }

            const userRef = doc(db, 'users', currentUserId);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data();

            const guildRef = doc(db, 'guilds', guild.id);

            const currentTimestamp = new Date();
            const newMember = {
                id: currentUserId,
                username: userData.username,
                role: 'member',
                joinedAt: currentTimestamp, 
                level: userData.level || 1,
                xp: userData.xp || 0
            };

            const newTotalXP = (guild.totalXP || 0) + (userData.xp || 0);
            const newMemberCount = guild.memberCount + 1;
            const newAvgLevel = ((guild.avgLevel || 1) * guild.memberCount + (userData.level || 1)) / newMemberCount;

            await updateDoc(guildRef, {
                members: arrayUnion(newMember), 
                memberCount: newMemberCount,
                totalXP: newTotalXP,
                avgLevel: newAvgLevel
            });

            await updateDoc(userRef, {
                guildId: guild.id,
                guildRole: 'member'
            });

            setUserGuildId(guild.id);

            navigation.navigate('GuildScreen', { guildId: guild.id });

        } catch (error) {
            console.error('Error joining guild:', error);
            Alert.alert('Error', 'Failed to join guild. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filteredGuilds = guilds.filter(guild =>
        guild.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guild.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderGuildItem = ({ item }) => {
        const isUserGuild = item.id === userGuildId;
        const isFull = item.memberCount >= item.maxMembers;

        return (
            <TouchableOpacity
                style={[styles.guildItem, isUserGuild && styles.currentGuildItem]}
                onPress={() => navigateToGuildDetails(item.id)}
            >
                <View style={styles.guildInfo}>
                    <Text style={[styles.guildName, isUserGuild && styles.currentGuildText]}>
                        {item.name}
                        {isUserGuild ? ' (Your Guild)' : ''}
                    </Text>
                    <Text style={styles.guildDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                    <View style={styles.statsRow}>
                        <Text style={styles.memberText}>
                            {item.memberCount}/{item.maxMembers || 25} Members
                        </Text>
                        <Text style={styles.levelText}>
                            Avg Level: {Math.round(item.avgLevel || 1)}
                        </Text>
                    </View>
                </View>

                {!isUserGuild && !isFull && (
                    <TouchableOpacity
                        style={[styles.joinButton, isFull && styles.disabledButton]}
                        onPress={() => handleJoinGuild(item)}
                        disabled={isFull}
                    >
                        <Text style={styles.joinButtonText}>Join</Text>
                    </TouchableOpacity>
                )}

                {isFull && !isUserGuild && (
                    <View style={styles.fullTag}>
                        <Text style={styles.fullTagText}>FULL</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Guilds</Text>

            <TextInput
                style={styles.searchInput}
                placeholder="Search guilds..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
            />

            {userGuildId ? (
                <TouchableOpacity
                    style={styles.viewMyGuildButton}
                    onPress={() => navigation.navigate('GuildScreen', { guildId: userGuildId })}
                >
                    <Text style={styles.viewMyGuildText}>View My Guild</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={styles.createButtonText}>Create New Guild</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading guilds...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredGuilds}
                renderItem={renderGuildItem}
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
                    <Text style={styles.emptyText}>
                        {searchQuery
                            ? 'No guilds match your search'
                            : 'No guilds available. Be the first to create one!'}
                    </Text>
                }
            />

            {/* Guild Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create New Guild</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Guild Name (required)"
                            value={newGuildName}
                            onChangeText={setNewGuildName}
                            maxLength={20}
                        />

                        <TextInput
                            style={[styles.modalInput, styles.descriptionInput]}
                            placeholder="Guild Description (optional)"
                            value={newGuildDescription}
                            onChangeText={setNewGuildDescription}
                            multiline={true}
                            maxLength={100}
                        />

                        <Text style={styles.modalNote}>
                            Note: Your guild can have up to 25 members.
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setModalVisible(false);
                                    setNewGuildName('');
                                    setNewGuildDescription('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.createModalButton]}
                                onPress={handleCreateGuild}
                            >
                                <Text style={styles.createModalButtonText}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        marginBottom: 15,
        color: '#333',
    },
    searchInput: {
        width: '100%',
        height: 40,
        backgroundColor: '#f2f2f2',
        borderRadius: 20,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    createButton: {
        backgroundColor: '#6366f1',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginTop: 5,
    },
    createButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    viewMyGuildButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginTop: 5,
    },
    viewMyGuildText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    guildItem: {
        flexDirection: 'row',
        padding: 15,
        marginBottom: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    currentGuildItem: {
        backgroundColor: '#e6f7ff',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    guildInfo: {
        flex: 1,
    },
    guildName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    currentGuildText: {
        color: '#007AFF',
    },
    guildDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    memberText: {
        fontSize: 14,
        color: '#444',
    },
    levelText: {
        fontSize: 14,
        color: '#444',
        fontWeight: '500',
    },
    joinButton: {
        backgroundColor: '#6366f1',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginLeft: 10,
    },
    joinButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    fullTag: {
        backgroundColor: '#ff6b6b',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 10,
        marginLeft: 10,
    },
    fullTagText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    emptyText: {
        textAlign: 'center',
        padding: 20,
        color: '#666',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    modalInput: {
        width: '100%',
        height: 50,
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    descriptionInput: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 15,
    },
    modalNote: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        width: '45%',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f2f2f2',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: 'bold',
    },
    createModalButton: {
        backgroundColor: '#6366f1',
    },
    createModalButtonText: {
        color: 'white',
        fontWeight: 'bold',
    }
});

export default GuildMenuScreen;