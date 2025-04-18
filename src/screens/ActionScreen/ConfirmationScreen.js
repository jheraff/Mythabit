import React from 'react';
import { View, Text, Button, StyleSheet, Image } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

const ConfirmationScreen = ({ navigation, route, extraData }) => {
    const { selectedFloor } = route.params || {};

    const handleNextScreen = () => {
      console.log('next: ');
      navigation.navigate('Tower', { selectedFloor, extraData });
    };

    return (
      <View style={styles.container}>

        <View style={styles.topView}> 
          <Text style={styles.headTitle}> Daily </Text>
        </View>

        <View style={styles.middleView}> 
          <Text style={styles.title}>Are you sure you want to begin the adventure?</Text>
          <Button title="Yes, Begin!" onPress={handleNextScreen}/>
        </View>


        <View style={styles.bottomView}> 
          <View style={[styles.slotOne, {bottom: 10}]}> 
            <TouchableOpacity style={styles.equipIcon}>
              <Image source={require('../../../assets/avatars/placeholder.png')}
              style={styles.previewImageOne}/>
            </TouchableOpacity>
          </View>

          <View style={[styles.slotOne, {right: 100}]}> 
            <TouchableOpacity style={styles.equipIcon}>
              <Image source={require('../../../assets/avatars/placeholder.png')}
              style={styles.previewImageOne}/>
            </TouchableOpacity>
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
      width: 400,
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
     
    },

    previewImageOne: {
      width: 70,
      height: 70,
      left: 5,
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

    previewText: {
      width: 20,
      height: 20,
    
    },

  });

  
  
  export default ConfirmationScreen;