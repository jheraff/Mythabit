import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

const TowerScreen = ({ navigation, extraData }) => {


    const [floorSelected, setFloorSelected] = useState(false);
    const handlePress = (index) => {
      console.log('Pressed index:', index);
      // You can navigate or set state based on the index here
    };

    return (
      <View style={styles.container}>

        <Text style={{color: 'black', fontSize: 50}}>Daily Tower</Text>

        <View style={styles.towerContainer}> 
          <ScrollView style={styles.towerView}> 
            {Array.from({ length: 20 }).map((_, index) => (
              <TouchableOpacity key={index} 
                style={styles.floorLayout} 
                onPress={() => {
                  setFloorSelected(true);
                  handlePress(index + 1);
                }}> 

                <Text style={{ color: 'black', fontSize: 18 }}>Floor {index + 1}</Text>          
              </TouchableOpacity>

              
              ))}
          </ScrollView>
        </View> 
        
          

        <View style={styles.bottomView}>
          <Text>Choose a floor</Text>
          <Button 
            title="Proceed" 
            onPress={() => navigation.navigate('Confirmation')} 
            disabled ={!floorSelected}
          />    
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
      top: 10,
      backgroundColor: 'black',
      width: 300,
      height: 500,
      
    },  

    towerView: { //2.1
      backgroundColor: 'lightblue',
      height: 200,
      width: 200,
      flex: 0.5,
      position: 'center',  
    
    },

    floorLayout: {
      //padding: 30,
      //position: 'center',
      
      backgroundColor: 'white',
      margin: 10,
      padding: 10,
      borderRadius: 8,
      alignItems: 'center'
      
    },

    bottomView: {
      marginTop: 20,
    },

    title: { 
      fontSize: 20, 
      marginBottom: 20,
    },

  });
  


  export default TowerScreen;