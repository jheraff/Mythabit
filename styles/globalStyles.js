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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  headerContainer: {
    backgroundColor: '#1c2d63',
    paddingVertical: 15,
    borderBottomWidth: 4,
    borderBottomColor: '#afe8ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  profileButton: {
    padding: 5,
    marginRight: 10,
    backgroundColor: '#152551',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#afe8ff',
  },
  username: {
    fontSize: 18,
    //fontWeight: 'bold',
    fontFamily: 'black-cherry',
    color: '#ffffff',
    flex: 1,
  },
  username_2:{
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c2d63',
  },

  //style for levels
  levelContainer: {
    backgroundColor: '#152551',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#afe8ff',
  },
  levelText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },

  //style for currency
  currencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#152551',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#afe8ff',
  },
  currencyIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#afe8ff', 
  },

  //style for experience
  xpContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 5,
  },
  xpText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    padding: 2,
    zIndex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  xpBarContainer: {
    height: 20,
    backgroundColor: '#152551',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#afe8ff',
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#4287f5',
    position: 'absolute',
    left: 0,
    top: 0,
  },

  //style for avatar
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8, 
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1c2d63',
  },

  //style for stats
  statsContainer: {
    padding: 20,
  },

  //style for inventory
  inventoryContainer: {
    padding: 20,
    paddingTop: 0,
  },
});