import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { Fusion } from '@core/models';
import { LocalStorageService } from '@core/services';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorBannerComponent } from '@shared/components/error-banner/error-banner.component';
import { FusionCardComponent } from '../fusion/components/fusion-card/fusion-card.component';

type LoadingState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ErrorBannerComponent,
    FusionCardComponent,
  ],
  template: `
    <div class="flex flex-col gap-8 max-w-4xl mx-auto">

      <!-- Header -->
      <header class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-4xl font-extrabold text-primary">★ Favoritos</h1>
          <p class="text-base-content/60 text-sm mt-1">
            Tus fusiones guardadas
          </p>
        </div>

        @if (favorites().length > 0) {
          <span class="badge badge-primary badge-lg font-semibold">
            {{ favorites().length }}
            {{ favorites().length === 1 ? 'fusión' : 'fusiones' }}
          </span>
        }
      </header>

      <!-- Estado: loading -->
      @if (loadingState() === 'loading') {
        <app-loading-spinner message="Cargando tus fusiones..." />
      }

      <!-- Estado: error -->
      @if (loadingState() === 'error') {
        <app-error-banner
          [message]="errorMessage()"
          (retry)="loadFavorites()"
        />
      }

      <!-- Estado: success vacío -->
      @if (loadingState() === 'success' && favorites().length === 0) {
        <app-empty-state
          icon="★"
          title="Aún no tienes favoritos"
          description="Crea una fusión y guárdala para verla aquí"
          actionLabel="Ir a fusionar"
          (action)="goToFusion()"
        />
      }

      <!-- Estado: success con datos -->
      @if (loadingState() === 'success' && favorites().length > 0) {
        <section
          aria-label="Lista de fusiones favoritas"
          class="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          @for (fusion of favorites(); track fusion.id) {
            <app-fusion-card
              [fusion]="fusion"
              [showDelete]="true"
              (delete)="confirmDelete(fusion)"
            />
          }
        </section>
      }

    </div>

    <!-- Modal de confirmación de eliminación -->
    @if (pendingDelete() !== null) {
      <div
        class="modal modal-open"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <div class="modal-box">

          <h3 id="modal-title" class="font-bold text-lg text-error">
            ¿Eliminar fusión?
          </h3>

          <p id="modal-description" class="py-4 text-base-content/70 text-sm">
            Estás a punto de eliminar
            <span class="font-bold text-base-content">
              "{{ pendingDelete()?.name }}"
            </span>.
            Esta acción no se puede deshacer.
          </p>

          <div class="modal-action gap-2">
            <button
              class="btn btn-ghost"
              (click)="cancelDelete()"
              [disabled]="isDeleting()"
              aria-label="Cancelar eliminación"
            >
              Cancelar
            </button>

            <button
              class="btn btn-error"
              [class.btn-disabled]="isDeleting()"
              [disabled]="isDeleting()"
              (click)="executeDelete()"
              aria-label="Confirmar eliminación"
            >
              @if (isDeleting()) {
                <span class="loading loading-spinner loading-xs"></span>
                Eliminando...
              } @else {
                🗑 Eliminar
              }
            </button>
          </div>

        </div>

        <!-- Backdrop -->
        <div
          class="modal-backdrop bg-black/50"
          (click)="cancelDelete()"
          aria-hidden="true"
        ></div>
      </div>
    }
  `,
})
export class FavoritesComponent implements OnInit {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly destroyRef   = inject(DestroyRef);
  private readonly router       = inject(Router);

  // ─── Estado ────────────────────────────────────────────────────────────────

  favorites    = signal<Fusion[]>([]);
  loadingState = signal<LoadingState>('loading');
  errorMessage = signal<string>('');
  pendingDelete = signal<Fusion | null>(null);
  isDeleting    = signal(false);

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    this.loadingState.set('loading');
    this.errorMessage.set('');

    this.localStorageService
      .getFavorites()
      .pipe(
        catchError((err) => {
          console.error('[Favorites] Error cargando favoritos:', err);
          this.loadingState.set('error');
          this.errorMessage.set(
            'No se pudieron cargar tus favoritos. Verifica tu conexión e intenta de nuevo.'
          );
          return of([] as Fusion[]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((fusions) => {
        this.favorites.set(fusions);
        this.loadingState.set('success');
      });
  }

  // ─── Navegación ────────────────────────────────────────────────────────────

  goToFusion(): void {
    this.router.navigate(['/fusion']);
  }

  // ─── Delete flow ───────────────────────────────────────────────────────────

  confirmDelete(fusion: Fusion): void {
    this.pendingDelete.set(fusion);
  }

  cancelDelete(): void {
    if (this.isDeleting()) return;
    this.pendingDelete.set(null);
  }

  async executeDelete(): Promise<void> {
    const fusion = this.pendingDelete();
    if (!fusion?.id || this.isDeleting()) return;

    this.isDeleting.set(true);

    try {
      await this.localStorageService.deleteFavorite(fusion.id);
      // El observable de getFavorites() actualiza favorites() en tiempo real
      // no es necesario mutar el array manualmente
      this.pendingDelete.set(null);
    } catch (err) {
      console.error('[Favorites] Error eliminando fusión:', err);
      this.errorMessage.set('No se pudo eliminar la fusión. Intenta de nuevo.');
      this.loadingState.set('error');
    } finally {
      this.isDeleting.set(false);
    }
  }
}