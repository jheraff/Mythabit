import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Pressable, Image, Modal} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { doc, updateDoc,getDoc, getDocs, query, collection} from 'firebase/firestore';
import { db } from '../../firebase/config';

const ConfirmationScreen = ({ navigation, route, extraData }) => {
    const [visible, setVisible] = useState(false);
    const { selectedFloor } = route.params || {};
    const numberArray = [1, 2, 3, 4, 5, 6,7,8,9];
    const [mainWeapon, setMainWeapon] = useState(null);
    const [mainArmor, setMainAmor] = useState(null);
    const [mainPotion, setMainPotion] = useState(null);
 

    const fetchEquipped = async () => {
      try {
        const slots = ['weaponSlot','potionSlot','armorSlot']
        const promises = slots.map(slot => getDoc(doc(db,'equippedItems',slot)))
        const docs = await Promise.all(promises);

        
        const equippedItems = docs.map((docSnap, index) => {
          if (docSnap.exists()) {
            if (docSnap.id === 'weaponSlot') {
              setMainWeapon(docSnap.data());
              console.log(mainWeapon);
            } else if (docSnap.id === 'armorSlot') {
              setMainAmor(docSnap.data());
              console.log(mainArmor);
            }  else if (docSnap.id === 'potionSlot') {
              setMainPotion(docSnap.data());
              console.log(mainPotion);
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

    const handleNextScreen = () => {
      setVisible;
      console.log('next: ');
      navigation.navigate('Tower', { selectedFloor, extraData });
    };

    const handleMenu = (value) => {
      console.log(value);
      setVisible(true);

    };
    
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
              {numberArray.map((num, index) => (
                <View key={index} style={styles.itemBox}>
                  <Text> {index + 1} </Text>
                </View>
              ))}

            </View>

            <View style ={[styles.itemBox ,{bottom: 130, backgroundColor:'lightgrey'}]}>
              <Text> {mainWeapon.name}</Text>
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
          
          <View style={[styles.slotOne, {bottom: -40}]}> 
            <TouchableOpacity style={styles.equipIcon} onPressOut={() => {handleMenu('sword'); fetchEquipped()}}>
              <Image source={require('../../../assets/avatars/placeholder.png')}
              style={styles.previewImageOne}/>
            </TouchableOpacity>
            <Text style={styles.itemTitle}> Sword </Text>
          </View>

          <View style={[styles.slotOne, {top: 60, right: 90}]}> 
            <TouchableOpacity style={styles.equipIcon} onPressOut={() => handleMenu('Armor')}>
              <Image source={require('../../../assets/avatars/placeholder.png')}
              style={styles.previewImageOne}/>
            </TouchableOpacity>
            <Text style={styles.itemTitle}> Armor </Text>
          </View>

          <View style={[styles.slotOne, {bottom: 60, left: 90}]}> 
            <TouchableOpacity style={styles.equipIcon} onPress={() => handleMenu('Potion')}>
              <Image source={require('../../../assets/avatars/placeholder.png')}
              style={styles.previewImageOne}/>
            </TouchableOpacity>
            <Text style={styles.itemTitle}> Potion </Text>
          </View>

        

      
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
      height: 120,
      width: 120,
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
      width: 70,
      height: 70,
      top: 5,
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