import React from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';

const TowerScreen = ({ navigation, extraData }) => {
    return (
      <View style={styles.container}>

        <View style={styles.towerContainer}> 
          <ScrollView style={styles.towerView}> 
            {Array.from({ length: 20 }).map((_, index) => (
              <Text key={index} style={styles.floorLayout}>Floor {index + 1} </Text>))}
          </ScrollView>
        </View> 
        

        <View style={styles.bottomView}>
          <Text>Choose a floor</Text>
          <Button title="Proceed" onPress={() => navigation.navigate('Confirmation')} />    
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({


    container: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
    },

    towerContainer:{ //2
   
      alignItems: 'center',
      top: 30,
      backgroundColor: 'grey',
      width: 100,
      height: 400,
    },  

    towerView: { //2.1
      backgroundColor: 'lightblue',
      height: 200,
      width: 200,
      flex: 0.5,
      position: 'center',  
    },

    floorLayout: {
      padding: 30,
      position: 'center',
    },

    bottomView: {
      bottom: '200',
    },

    title: { 
      fontSize: 20, 
      marginBottom: 20,
    },

  });
  


  export default TowerScreen;