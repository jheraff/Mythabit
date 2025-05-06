import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Pressable, Image, Modal} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { doc, updateDoc,getDoc, getDocs, query, collection, setDoc , onSnapshot} from 'firebase/firestore';
import { db , auth } from '../../firebase/config';

const ConfirmationScreen = ({ navigation, route, extraData }) => {
    const [visible, setVisible] = useState(false);
    const { selectedIndex } = route.params || {};
    const [numberArray, setNumberArray] = useState([]);

    const [currSlot, setCurrSlot] = useState([]);




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
                              weaponList: userData.inventory?.weaponList || null,
                              armorList: userData.inventory?.armorList || null,
                              potionList: userData.inventory?.potionList || null,
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
      } catch (err) {
        console.error('Failed to update', err);
      }
    };


    const renderInventory = (category) => {
      if (category == 'weaponSlot') {
        setNumberArray(userStats.inventory.weaponList);
      } else if (category == 'potionSlot') {
        setNumberArray(userStats.inventory.potionList);
      } else if (category == 'armorSlot') {
        setNumberArray(userStats.inventory.armorList);
      
      }
    
    };

    
    const handleMenu = (value) => {
      renderInventory(value);
      console.log(value);
      setCurrSlot(value);
      setVisible(true);

    };

    function switchTemp (index) {
      setTempItem(index);

    };

    
    
    return (

      <View style={styles.container}>


        <Modal
          animationType="slide"
          transparent={true}
          visible={visible}
          onRequestClose={() => setVisible(false)}
        >
          <Pressable style={styles.overlay} onPress={() => {setVisible(false); setTempItem(" "); }} />
          <View style={styles.menu}>
            <Pressable onPress={() => setVisible(false)}>
              <Text style={{ color: 'white', fontSize: 18 }}>Close</Text>
            </Pressable>

            <View style={styles.quickMenu}>
              {numberArray?.map((item, index) => (
                <View key={index} style={styles.itemBox}>
                  <Pressable onPress={() => {console.log(item.name); switchTemp(item);}}> 
                    <Text> {item.name} </Text>
                  </Pressable>
                </View>
              ))}

            </View>
              
            <View style={styles.updateButton}> 
            <Button
              title="Update Item?"
              onPress={() => {
                if (tempItem) {
                  console.log(tempItem);
                  updateEquippedSlot(currSlot, tempItem);
                  
                } else {
                  console.log('No item selected');
                }
              }}
            />
            </View>

            <TouchableOpacity style ={[styles.itemBox ,{height: 100,width: 100, bottom: 160,left: 30, backgroundColor:'lightgrey'}]}
            onPress={() => {console.log('hi')} }>
              <Text> Item selected: {tempItem?.name || 'No item selected'}</Text>
            </TouchableOpacity>

            <View style ={[styles.itemBox ,{height: 100,width: 100, bottom: 275,left: 200,backgroundColor:'lightgrey'}]}>
              <Text> Current Item:</Text>
              {currSlot === 'weaponSlot' && (
                <Text>{userStats.equip.weaponS.name|| 'None equipped'}</Text>
              )}
              
              {currSlot === 'armorSlot' && (
                <Text>{userStats.equip.armorS.name || 'None equipped'}</Text>
              )}

              {currSlot === 'potionSlot' && (
                <Text>{userStats.equip.potionS.name || 'None equipped'}</Text>
              )}
            </View>


          </View>
        </Modal>
        
       

        <View style={styles.topView}> 
          <Text style={styles.headTitle}> Items Equpped </Text>
        </View>

        

              <View style={styles.middleView}>
        <TouchableOpacity style={styles.slotOne} onPress={() => handleMenu('weaponSlot')}>
          <Image source={require('../../../assets/avatars/placeholder.png')} style={styles.previewImageOne} />
          <Text style={styles.itemTitle}>Weapon</Text>
          <Text style={styles.equippedItemName}>{mainWeapon?.name || 'None equipped'}</Text>
          <Text style={[styles.itemTitle, { color: 'darkgreen' }]}>{mainWeapon ? `+ ${mainWeapon.damage}` : ''}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.slotOne} onPress={() => handleMenu('armorSlot')}>
          <Image source={require('../../../assets/avatars/placeholder.png')} style={styles.previewImageOne} />
          <Text style={styles.itemTitle}>Armor</Text>
          <Text style={styles.equippedItemName}>{mainArmor?.name || 'None equipped'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.slotOne} onPress={() => handleMenu('potionSlot')}>
          <Image source={require('../../../assets/avatars/placeholder.png')} style={styles.previewImageOne} />
          <Text style={styles.itemTitle}>Potion</Text>
          <Text style={styles.equippedItemName}>{mainPotion?.name || 'None equipped'}</Text>
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
    middleView: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-evenly',
      width: '90%',
      paddingVertical: 20,
    },
    slotOne: {
      backgroundColor: '#2b2b2b',
      height: 120,
      width: 300,
      borderColor: '#666',
      borderWidth: 2,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      paddingTop: 10,
    },
    itemTitle: {
      fontSize: 16,
      fontFamily: 'serif',
      color: '#d4af37', // for "Weapon", "Armor", etc.
    },
    equippedItemName: {
      fontSize: 14,
      color: '#e0d8c3', // for equipped item name
      fontFamily: 'serif',
      marginTop: -6,
    },
    previewImageOne: {
      width: 45,
      height: 45,
      tintColor: '#c2baa6',
      marginBottom: 5,
    },
    darkFantasyButton: {
      backgroundColor: '#2e2e2e',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: '#888',
      marginTop: 5,
    },
    darkFantasyButtonText: {
      color: '#e0d8c3',
      fontSize: 16,
      fontFamily: 'serif',
    },
    menu: {
      maxHeight: '70%',
      backgroundColor: '#1a1a1a',
      padding: 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    quickMenu: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 10,
    },
    itemBox: {
      backgroundColor: '#2e2e2e',
      borderWidth: 1,
      borderColor: '#d4af37',
      padding: 10,
      margin: 6,
      width: 70,
      height: 70,
      justifyContent: 'center',
      alignItems: 'center',
    },
    updateButton: {
      marginTop: 10,
      alignItems: 'center',
    },
  });  
  
  export default ConfirmationScreen;