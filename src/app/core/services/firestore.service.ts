import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
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

  /**
   * Referencia reactiva a la colección de fusiones.
   * Lazy: se crea solo cuando se llama por primera vez.
   */
  private get fusionsRef() {
    return collection(this.firestore, FUSIONS_COLLECTION);
  }

  // ─── Read ────────────────────────────────────────────────────────────────────

  /**
   * Devuelve un Observable que emite el array de fusiones guardadas
   * cada vez que cambia la colección en Firestore (tiempo real).
   * Ordenadas de más reciente a más antigua.
   */
  getFavorites(): Observable<Fusion[]> {
    const q = query(this.fusionsRef, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Fusion[]>;
  }

  // ─── Write ───────────────────────────────────────────────────────────────────

  /**
   * Guarda una fusión en Firestore.
   * Reemplaza createdAt con serverTimestamp() para consistencia entre clientes.
   * El id lo asigna Firestore automáticamente.
   *
   * @param fusion - Fusión a guardar (sin id)
   * @returns Promise que resuelve cuando Firestore confirma el write
   */
  async saveFusion(fusion: Omit<Fusion, 'id'>): Promise<void> {
    const payload = {
      name:       fusion.name,
      types:      fusion.types,
      stats:      fusion.stats,
      moves:      fusion.moves,
      parents:    fusion.parents,
      spriteUrls: fusion.spriteUrls,
      createdAt:  serverTimestamp(),   // timestamp del servidor, no del cliente
    };

    await addDoc(this.fusionsRef, payload);
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  /**
   * Elimina una fusión por su id de documento.
   *
   * @param id - id del documento en Firestore
   * @returns Promise que resuelve cuando Firestore confirma el delete
   */
  async deleteFavorite(id: string): Promise<void> {
    const docRef = doc(this.firestore, FUSIONS_COLLECTION, id);
    await deleteDoc(docRef);
  }
}