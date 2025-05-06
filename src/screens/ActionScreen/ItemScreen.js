import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

const ItemScreen = () => {
  const [inventory, setInventory] = useState([]);
  const [selectedRarity, setSelectedRarity] = useState(null);

  const rarityConfig = {
    common: { label: 'Common', color: '#C0C0C0', darkColor: '#8a8a8a' },
    uncommon: { label: 'Uncommon', color: '#008000', darkColor: '#006400' },
    rare: { label: 'Rare', color: '#0000FF', darkColor: '#00008b' },
    epic: { label: 'Epic', color: '#800080', darkColor: '#4b0082' },
    legendary: { label: 'Legendary', color: '#FFD700', darkColor: '#daa520' },
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        const inventoryItems = Object.values(userData.inventory || {}).flat().map(item => ({
          ...item,
          rarity: item.rarity?.toLowerCase() || 'common', 
        }));

        setInventory(inventoryItems);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const numColumns = 3;
  const itemSpacing = 12;
  const totalSpacing = itemSpacing * (numColumns + 1);
  const itemSize = (screenWidth - totalSpacing) / numColumns;

  const filteredItems = selectedRarity
    ? inventory.filter(item => item.rarity === selectedRarity)
    : inventory;

  const renderRarityFilter = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          !selectedRarity && styles.filterButtonSelected
        ]}
        onPress={() => setSelectedRarity(null)}
      >
        <Text style={styles.filterButtonText}>All</Text>
      </TouchableOpacity>
      {Object.entries(rarityConfig).map(([rarity, config]) => (
        <TouchableOpacity
          key={rarity}
          style={[
            styles.filterButton,
            { borderColor: config.darkColor },
            selectedRarity === rarity && styles.filterButtonSelected
          ]}
          onPress={() => setSelectedRarity(rarity)}
        >
          <Text style={[styles.filterButtonText, { color: config.darkColor }]}>
            {config.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderItem = ({ item }) => {
    const rarityKey = typeof item.rarity === 'string' ? item.rarity.toLowerCase() : 'common';
    const rarityInfo = rarityConfig[rarityKey] || { label: 'Unknown', color: '#999', darkColor: '#666' };

    return (
      <TouchableOpacity
        style={[styles.itemBox, { width: itemSize }]}
        onPress={() => handleItemPress(item)}
      >
        <View style={[styles.itemRarity, { backgroundColor: rarityInfo.darkColor }]} />
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={[styles.itemRarityText, { color: rarityInfo.darkColor }]}>
          {rarityInfo.label}
        </Text>
        {item.description && (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const handleItemPress = (item) => {
    const rarityKey = typeof item.rarity === 'string' ? item.rarity.toLowerCase() : 'common';
    const rarityLabel = rarityConfig[rarityKey]?.label || 'Unknown';
    Alert.alert(
      item.name,
      `${item.description}\n\nRarity: ${rarityLabel}`,
      [{ text: 'Close', style: 'cancel' }],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.count}>
          {inventory.length} {inventory.length === 1 ? 'Item' : 'Items'}
        </Text>
      </View>

      {renderRarityFilter()}

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        numColumns={numColumns}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {selectedRarity 
              ? `No ${rarityConfig[selectedRarity]?.label.toLowerCase()} items in inventory`
              : 'Your inventory is empty'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    backgroundColor: '#2b2b2b',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e0d8c3',
    fontFamily: 'morris-roman',
  },
  count: {
    fontSize: 16,
    color: '#c2baa6',
    fontFamily: 'morris-roman',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    backgroundColor: '#2b2b2b',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#666',
    backgroundColor: '#2b2b2b',
  },
  filterButtonSelected: {
    backgroundColor: '#3a3a3a',
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'morris-roman',
  },
  list: {
    padding: 12,
    gap: 12,
  },
  itemBox: {
    backgroundColor: '#2b2b2b',
    borderRadius: 8,
    padding: 12,
    margin: 6,
    borderWidth: 1,
    borderColor: '#444',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemRarity: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#e0d8c3',
    fontFamily: 'morris-roman',
  },
  itemRarityText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'morris-roman',
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 12,
    color: '#c2baa6',
    lineHeight: 16,
    fontFamily: 'morris-roman',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#c2baa6',
    fontSize: 16,
    fontFamily: 'morris-roman',
  },
});

export default ItemScreen;