import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

function getRandomDelay() {
  return Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
}

export default function AdventureScreen({ route }) {
  const { selectedIndex } = route.params || {};
  console.log('Selected index:', selectedIndex);
  const [playerStats, setPlayerStats] = useState({ agility: 0, arcane: 0, focus: 0, intellect: 0, strength: 0 });
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerHealth, setPlayerHealth] = useState(5);
  const [isAdventureStarted, setIsAdventureStarted] = useState(false);
  const [adventureResult, setAdventureResult] = useState('none');
  const [loot, setLoot] = useState(0);
  const [enemies, setEnemies] = useState(0);
  const [boss, setBoss] = useState(0);
  const [encounters, setEncounters] = useState(0);
  const [adventureProgress, setAdventureProgress] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [battleLog, setBattleLog] = useState([]);
  const [currentMonsterHP, setCurrentMonsterHP] = useState(0);
  const [currentMonsterMaxHP, setCurrentMonsterMaxHP] = useState(0);
  
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const [logColorTarget, setLogColorTarget] = useState('#555');
  const scrollViewRef = useRef(null);
  const [floorData, setFloorData] = useState(null);

  const monsterWeaknesses = {
    squishy: 'strength',
    range: 'focus',
    medium: 'intellect',
    tank: 'arcane',
  };
  
  const interpolatedBorderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#555', logColorTarget],
  });

  const encounterRef = useRef(0);
  const timerIdRef = useRef(null);
  const playerLootRef = useRef(0);
  const encounterListRef = useRef([]);
  const playerHealthRef = useRef(5);


  const attackPulseAnim = useRef(new Animated.Value(0)).current;
const hitFlashAnim = useRef(new Animated.Value(0)).current;
const lowHealthShake = useRef(new Animated.Value(0)).current;
const victoryGlowAnim = useRef(new Animated.Value(0)).current;

async function loadFloorData(index) {
  const floorDocName = `floor${index + 1}`;
  const docRef = doc(db, 'dungeonfloors', floorDocName);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    console.log('Floor data:', data);
    return data;
  } else {
    console.warn('No such floor!');
    return null;
  }
}



function flashAttackEffect() {
  attackPulseAnim.setValue(0);
  Animated.timing(attackPulseAnim, {
    toValue: 1,
    duration: 200,
    useNativeDriver: false,
  }).start(() => attackPulseAnim.setValue(0));
}

function flashHitEffect() {
  hitFlashAnim.setValue(0);
  Animated.sequence([
    Animated.timing(hitFlashAnim, { toValue: 1, duration: 150, useNativeDriver: false }),
    Animated.timing(hitFlashAnim, { toValue: 0, duration: 150, useNativeDriver: false }),
  ]).start();
}

