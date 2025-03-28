import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

function getRandomDelay() {
  return Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
}

const AdventureScreen = () => {
  const [isAdventureStarted, setIsAdventureStarted] = useState(false);

  const [loot, setLoot] = useState(0);
  const [enemies, setEnemies] = useState(0);
  const [boss, setBoss] = useState(0);
  const [encounters, setEncounters] = useState(0);

  const [displayText, setDisplayText] = useState('');

  const [adventureProgress, setAdventureProgress] = useState(0);

  const startAdventure = () => {
    setIsAdventureStarted(true);

    const lootVal = Math.floor(Math.random() * 11);
    const enemiesVal = Math.floor(Math.random() * 6) + 5;
    const bossVal = 1;
    const encountersVal = Math.floor(Math.random() * 6) + 10;

    setLoot(lootVal);
    setEnemies(enemiesVal);
    setBoss(bossVal);
    setEncounters(encountersVal);

    setAdventureProgress(0);
    setDisplayText('Beginning the adventure...');
  };

  useEffect(() => {
    let timerId;

    let currentEncounter = 0;

    if (isAdventureStarted) {
      function doEncounter() {
        if (currentEncounter >= encounters) {
          setDisplayText('Adventure complete!');
          setAdventureProgress(100);
          return;
        }

        if (enemies > 0 && Math.random() < 0.7) {
          setDisplayText('The player is fighting a monster!');
          setEnemies((prev) => prev - 1);
        } else if (enemies > 0 && loot > 0 && Math.random() < 0.3) {
          setDisplayText('The player has found loot!');
          setLoot((prev) => prev - 1);
        } else if (enemies === 0) {
          setDisplayText('The player is fighting a boss!');
        } else {
          setDisplayText('Nothing happens this time...');
        }
        currentEncounter++;
        const newProgress = Math.floor(
          (currentEncounter / encounters) * 100
        );
        setAdventureProgress(newProgress);
        scheduleNextEncounter();
      }
      function scheduleNextEncounter() {
        const delay = getRandomDelay(); 
        timerId = setTimeout(doEncounter, delay);
      }
      scheduleNextEncounter();
    }
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [isAdventureStarted, encounters, enemies, loot, boss]);

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
          {/* Display text from the random encounter logic */}
          <Text style={styles.statusText}>{displayText}</Text>

          {/* Progress Bar */}
          <Text style={styles.progressLabel}>Adventure Progress</Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${adventureProgress}%` },
              ]}
            />
            <Text style={styles.progressText}>
              {adventureProgress}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default AdventureScreen;

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
  statusText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
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
