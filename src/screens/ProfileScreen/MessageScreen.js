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
    ScrollView
} from 'react-native';
import { 
    doc, 
    getDoc, 
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import CoopQuestsModal from '../tasks/CoopQuestsModal';

const MessageScreen = ({ route, navigation }) => {
    const [loading, setLoading] = useState(true);
    const [partnerData, setPartnerData] = useState(null);
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState('');
    const [showMessageOptions, setShowMessageOptions] = useState(false);
    const [showCoopQuestModal, setShowCoopQuestModal] = useState(false);
    const flatListRef = useRef(null);
    
    const predefinedMessages = [
        "Hey, how are you?",
        "Hello!",
        "I'm great",
        "Nice to meet you!",
        "Do you want to quest together?",
        "Congratulations on leveling up!",
    ];

    const partnerId = route.params?.userId;
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        setLoading(true);
        loadPartnerData();
        return () => {};
    }, [partnerId]);

    useEffect(() => {
        if (!currentUserId || !partnerId) return;
        
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
    }, [currentUserId, partnerId]);

    const loadPartnerData = async () => {
        if (!partnerId) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', partnerId));
            if (userDoc.exists()) {
                const data = userDoc.data();
                
                const partnerInfo = {
                    id: partnerId,
                    username: data.username || 'User',
                    avatar: data.avatar || null,
                };
                
                setPartnerData(partnerInfo);
                setLoading(false);
            } else {
                console.error('Partner data not found');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error loading partner data:', error);
            setLoading(false);
        }
    };

    const getChatId = () => {
        const sortedIds = [currentUserId, partnerId].sort();
        return `${sortedIds[0]}_${sortedIds[1]}`;
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
        if (!selectedMessage || !currentUserId || !partnerId) return;

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
                receiverId: partnerId
            });
            
            const timestamp = new Date();
            
            await addDoc(collection(db, 'chats'), {
                chatId: chatId,
                text: selectedMessage,
                senderId: currentUserId,
                receiverId: partnerId,
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
                        <Ionicons name="trophy" size={16} color="#1c2d63" style={styles.systemMessageIcon} />
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
                <ActivityIndicator size="large" color="#1c2d63" />
            </View>
        );
    }

    if (!partnerData) {
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
            {/* Header Container with updated styling */}
            <View style={styles.headerContainer}>
                {/* Top row of header with back button, title, and profile button */}
                <View style={styles.headerTopRow}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#afe8ff" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>
                        {partnerData.username}
                    </Text>
                    
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('UserProfile', { userId: partnerId })}
                    >
                        <Ionicons name="person-circle-outline" size={24} color="#afe8ff" />
                    </TouchableOpacity>
                </View>
            </View>

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

            {/* Co-op Quest Modal */}
            <CoopQuestsModal
                visible={showCoopQuestModal}
                onClose={() => setShowCoopQuestModal(false)}
                partnerId={partnerId}
                partnerName={partnerData?.username || 'Partner'}
            />
        </KeyboardAvoidingView>
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
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 5,
        backgroundColor: '#152551',
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#afe8ff',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    profileButton: {
        padding: 5,
        backgroundColor: '#152551',
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#afe8ff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    chatContainer: {
        flex: 1,
        margin: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1c2d63',
        overflow: 'hidden',
        backgroundColor: '#f9f9f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
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
        color: '#1c2d63',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
    messageBubble: {
        padding: 12,
        marginVertical: 5,
        borderRadius: 18,
        maxWidth: '80%',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    currentUserMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#1c2d63',
        borderTopRightRadius: 4,
    },
    otherUserMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0F0F0',
        borderTopLeftRadius: 4,
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
        backgroundColor: '#1c2d63',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    toggleMessagesButtonText: {
        color: '#afe8ff',
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
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    selectedMessageOption: {
        backgroundColor: '#E1F5FE',
        borderColor: '#1c2d63',
    },
    messageOptionText: {
        fontSize: 14,
        color: '#333',
    },
    selectedMessageOptionText: {
        color: '#1c2d63',
        fontWeight: '500',
    },
    sendButtonContainer: {
        marginTop: 10,
        alignItems: 'center',
    },
    sendButton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1c2d63',
        borderRadius: 20,
        paddingHorizontal: 25,
        paddingVertical: 10,
        width: 120,
    },
    disabledButton: {
        backgroundColor: '#B0C4DE',
    },
    sendButtonText: {
        color: '#afe8ff',
        fontWeight: '600',
        fontSize: 16,
    },
    questButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1c2d63',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    questButtonText: {
        color: '#afe8ff',
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
        color: '#1c2d63',
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
        backgroundColor: '#1c2d63',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginTop: 10,
    },
    startQuestButtonText: {
        color: '#afe8ff',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default MessageScreen;