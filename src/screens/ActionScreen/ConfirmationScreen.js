import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Pressable, Image, Modal} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

const ConfirmationScreen = ({ navigation, route, extraData }) => {
    const [visible, setVisible] = useState(false);
    const { selectedFloor } = route.params || {};
  


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
          transparent={false}
          visible={visible}
          onRequestClose={() => setVisible(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
            <Pressable style={styles.menu} onPress={() => {}}>
              <Text>Slide-up Menu</Text>

              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={{color: 'blue', fontSize: 50,}}>Close</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>

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
            <TouchableOpacity style={styles.equipIcon} onPressOut={() => handleMenu('sword')}>
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
      maxHeight: '50%',
    },

    previewText: {
      width: 20,
      height: 20,
    
    },
    menu: {
      
      maxHeight: '50%',
      backgroundColor: 'white',
      padding: 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },

  });

  
  
  export default ConfirmationScreen;