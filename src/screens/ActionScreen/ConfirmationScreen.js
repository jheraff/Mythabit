import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Pressable, Image, Modal, ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { doc, updateDoc, getDoc, getDocs, query, collection, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

const ConfirmationScreen = ({ navigation, route, extraData }) => {
    const [visible, setVisible] = useState(false);
    const { selectedIndex } = route.params || {};
    const [numberArray, setNumberArray] = useState([]);
    const [currSlot, setCurrSlot] = useState('');
    const [tempItem, setTempItem] = useState(null);

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
        equip: {
            weaponS: null,
            armorS: null,
            potionS: null,
        },
        inventory: {
            weaponList: [null],
            armorList: [null],
            potionList: [null],
        },
    });

    useEffect(() => {
        console.log('userStats updated:', userStats);
    }, [userStats]);

    useEffect(() => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const unsubscribeUserStats = onSnapshot(
            doc(db, 'users', userId),
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    console.log('Firestore snapshot received!');
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
                            focus: userData.stats?.focus || 1
                        },
                        equip: {
                            weaponS: userData.equippedItems?.weaponSlot || null,
                            armorS: userData.equippedItems?.armorSlot || null,
                            potionS: userData.equippedItems?.potionSlot || null,
                        },
                        inventory: {
                            weaponList: userData.inventory?.weaponList || [null],
                            armorList: userData.inventory?.armorList || [null],
                            potionList: userData.inventory?.potionList || [null],
                        }
                    };

                    setUserStats(completeUserStats);
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

    useEffect(() => {
        console.log('floor: ' + selectedIndex);
    }, []);

    const updateEquippedSlot = async (slot, itemData) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const userDocRef = doc(db, 'users', userId);

        try {
            await updateDoc(userDocRef, {
                [`equippedItems.${slot}`]: itemData
            });

            console.log(`Updated ${slot} with`, itemData);

            setUserStats((prev) => ({
                ...prev,
                equip: {
                    ...prev.equip,
                    [slot === 'weaponSlot' ? 'weaponS' : slot === 'armorSlot' ? 'armorS' : 'potionS']: itemData
                }
            }));

            setVisible(false);
            setTempItem(null);
        } catch (err) {
            console.error('Failed to update', err);
        }
    };

    const renderInventory = (category) => {
        let inventoryItems = [];
        switch (category) {
            case 'weaponSlot':
                inventoryItems = userStats.inventory.weaponList?.filter(item => item !== null) || [];
                break;
            case 'potionSlot':
                inventoryItems = userStats.inventory.potionList?.filter(item => item !== null) || [];
                break;
            case 'armorSlot':
                inventoryItems = userStats.inventory.armorList?.filter(item => item !== null) || [];
                break;
            default:
                break;
        }
        setNumberArray(inventoryItems);
    };

    const handleMenu = (value) => {
        setCurrSlot(value);
        renderInventory(value);
        setVisible(true);
    };

    function switchTemp(index) {
        setTempItem(index);
    };

    const getCurrentEquippedItem = () => {
        switch (currSlot) {
            case 'weaponSlot':
                return userStats.equip.weaponS;
            case 'armorSlot':
                return userStats.equip.armorS;
            case 'potionSlot':
                return userStats.equip.potionS;
            default:
                return null;
        }
    };

    return (
      <View style={styles.container}>
          <Modal
              animationType="slide"
              transparent={true}
              visible={visible}
              onRequestClose={() => {
                  setVisible(false);
                  setTempItem(null);
              }}
          >
              <Pressable style={styles.overlay} onPress={() => { setVisible(false); setTempItem(null); }} />
              <View style={styles.menuContainer}>
                  <View style={styles.menuHeader}>
                      <Text style={styles.menuTitle}>Select {currSlot.replace('Slot', '')}</Text>
                      <Pressable onPress={() => { setVisible(false); setTempItem(null); }}>
                          <Text style={styles.closeButton}>X</Text>
                      </Pressable>
                  </View>

                  <ScrollView contentContainerStyle={styles.inventoryGrid}>
                      {numberArray.map((item, index) => (
                          <TouchableOpacity
                              key={index}
                              style={[
                                  styles.itemBox,
                                  tempItem?.id === item.id && styles.selectedItem // Changed to compare by id for more reliable selection
                              ]}
                              onPress={() => {
                                  console.log("Selected item:", item);
                                  switchTemp(item);
                              }}
                          >
                              <Image
                                  source={require('../../../assets/avatars/placeholder.png')}
                                  style={styles.itemImage}
                              />
                              <Text style={styles.itemName}>{item.name}</Text>
                              {tempItem?.id === item.id && ( // Added checkmark for selected item
                                  <View style={styles.selectedIndicator}>
                                      <Text style={styles.checkmark}>✓</Text>
                                  </View>
                              )}
                          </TouchableOpacity>
                      ))}
                  </ScrollView>

                    <View style={styles.selectionPanel}>
                        <View style={styles.itemInfoBox}>
                            <Text style={styles.infoTitle}>Current:</Text>
                            <Text style={styles.infoText}>
                                {getCurrentEquippedItem()?.name || 'None equipped'}
                            </Text>
                        </View>

                        <View style={styles.itemInfoBox}>
                            <Text style={styles.infoTitle}>Selected:</Text>
                            <Text style={styles.infoText}>
                                {tempItem?.name || 'None selected'}
                            </Text>
                        </View>

                        <Button
                            title="Equip Selected"
                            onPress={() => {
                                if (tempItem) {
                                    updateEquippedSlot(currSlot, tempItem);
                                } else {
                                    console.log('No item selected');
                                }
                            }}
                            disabled={!tempItem}
                            color="#d4af37"
                        />
                    </View>
                </View>
            </Modal>

            <View style={styles.topView}>
                <Text style={styles.headTitle}>Items Equipped</Text>
            </View>

            <View style={styles.middleView}>
                <TouchableOpacity style={styles.equipmentSlot} onPress={() => handleMenu('armorSlot')}>
                    <Image source={require('../../../assets/avatars/placeholder.png')}
                        style={styles.previewImage} />
                    <Text style={styles.slotTitle}>Armor</Text>
                    <Text style={styles.equippedItem}>{userStats.equip.armorS?.name || 'None equipped'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.equipmentSlot} onPress={() => handleMenu('weaponSlot')}>
                    <Image source={require('../../../assets/avatars/placeholder.png')}
                        style={styles.previewImage} />
                    <Text style={styles.slotTitle}>Weapon</Text>
                    <Text style={styles.equippedItem}>{userStats.equip.weaponS?.name || 'None equipped'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.equipmentSlot} onPress={() => handleMenu('potionSlot')}>
                    <Image source={require('../../../assets/avatars/placeholder.png')}
                        style={styles.previewImage} />
                    <Text style={styles.slotTitle}>Potion</Text>
                    <Text style={styles.equippedItem}>{userStats.equip.potionS?.name || 'None equipped'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.bottomView}>
                <Text style={styles.title}>Are these the items you want equipped?</Text>
                <TouchableOpacity
                    style={styles.darkFantasyButton}
                    onPress={() => navigation.navigate('Adventure', { selectedIndex })}
                >
                    <Text style={styles.darkFantasyButtonText}>Yes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.darkFantasyButton, { marginTop: 10, backgroundColor: '#2e2e2e' }]}
                    onPress={() => navigation.navigate('Tower', { selectedIndex })}
                >
                    <Text style={styles.darkFantasyButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
    },
    topView: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 100,
        width: '100%',
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 2,
        borderColor: '#444',
    },
    headTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#e0d8c3',
        fontFamily: 'serif',
    },
    middleView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-evenly',
        width: '90%',
        paddingVertical: 20,
    },
    equipmentSlot: {
        backgroundColor: '#2b2b2b',
        height: 120,
        width: '100%',
        maxWidth: 300,
        borderColor: '#666',
        borderWidth: 2,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        padding: 10,
    },
    previewImage: {
        width: 45,
        height: 45,
        tintColor: '#c2baa6',
        marginBottom: 5,
    },
    slotTitle: {
        fontSize: 16,
        fontFamily: 'serif',
        color: '#d4af37',
        fontWeight: 'bold',
    },
    equippedItem: {
        fontSize: 14,
        color: '#e0d8c3',
        fontFamily: 'serif',
    },
    bottomView: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        width: '100%',
        borderTopWidth: 2,
        borderColor: '#444',
    },
    title: {
        fontSize: 18,
        color: '#e0d8c3',
        fontFamily: 'serif',
        marginBottom: 12,
    },
    darkFantasyButton: {
        backgroundColor: '#2e2e2e',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#888',
        marginTop: 5,
        width: '80%',
        alignItems: 'center',
    },
    darkFantasyButtonText: {
        color: '#e0d8c3',
        fontSize: 16,
        fontFamily: 'serif',
    },
    // Modal styles
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    menuContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    menuTitle: {
        color: '#d4af37',
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        color: '#e0d8c3',
        fontSize: 20,
        padding: 10,
    },
    inventoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    itemBox: {
        backgroundColor: '#2e2e2e',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        padding: 10,
        margin: 8,
        width: 100,
        alignItems: 'center',
    },
    selectedItem: {
        borderColor: '#d4af37',
        backgroundColor: '#3a3a3a',
    },
    itemImage: {
        width: 40,
        height: 40,
        tintColor: '#c2baa6',
        marginBottom: 5,
    },
    itemName: {
        color: '#e0d8c3',
        fontSize: 12,
        textAlign: 'center',
    },
    selectionPanel: {
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#444',
    },
    itemInfoBox: {
        marginBottom: 10,
    },
    infoTitle: {
        color: '#d4af37',
        fontWeight: 'bold',
        marginBottom: 3,
    },
    infoText: {
        color: '#e0d8c3',
    },
    selectedItem: {
      borderColor: '#d4af37',
      backgroundColor: '#3a3a3a',
      transform: [{ scale: 1.05 }], // Slightly enlarge selected item
  },
  selectedIndicator: {
      position: 'absolute',
      top: 5,
      right: 5,
      backgroundColor: '#d4af37',
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
  },
  checkmark: {
      color: '#1a1a1a',
      fontWeight: 'bold',
      fontSize: 14,
  },
});

export default ConfirmationScreen;