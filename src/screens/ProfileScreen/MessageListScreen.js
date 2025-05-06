import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    FlatList, 
    ActivityIndicator,
    Image
} from 'react-native';
import { 
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc
} from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles } from '../../../styles/globalStyles';
import Avatar from '../AvatarScreen/Avatar';

const MessageListScreen = ({ navigation, route }) => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const extraData = route.params?.extraData;
    const currentUserId = auth.currentUser?.uid;
    
    useEffect(() => {
        loadConversations();
    }, []);
    
    const loadConversations = async () => {
        if (!currentUserId) return;
        
        try {
            setLoading(true);
            
            // Query for chats where current user is sender
            const senderQuery = query(
                collection(db, 'chats'),
                where('senderId', '==', currentUserId)
            );
            
            // Query for chats where current user is receiver
            const receiverQuery = query(
                collection(db, 'chats'),
                where('receiverId', '==', currentUserId)
            );
            
            const [senderSnapshot, receiverSnapshot] = await Promise.all([
                getDocs(senderQuery),
                getDocs(receiverQuery)
            ]);
            
            // Combine both results
            const chatDocs = [...senderSnapshot.docs, ...receiverSnapshot.docs];
            
            // Extract unique conversation partners
            const uniquePartners = new Map();
            
            for (const chatDoc of chatDocs) {
                const chatData = chatDoc.data();
                
                // Determine partner ID (the other person in the conversation)
                const partnerId = chatData.senderId === currentUserId 
                    ? chatData.receiverId 
                    : chatData.senderId;
                
                if (!uniquePartners.has(partnerId)) {
                    // Get user data for this partner
                    const partnerDoc = await getDoc(doc(db, 'users', partnerId));
                    
                    if (partnerDoc.exists()) {
                        const partnerData = partnerDoc.data();
                        
                        uniquePartners.set(partnerId, {
                            id: partnerId,
                            username: partnerData.username || 'User',
                            avatar: partnerData.avatar || null,
                            lastMessage: chatData.text,
                            timestamp: chatData.timestamp || null
                        });
                    }
                } else {
                    // Update with more recent message if needed
                    const existingData = uniquePartners.get(partnerId);
                    const existingTime = existingData.timestamp ? 
                        (typeof existingData.timestamp.toDate === 'function' ? existingData.timestamp.toDate() : existingData.timestamp) : 
                        0;
                    
                    const newTime = chatData.timestamp ? 
                        (typeof chatData.timestamp.toDate === 'function' ? chatData.timestamp.toDate() : chatData.timestamp) : 
                        0;
                    
                    if (newTime > existingTime) {
                        uniquePartners.set(partnerId, {
                            ...existingData,
                            lastMessage: chatData.text,
                            timestamp: chatData.timestamp
                        });
                    }
                }
            }
            
            // Convert Map to array and sort by timestamp (newest first)
            const conversationList = Array.from(uniquePartners.values())
                .sort((a, b) => {
                    if (!a.timestamp) return 1;
                    if (!b.timestamp) return -1;
                    
                    const timeA = typeof a.timestamp.toDate === 'function' ? a.timestamp.toDate() : a.timestamp;
                    const timeB = typeof b.timestamp.toDate === 'function' ? b.timestamp.toDate() : b.timestamp;
                    
                    return timeB - timeA;
                });
            
            setConversations(conversationList);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleConversationPress = (userId) => {
        // Navigate to message screen with the selected user's ID
        navigation.navigate('MessageDetail', { userId });
    };
    
    const renderAvatar = (userData) => {
        return (
            <View style={styles.avatarWrapper}>
                <Avatar 
                    size={50}
                    style={styles.profileAvatar}
                    userId={userData.id}
                />
            </View>
        );
    };
    
    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return '';
        
        try {
            const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHour / 24);
            
            if (diffSec < 60) {
                return 'just now';
            } else if (diffMin < 60) {
                return `${diffMin}m ago`;
            } else if (diffHour < 24) {
                return `${diffHour}h ago`;
            } else if (diffDay < 7) {
                return `${diffDay}d ago`;
            } else {
                return date.toLocaleDateString();
            }
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return '';
        }
    };
    
    const renderConversationItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.conversationItem}
            onPress={() => handleConversationPress(item.id)}
        >
            <View style={styles.avatarContainer}>
                {renderAvatar(item)}
            </View>
            
            <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.timeAgo}>{formatTimeAgo(item.timestamp)}</Text>
                </View>
                
                <Text style={styles.lastMessage} numberOfLines={1} ellipsizeMode="tail">
                    {item.lastMessage}
                </Text>
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
        <View style={globalStyles.container}>
            {/* Header Container with updated styling */}
            <View style={globalStyles.headerContainer}>
                {/* Top row of header with back button, title */}
                <View style={styles.headerTopRow}>
                    <TouchableOpacity
                        style={globalStyles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Messages</Text>
                    
                    {/* Empty view for spacing */}
                    <View style={{ width: 40 }} />
                </View>
            </View>
            
            {conversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubble-outline" size={60} color="#1c2d63" />
                    <Text style={styles.emptyText}>
                        No conversations yet.
                    </Text>
                    <Text style={styles.emptySubText}>
                        Visit user profiles to start messaging.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversationItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.conversationsList}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 5,
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 24,
        //fontWeight: 'bold',
        fontFamily: 'morris-roman',
        color: '#ffffff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        color: '#1c2d63',
        marginTop: 20,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    emptySubText: {
        fontSize: 14,
        color: '#666',
        marginTop: 10,
        textAlign: 'center',
    },
    conversationsList: {
        paddingVertical: 10,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginHorizontal: 15,
        marginBottom: 10,
        borderRadius: 8,
        backgroundColor: '#d3d3d3',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    avatarContainer: {
        marginRight: 15,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1c2d63',
    },
    avatarImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#1c2d63',
    },
    conversationContent: {
        flex: 1,
        justifyContent: 'center',
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    username: {
        fontSize: 22,
        //fontWeight: 'bold',
        fontFamily: 'morris-roman',
        color: '#1c2d63',
    },
    timeAgo: {
        fontSize: 12,
        color: '#666',
    },
    lastMessage: {
        fontSize: 14,
        color: '#666',
    },
    avatarWrapper: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileAvatar: {
        borderWidth: 1,
        borderColor: '#1c2d63',
    }
});

export default MessageListScreen;