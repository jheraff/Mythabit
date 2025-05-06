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

  // style for background
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },

  //color for top header
  headerContainer: {
    backgroundColor: 'rgb(34, 119, 45)', //rgb(29, 92, 37)
    paddingVertical: 15,
    borderBottomWidth: 4,
    borderBottomColor: '#8fcb9b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 5,
  },

  //style for profile butto
  profileButton: {
    padding: 5,
    marginRight: 10,
    backgroundColor: '#14451c',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#8fcb9b',
  },
  username: {
    fontSize: 23,
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
  profileSection: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#36454F',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
},

  //style for levels
  levelContainer: {
    backgroundColor: '#14451c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#8fcb9b',
  },
  levelText: {
    fontSize: 17,
    fontFamily: 'morris-roman',
    color: '#ffffff',
    //fontWeight: '700',
  },

  //style for currency
  currencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14451c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#8fcb9b',
  },
  currencyIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  currencyText: {
    fontSize: 17,
    fontFamily: 'morris-roman',
    //fontWeight: 'bold',
    color: '#ffffff', 
  },

  //style for experience
  xpContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 5,
  },
  xpText: {
    fontSize: 11,
    color: '#a8a29e',
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
    backgroundColor: '#a8a29e',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#93c5fd',
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#1e3a8a',
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
  stats: {
    padding: 20,
  },

  //style for stats under profiles
  statsContainer: {
    padding: 15,
    backgroundColor: '#E5C9A3', //bold beige
    borderRadius: 12,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statItemBox: {
    width: 55,
    height: 55,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: '#D3D3D3',
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
},

  //style for achievements

  //style for achievements under profile
  achievementsContainer: {
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#E5C9A3',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  noAchievementsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D3D3D3',
    borderRadius: 8,
    marginBottom: 10,
},

  //style for inventory
  inventoryContainer: {
    padding: 20,
    paddingTop: 0,
  },

  //style for buttons
  backButton: {
    padding: 5,
    marginRight: 10,
    backgroundColor: '#14451c',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#8fcb9b',
  },
});