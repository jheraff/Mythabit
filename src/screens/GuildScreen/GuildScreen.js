import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    TextInput
} from 'react-native';
import { 
    doc, 
    getDoc, 
    updateDoc, 
    arrayRemove, 
    arrayUnion, 
    deleteDoc, 
    serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useFocusEffect } from '@react-navigation/native';
import { globalStyles } from '../../../styles/globalStyles';

const GuildScreen = ({ route, navigation }) => {
    const { guildId } = route.params;
    const [guild, setGuild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [guildName, setGuildName] = useState('');
    const [guildDescription, setGuildDescription] = useState('');
    
    const currentUserId = auth.currentUser?.uid;

    useFocusEffect(
        useCallback(() => {
            fetchGuildData();
            return () => {};
        }, [guildId])
    );

    const fetchGuildData = async () => {
        try {
            setLoading(true);
            const guildRef = doc(db, 'guilds', guildId);
            const guildDoc = await getDoc(guildRef);
            
            if (guildDoc.exists()) {
                const guildData = { id: guildDoc.id, ...guildDoc.data() };
                setGuild(guildData);
                setGuildName(guildData.name);
                setGuildDescription(guildData.description || '');
                
                const memberInfo = guildData.members.find(member => member.id === currentUserId);
                if (memberInfo) {
                    setCurrentUserRole(memberInfo.role);
                } else {
                    setCurrentUserRole(null);
                }
            } else {
                Alert.alert('Error', 'Guild not found');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error fetching guild data:', error);
            Alert.alert('Error', 'Failed to load guild information');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchGuildData();
    };

    const handleLeaveGuild = async () => {
        try {
            Alert.alert(
                'Leave Guild',
                'Are you sure you want to leave this guild?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Leave', 
                        style: 'destructive', 
                        onPress: async () => {
                            setLoading(true);
                            
                            const guildRef = doc(db, 'guilds', guildId);
                            const guildSnap = await getDoc(guildRef);
                            
                            if (!guildSnap.exists()) {
                                Alert.alert('Error', 'Guild no longer exists');
                                navigation.goBack();
                                return;
                            }
                            
                            const guildData = guildSnap.data();
                            const memberIndex = guildData.members.findIndex(m => m.id === currentUserId);
                            
                            if (memberIndex === -1) {
                                Alert.alert('Error', 'You are not a member of this guild');
                                return;
                            }
                            
                            const memberToRemove = guildData.members[memberIndex];
                            const newMemberCount = guildData.memberCount - 1;
                            
                            if (memberToRemove.role === 'leader' && newMemberCount > 0) {
                                const remainingMembers = [...guildData.members];
                                remainingMembers.splice(memberIndex, 1);
                                remainingMembers.sort((a, b) => b.level - a.level);
                                const newLeader = remainingMembers[0];
                                
                                const updatedMembers = guildData.members.map(member => {
                                    if (member.id === newLeader.id) {
                                        return { ...member, role: 'leader' };
                                    }
                                    return member;
                                });
                                
                                const finalMembers = updatedMembers.filter(member => member.id !== currentUserId);
                                
                                const newTotalXP = guildData.totalXP - (memberToRemove.xp || 0);
                                const newAvgLevel = finalMembers.reduce((sum, member) => sum + member.level, 0) / finalMembers.length;
                                
                                await updateDoc(guildRef, {
                                    members: finalMembers,
                                    memberCount: newMemberCount,
                                    totalXP: newTotalXP,
                                    avgLevel: newAvgLevel
                                });
                                
                                const newLeaderRef = doc(db, 'users', newLeader.id);
                                await updateDoc(newLeaderRef, {
                                    guildRole: 'leader'
                                });
                            } 
                            else if (newMemberCount === 0) {
                                await deleteDoc(guildRef);
                            } 
                            else {
                                const newTotalXP = guildData.totalXP - (memberToRemove.xp || 0);
                                const newMembers = guildData.members.filter(member => member.id !== currentUserId);
                                const newAvgLevel = newMembers.reduce((sum, member) => sum + member.level, 0) / newMembers.length;
                                
                                await updateDoc(guildRef, {
                                    members: arrayRemove(memberToRemove),
                                    memberCount: newMemberCount,
                                    totalXP: newTotalXP,
                                    avgLevel: newAvgLevel
                                });
                            }
                            
                            const userRef = doc(db, 'users', currentUserId);
                            await updateDoc(userRef, {
                                guildId: null,
                                guildRole: null
                            });
                            
                            Alert.alert('Success', 'You have left the guild');
                            navigation.navigate('GuildMenu');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error leaving guild:', error);
            Alert.alert('Error', 'Failed to leave guild. Please try again.');
            setLoading(false);
        }
    };

    const handlePromoteMember = async (memberId) => {
        try {
            if (currentUserRole !== 'leader') {
                Alert.alert('Error', 'Only the guild leader can promote members');
                return;
            }
            
            setLoading(true);
            
            const guildRef = doc(db, 'guilds', guildId);
            const guildSnap = await getDoc(guildRef);
            
            if (!guildSnap.exists()) {
                Alert.alert('Error', 'Guild not found');
                navigation.goBack();
                return;
            }
            
            const guildData = guildSnap.data();
            
            const memberToPromote = guildData.members.find(m => m.id === memberId);
            if (!memberToPromote) {
                Alert.alert('Error', 'Member not found');
                setLoading(false);
                return;
            }
            
            if (memberToPromote.role === 'officer') {
                Alert.alert('Error', 'This member is already an officer');
                setLoading(false);
                return;
            }
            
            const updatedMembers = guildData.members.map(member => {
                if (member.id === memberId) {
                    return { ...member, role: 'officer' };
                }
                return member;
            });
            
            await updateDoc(guildRef, {
                members: updatedMembers
            });
            
            const userRef = doc(db, 'users', memberId);
            await updateDoc(userRef, {
                guildRole: 'officer'
            });
            
            fetchGuildData();
            Alert.alert('Success', `${memberToPromote.username} has been promoted to officer`);
            
        } catch (error) {
            console.error('Error promoting member:', error);
            Alert.alert('Error', 'Failed to promote member. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoteMember = async (memberId) => {
        try {
            if (currentUserRole !== 'leader') {
                Alert.alert('Error', 'Only the guild leader can demote members');
                return;
            }
            
            setLoading(true);
            
            const guildRef = doc(db, 'guilds', guildId);
            const guildSnap = await getDoc(guildRef);
            
            if (!guildSnap.exists()) {
                Alert.alert('Error', 'Guild not found');
                navigation.goBack();
                return;
            }
            
            const guildData = guildSnap.data();
            
            const memberToDemote = guildData.members.find(m => m.id === memberId);
            if (!memberToDemote) {
                Alert.alert('Error', 'Member not found');
                setLoading(false);
                return;
            }
            
            if (memberToDemote.role !== 'officer') {
                Alert.alert('Error', 'This member is not an officer');
                setLoading(false);
                return;
            }
            
            const updatedMembers = guildData.members.map(member => {
                if (member.id === memberId) {
                    return { ...member, role: 'member' };
                }
                return member;
            });
            
            await updateDoc(guildRef, {
                members: updatedMembers
            });
            
            const userRef = doc(db, 'users', memberId);
            await updateDoc(userRef, {
                guildRole: 'member'
            });
            
            fetchGuildData();
            Alert.alert('Success', `${memberToDemote.username} has been demoted to member`);
            
        } catch (error) {
            console.error('Error demoting member:', error);
            Alert.alert('Error', 'Failed to demote member. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleKickMember = async (memberId) => {
        try {
            if (currentUserRole !== 'leader' && currentUserRole !== 'officer') {
                Alert.alert('Error', 'Only leaders and officers can kick members');
                return;
            }
            
            if (memberId === currentUserId) {
                Alert.alert('Error', 'You cannot kick yourself. Use the leave option instead.');
                return;
            }
            
            setLoading(true);
            
            const guildRef = doc(db, 'guilds', guildId);
            const guildSnap = await getDoc(guildRef);
            
            if (!guildSnap.exists()) {
                Alert.alert('Error', 'Guild not found');
                navigation.goBack();
                return;
            }
            
            const guildData = guildSnap.data();
            
            const memberToKick = guildData.members.find(m => m.id === memberId);
            if (!memberToKick) {
                Alert.alert('Error', 'Member not found');
                setLoading(false);
                return;
            }
            
            if (currentUserRole === 'officer' && 
                (memberToKick.role === 'officer' || memberToKick.role === 'leader')) {
                Alert.alert('Error', 'Officers cannot kick other officers or the leader');
                setLoading(false);
                return;
            }
            
            Alert.alert(
                'Kick Member',
                `Are you sure you want to kick ${memberToKick.username} from the guild?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Kick', 
                        style: 'destructive', 
                        onPress: async () => {
                            const newMemberCount = guildData.memberCount - 1;
                            const newTotalXP = guildData.totalXP - (memberToKick.xp || 0);
                            const newMembers = guildData.members.filter(member => member.id !== memberId);
                            const newAvgLevel = newMembers.reduce((sum, member) => sum + member.level, 0) / newMembers.length;
                            
                            await updateDoc(guildRef, {
                                members: arrayRemove(memberToKick),
                                memberCount: newMemberCount,
                                totalXP: newTotalXP,
                                avgLevel: newAvgLevel
                            });
                            
                            const userRef = doc(db, 'users', memberId);
                            await updateDoc(userRef, {
                                guildId: null,
                                guildRole: null
                            });
                            
                            fetchGuildData();
                            Alert.alert('Success', `${memberToKick.username} has been kicked from the guild`);
                        }
                    }
                ]
            );
            
        } catch (error) {
            console.error('Error kicking member:', error);
            Alert.alert('Error', 'Failed to kick member. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleEditGuild = async () => {
        try {
            if (currentUserRole !== 'leader') {
                Alert.alert('Error', 'Only the guild leader can edit guild info');
                return;
            }
            
            if (!guildName.trim()) {
                Alert.alert('Error', 'Guild name cannot be empty');
                return;
            }
            
            setLoading(true);
            
            const guildRef = doc(db, 'guilds', guildId);
            await updateDoc(guildRef, {
                name: guildName.trim(),
                description: guildDescription.trim(),
                updatedAt: serverTimestamp()
            });
            
            setEditModalVisible(false);
            fetchGuildData();
            Alert.alert('Success', 'Guild information updated');
            
        } catch (error) {
            console.error('Error updating guild:', error);
            Alert.alert('Error', 'Failed to update guild information');
        } finally {
            setLoading(false);
        }
    };
    
    const handleTransferLeadership = async (memberId) => {
        try {
            if (currentUserRole !== 'leader') {
                Alert.alert('Error', 'Only the guild leader can transfer leadership');
                return;
            }
            
            setLoading(true);
            
            const guildRef = doc(db, 'guilds', guildId);
            const guildSnap = await getDoc(guildRef);
            
            if (!guildSnap.exists()) {
                Alert.alert('Error', 'Guild not found');
                navigation.goBack();
                return;
            }
            
            const guildData = guildSnap.data();
            
            const targetMember = guildData.members.find(m => m.id === memberId);
            if (!targetMember) {
                Alert.alert('Error', 'Member not found');
                setLoading(false);
                return;
            }
            
            Alert.alert(
                'Transfer Leadership',
                `Are you sure you want to transfer guild leadership to ${targetMember.username}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Transfer', 
                        onPress: async () => {
                            const updatedMembers = guildData.members.map(member => {
                                if (member.id === memberId) {
                                    return { ...member, role: 'leader' };
                                }
                                if (member.id === currentUserId) {
                                    return { ...member, role: 'officer' };
                                }
                                return member;
                            });
                            
                            await updateDoc(guildRef, {
                                members: updatedMembers,
                                createdBy: memberId
                            });
                            
                            const newLeaderRef = doc(db, 'users', memberId);
                            await updateDoc(newLeaderRef, {
                                guildRole: 'leader'
                            });
                            
                            const userRef = doc(db, 'users', currentUserId);
                            await updateDoc(userRef, {
                                guildRole: 'officer'
                            });
                            
                            fetchGuildData();
                            Alert.alert('Success', `Leadership transferred to ${targetMember.username}`);
                        }
                    }
                ]
            );
            
        } catch (error) {
            console.error('Error transferring leadership:', error);
            Alert.alert('Error', 'Failed to transfer leadership. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderMemberItem = ({ item }) => {
        const isCurrentUser = item.id === currentUserId;
        const isLeader = item.role === 'leader';
        const isOfficer = item.role === 'officer';
        
        return (
            <View style={[styles.memberItem, isCurrentUser && styles.currentMemberItem]}>
                <View style={styles.memberInfo}>
                    <Text style={[styles.username, isCurrentUser && styles.currentUserText]}>
                        {item.username}
                        {isCurrentUser ? ' (You)' : ''}
                    </Text>
                    
                    <View style={styles.memberDetails}>
                        <Text style={[styles.roleText, 
                            isLeader ? styles.leaderText : (isOfficer ? styles.officerText : styles.memberRoleText)]}>
                            {isLeader ? 'Leader' : (isOfficer ? 'Officer' : 'Member')}
                        </Text>
                        <Text style={styles.levelText}>Level {item.level}</Text>
                        {item.xp !== undefined && (
                            <Text style={styles.xpText}>{item.xp} XP</Text>
                        )}
                    </View>
                </View>
                
                {!isCurrentUser && (currentUserRole === 'leader' || (currentUserRole === 'officer' && !isLeader && !isOfficer)) && (
                    <View style={styles.actionButtons}>
                        {currentUserRole === 'leader' && !isLeader && (
                            <>
                                {!isOfficer ? (
                                    <TouchableOpacity 
                                        style={[styles.actionButton, styles.promoteButton]}
                                        onPress={() => handlePromoteMember(item.id)}
                                    >
                                        <Text style={styles.actionButtonText}>Promote</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity 
                                        style={[styles.actionButton, styles.demoteButton]}
                                        onPress={() => handleDemoteMember(item.id)}
                                    >
                                        <Text style={styles.actionButtonText}>Demote</Text>
                                    </TouchableOpacity>
                                )}
                                
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.transferButton]}
                                    onPress={() => handleTransferLeadership(item.id)}
                                >
                                    <Text style={styles.actionButtonText}>Make Leader</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.kickButton]}
                            onPress={() => handleKickMember(item.id)}
                        >
                            <Text style={styles.actionButtonText}>Kick</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const renderHeader = () => {
        if (!guild) return null;
        
        return (
            <View style={styles.headerContainer}>
                <View style={styles.guildInfoHeader}>
                    <Text style={styles.guildName}>{guild.name}</Text>
                    <Text style={styles.guildDescription}>{guild.description}</Text>
                    
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{guild.memberCount}/{guild.maxMembers || 25}</Text>
                            <Text style={styles.statLabel}>Members</Text>
                        </View>
                        
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{Math.round(guild.avgLevel || 1)}</Text>
                            <Text style={styles.statLabel}>Avg Level</Text>
                        </View>
                        
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{guild.totalXP || 0}</Text>
                            <Text style={styles.statLabel}>Total XP</Text>
                        </View>
                    </View>
                    
                    {currentUserRole === 'leader' && (
                        <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => setEditModalVisible(true)}
                        >
                            <Text style={styles.editButtonText}>Edit Guild Info</Text>
                        </TouchableOpacity>
                    )}
                </View>
                
                <View style={styles.membersHeader}>
                    <Text style={styles.membersTitle}>Members</Text>
                </View>
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading guild data...</Text>
            </View>
        );
    }
    
    return (
        <View style={globalStyles.container}>
            {guild && (
                <>
                    <FlatList
                        data={guild.members.sort((a, b) => {
                            if (a.role === 'leader') return -1;
                            if (b.role === 'leader') return 1;
                            if (a.role === 'officer' && b.role !== 'officer') return -1;
                            if (b.role === 'officer' && a.role !== 'officer') return 1;
                            
                            return b.level - a.level;
                        })}
                        renderItem={renderMemberItem}
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
                            <Text style={styles.emptyText}>No members found</Text>
                        }
                    />
                    
                    <TouchableOpacity 
                        style={styles.leaveButton}
                        onPress={handleLeaveGuild}
                    >
                        <Text style={styles.leaveButtonText}>
                            {currentUserRole === 'leader' ? 'Abandon Guild' : 'Leave Guild'}
                        </Text>
                    </TouchableOpacity>
                </>
            )}
            
            {/* Edit Guild Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Guild Information</Text>
                        
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Guild Name"
                            value={guildName}
                            onChangeText={setGuildName}
                            maxLength={20}
                        />
                        
                        <TextInput
                            style={[styles.modalInput, styles.descriptionInput]}
                            placeholder="Guild Description"
                            value={guildDescription}
                            onChangeText={setGuildDescription}
                            multiline={true}
                            maxLength={100}
                        />
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setEditModalVisible(false);
                                    if (guild) {
                                        setGuildName(guild.name);
                                        setGuildDescription(guild.description || '');
                                    }
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleEditGuild}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        paddingBottom: 10,
    },
    guildInfoHeader: {
        padding: 20,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        marginHorizontal: 15,
        marginTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    guildName: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
        marginBottom: 5,
    },
    guildDescription: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 15,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6366f1',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    editButton: {
        backgroundColor: '#6366f1',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        alignSelf: 'center',
        marginTop: 15,
    },
    editButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    membersHeader: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    membersTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    listContent: {
        paddingBottom: 80, 
    },
    memberItem: {
        flexDirection: 'row',
        padding: 15,
        marginHorizontal: 15,
        marginTop: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    currentMemberItem: {
        backgroundColor: '#e6f7ff',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    memberInfo: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    currentUserText: {
        color: '#007AFF',
    },
    memberDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    roleText: {
        fontSize: 14,
        fontWeight: '500',
    },
    leaderText: {
        color: '#000',
    },
    officerText: {
        color: '#000',
    },
    memberRoleText: {
        color: '#666',
    },
    levelText: {
        fontSize: 14,
        color: '#444',
    },
    xpText: {
        fontSize: 14,
        color: '#666',
    },
    actionButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        maxWidth: 120,
    },
    actionButton: {
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 15,
        margin: 2,
    },
    promoteButton: {
        backgroundColor: '#4CAF50',
    },
    demoteButton: {
        backgroundColor: '#FF9800',
    },
    kickButton: {
        backgroundColor: '#F44336',
    },
    transferButton: {
        backgroundColor: '#7B1FA2',
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    leaveButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#F44336',
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
    },
    leaveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
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
        fontSize: 20,
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
    saveButton: {
        backgroundColor: '#4CAF50',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
    }
});

export default GuildScreen;