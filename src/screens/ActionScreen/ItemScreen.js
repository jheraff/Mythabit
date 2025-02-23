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

  // Map rarity levels to colors and display names
  const rarityConfig = {
    common: { 
      color: '#C0C0C0',
      label: 'Common'
    },
    uncommon: { 
      color: '#008000',
      label: 'Uncommon'
    },
    rare: { 
      color: '#0000FF',
      label: 'Rare'
    },
    epic: { 
      color: '#800080',
      label: 'Epic'
    },
    legendary: { 
      color: '#FFD700',
      label: 'Legendary'
    },
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
        setInventory(userData.inventory || []);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  // Get screen dimensions
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
            { borderColor: config.color },
            selectedRarity === rarity && styles.filterButtonSelected
          ]}
          onPress={() => setSelectedRarity(rarity)}
        >
          <Text style={styles.filterButtonText}>{config.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemBox, { width: itemSize }]}
      onPress={() => handleItemPress(item)}
    >
      <View style={[
        styles.itemRarity, 
        { backgroundColor: rarityConfig[item.rarity].color }
      ]} />
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemRarityText}>
        {rarityConfig[item.rarity].label}
      </Text>
      {item.description && (
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  const handleItemPress = (item) => {
    Alert.alert(
      item.name,
      `${item.description}\n\nRarity: ${rarityConfig[item.rarity].label}`,
      [{ text: 'Close' }]
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
              ? `No ${rarityConfig[selectedRarity].label.toLowerCase()} items in inventory`
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
    backgroundColor: '#f5f5f5',
    borderTopWidth: 45,
    borderTopColor: 'black'
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  count: {
    fontSize: 16,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterButtonSelected: {
    backgroundColor: '#f0f0f0',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
  },
  list: {
    padding: 12,
    gap: 12,
  },
  itemBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
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
  },
  itemRarityText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
    fontSize: 16,
  },
});

export default ItemScreen;