import { inject, Injectable, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import {
  addDoc,
  collection,
  CollectionReference,
  collectionData,
  deleteDoc,
  doc,
  DocumentData,
  Firestore,
  orderBy,
  query,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { Fusion } from '@core/models';

/** Nombre de la colección en Firestore. */
const FUSIONS_COLLECTION = 'fusions';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private readonly firestore = inject(Firestore);
  private readonly injector = inject(EnvironmentInjector);
  
  /**
   * Referencia a la colección. 
   * Se inicializa una vez para ser reutilizada en los métodos.
   */
  private readonly fusionsRef: CollectionReference<DocumentData>;

  constructor() {
    this.fusionsRef = collection(this.firestore, FUSIONS_COLLECTION);
  }

  // ─── Read ────────────────────────────────────────────────────────────────────

  /**
   * Devuelve un Observable con las fusiones en tiempo real.
   */
  getFavorites(): Observable<Fusion[]> {
      return runInInjectionContext(this.injector, () => {
        const fusionsRef = collection(this.firestore, FUSIONS_COLLECTION);
        const q = query(fusionsRef, orderBy('createdAt', 'desc'));
        return collectionData(q, { idField: 'id' }) as Observable<Fusion[]>;
      });
    }

  // ─── Write ───────────────────────────────────────────────────────────────────

  /**
   * Guarda una fusión en Firestore asegurando el contexto de inyección.
   */
  async saveFusion(fusion: Omit<Fusion, 'id'>): Promise<void> {
    try {
      const payload = {
        name:       fusion.name,
        types:      fusion.types,
        stats:      fusion.stats,
        moves:      fusion.moves,
        parents:    fusion.parents,
        spriteUrls: fusion.spriteUrls,
        createdAt:  serverTimestamp(),
      };

      // Agregamos un log para ver qué estamos enviando exactamente
      console.log('Payload a enviar:', payload);

      const docRef = await addDoc(this.fusionsRef, payload);
      console.log('Documento guardado con ID:', docRef.id);
      
    } catch (error: any) {
      console.error('Error detallado en FirestoreService:', error);
      // Forzamos el lanzamiento del error para que el componente lo capture
      throw new Error(error.message || 'Error desconocido en Firestore');
    }
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  /**
   * Elimina una fusión asegurando que la referencia al documento 
   * se cree dentro del contexto de Angular.
   */
  async deleteFavorite(id: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const docRef = doc(this.firestore, `${FUSIONS_COLLECTION}/${id}`);
      await deleteDoc(docRef);
    });
  }
}