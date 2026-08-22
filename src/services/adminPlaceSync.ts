import { doc, setDoc } from 'firebase/firestore';
import { Place } from '../types';
import { getFirebaseDb } from './firebase';

/**
 * Persists an approved place directly to the primary Firestore places collection.
 * The approval API still maintains the local JSON audit/source for compatibility,
 * while this write makes Firestore immediately consistent with the Admin action.
 */
export async function syncApprovedPlaceToFirestore(place: Place): Promise<Place> {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const placeId = Number(place.id);
  if (!Number.isFinite(placeId) || placeId <= 0) {
    throw new Error('Approved place has an invalid id.');
  }

  const normalizedPlace = {
    ...place,
    id: placeId,
  } as Place;

  await setDoc(doc(db, 'places', String(placeId)), normalizedPlace);
  return normalizedPlace;
}