function pulseVictoryEffect() {
  Animated.sequence([
    Animated.timing(victoryGlowAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
    Animated.timing(victoryGlowAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
  ]).start();
}

function shakeIfLowHealth(hp) {
  if (hp <= 5) {
    Animated.sequence([
      Animated.timing(lowHealthShake, { toValue: 1, duration: 100, useNativeDriver: false }),
      Animated.timing(lowHealthShake, { toValue: 0, duration: 100, useNativeDriver: false }),
    ]).start();
  }
}

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  async function loadPlayerStats() {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      const stats = data.stats || {};
      const level = data.level || 1;
      setPlayerStats(stats);
      setPlayerLevel(level);
      setPlayerHealth(level * 5);
      playerHealthRef.current = level * 5; 
    }
  }

  async function getRandomMonsterFromCategory(categoryName) {
    const docSnap = await getDoc(doc(db, 'monsters', categoryName));
    if (docSnap.exists()) {
      const monsters = docSnap.data();
      const names = Object.keys(monsters);
      const randomName = names[Math.floor(Math.random() * names.length)];
      return {
        name: randomName,
        class: categoryName.toLowerCase(), // Infer class from document name
        ...monsters[randomName],
      };
    }
    return null;
  }  

  async function getRandomBoss() {
    const docSnap = await getDoc(doc(db, 'monsters', 'Boss'));
    if (docSnap.exists()) {
      const bosses = docSnap.data();
      const names = Object.keys(bosses);
      const randomName = names[Math.floor(Math.random() * names.length)];
      return { name: randomName, ...bosses[randomName] };
    }
    return null;
  }

  async function giveLoot(playerLootCount) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId || !floorData) return;
  
      const dungeonLootDoc = await getDoc(doc(db, 'items', 'dungeonloot'));
      if (!dungeonLootDoc.exists()) return;
  
      const lootData = dungeonLootDoc.data();
      const lootdrops = floorData.lootdrops;
  
      // Helper function to pick rarity based on percentage
      function getRandomRarity(rarityMap) {
        const entries = Object.entries(rarityMap);
        const total = entries.reduce((sum, [, percent]) => sum + percent, 0);
        const roll = Math.random() * total;
        let cumulative = 0;
  
        for (const [rarity, percent] of entries) {
          cumulative += percent;
          if (roll <= cumulative) return rarity;
        }
        return 'Common'; // fallback
      }
  
      const rewards = [];
      for (let i = 0; i < playerLootCount; i++) {
        const chosenRarity = getRandomRarity(lootdrops);
        const filteredItems = Object.entries(lootData)
          .filter(([_, item]) => item.rarity === chosenRarity)
          .map(([id, item]) => ({ id, ...item }));
  
        if (filteredItems.length > 0) {
          const randomItem = filteredItems[Math.floor(Math.random() * filteredItems.length)];
          rewards.push(randomItem);
        }
      }
  
      // Add rewards to player inventory
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) return;
      const userData = userDocSnap.data();
      const currentInventory = userData.inventory || [];
  
      await updateDoc(userDocRef, {
        inventory: [...currentInventory, ...rewards],
      });
  
      // Summary
      const itemCounts = {};
      for (const item of rewards) {
        const key = item.name;
        if (!itemCounts[key]) {
          itemCounts[key] = { count: 0, rarity: item.rarity };
        }
        itemCounts[key].count += 1;
      }
  
      const rewardSummary = Object.entries(itemCounts)
        .map(([name, data]) => `• ${data.count}x ${name} (${data.rarity})`)
        .join('\n');
  
      alert(`You have received:\n${rewardSummary}`);
    } catch (error) {
      console.error('Error giving loot:', error);
    }
  }
  

  function getRandomMonsterClass(spawnRates) {
    const total = Object.values(spawnRates).reduce((a, b) => a + b, 0);
    const roll = Math.random() * total;
    let cumulative = 0;
    
    for (const [type, percent] of Object.entries(spawnRates)) {
      cumulative += percent;
      if (roll <= cumulative) return type;
    }
    return 'squishy'; // fallback
  }
  
  async function simulateCombat(monster) {
    return new Promise(async (resolve) => {
      let playerHP = playerHealthRef.current;
      let monsterHP = monster.health;
  
      setCurrentMonsterHP(monster.health);
      setCurrentMonsterMaxHP(monster.health);
  
      const playerAttackBase = playerStats.strength + playerStats.agility;
      const playerDefense = playerStats.focus + playerStats.intellect;
  
      const monsterEvasion = monster.evasion || 0;
      const monsterClass = monster.class?.toLowerCase() || 'unknown';
      const weaknessStat = monsterWeaknesses[monsterClass];
      const weaknessBonus = weaknessStat ? (playerStats[weaknessStat] || 0) * 0.2 : 0;
  
      const playerEvasionChance = Math.min(70, (playerStats.agility / 100) * 70);
  
      while (playerHP > 0 && monsterHP > 0) {
        await new Promise((r) => setTimeout(r, 700));
  
        // --- Monster tries to evade player attack
        if (Math.random() * 100 < monsterEvasion) {
          setBattleLog((prev) => [...prev, `${monster.name} evaded your attack!`]);
        } else {
          const monsterDefenseFactor = monster.defense / (monster.defense + 50);
          const damageToMonster = Math.max(
            1,
            Math.round((playerAttackBase + weaknessBonus) * (1 - monsterDefenseFactor))
          );
          monsterHP -= damageToMonster;
          setCurrentMonsterHP(Math.max(0, monsterHP));
          flashAttackEffect();
          setBattleLog((prev) => [...prev, `You hit ${monster.name} for ${damageToMonster} damage!`]);
        }
  
        if (monsterHP <= 0) break;
  
        await new Promise((r) => setTimeout(r, 700));
  
        // --- Player tries to evade monster attack
        if (Math.random() * 100 < playerEvasionChance) {
          setBattleLog((prev) => [...prev, `You evaded ${monster.name}'s attack!`]);
        } else {
          const playerDefenseFactor = playerDefense / (playerDefense + 50);
          const damageToPlayer = Math.max(
            1,
            Math.round(monster.attack * (1 - playerDefenseFactor))
          );
          playerHP -= damageToPlayer;
          flashHitEffect();
          shakeIfLowHealth(playerHP);
          setBattleLog((prev) => [...prev, `${monster.name} hits you for ${damageToPlayer} damage!`]);
        }
      }
  
      resolve({
        playerWins: playerHP > 0,
        remainingHP: Math.max(0, playerHP),
      });
    });
  }
  


  function animateLogBorder(color) {
    setLogColorTarget(color);
    borderColorAnim.setValue(0);
    Animated.timing(borderColorAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }

  function getRandomInRangeFromMax(max) {
    const min = Math.floor(max * 0.4);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async function startAdventure() {
    await loadPlayerStats();
    setAdventureResult('in-progress');
    setAdventureProgress(0);
    setDisplayText('Adventure begins...');
    setBattleLog([]);
    animateLogBorder('#555');
    const fetchedFloorData = await loadFloorData(selectedIndex);
    if (!fetchedFloorData) return;
    setFloorData(fetchedFloorData);
    
    const numMonsters = getRandomInRangeFromMax(fetchedFloorData.maxEnemies);
    const numLoot = getRandomInRangeFromMax(fetchedFloorData.maxLoot);
    const numExploring =  getRandomInRangeFromMax(fetchedFloorData.maxExploring);
    const numBoss = fetchedFloorData.maxBoss || 1;
    const totalEncounters = numMonsters + numLoot + numExploring + numBoss;

    const encounterQueue = [];
    for (let i = 0; i < numMonsters; i++) encounterQueue.push('monster');
    for (let i = 0; i < numLoot; i++) encounterQueue.push('loot');
    for (let i = 0; i < numExploring; i++) encounterQueue.push('explore');
    shuffleArray(encounterQueue);
    encounterQueue.push('boss');

    encounterRef.current = 0;
    encounterListRef.current = encounterQueue;
    setLoot(numLoot);
    setEnemies(numMonsters);
    setBoss(numBoss);
    setEncounters(totalEncounters);

    setTimeout(() => {
      setIsAdventureStarted(true);
    }, 100);
  }

  useEffect(() => {
    if (!isAdventureStarted || !floorData) return;

  async function doEncounter() {
      const type = encounterListRef.current?.[encounterRef.current];
      if (!type) return;

      setBattleLog([]);

      if (type === 'monster') {
        const classType = getRandomMonsterClass(floorData.enemyspawn); 
        const monster = await getRandomMonsterFromCategory(classType.charAt(0).toUpperCase() + classType.slice(1));
        if (monster) {
          setDisplayText(`Encounter: ${monster.name}`);
          animateLogBorder('#8b0000');
          const result = await simulateCombat(monster, playerHealth);


          if (!result.playerWins) {
            setBattleLog((prev) => [...prev, `You were defeated by ${monster.name}...`]);
            setDisplayText(`You were defeated by ${monster.name}...`);
            await new Promise((r) => setTimeout(r, 1500));
            setAdventureResult('lost');
            setIsAdventureStarted(false);
            return;
          }

          await new Promise((r) => setTimeout(r, 500));
          setBattleLog((prev) => [...prev, `You defeated the ${monster.name}!`]);
          await new Promise((r) => setTimeout(r, 1000));
          setPlayerHealth(result.remainingHP);
          playerHealthRef.current = result.remainingHP;
          setEnemies((e) => Math.max(0, e - 1));
        }
      } else if (type === 'loot') {
        const dungeonLootDoc = await getDoc(doc(db, 'items', 'dungeonloot'));
        if (dungeonLootDoc.exists()) {
          const lootData = dungeonLootDoc.data();
          const lootItems = Object.keys(lootData).map((key) => ({ id: key, ...lootData[key] }));
          if (lootItems.length > 0) {
            const randomItem = lootItems[Math.floor(Math.random() * lootItems.length)];
            setDisplayText(`Found loot: ${randomItem.name}`);
            setBattleLog((prev) => [...prev, `You found ${randomItem.name}`]);
            animateLogBorder('#d4af37');
          }
        }
        playerLootRef.current++;
        setLoot((l) => Math.max(0, l - 1));
      } else if (type === 'explore') {
        setDisplayText('Exploring...');
        animateLogBorder('#228b22');
      } else if (type === 'boss') {
        const bossMonster = await getRandomBoss();
        if (bossMonster) {
          setDisplayText(`Boss Encounter: ${bossMonster.name}`);
          animateLogBorder('#800080');
          const result = await simulateCombat(bossMonster, playerHealth);

          setPlayerHealth(result.remainingHP);
          playerHealthRef.current = result.remainingHP;




          if (!result.playerWins) {
            setBattleLog((prev) => [...prev, `You were slain by the boss ${bossMonster.name}...`]);
            setDisplayText(`You were slain by the boss ${bossMonster.name}...`);
            await new Promise((r) => setTimeout(r, 1500));
            setAdventureResult('lost');
            setIsAdventureStarted(false);
            return;
          }
          await new Promise((r) => setTimeout(r, 500));
          setBattleLog((prev) => [...prev, `You defeated the boss ${bossMonster.name}!`]);
          await new Promise((r) => setTimeout(r, 1500));
          setPlayerHealth(result.remainingHP);
          playerHealthRef.current = result.remainingHP;

          setBoss((b) => Math.max(0, b - 1));
        }
      }

      encounterRef.current++;
      const progress = Math.min(100, Math.floor((encounterRef.current / encounters) * 100));
      setAdventureProgress(progress);

      if (encounterRef.current >= encounters) {
        if (playerLootRef.current > 0) {
          await giveLoot(playerLootRef.current);
          playerLootRef.current = 0;
        }
        setAdventureResult('won');
        setDisplayText('Adventure complete!');
        setIsAdventureStarted(false);
        return;
      }

      timerIdRef.current = setTimeout(doEncounter, getRandomDelay());
    }

    timerIdRef.current = setTimeout(doEncounter, getRandomDelay());

    return () => {
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
    };
  }, [isAdventureStarted, floorData]);

  return (
    <View style={styles.container}>
      {!isAdventureStarted && adventureResult !== 'in-progress' ? (
        <View style={styles.startContainer}>
          <Text style={styles.title}>Adventure</Text>
          {adventureResult === 'won' && <Text style={styles.resultText}>You won!</Text>}
          {adventureResult === 'lost' && <Text style={styles.resultText}>You lost!</Text>}
          <TouchableOpacity style={styles.button} onPress={startAdventure}>
            <Text style={styles.buttonText}>Start Adventure</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.adventureContainer}>
          <View style={styles.contentWrapper}>
            <Text style={styles.statusText}>{displayText}</Text>
            <Text style={styles.progressLabel}>Progress</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${adventureProgress}%` }]} />
              <Text style={styles.progressText}>{adventureProgress}%</Text>
            </View>
            <Text style={styles.infoText}>Health: {playerHealth} | Enemies: {enemies} | Loot: {loot} | Boss: {boss}</Text>
          </View>
  
          <Animated.View
            style={[
              styles.logBox,
              {
                borderColor: interpolatedBorderColor,
                backgroundColor: hitFlashAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#222', '#661111'],
                }),
                shadowColor: '#d4af37',
                shadowOpacity: victoryGlowAnim,
                shadowRadius: victoryGlowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 12],
                }),
                transform: [
                  {
                    scale: attackPulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05],
                    }),
                  },
                  {
                    translateX: lowHealthShake.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 4],
                    }),
                  },
                ],
              },
            ]}
          >
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={{ paddingBottom: 10 }}
              showsVerticalScrollIndicator={true}
              onContentSizeChange={() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }}
            >
              {battleLog.map((entry, index) => (
                <Text key={index} style={styles.logEntry}>{entry}</Text>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      )}
    </View>
  );
  
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', padding: 16 },
  startContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  adventureContainer: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 30 },
  contentWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, color: '#e0d8c3', fontFamily: 'serif' },
  button: { padding: 12, backgroundColor: '#333', borderRadius: 8, borderColor: '#888', borderWidth: 1 },
  buttonText: { fontSize: 18, color: '#e0d8c3', fontFamily: 'serif' },
  statusText: { fontSize: 18, marginVertical: 10, textAlign: 'center', color: '#e0d8c3', fontFamily: 'serif' },
  progressLabel: { fontSize: 16, fontWeight: 'bold', marginTop: 10, color: '#e0d8c3', fontFamily: 'serif' },
  progressBarContainer: {
    width: '80%', height: 20, backgroundColor: '#333', borderRadius: 10, overflow: 'hidden', marginVertical: 10,
  },
  progressBar: { height: '100%', backgroundColor: '#8b0000' },
  progressText: { position: 'absolute', width: '100%', textAlign: 'center', color: '#fff', fontWeight: 'bold', fontFamily: 'serif' },
  infoText: { fontSize: 14, marginTop: 5, color: '#c2baa6', fontFamily: 'serif' },
  resultText: { fontSize: 20, color: '#cc4444', marginBottom: 10, fontFamily: 'serif' },
  logBox: {
    flex: 1,
    minHeight: 120,
    maxHeight: '40%',
    width: '100%',
    borderWidth: 2,
    padding: 10,
    backgroundColor: '#222',
  },
  logEntry: { fontSize: 14, marginBottom: 4, color: '#c7c2b6', fontFamily: 'serif' },
});
