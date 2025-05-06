import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { globalStyles } from '../../../styles/globalStyles';
import Avatar from '../AvatarScreen/Avatar'; // Import your Avatar component
import { useAvatar } from '../AvatarScreen/AvatarContext'; // Import your avatar context

const HomeScreen = () => {
  const navigation = useNavigation();
  const { avatar, loading } = useAvatar(); // Use your avatar context
  const [userStats, setUserStats] = useState({
    username: '',
    level: 1,
    xp: 0,
    currency: 0,
    avatar: null,
    stats: {
      strength: 1,
      intellect: 1,
      agility: 1,
      arcane: 1,
      focus: 1
    },
    inventory: {
      armor: null,
      weapon: null,
      gear: null
    }
  });

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const unsubscribeUserStats = onSnapshot(
      doc(db, 'users', userId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();

          // Create complete user stats object, ensuring all fields exist
          // Handle legacy data structure or create new simplified structure
          let armorItem = userData.inventory?.armor;
          
          // If we're migrating from the old system, check if any armor pieces exist
          // and use the first one found as the armor item
          if (!armorItem) {
            if (userData.inventory?.helmet) {
              armorItem = userData.inventory.helmet;
            } else if (userData.inventory?.chestplate) {
              armorItem = userData.inventory.chestplate;
            } else if (userData.inventory?.leggings) {
              armorItem = userData.inventory.leggings;
            } else if (userData.inventory?.boots) {
              armorItem = userData.inventory.boots;
            }
          }
          
          const completeUserStats = {
            username: userData.username || auth.currentUser?.displayName || 'New User',
            level: userData.level || 1,
            xp: userData.xp || 0,
            currency: userData.currency || 0,
            avatar: userData.avatar || null,
            stats: {
              strength: userData.stats?.strength || 1,
              intellect: userData.stats?.intellect || 1,
              agility: userData.stats?.agility || 1,
              arcane: userData.stats?.arcane || 1,
              focus: userData.stats?.focus || 1
            },
            inventory: {
              armor: armorItem,
              weapon: userData.inventory?.weapon || null,
              gear: userData.inventory?.gear || null
            }
          };
          setUserStats(completeUserStats);
        } else {
          initializeNewUser(userId);
        }
      },
      (error) => {
        console.error(error);
      }
    );

    return () => {
      unsubscribeUserStats();
    };
  }, []);

  const initializeNewUser = async (userId) => {
    // Initialize new user stats
    const initialStats = {
      username: auth.currentUser?.displayName || 'New User',
      level: 1,
      xp: 0,
      currency: 0,
      avatar: null,
      stats: {
        strength: 1,
        intellect: 1,
        agility: 1,
        arcane: 1,
        focus: 1
      },
      inventory: {
        armor: null,
        weapon: null,
        gear: null
      },
      lastUpdated: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', userId), initialStats);
      setUserStats(initialStats);
    } catch (error) {
      console.error('Error initializing new user:', error);
    }
  };

  const calculateXpProgress = () => {
    return (userStats.xp / 1000) * 100;
  };

  const statColors = {
    Strength: '#D62828',  // red
    Intellect: '#1D4ED8', // blue
    Agility: '#059669',   // green
    Arcane: '#7C3AED',    // purple
    Focus: '#FBBF24',     // yellow
  };

  const renderStatBar = (statName, value) => {
    const barColor = statColors[statName] || '#ccc';
  
    return (
      <View style={styles.statContainer}>
        <Text style={styles.statLabel}>{statName}</Text>
        <View style={styles.statBarContainer}>
          <View
            style={[
              styles.statBar,
              {
                width: `${(value / 100) * 100}%`,
                backgroundColor: barColor
              }
            ]}
          />
          <Text style={styles.statValue}>{value}</Text>
        </View>
      </View>
    );
  };

  // Avatar component function
  const renderAvatar = () => {
    return (
      <View style={styles.avatarWrapper}>
        <Avatar 
          size={180}
          style={styles.homeScreenAvatar}
          userId={auth.currentUser?.uid}
        />
      </View>
    );
  };

  // Render equipment slots (just armor, weapon, and gear)
  const renderEquipmentSlots = () => {
    // Only show the main equipment types (armor, weapon, gear)
    const equipmentTypes = [
      { id: 'armor', name: 'Armor', icon: 'shield-outline' },
      { id: 'weapon', name: 'Weapon', icon: 'flash-outline' },
      { id: 'gear', name: 'Gear', icon: 'cog-outline' }
    ];
    
    return (
      <View style={styles.inventorySlotsContainer}>
        {equipmentTypes.map(type => renderInventorySlot(type.id, type.name, type.icon))}
      </View>
    );
  };

  const renderInventorySlot = (slotType, slotName, iconName) => {
    const item = userStats.inventory[slotType];
    
    return (
      <TouchableOpacity 
        key={slotType}
        style={styles.inventorySlot}
        onPress={() => navigation.navigate('Items', { activeSlot: slotType })}
      >
        {item ? (
          <View style={styles.equippedItemContainer}>
            <Image 
              source={{ uri: item.imageUri }}
              style={styles.itemImage}
              resizeMode="contain"
            />
            <Text style={styles.equippedItemName}>{item.name}</Text>
            <View style={[styles.rarityIndicator, { backgroundColor: getRarityColor(item.rarity) }]} />
          </View>
        ) : (
          <View style={styles.emptySlot}>
            <Ionicons 
              name={iconName} 
              size={24} 
              color="#aaa" 
            />
            <Text style={styles.addItemText}>Add {slotName}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getRarityColor = (rarity) => {
    const rarityColors = {
      common: '#C0C0C0',
      uncommon: '#008000',
      rare: '#0000FF',
      epic: '#800080',
      legendary: '#FFD700'
    };
    
    return rarityColors[rarity?.toLowerCase()] || '#C0C0C0';
  };

  return (
    <ScrollView style={globalStyles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
      bounces={true}
    >
      <View style={globalStyles.headerContainer}>
        
        {/* Top row of header with profile, username, level, and currency */}
        <View style={globalStyles.headerTopRow}>
          <TouchableOpacity
            style={globalStyles.profileButton}
            onPress={() => navigation.navigate('ProfileScreen')}
          >
            <Ionicons name="person-circle-outline" size={30} color="white" />
          </TouchableOpacity>

          <Text style={globalStyles.username}>{userStats.username}</Text>

          <View style={globalStyles.levelContainer}>
            <Text style={globalStyles.levelText}>Level {userStats.level}</Text>
          </View>

          <View style={globalStyles.currencyContainer}>
            <Image
              source={require('../../../assets/coin.png')}
              style={globalStyles.currencyIcon}
            />
            <Text style={globalStyles.currencyText}>{userStats.currency}</Text>
          </View>
        </View>

        <View style={globalStyles.xpContainer}>
          <View style={globalStyles.xpBarContainer}>
            <View
              style={[
                globalStyles.xpBar,
                { width: `${calculateXpProgress()}%` }
              ]}
            />
            <Text style={globalStyles.xpText}>XP: {userStats.xp} / 1000</Text>
          </View>
        </View>
      </View>

      {/* Avatar Box Section */}
      <View style={styles.avatarBoxContainer}>
        <View style={styles.avatarBox}>
          {renderAvatar()}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsHeader}>Stats</Text>
        {renderStatBar('Strength', userStats.stats.strength)}
        {renderStatBar('Intellect', userStats.stats.intellect)}
        {renderStatBar('Agility', userStats.stats.agility)}
        {renderStatBar('Arcane', userStats.stats.arcane)}
        {renderStatBar('Focus', userStats.stats.focus)}
      </View>

      {/* Equipment Section */}
      <View style={styles.equipmentContainer}>
        <View style={styles.equipmentHeaderRow}>
          <Text style={styles.equipmentHeader}>Equipment</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('ItemScreen')}
          >
            <Text style={styles.viewAllText}>View All Items</Text>
          </TouchableOpacity>
        </View>
        {renderEquipmentSlots()}
      </View>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  avatarBoxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  avatarBox: {
    width: 200,
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1c2d63',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeScreenAvatar: {
    borderWidth: 0, // Remove border as the avatarBox already has one
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  statsContainer: {
    padding: 20,
  },
  statsHeader: {
    fontSize: 40,
    color: '#e0d8c3',
    fontFamily: 'morris-roman',
    //fontWeight: 'bold',
    marginBottom: 16,
  },
  statContainer: {
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 20,
    fontFamily: 'morris-roman',
    color: '#e0d8c3',
    marginBottom: 2,
  },
  statBarContainer: {
    height: 12,
    backgroundColor: '#330000',
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBar: {
    height: '100%',
    backgroundColor: '#528aae', 
  },
  statValue: {
    position: 'absolute',
    right: 8,
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inventoryContainer: {
    padding: 20,
    paddingTop: 0,
  },
  inventoryHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inventorySlotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  inventorySlot: {
    width: '16%',
    aspectRatio: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  emptySlot: {
    width: '100%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  itemImage: {
    width: '100%',
    height: '70%',
  },
  slotName: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  equipmentContainer: {
    padding: 20,
    paddingTop: 10,
  },
  equipmentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  equipmentHeader: {
    fontSize: 30,
    fontFamily: 'morris-roman',
    color: '#e0d8c3',
    //fontWeight: 'bold',
  },
  viewAllButton: {
    padding: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  viewAllText: {
    fontSize: 12,
    color: '#666',
  },
  inventorySlotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  inventorySlot: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    padding: 8,
    overflow: 'hidden',
  },
  emptySlot: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  addItemText: {
    fontSize: 10,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },
  equippedItemContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '70%',
    marginBottom: 4,
  },
  equippedItemName: {
    fontSize: 10,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  rarityIndicator: {
    height: 3,
    width: '80%',
    borderRadius: 1.5,
    position: 'absolute',
    bottom: 0,
  },
});

export default HomeScreen;