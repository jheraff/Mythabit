import { StyleSheet, Platform } from 'react-native';

export const globalStyles = StyleSheet.create({
  pixelTitle: {
    fontSize: 40,
    color: '#a855f7', // Purple base
    textShadowColor: '#f97316', // Orange 3D glow
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 2,
    fontFamily: 'pixel-regular',
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: 30,
    fontSize: 16,
    color: '#ccc',
    fontStyle: 'pixel-regular',
  },
});