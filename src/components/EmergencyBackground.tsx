import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { AppSettings } from '../types';

interface EmergencyBackgroundProps {
  opacity?: number;
}

export default function EmergencyBackground({ opacity }: EmergencyBackgroundProps) {
  return null;
}
// synchronized
