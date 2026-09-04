import { db } from './firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

export async function seedInitialData() {
  const batch = writeBatch(db);
  // Example seed data
  const unitsRef = collection(db, 'units');
  // Add some initial units if necessary
  console.log('Seeding initial data...');
  await batch.commit();
}
