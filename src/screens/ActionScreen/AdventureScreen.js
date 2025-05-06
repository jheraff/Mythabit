import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useNavigation } from '@react-navigation/native';

function getRandomDelay() {
  return Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
}


export default function AdventureScreen({ route }) {
  const navigation = useNavigation();
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
  const [isLoadingScreen, setIsLoadingScreen] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const adventureStartedRef = useRef(false);
  const animatedPlayerHealth = useRef(new Animated.Value(1)).current;
  const animatedMonsterHealth = useRef(new Animated.Value(1)).current;
  const playerHPAnim = useRef(new Animated.Value(1)).current;
  const enemyHPAnim = useRef(new Animated.Value(1)).current;
  const [currentMonsterName, setCurrentMonsterName] = useState('Enemy');
  const [isBossFight, setIsBossFight] = useState(false);


  
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const [logColorTarget, setLogColorTarget] = useState('#555');
  const scrollViewRef = useRef(null);
  const [floorData, setFloorData] = useState(null);

  const simulateLoadingScreen = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setLoadingProgress(progress);
  
        // ✅ Run once only
        if (!adventureStartedRef.current) {
          adventureStartedRef.current = true;
          setTimeout(() => {
            setIsLoadingScreen(false);
            setLoadingProgress(0);
            startAdventure();
          }, 300);
        }
      } else {
        setLoadingProgress(progress);
      }
    }, 150);
  };
  
  
  
  
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
  const playerLootRef = useRef({ items: [], count: 0 });

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

