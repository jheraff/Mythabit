import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore'; 

// Delays between 2s and 5s
function getRandomDelay() {
  return Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
}

export default function AdventureScreen() {
  // -----------------------
  // Player States
  // -----------------------
  const [playerStats, setPlayerStats] = useState({
    agility: 0,
    arcane: 0,
    focus: 0,
    intellect: 0,
    strength: 0,
  });
  const [playerLevel, setPlayerLevel] = useState(1);

  // The player’s health for the entire adventure
  const [playerHealth, setPlayerHealth] = useState(5);

  // -----------------------
  // Adventure States
  // -----------------------
  const [isAdventureStarted, setIsAdventureStarted] = useState(false);
  // This tracks whether the adventure is in progress, won, or lost
  const [adventureResult, setAdventureResult] = useState('none'); 
  const [loot, setLoot] = useState(0);
  const [enemies, setEnemies] = useState(0);
  const [boss, setBoss] = useState(0);
  const [encounters, setEncounters] = useState(0);
  const [adventureProgress, setAdventureProgress] = useState(0);
  const [displayText, setDisplayText] = useState('');

  // Track how many encounters have happened so far
  const encounterRef = useRef(0);
  // Track our timer so we can cancel it on unmount or when adventure ends
  const timerIdRef = useRef(null);

  const playerLootRef = useRef(0); // Tracks total loot collected

  // -----------------------
  // Load Player Stats
  // -----------------------
  async function loadPlayerStats() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const stats = userData.stats || {};
        const level = userData.level || 1;
        setPlayerStats({
          agility: stats.agility || 0,
          arcane: stats.arcane || 0,
          focus: stats.focus || 0,
          intellect: stats.intellect || 0,
          strength: stats.strength || 0,
        });
        setPlayerLevel(level);
        // Initialize the player’s health based on the level
        setPlayerHealth(level * 5);
      }
    } catch (error) {
      console.error('Error loading player stats/level:', error);
    }
  }

  // -----------------------
  // Get a Random Monster from a Category
  // -----------------------
  async function getRandomMonsterFromCategory(categoryName) {
    try {
      const docSnap = await getDoc(doc(db, 'monsters', categoryName));
      if (docSnap.exists()) {
        const monsters = docSnap.data(); // e.g. { goblin: {...}, spider: {...} }
        const names = Object.keys(monsters);
        const randomName = names[Math.floor(Math.random() * names.length)];
        return { name: randomName, ...monsters[randomName] };
      }
    } catch (e) {
      console.error('Failed to load monster:', e);
    }
    return null;
  }
  async function giveLoot(playerLootCount) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
  
      // FIXED: Get document instead of collection
      const dungeonLootDoc = await getDoc(doc(db, 'items', 'dungeonloot'));
      if (!dungeonLootDoc.exists()) {
        console.error('No dungeonloot document found.');
        return;
      }
  
      const lootData = dungeonLootDoc.data(); // this will be { dagger: {...}, ... }
      const lootItems = Object.keys(lootData).map((key) => ({
        id: key,
        ...lootData[key],
      }));
  
      if (lootItems.length === 0) {
        console.error('No loot items found in dungeonloot.');
        return;
      }
  
      const rewards = [];
      for (let i = 0; i < playerLootCount; i++) {
        const randomItem = lootItems[Math.floor(Math.random() * lootItems.length)];
        rewards.push(randomItem);
      }
  
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        console.error('User not found');
        return;
      }
  
      const userData = userDocSnap.data();
      const currentInventory = userData.inventory || [];
  
      await updateDoc(userDocRef, {
        inventory: [...currentInventory, ...rewards],
      });
  
      const itemCounts = {};
      for (const item of rewards) {
        const key = item.name;
        if (!itemCounts[key]) {
          itemCounts[key] = { count: 0, rarity: item.rarity };
        }
        itemCounts[key].count += 1;
      }

      const rewardSummary = Object.entries(itemCounts)
        .map(([name, data]) => {
          return `• ${data.count}x ${name}`;
        })
        .join('\n');

      alert(`You have received:\n${rewardSummary}`);

      
    } catch (error) {
      console.error('Error giving loot:', error);
    }
  }
  
  
  

  // -----------------------
  // Combat Logic
  // -----------------------
  function simulateCombat(stats, currentHP, monster) {
    // Basic example: 
    //   playerAttack = STR + AGI
    //   playerDefense = FOCUS + INT
    const playerAttack = stats.strength + stats.agility;
    const playerDefense = stats.focus + stats.intellect;

    const monsterAttack = monster.attack;
    const monsterDefense = monster.defense;
    const monsterHealth = monster.health;

    let playerCurrentHP = currentHP;
    let monsterCurrentHP = monsterHealth;

    while (playerCurrentHP > 0 && monsterCurrentHP > 0) {
      // Player hits monster
      const damageToMonster = Math.max(0, playerAttack - monsterDefense);
      monsterCurrentHP -= damageToMonster;
      if (monsterCurrentHP <= 0) break;

      // Monster hits back
      const damageToPlayer = Math.max(0, monsterAttack - playerDefense);
      playerCurrentHP -= damageToPlayer;
    }

    return {
      playerWins: playerCurrentHP > 0,
      remainingHP: Math.max(playerCurrentHP, 0),
    };
  }

  useEffect(() => {
    if (adventureResult === 'won') {
      if (playerLootRef.current > 0) {
        giveLoot(playerLootRef.current);
        playerLootRef.current = 0;
      }
    }
  }, [adventureResult]);

  // -----------------------
  // Start Adventure
  // -----------------------
  async function startAdventure() {
    // Load latest player data
    await loadPlayerStats();
    
    setIsAdventureStarted(true);
    setAdventureProgress(0);
    setDisplayText('Beginning the adventure...');
    setAdventureResult('in-progress');

    // Random starting values
    setLoot(Math.floor(Math.random() * 5));        // 0-5
    setEnemies(Math.floor(Math.random() * 6) + 5);  // 5-10
    setBoss(1);
    setEncounters(Math.floor(Math.random() * 6) + 10); // 10-15

    // Reset encounter count
    encounterRef.current = 0;
  }

  // -----------------------
  // Encounter Loop
  // -----------------------
  useEffect(() => {
    if (!isAdventureStarted) {
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      return;
    }

    // We define our async encounter function
    async function doEncounter() {
      // If we've reached total encounters or we already have a result (lost/won), wrap up
      if (encounterRef.current >= encounters) {
        // End the adventure: consider it a win if the player is alive

        setDisplayText('Adventure complete! You have won!');
        setAdventureProgress(100);
        setAdventureResult('won');
        // Force leftover enemies, loot, and boss to zero
        setEnemies(0);
        setLoot(0);
        setBoss(0);
        setIsAdventureStarted(false);
        return;
      }

      // 70% chance to fight a monster if enemies > 0
      if (enemies > 0 && Math.random() < 0.7) {
        const monster = await getRandomMonsterFromCategory('Squishy');
        if (monster) {
          setDisplayText(`Your avatar is fighting a ${monster.name}!`);

          // Use current states for combat
          const result = simulateCombat(playerStats, playerHealth, monster);

          // If the player loses, end the adventure
          if (!result.playerWins) {
            setDisplayText(`You were defeated by the ${monster.name}! You lost.`);
            setAdventureResult('lost');
            // Force leftover enemies, loot, and boss to zero
            setEnemies(0);
            setLoot(0);
            setBoss(0);
            setIsAdventureStarted(false);
            return;
          } else {
            // Player wins => update HP, decrement enemies
            // Use Math.min to be absolutely sure the HP never goes up
            setPlayerHealth((prev) => Math.min(prev, result.remainingHP));
            setEnemies((prev) => {
              const newVal = prev - 1;
              return newVal < 0 ? 0 : newVal; // clamp to 0
            });
          }
        } else {
          // If no monster found in that category
          setDisplayText('No monster found, your avatar wanders...');
        }
      }
      // 30% chance to find loot, if loot > 0
      else if (enemies > 0 && loot > 0 && Math.random() < 0.3) {
        setDisplayText('Your avatar has found loot!');
        playerLootRef.current += 1;
        setLoot((prev) => {
          const newVal = prev - 1;
          return newVal < 0 ? 0 : newVal; // clamp to 0
        });
      }
      // If enemies = 0 but a boss remains, fight the boss
      else if (enemies === 0 && boss > 0) {
        setDisplayText('Your avatar is fighting the boss!');
        //temp boss function
        const bossMonster = { name: 'BigBoss', attack: 10, defense: 6, health: 15 };
        const result = simulateCombat(playerStats, playerHealth, bossMonster);

        if (!result.playerWins) {
          setDisplayText('The boss defeated you! You lost.');
          setAdventureResult('lost');
          setEnemies(0);
          setLoot(0);
          setBoss(0);
          setIsAdventureStarted(false);
          playerLootRef.current = 0;
          return;
        } else {
          setPlayerHealth(() => result.remainingHP);
          setBoss((prev) => {
            const newVal = prev - 1;
            return newVal < 0 ? 0 : newVal;
          });
        }
      }
      // Otherwise, just exploring
      else {
        setDisplayText('Your avatar is exploring...');
      }

      // Increment encounters
      encounterRef.current += 1;
      setAdventureProgress((prev) =>
        Math.max(prev, Math.floor((encounterRef.current / encounters) * 100))
      );      

      // If we used up all enemies, loot, and boss, we might as well end right away
      if (enemies === 0 && loot === 0 && boss === 0) {
        setDisplayText('You have cleared everything! Adventure complete. You won!');
        setAdventureProgress(100);
        setAdventureResult('won');
        setIsAdventureStarted(false);
        return;
      }

      scheduleNextEncounter();
    }

    function scheduleNextEncounter() {
      const delay = getRandomDelay(); // 2-5 seconds
      timerIdRef.current = setTimeout(doEncounter, delay);
    }

    // Begin the first encounter
    scheduleNextEncounter();

    return () => {
      // Cleanup: stop the timer if the component unmounts or if the user cancels
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
        timerIdRef.current = null;
      }
    };
  }, [isAdventureStarted, enemies, loot, boss, playerHealth, encounters]);

  // -----------------------
  // Render
  // -----------------------
  return (
    <View style={styles.container}>
      {/* If the adventure hasn’t started, or we have a result other than in-progress */}
      {!isAdventureStarted && adventureResult !== 'in-progress' ? (
        <View style={styles.startContainer}>
          {adventureResult === 'lost' && (
            <Text style={styles.resultText}>
              You lost the adventure! Better luck next time.
            </Text>
          )}
          {adventureResult === 'won' && (
            <Text style={styles.resultText}>
              Congratulations! You won the adventure!
            </Text>
          )}
          {adventureResult === 'none' && (
            <Text style={styles.title}>Ready for Adventure?</Text>
          )}

          <TouchableOpacity style={styles.button} onPress={startAdventure}>
            <Text style={styles.buttonText}>Start Adventure</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.adventureContainer}>
          <Text style={styles.statusText}>{displayText}</Text>

          <Text style={styles.progressLabel}>Adventure Progress</Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${adventureProgress}%` },
              ]}
            />
            <Text style={styles.progressText}>{adventureProgress}%</Text>
          </View>

          {/* Display current player health, enemy count, etc. */}
          <Text style={styles.infoText}>
            Health: {playerHealth}{' '}
            | Enemies: {enemies}{' '}
            | Loot: {loot}{' '}
            | Bosses: {boss}
          </Text>
        </View>
      )}
    </View>
  );
}

// -----------------------
// Styles
// -----------------------
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
  infoText: {
    fontSize: 16,
    marginTop: 20,
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'red',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
