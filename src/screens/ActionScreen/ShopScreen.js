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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

export default function ShopScreen() {
  const [userGold, setUserGold] = useState(0);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

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
      <View style={styles.topContainer}>
        <Text style={styles.shopkeeperText}>Welcome to the Shop!</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceText}>Your Gold: {userGold}</Text>
        </View>
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