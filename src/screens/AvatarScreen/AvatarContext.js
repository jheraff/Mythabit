import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

const AvatarContext = createContext();

export const AvatarProvider = ({ children }) => {
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAvatarData = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists() && userSnap.data().avatar) {
        setAvatar(userSnap.data().avatar);
      } else {
        console.log('No avatar data found for user:', userId);
        setAvatar(null);
      }
    } catch (err) {
      console.error('Error loading avatar data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        
        const unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
          if (doc.exists() && doc.data().avatar) {
            setAvatar(doc.data().avatar);
          } else {
            setAvatar(null);
          }
          setLoading(false);
        }, (err) => {
          console.error('Error in avatar snapshot listener:', err);
          setError(err.message);
          setLoading(false);
        });
        
        return () => unsubscribeSnapshot();
      } else {
        setAvatar(null);
        setLoading(false);
      }
    });
    
    return () => unsubscribeAuth();
  }, []);

  const refreshAvatar = async () => {
    if (auth.currentUser) {
      await loadAvatarData(auth.currentUser.uid);
    }
  };

  const value = {
    avatar,
    loading,
    error,
    refreshAvatar,
  };

  return (
    <AvatarContext.Provider value={value}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  
  if (context === undefined) {
    throw new Error('useAvatar must be used within an AvatarProvider');
  }
  
  return context;
};

export default AvatarContext;