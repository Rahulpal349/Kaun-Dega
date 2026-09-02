'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, signOut } from './firebase';
import { toStandardUuid } from './uidHelper';
import { supabase } from '../archive/deprecated-utils/supabaseClient';

const AuthContext = createContext({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const dbId = toStandardUuid(firebaseUser.uid);
        const enrichedUser = {
          ...firebaseUser,
          dbId,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        };
        setUser(enrichedUser);

        // Sync profile to database
        try {
          await supabase.from('profiles').upsert(
            {
              id: dbId,
              name: enrichedUser.name,
              email: firebaseUser.email || '',
            },
            { onConflict: 'id' }
          );
        } catch (err) {
          console.warn('Profile sync notice:', err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
