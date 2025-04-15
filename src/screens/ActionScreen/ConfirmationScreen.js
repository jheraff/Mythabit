import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const ConfirmationScreen = ({ navigation, extraData }) => {
    return (
      <View style={styles.container}>

        <View style={styles.topView}> 
          <Text style={styles.title}> Daily </Text>
        </View>

        <View style={styles.middleView}> 
          <Text style={styles.title}>Are you sure you want to begin the adventure?</Text>
          <Button title="Yes, Begin!" onPress={() => navigation.navigate('Tower')} />
        </View>


        <View style={styles.bottomView}> 

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

    title: {
      fontSize: 200,
    },

    middleView: {
      position: 'absolute',
      bottom: 260,
      left: 0,
      right: 0,
      padding: 16,
      alignItems: 'center',
    },

    bottomView: {
      position: 'absolute',
      bottom: 20,
      alignItems: 'center',
      height: 200,
      width: 400,
      backgroundColor: 'lightblue',
    },

    title: { 
      
      fontSize: 20, 
      marginBottom: 20,
    },

  });
  
  
  export default ConfirmationScreen;