function animateHealthBar(animatedValue, percent) {
  Animated.timing(animatedValue, {
    toValue: percent,
    duration: 300,
    useNativeDriver: false,
  }).start();
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

  function getRandomRarity(rarityMap) {
    const entries = Object.entries(rarityMap).filter(([, percent]) => percent > 0);
    const total = entries.reduce((sum, [, percent]) => sum + percent, 0);
    const roll = Math.random() * total;
    let cumulative = 0;
  
    for (const [rarity, percent] of entries) {
      cumulative += percent;
      if (roll <= cumulative) return rarity;
    }
    return 'Common'; // fallback
  }
  
  async function getRandomLootItemByRarity(rarity) {
    const dungeonLootDoc = await getDoc(doc(db, 'items', 'dungeonloot'));
    if (!dungeonLootDoc.exists()) return null;
  
    const lootData = dungeonLootDoc.data();
    const filteredItems = Object.entries(lootData)
      .filter(([_, item]) => item.rarity === rarity)
      .map(([id, item]) => ({ id, ...item }));
  
    if (filteredItems.length === 0) return null;
    return filteredItems[Math.floor(Math.random() * filteredItems.length)];
  }
  

  async function giveLoot() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
  
      // Ensure playerLootRef.current.items is a valid array
      if (!Array.isArray(playerLootRef.current.items)) {
        console.error('playerLootRef.current.items is not an array:', playerLootRef.current.items);
        return;
      }
  
      const rewards = playerLootRef.current.items;
      if (rewards.length === 0) return;
  
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) return;
  
      const userData = userDocSnap.data();
      const currentInventory = Array.isArray(userData.inventory) ? userData.inventory : [];
  
      // Update inventory
      await updateDoc(userDocRef, {
        inventory: [...currentInventory, ...rewards],
      });
  
      // Build reward summary
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
  
      // Reset loot tracking
      playerLootRef.current.items = [];
      playerLootRef.current.count = 0;
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
  
      // Set enemy status
      setCurrentMonsterName(monster.name);
      setIsBossFight(monster.class?.toLowerCase() === 'boss');
      setCurrentMonsterHP(monster.health);
      setCurrentMonsterMaxHP(monster.health);
      enemyHPAnim.setValue(1);
      playerHPAnim.setValue(playerHP / (playerLevel * 5));
  
      const playerAttackBase = playerStats.strength + playerStats.agility;
      const playerDefense = playerStats.focus + playerStats.intellect;
      const monsterEvasion = monster.evasion || 0;
      const monsterClass = monster.class?.toLowerCase() || 'unknown';
      const weaknessStat = monsterWeaknesses[monsterClass];
      const weaknessBonus = weaknessStat ? (playerStats[weaknessStat] || 0) * 0.2 : 0;
      const playerEvasionChance = Math.min(70, (playerStats.agility / 100) * 70);
  
      while (playerHP > 0 && monsterHP > 0) {
        await new Promise((r) => setTimeout(r, 700));
  
        // Player attacks
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
          Animated.timing(enemyHPAnim, {
            toValue: Math.max(monsterHP / monster.health, 0),
            duration: 300,
            useNativeDriver: false,
          }).start();
          flashAttackEffect();
          setBattleLog((prev) => [...prev, `You hit ${monster.name} for ${damageToMonster} damage!`]);
        }
  
        if (monsterHP <= 0) break;
  
        await new Promise((r) => setTimeout(r, 700));
  
        // Monster attacks
        if (Math.random() * 100 < playerEvasionChance) {
          setBattleLog((prev) => [...prev, `You evaded ${monster.name}'s attack!`]);
        } else {
          const playerDefenseFactor = playerDefense / (playerDefense + 50);
          const damageToPlayer = Math.max(
            1,
            Math.round(monster.attack * (1 - playerDefenseFactor))
          );
          playerHP -= damageToPlayer;
          setPlayerHealth(Math.max(0, playerHP));
          Animated.timing(playerHPAnim, {
            toValue: Math.max(playerHP / (playerLevel * 5), 0),
            duration: 300,
            useNativeDriver: false,
          }).start();
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
    setIsLoadingScreen(true);
    setLoadingProgress(0);
  
    await loadPlayerStats();
    setLoadingProgress(20);
  
    const fetchedFloorData = await loadFloorData(selectedIndex);
    if (!fetchedFloorData) return;
    setFloorData(fetchedFloorData);
    setLoadingProgress(50);
  
    const numMonsters = getRandomInRangeFromMax(fetchedFloorData.maxEnemies);
    const numLoot = getRandomInRangeFromMax(fetchedFloorData.maxLoot);
    const numExploring = getRandomInRangeFromMax(fetchedFloorData.maxExploring);
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
    setLoadingProgress(100);
  
    setTimeout(() => {
      setIsLoadingScreen(false);
      setIsAdventureStarted(true);
      setAdventureResult('in-progress');
      setAdventureProgress(0);
      setDisplayText('Adventure begins...');
      setBattleLog([]);
      animateLogBorder('#555');
    }, 500);
  }
  
  //startAdventure();
  useEffect(() => {
     simulateLoadingScreen(); // begin the loading bar
    if (!isAdventureStarted || !floorData) return;

  async function doEncounter() {
    console.log(`Encounters: ${encounters}, Enemies: ${enemies}, Loot: ${loot}, Boss: ${boss}`);
      const type = encounterListRef.current?.[encounterRef.current];
      if (type === 'loot' || type === 'explore') {
        setCurrentMonsterName('Enemy');
        setCurrentMonsterMaxHP(0);
        setCurrentMonsterHP(0);
        setIsBossFight(false);
      }

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
        if (!floorData || !floorData.lootdrops) return;
      
        const chosenRarity = getRandomRarity(floorData.lootdrops);
        const lootItem = await getRandomLootItemByRarity(chosenRarity);
      
        if (lootItem) {
          setDisplayText(`Found loot: ${lootItem.name}`);
          setBattleLog((prev) => [...prev, `You found ${lootItem.name}`]);
          animateLogBorder('#d4af37');
      
          if (!playerLootRef.current.items) {
            playerLootRef.current.items = [];
          }
          playerLootRef.current.items.push(lootItem);
          playerLootRef.current.count++;
        }          
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
      const total = encounterListRef.current.length || 1;
      const progress = Math.floor((encounterRef.current / total) * 100);
      setAdventureProgress(progress);

      if (encounterRef.current >= total) {

        let rewardSummary = '';
      
        if (playerLootRef.current.items.length > 0) {
          await giveLoot(); 
          const itemCounts = {};
          for (const item of playerLootRef.current.items) {
            const key = item.name;
            if (!itemCounts[key]) {
              itemCounts[key] = { count: 0, rarity: item.rarity };
            }
            itemCounts[key].count += 1;
          }
      
          rewardSummary = Object.entries(itemCounts)
          .map(([name, data]) => `• ${data.count}x ${name} (${data.rarity})`)
          .join('\n');
      
        await giveLoot(); 
      }
      
        setAdventureResult('won');
        setDisplayText('Adventure complete!');
        setIsAdventureStarted(false);
      
        if (rewardSummary) {
          setTimeout(() => {
            alert(`Adventure complete!\nYou have received:\n${rewardSummary}`);
          }, 500);
        }
      
        return;
      }
      
      

      timerIdRef.current = setTimeout(doEncounter, getRandomDelay());
    }

    timerIdRef.current = setTimeout(doEncounter, getRandomDelay());

    return () => {
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
    };
  }, [isLoadingScreen, isAdventureStarted, floorData]);
  return (
    <View style={styles.container}>
      {isLoadingScreen ? (
        // 1. Loading Screen
        <View style={styles.startContainer}>
          <Text style={styles.title}>Loading Adventure...</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${loadingProgress}%` }]} />
            <Text style={styles.progressText}>{loadingProgress}%</Text>
          </View>
        </View>
      ) : adventureResult === 'won' || adventureResult === 'lost' ? (
        // 2. Result Screen
        <View style={styles.startContainer}>
          <Text style={styles.title}>
            {adventureResult === 'won' ? 'You won!' : 'You lost!'}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Action', {
              screen: 'ActionMain'
            })}
          >
            <Text style={styles.buttonText}>Return</Text>
          </TouchableOpacity>

        </View>
      ) : (
        // 3. Adventure In-Progress
        <View style={styles.adventureContainer}>
          <View style={styles.contentWrapper}>
            <Text style={styles.statusText}>{displayText}</Text>
            <Text style={styles.progressLabel}>Progress</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${adventureProgress}%` }]} />
              <Text style={styles.progressText}>{adventureProgress}%</Text>
            </View>

