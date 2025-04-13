import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const ConfirmationScreen = ({ navigation, extraData }) => {
    return (
      <View style={styles.container}>

        <Text style={styles.title}>Are you sure you want to begin the adventure?</Text>
        <Button title="Yes, Begin!" onPress={() => navigation.navigate('Tower')} />
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      alignItems: 'center',
    },

    towerView: {

    },
    
    bottomView: {
      justifyContent: 'bottom',
    },

    title: { 
      fontSize: 20, 
      marginBottom: 20,
    },

  });
  
  
  export default ConfirmationScreen;