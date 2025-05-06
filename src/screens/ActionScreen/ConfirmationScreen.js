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


    const [mainWeapon, setMainWeapon] = useState(null);
    const [mainArmor, setMainAmor] = useState(null);
    const [mainPotion, setMainPotion] = useState(null);


    const [inventoryArmor, setInventoryArmor] = useState(null);
    const [inventoryWeapon, setInventoryWeapon] = useState(null);
    const [inventoryPotion, setInventoryPotion] = useState(null);
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
                        console.log('User data:', userData);
    
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
      fetchEquipped();
      fetchArmor();
      fetchWeapon();
      fetchPotion();
      console.log('floor: ' + selectedIndex);
      
    }, []);



    const updateEquippedSlot = async (slot, itemData) => {
      try {
        await setDoc(doc(db, 'users',userId, 'equippedItems', slot), itemData);
        console.log('Updated ${slot} with', itemData);
        fetchEquipped();
      } catch (err) {
        console.error('Failed to update', error);
      }
    };

    const fetchArmor = async () => {
      try {
        const armor = collection(db, 'inventory_armor');
        const snapshot = await getDocs(armor);
    
        const armorItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
    
        setInventoryArmor(armorItems);
      } catch (error) {
        console.error('Error loading armor:', error);
      }
    };

    

    const fetchWeapon = async () => {
      try {
        const weapon = collection(db, 'inventory_weapons');
        const snapshot = await getDocs(weapon);
    
        const weaponItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
    
        setInventoryWeapon(weaponItems);
      } catch (error) {
        console.error('Error loading weapons:', error);
      }
    };

    const fetchPotion = async () => {
      try {
        const potion = collection(db, 'inventory_potions');
        const snapshot = await getDocs(potion);
    
        const potionItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
    
        setInventoryPotion(potionItems);
      } catch (error) {
        console.error('Error loading potions:', error);
      }
    };

    const fetchEquipped = async () => {
      try {
        const slots = ['weaponSlot','potionSlot','armorSlot']
        const promises = slots.map(slot => getDoc(doc(db,'equippedItems',slot)))
        const docs = await Promise.all(promises);

        
        const equippedItems = docs.map((docSnap, index) => {
          if (docSnap.exists()) {
            if (docSnap.id === 'weaponSlot') {
              setMainWeapon(docSnap.data());
            } else if (docSnap.id === 'armorSlot') {
              setMainAmor(docSnap.data());
            }  else if (docSnap.id === 'potionSlot') {
              setMainPotion(docSnap.data());
            } 

            return {
              slot: slots[index],
              ...docSnap.data()
             
            };
          } else {
            return {
              slot: slots[index],
              name: null
            };
          }
        });
    
        return equippedItems; // [{slot: 'weapon', name: 'dagger'}, ...]
      } catch (err) {
        console.log('Error fetching equipped items:', err);
        return [];
      }
    };

    const renderInventory = (category) => {
      if (category == 'weaponSlot') {
        setNumberArray(userStats.inventory.weaponList);
      } else if (category == 'potionSlot') {
        setNumberArray(userStats.inventory.potionList);
        console.log('numberArraySGSGSGSGSGSG:', userStats.inventory.potionList);
      } else if (category == 'armorSlot') {
        setNumberArray(inventoryArmor);
      
      }
    
    };



    const handleNextScreen = () => {
      setVisible;
      console.log('next: ');
      navigation.navigate('Adventure', { selectedIndex, extraData });
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

    useEffect(() => {
      //console.log('Updated inventory', inventoryWeapon);

    }, [inventoryWeapon]);

    
    
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
          <Text style={styles.headTitle}> Daily </Text>
        </View>

        


        <View style={styles.middleView}> 
          
          <TouchableOpacity style={[styles.slotOne, {top: 280}]} onPress={() => handleMenu('armorSlot')}> 
            <Image source={require('../../../assets/avatars/placeholder.png')}
            style={styles.previewImageOne}/>
            <Text style={[styles.itemTitle, {fontWeight: 'bold'}]}> Armor </Text>
            <Text style={styles.itemTitle}> {userStats.equip.armorS?.name || 'None equipped'} </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.slotOne, {top: 20}]} onPress={() => {handleMenu('weaponSlot')}}> 
            <Image source={require('../../../assets/avatars/placeholder.png')}
            style={styles.previewImageOne}/>
            <Text style={[styles.itemTitle, {fontWeight: 'bold'}]}> Weapon </Text>
            <Text style={[styles.itemTitle]}> {userStats.equip.weaponS?.name || 'None equipped'} </Text>
            <Text style={[styles.itemTitle, {color: 'darkgreen'}]}> {'+ ' + mainWeapon?.damage || 'None equipped'} </Text>

          </TouchableOpacity>


          <TouchableOpacity style={[styles.slotOne, {bottom: 240,}]} onPress={() => handleMenu('potionSlot')}> 
            <Image source={require('../../../assets/avatars/placeholder.png')}
            style={styles.previewImageOne}/>
            <Text style={[styles.itemTitle, {fontWeight: 'bold'}]}> Potion </Text>
            <Text style={styles.itemTitle}>{(userStats.equip.potionS?.name || 'None equipped')}</Text>
            

          </TouchableOpacity>

        </View>

        <View style={styles.bottomView}> 
          <Text style={styles.title}>Are you sure you want to begin the adventure?</Text>
          <Button title="Yes, Begin!" onPress={() => navigation.navigate('Adventure', { selectedIndex })}/>

        </View>
      
      </View>
    );
  };

  const styles = StyleSheet.create({
    
    itemBox: {
      borderColor: '#ccc',
      borderWidth: 5,
      backgroundColor: 'white',
      marginHorizontal: 10,
      marginVertical: 8,
      height: 70,
      width: 70,
      zIndex: 10,
      
    },
    quickMenu: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      backgroundColor: 'white',
      
      
      height: 500,
      width: 390,
      right: 19,
    },

    updateButton: {
      bottom: 175,
    },

    container: { 
      flex: 1, 
      alignItems: 'center',
    },

    topView: {
      alignItems: 'center',
      top: 20,
      height: 100,
      width: 400,
      backgroundColor: '#1c2d63',
    },

    headTitle: {
      top:10,
      fontSize: 50,
      fontWeight: 'bold',
      color: 'white'
    },

    bottomView: {
      padding: 16,
      alignItems: 'center',
      margin: 20,
      backgroundColor: '#1c2d63',
      width: 400,
    },

    middleView: {
      justifyContent: 'center',
      alignItems: 'center',
      height: 100,
      width: 390,
      flex: 1,
      
    },

    slotOne: {
      backgroundColor: 'white',
      height: 120,
      width: 300,
      borderColor: 'black',
      borderWidth: 5,
      borderRadius: 10,
      alignItems: 'center',
     
    },

    itemTitle: {
      bottom: 75,
      fontSize: 20,
    },

    previewImageOne: {
      width: 55,
      height: 55,
      top: 25,
      right: 100,
      marginBottom: 30,
    },

    title: { 
      fontSize: 20, 
      marginBottom: 20,
      color: 'white',
      fontWeight: 'bold',
      
    },

    equipIcon: {
      borderColor: 'black',
      width: 100,
      height: 100,
      alignItems: 'center',
      
    },

    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      maxHeight: '27%',
    },

    previewText: {
      width: 20,
      height: 20,
    
    },
    menu: {
      
      maxHeight: '70%',
      backgroundColor: '#1c2d63',
      padding: 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: 75,
    },

  });

  
  
  export default ConfirmationScreen;