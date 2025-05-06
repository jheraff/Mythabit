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
import { globalStyles } from '../../../styles/globalStyles';

export default function ShopScreen() {
  const navigation = useNavigation();
  const [userGold, setUserGold] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [shopItems, setShopItems] = useState([]);
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
      focus: 1,
    },
  });

  useEffect(() => {
    loadUserData();
    loadShopItems();

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const unsubscribeUserStats = onSnapshot(
      doc(db, 'users', userId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
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
              focus: userData.stats?.focus || 1,
            },
          };
          setUserStats(completeUserStats);
          setUserGold(userData.currency || 0);
          setInventory(userData.inventory || []);
        }
      },
      (error) => console.error(error)
    );

    return () => unsubscribeUserStats();
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

  const loadShopItems = async () => {
    try {
      const shopRotationDoc = await getDoc(doc(db, 'shop', 'shop_rotation'));
      if (!shopRotationDoc.exists()) return;
  
      const shopData = shopRotationDoc.data();
      const itemIds = shopData.items;
  
      const shopLootDoc = await getDoc(doc(db, 'items', 'itemshoploot'));
      if (!shopLootDoc.exists()) return;
  
      const lootMap = shopLootDoc.data(); // This is a key:value map like { bronze_armor: {...}, iron_sword: {...} }
  
      const selectedItems = itemIds
        .map((id) => {
          const item = lootMap[id];
          if (!item) return null;
          return {
            id,
            ...item,
            rarity: item.rarity?.toLowerCase() || 'common',
          };
        })
        .filter(Boolean);
  
      setShopItems(selectedItems);
    } catch (error) {
      console.error('Error loading shop items:', error);
    }
  };
  

  const screenWidth = Dimensions.get('window').width;
  const numColumns = 2;
  const itemSpacing = 16;
  const totalSpacing = itemSpacing * (numColumns + 1);
  const itemSize = (screenWidth - totalSpacing) / numColumns;

  const calculateXpProgress = () => (userStats.xp / 1000) * 100;

  const purchaseItem = async (item) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
  
      const userRef = doc(db, 'users', userId);
  
      // Get current inventory
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return;
  
      const userData = userDoc.data();
      const currentInventory = userData.inventory || {
        weaponList: [],
        armorList: [],
        potionList: []
      };
  
      const newGoldAmount = userGold - item.cost;
  
      // Determine item type and where to store it
      let updatedInventory = { ...currentInventory };

      console.log(item.slot);
  
      switch (item.slot) {
        case 'Weapon':
          updatedInventory.weaponList.push(item);
          break;
        case 'Armor':
          updatedInventory.armorList.push(item);
          break;
        case 'Potion':
          updatedInventory.potionList.push(item);
          break;
        default:
          Alert.alert('Error', 'Unknown item type');
          return;
      }
  
      // Save updated data
      await updateDoc(userRef, {
        currency: newGoldAmount,
        inventory: updatedInventory,
      });
  
      setUserGold(newGoldAmount);
      setInventory(updatedInventory);
  
      Alert.alert('Purchase Successful', `You bought ${item.name}!`);
    } catch (error) {
      console.error('Error purchasing item:', error);
      Alert.alert('Error', 'Failed to purchase item. Please try again.');
    }
  };

  const handleItemPress = (item) => {
    if (userGold >= item.cost) {
      Alert.alert(
        'Confirm Purchase',
        `Buy ${item.name} for ${item.cost} gold?\n\n${item.description}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy', onPress: () => purchaseItem(item) },
        ]
      );
    } else {
      Alert.alert('Not enough gold', `You need ${item.cost - userGold} more.`);
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
      <View style={globalStyles.headerContainer}>
        <View style={globalStyles.headerTopRow}>
          <TouchableOpacity
            style={globalStyles.profileButton}
            onPress={() => navigation.navigate('Home', { screen: 'ProfileScreen' })}
          >
            <Ionicons name="person-circle-outline" size={30} color="white" />
          </TouchableOpacity>
          <Text style={globalStyles.username}>{userStats.username}</Text>
          <View style={globalStyles.levelContainer}>
            <Text style={globalStyles.levelText}>Level {userStats.level}</Text>
          </View>
          <View style={globalStyles.currencyContainer}>
            <Image source={require('../../../assets/coin.png')} style={globalStyles.currencyIcon}/>
            <Text style={globalStyles.currencyText}>{userStats.currency}</Text>
          </View>
        </View>
        <View style={globalStyles.xpContainer}>
          <View style={globalStyles.xpBarContainer}>
            <View style={[globalStyles.xpBar, { width: `${calculateXpProgress()}%` }]}/>
            <Text style={globalStyles.xpText}>XP: {userStats.xp} / 1000</Text>
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
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}
const rarityColors = {
  common: '#C0C0C0',     // gray/silver
  uncommon: '#008000',   // green
  rare: '#0000FF',       // blue
  epic: '#800080',       // purple
  legendary: '#FFD700',  // gold
};

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
    color: '#1c2d63',
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
    shadowOffset: { width: 0, height: 2 },
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
