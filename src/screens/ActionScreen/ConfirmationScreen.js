import React from 'react';
import { View, Text, Button, StyleSheet, Image } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

const ConfirmationScreen = ({ navigation, extraData }) => {
    return (
      <View style={styles.container}>

        <View style={styles.topView}> 
          <Text style={styles.headTitle}> Daily </Text>
        </View>

        <View style={styles.middleView}> 
          <Text style={styles.title}>Are you sure you want to begin the adventure?</Text>
          <Button title="Yes, Begin!" onPress={() => navigation.navigate('Adventure')} />
        </View>


        <View style={styles.bottomView}> 
          <TouchableOpacity style={styles.equipIcon}>
            <Image source={require('../../../assets/avatars/placeholder.png')}
             style={styles.previewImage}/>
          </TouchableOpacity>
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
      alignItems: 'center',
      height: 100,
      width: 400,
      backgroundColor: 'lightblue',
      flex: 1,
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