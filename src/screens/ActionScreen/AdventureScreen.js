import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
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
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adventureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  progressBarContainer: {
    width: '80%',
    height: 20,
    backgroundColor: 'lightgray',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 10,
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
