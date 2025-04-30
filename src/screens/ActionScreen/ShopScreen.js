import React, { useState, useEffect } from 'react';

import {
  StyleSheet,
  View,
  Text,
  Image,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ShopScreen() {
  const navigation = useNavigation();
  const [userGold, setUserGold] = useState(0);
  const [inventory, setInventory] = useState([]);
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
    }
  });

  useEffect(() => {
    loadUserData();
    
    // Set up real-time listener for user stats
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const unsubscribeUserStats = onSnapshot(
      doc(db, 'users', userId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();

          // Create complete user stats object, ensuring all fields exist
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
            }
          };
          setUserStats(completeUserStats);
          setUserGold(userData.currency || 0);
          setInventory(userData.inventory || []);
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

  const calculateXpProgress = () => {
    return (userStats.xp / 1000) * 100;
  };

  const loadUserData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserGold(userData.currency || 0);
        setInventory(userData.inventory || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Define the items array with shop items
  const items = [
    { id: 1, name: 'Wooden Sword', rarity: 'common', description: 'A basic training sword' },
    { id: 2, name: 'Iron Shield', rarity: 'uncommon', description: 'Reliable protection' },
    { id: 3, name: 'Health Potion', rarity: 'rare', description: 'Restores vitality' },
    { id: 4, name: 'Dragon Helm', rarity: 'epic', description: 'Forged in dragon fire' },
    { id: 5, name: 'Crystal Boots', rarity: 'legendary', description: 'Mystical footwear' },
    { id: 6, name: 'Silver Ring', rarity: 'common', description: 'A simple band' },
  ];

  const rarityColors = {
    common: '#C0C0C0',     // Silver
    uncommon: '#008000',   // Green
    rare: '#0000FF',       // Blue
    epic: '#800080',       // Purple
    legendary: '#FFD700',  // Gold
  };

  const rarityBaseCosts = {
    common: 100,
    uncommon: 250,
    rare: 500,
    epic: 1000,
    legendary: 2000,
  };

  const shopItems = items.map((item) => {
    const baseCost = rarityBaseCosts[item.rarity];
    const randomVariation = Math.floor(Math.random() * baseCost * 0.2);
    const cost = baseCost + randomVariation;
    return {
      ...item,
      cost,
    };
  });

  const screenWidth = Dimensions.get('window').width;
  const numColumns = 2;
  const itemSpacing = 16;
  const totalSpacing = itemSpacing * (numColumns + 1);
  const itemSize = (screenWidth - totalSpacing) / numColumns;

  const purchaseItem = async (item) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userRef = doc(db, 'users', userId);
      const newGoldAmount = userGold - item.cost;
      const newInventory = [...inventory, item];

      await updateDoc(userRef, {
        currency: newGoldAmount,
        inventory: newInventory
      });

      setUserGold(newGoldAmount);
      setInventory(newInventory);

      Alert.alert(
        'Purchase Successful',
        `You have purchased ${item.name}!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error purchasing item:', error);
      Alert.alert('Error', 'Failed to purchase item. Please try again.');
    }
  };

  const handleItemPress = (item) => {
    if (userGold >= item.cost) {
      Alert.alert(
        'Confirm Purchase',
        `Would you like to buy ${item.name} for ${item.cost} gold?\n\n${item.description}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy', onPress: () => purchaseItem(item) }
        ]
      );
    } else {
      Alert.alert(
        'Insufficient Funds',
        `You need ${item.cost - userGold} more gold to buy this item.`
      );
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemBox, { width: itemSize }]}
      onPress={() => handleItemPress(item)}
    >
      <View style={[styles.itemRarity, { backgroundColor: rarityColors[item.rarity] }]} />
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemRarityText}>{item.rarity.toUpperCase()}</Text>
      <Text style={styles.itemCost}>{item.cost} Gold</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header Container */}
      <View style={styles.headerContainer}>
        {/* Top row of header with profile, username, level, and currency */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Home', { screen: 'ProfileScreen' })}
          >
            <Ionicons name="person-circle-outline" size={30} color="white" />
          </TouchableOpacity>

          <Text style={styles.username}>{userStats.username}</Text>

          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>Level {userStats.level}</Text>
          </View>

          <View style={styles.currencyContainer}>
            <Image
              source={require('../../../assets/coin.png')}
              style={styles.currencyIcon}
            />
            <Text style={styles.currencyText}>{userStats.currency}</Text>
          </View>
        </View>

        {/* XP bar row with text inside */}
        <View style={styles.xpContainer}>
          <View style={styles.xpBarContainer}>
            <View
              style={[
                styles.xpBar,
                { width: `${calculateXpProgress()}%` }
              ]}
            />
            <Text style={styles.xpText}>XP: {userStats.xp} / 1000</Text>
          </View>
        </View>
      </View>

      <View style={styles.topContainer}>
        <Text style={styles.shopkeeperText}>Welcome to the Shop!</Text>
      </View>

      <View style={styles.itemsContainer}>
        <FlatList
          data={shopItems}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={numColumns}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  profileButton: {
    padding: 5,
    marginRight: 10,
    backgroundColor: '#152551',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#afe8ff',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  levelContainer: {
    backgroundColor: '#152551',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#afe8ff',
  },
  levelText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  currencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#152551',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#afe8ff',
  },
  currencyIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#afe8ff',
  },
  xpContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 5,
  },
  xpText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    padding: 2,
    zIndex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  xpBarContainer: {
    height: 20,
    backgroundColor: '#152551',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#afe8ff',
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#4287f5', 
    position: 'absolute',
    left: 0,
    top: 0,
  },
  topContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  shopkeeperText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1c2d63',
  },
  balanceContainer: {
    alignItems: 'center',
  },
  balanceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  itemsContainer: {
    flex: 1,
    padding: 16,
  },
  list: {
    gap: 16,
  },
  itemBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  itemRarity: {
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemRarityText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  itemCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});