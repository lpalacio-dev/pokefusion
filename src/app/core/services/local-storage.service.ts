import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

import { Fusion } from '@core/models';

const STORAGE_KEY = 'pokefusion_favorites';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private readonly favorites$ = new BehaviorSubject<Fusion[]>(this.load());

  // ─── Read ─────────────────────────────────────────────────────────────────

  getFavorites(): Observable<Fusion[]> {
    return this.favorites$.asObservable();
  }

  // ─── Write ────────────────────────────────────────────────────────────────

  async saveFusion(fusion: Omit<Fusion, 'id'>): Promise<void> {
    const current = this.load();
    const newFusion: Fusion = {
      ...fusion,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    // Más reciente primero
    const updated = [newFusion, ...current];
    this.persist(updated);
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async deleteFavorite(id: string): Promise<void> {
    const updated = this.load().filter((f) => f.id !== id);
    this.persist(updated);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private load(): Fusion[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Fusion[]) : [];
    } catch {
      return [];
    }
  }

  private persist(fusions: Fusion[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fusions));
    this.favorites$.next(fusions);
  }
}