</View>

<View style={styles.healthBarsRow}>
  {/* Player Health */}
  <View style={styles.healthBarBlock}>
    <Text style={styles.healthBarLabel}>
      Avatar HP: {playerHealth} / {playerLevel * 5}
    </Text>
    <View style={styles.hpBar}>
      <Animated.View
        style={[
          styles.hpBarFillEnemy,
          {
            backgroundColor: '#8b0000',
            width: playerHPAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  </View>

  {/* Enemy Health */}
  <View style={styles.enemyHealthBar}>
    <Text style={styles.hpLabel}>
      {currentMonsterName}: {currentMonsterHP} /{' '}
      {currentMonsterMaxHP > 0 ? currentMonsterMaxHP : '???'}
    </Text>
    <View style={styles.hpBar}>
      <Animated.View
        style={[
          styles.hpBarFillEnemy,
          {
            backgroundColor: isBossFight ? '#800080' : '#8b0000',
            width: enemyHPAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  </View>
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
  healthBarContainer: {
    width: '80%',
    backgroundColor: '#555',
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: 16,
    backgroundColor: '#8b0000',
  },
  healthBarText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
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
  fixedHealthBars: {
    position: 'absolute',
    width: '100%',
    top: '38%', // adjust based on layout
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  
  playerHealthWrapper: {
    width: '45%',
    backgroundColor: '#555',
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  
  enemyHealthWrapper: {
    width: '45%',
    backgroundColor: '#555',
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'flex-end',
  },
  
  healthBarText: {
    fontSize: 12,
    color: '#c2baa6',
    textAlign: 'center',
    marginTop: 2,
  },  

  fixedHealthBars: {
    position: 'absolute',
    top: 150, // adjust if needed
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  healthBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  
  healthBarBlock: {
    flex: 1,
    marginHorizontal: 10,
  },
  
  healthBarLabel: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 2,
    textAlign: 'left',
    fontFamily: 'serif',
  },
  
  healthBarFill: {
    height: 8,
    backgroundColor: '#8b0000',
    borderRadius: 4,
  },
  
  enemyHealthBar: {
    flex: 1,
    marginHorizontal: 10,
  },
  
  hpLabel: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 2,
    textAlign: 'right',
    fontFamily: 'serif',
  },
  
  hpBar: {
    height: 8,
    backgroundColor: '#444',
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  hpBarFillEnemy: {
    height: 8,
    borderRadius: 4,
  },  
  
  logEntry: { fontSize: 14, marginBottom: 4, color: '#c7c2b6', fontFamily: 'serif' },
});
