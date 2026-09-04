import { useEffect, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserRole } from '../types';

export function useAuthRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (user) {
        const path = `users/${user.uid}`;
        try {
          // Explicitly bootstrap the admin in the database if they are the special user
          if (user.email === 'sndjy1986@gmail.com') {
            try {
              const { setDoc } = await import('firebase/firestore');
              await setDoc(doc(db, 'users', user.uid), { 
                uid: user.uid,
                email: user.email,
                role: 'admin' 
              }, { merge: true });
              setRole('admin');
              setLoading(false);
              return;
            } catch (bootstrapErr) {
              console.warn("Bootstrap write failed", bootstrapErr);
              // Fall through to regular check
            }
          }

          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role as UserRole);
          } else {
            setRole('viewer');
          }
        } catch (error) {
          console.warn("Could not fetch user role", error);
          setRole('viewer');
          handleFirestoreError(error, OperationType.GET, path);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { 
    role, 
    loading, 
    isAdmin: role === 'admin', 
    isEditor: role === 'admin' || role === 'editor' 
  };
}
