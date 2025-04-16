import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Pressable, BackHandler } from 'react-native';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const AdventureScreen = () => {
  const [isAdventureStarted, setIsAdventureStarted] = useState(false);
  const [adventureProgress, setAdventureProgress] = useState(0);

  const startAdventure = () => {
    setIsAdventureStarted(true);
    
  };

  return (
    <View style={styles.container}>
      {!isAdventureStarted ? (
        <View style={styles.startContainer}>
          <Text style={styles.title}>Ready for Adventure?</Text>
          <TouchableOpacity style={styles.button} onPress={startAdventure}>
            <Text style={styles.buttonText}>Start Adventure</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.adventureContainer}>

          
          <View style={styles.headingContainer}>  
            <Text style={styles.progressLabel}>Adventure Progress</Text>
              <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${adventureProgress}%` }
                ]}
              />
              <Text style={styles.progressText}>{adventureProgress}%</Text>
            </View>
            <Text style={styles.adventureCounter}> Days left</Text>
          </View>
      
          

          <View style={styles.towerContainer}> 
            <ScrollView style={styles.towerView}> 
            {Array.from({ length: 20 }).map((_, index) => (
                <Text key={index} style={{ padding: 30 }}>Floor {index + 1}</Text>
            

                ))}

            </ScrollView>
          </View> 

          <View style={styles.adventureNavContainer}>  </View>


                
       
        </View>   
      )}
    </View>
    
  );
};

const styles = StyleSheet.create({

  adventureContainer: {
    top: 10,
    flex: 1,
    justifyContent: 'top',
    alignItems: 'center',
    backgroundColor: 'white',
  },

  headingContainer:{
    backgroundColor: '#434',
    alignItems: 'center',
    justifyContent: 'center',
    width: 400,
    height: 130,
  },

  towerContainer:{ //2
   
    alignItems: 'center',
    top: 30,
    backgroundColor: 'grey',
    width: 400,
    height: 450,
  },  

  towerView: { //2.1
    backgroundColor: 'lightblue',
    height: 1110,
    width: 400,
    flex: 0.5,
    position: 'center',  
  },


  adventureNavContainer: {

  },

 
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  progressLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 0,
    color: 'white',
    bottom: 20,
  },
  progressBarContainer: {
    bottom: 20,
    width: '80%',
    height: 20,
    backgroundColor: 'lightgray',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 8,
    ackgroundColor: '#44434',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'green',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#FFF',
  },

  adventureCounter:{
    color: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#EEE',
  },
  buttonText: {
    fontSize: 18,
    color: '#000',
  },
});

export default AdventureScreen;