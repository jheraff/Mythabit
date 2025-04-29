import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Pressable, Image, Modal} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { doc, updateDoc,getDoc, getDocs, query, collection} from 'firebase/firestore';
import { db } from '../../firebase/config';

const ConfirmationScreen = ({ navigation, route, extraData }) => {
    const [visible, setVisible] = useState(false);
    const { selectedFloor } = route.params || {};
    const [numberArray, setNumberArray] = useState([]);
    const [mainWeapon, setMainWeapon] = useState(null);
    const [mainArmor, setMainAmor] = useState(null);
    const [mainPotion, setMainPotion] = useState(null);
    const [inventoryArmor, setInventoryArmor] = useState(null);
    const [inventoryWeapon, setInventoryWeapon] = useState(null);
    const [inventoryPotion, setInventoryPotion] = useState(null);

    useEffect(() => {
      fetchEquipped();
      fetchArmor();
      fetchWeapon();
      fetchPotion();
      
    }, []);

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
      if (category == 'sword') {
        setNumberArray(inventoryWeapon);
      } else if (category == 'Potion') {
        setNumberArray(inventoryPotion);
      } else if (category == 'Armor') {
        setNumberArray(inventoryArmor);
      
      }
    
    };

    const handleNextScreen = () => {
      setVisible;
      console.log('next: ');
      navigation.navigate('Tower', { selectedFloor, extraData });
    };

    
    const handleMenu = (value) => {
      renderInventory(value);
      console.log(value);
      setVisible(true);

    };

    useEffect(() => {
      console.log('Updated inventory', inventoryWeapon);

    }, [inventoryWeapon]);
    
    return (

      <View style={styles.container}>


        <Modal
          animationType="slide"
          transparent={true}
          visible={visible}
          onRequestClose={() => setVisible(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setVisible(false)} />
          <View style={styles.menu}>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={{ color: 'blue', fontSize: 18 }}>Close</Text>
            </TouchableOpacity>

            <View style={styles.quickMenu}>
              {numberArray.map((index) => (
                <View key={index} style={styles.itemBox}>
                  <Text> {index + 1} </Text>
                </View>
              ))}

            </View>

            <View style ={[styles.itemBox ,{bottom: 130, backgroundColor:'lightgrey'}]}>
              <Text> {mainWeapon?.name || 'None equipped'}</Text>
            </View>

            <View style ={[styles.itemBox ,{bottom: 215, left:120,backgroundColor:'lightgrey'}]}>
              <Text> mainArmor</Text>
            </View>

            <View style ={[styles.itemBox ,{bottom: 300,left: 230,backgroundColor:'lightgrey'}]}>
              <Text> Potion</Text>
            </View>


          </View>
        </Modal>
        
       

        <View style={styles.topView}> 
          <Text style={styles.headTitle}> Daily </Text>
        </View>

        <View style={styles.middleView}> 
          <Text style={styles.title}>Are you sure you want to begin the adventure?</Text>
          <Button title="Yes, Begin!" onPress={handleNextScreen}/>
        </View>


        <View style={styles.bottomView}> 
          
          <TouchableOpacity style={[styles.slotOne, {top: 190,right: 125}]} onPress={() => handleMenu('Armor')}> 
            <Image source={require('../../../assets/avatars/placeholder.png')}
            style={styles.previewImageOne}/>
            <Text style={[styles.itemTitle, {fontWeight: 'bold'}]}> Armor </Text>
            <Text style={styles.itemTitle}> {mainArmor?.name || 'None equipped'} </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.slotOne, {bottom: 0}]} onPress={() => {handleMenu('sword')}}> 
            <Image source={require('../../../assets/avatars/placeholder.png')}
            style={styles.previewImageOne}/>
            <Text style={[styles.itemTitle, {fontWeight: 'bold'}]}> Weapon </Text>
            <Text style={styles.itemTitle}> {mainWeapon?.name || 'None equipped'} </Text>
            <Text style={[styles.itemTitle, {color: 'darkgreen'}]}> {'+ ' + mainWeapon?.damage || 'None equipped'} </Text>

          </TouchableOpacity>


          <TouchableOpacity style={[styles.slotOne, {bottom: 190, left: 122}]} onPress={() => handleMenu('Potion')}> 
            <Image source={require('../../../assets/avatars/placeholder.png')}
            style={styles.previewImageOne}/>
            <Text style={[styles.itemTitle, {fontWeight: 'bold'}]}> Potion </Text>
            <Text style={styles.itemTitle}>{mainPotion?.name || 'None equipped'}</Text>
            

          </TouchableOpacity>

        </View>
      
      </View>
    );
  };

  const styles = StyleSheet.create({
    
    itemBox: {
      borderColor: '#ccc',
      borderWidth: 10,
      backgroundColor: 'white',
      marginHorizontal: 10,
      marginVertical: 8,
      height: 70,
      width: 70,
    },
    quickMenu: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      backgroundColor: 'lightgreen',
      
      height: 500,
      width: 390,
      right: 19,
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
      backgroundColor: 'lightblue',
    },

    headTitle: {
      fontSize: 50,
    },

    middleView: {
      padding: 16,
      alignItems: 'center',
      margin: 60,
    },

    bottomView: {
      justifyContent: 'center',
      alignItems: 'center',
      height: 100,
      width: 390,
      flex: 1,
      backgroundColor: 'lightblue',
    },

    slotOne: {
      backgroundColor: 'white',
      height: 190,
      width: 110,
      borderColor: 'black',
      borderWidth: 5,
      borderRadius: 10,
      alignItems: 'center',
     
    },

    itemTitle: {
      bottom: 20,
      fontSize: 20,
    },

    previewImageOne: {
      width: 55,
      height: 55,
      top: 5,
      marginBottom: 30,
    },

    title: { 
      fontSize: 20, 
      marginBottom: 20,
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
      maxHeight: '25%',
    },

    previewText: {
      width: 20,
      height: 20,
    
    },
    menu: {
      
      maxHeight: '70%',
      backgroundColor: 'white',
      padding: 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: 75,
    },

  });

  
  
  export default ConfirmationScreen;