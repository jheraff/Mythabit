import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const TowerScreen = ({ navigation }) => {
  const [floorSelected, setFloorSelected] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const scrollViewRef = useRef();

  const handlePress = (index) => {
    setSelectedIndex(index);
    setFloorSelected(true);
  };

  useEffect(() => {
    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topView}>
        <Text style={styles.titleText}>Daily Tower</Text>
      </View>

      <View style={styles.towerContainer}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollViewContent}
        >
          {Array.from({ length: 20 }).map((_, index) => {
            const floorNum = 20 - index;
            return (
              <TouchableOpacity
                key={floorNum}
                onPress={() => handlePress(floorNum - 1)}
                style={[
                  styles.floorButton,
                  selectedIndex === floorNum - 1 && styles.floorButtonSelected,
                ]}
              >
                <Text style={styles.floorText}>Floor {floorNum}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.bottomView}>
        <Text style={styles.promptText}>Choose a floor</Text>
        <TouchableOpacity
          style={[
            styles.darkFantasyButton,
            !floorSelected && styles.disabledButton,
          ]}
          onPress={() => navigation.navigate('Confirmation', { selectedIndex })}
          disabled={!floorSelected}
        >
          <Text style={styles.darkFantasyButtonText}>Proceed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.darkFantasyButton, { marginTop: 10 }]}
          onPress={() => navigation.navigate('Action', { screen: 'ActionMain' })}
        >
          <Text style={styles.darkFantasyButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  topView: {
    width: '100%',
    padding: 20,
    backgroundColor: '#222',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#444',
  },
  titleText: {
    fontSize: 36,
    color: '#e0d8c3',
    fontFamily: 'serif',
  },
  towerContainer: {
    flex: 1,
    width: '90%',
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#444',
    borderRadius: 10,
    marginVertical: 20,
    paddingVertical: 10,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  floorButton: {
    backgroundColor: '#3a3a3a',
    borderColor: '#888',
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 6,
    padding: 12,
    alignItems: 'center',
  },
  floorButtonSelected: {
    backgroundColor: '#d4af37',
    borderColor: '#fff',
  },
  floorText: {
    fontSize: 18,
    color: '#e0d8c3',
    fontFamily: 'serif',
  },
  bottomView: {
    width: '100%',
    padding: 16,
    backgroundColor: '#222',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#444',
  },
  promptText: {
    color: '#e0d8c3',
    fontSize: 16,
    fontFamily: 'serif',
    marginBottom: 10,
  },
  darkFantasyButton: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#888',
  },
  darkFantasyButtonText: {
    color: '#e0d8c3',
    fontSize: 16,
    fontFamily: 'serif',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.4,
  },
});

export default TowerScreen;
