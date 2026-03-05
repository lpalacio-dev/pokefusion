import {
  Component,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';

import { Pokemon, Fusion } from '@core/models';
import { PokeApiService, FusionLogicService, FirestoreService } from '@core/services';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ErrorBannerComponent } from '@shared/components/error-banner/error-banner.component';
import { PokemonSearchComponent } from './components/pokemon-search/pokemon-search.component';
import { FusionCardComponent } from './components/fusion-card/fusion-card.component';

type LoadingState = 'idle' | 'loading' | 'success' | 'error';
type SaveState    = 'idle' | 'saving' | 'saved' | 'error';

@Component({
  selector: 'app-fusion',
  standalone: true,
  imports: [
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ErrorBannerComponent,
    PokemonSearchComponent,
    FusionCardComponent,
  ],
  template: `
    <div class="flex flex-col gap-8 max-w-2xl mx-auto">

      <!-- Título -->
      <header class="text-center">
        <h1 class="text-4xl font-extrabold text-primary mb-2">⚡ PokéFusion</h1>
        <p class="text-base-content/60 text-sm">
          Elige 3 Pokémon para crear una fusión única
        </p>
      </header>

      <!-- Slots de búsqueda -->
      <section aria-label="Selección de Pokémon" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        @for (slot of slots; track slot.id) {
          <app-pokemon-search
            [inputId]="'pokemon-slot-' + slot.id"
            [label]="'Pokémon ' + slot.id"
            placeholder="Buscar..."
            (pokemonSelected)="onPokemonSelected($event, slot.index)"
            (pokemonCleared)="onPokemonCleared(slot.index)"
          />
        }
      </section>

      <!-- Botones de acción -->
      <div class="flex flex-wrap justify-center gap-3">

        <!-- Aleatorizar -->
        <button
          class="btn btn-outline btn-secondary"
          [class.btn-disabled]="loadingState() === 'loading'"
          (click)="randomize()"
          [disabled]="loadingState() === 'loading'"
          aria-label="Seleccionar 3 Pokémon al azar y fusionar"
        >
          @if (isRandomizing()) {
            <span class="loading loading-spinner loading-xs"></span>
          } @else {
            🎲
          }
          Aleatorizar
        </button>

        <!-- Fusionar -->
        <button
          class="btn btn-primary"
          [class.btn-disabled]="!canFuse() || loadingState() === 'loading'"
          [disabled]="!canFuse() || loadingState() === 'loading'"
          (click)="fuse()"
          aria-label="Fusionar los 3 Pokémon seleccionados"
        >
          @if (loadingState() === 'loading') {
            <span class="loading loading-spinner loading-xs"></span>
            Fusionando...
          } @else {
            ⚡ Fusionar
          }
        </button>
      </div>

      <!-- Estado: loading -->
      @if (loadingState() === 'loading' && !isRandomizing()) {
        <app-loading-spinner message="Creando fusión..." />
      }

      <!-- Estado: error -->
      @if (loadingState() === 'error') {
        <app-error-banner
          [message]="errorMessage()"
          (retry)="fuse()"
        />
      }

      <!-- Estado: idle sin resultado -->
      @if (loadingState() === 'idle' && !fusionResult()) {
        <app-empty-state
          icon="🧬"
          title="Aún no hay fusión"
          description="Selecciona 3 Pokémon o usa el botón Aleatorizar para comenzar"
        />
      }

      <!-- Estado: success — resultado de la fusión -->
      @if (fusionResult()) {
        <section aria-label="Resultado de la fusión" class="flex flex-col gap-4">

          <app-fusion-card [fusion]="fusionResult()!" />

          <!-- Botones de resultado -->
          <div class="flex flex-wrap justify-center gap-3">

            <!-- Re-fusionar -->
            <button
              class="btn btn-outline btn-accent"
              (click)="refuse()"
              aria-label="Generar una nueva fusión con los mismos Pokémon"
            >
              🔄 Re-fusionar
            </button>

            <!-- Guardar favorito -->
            <button
              class="btn btn-success"
              [class.btn-disabled]="saveState() === 'saving' || saveState() === 'saved'"
              [disabled]="saveState() === 'saving' || saveState() === 'saved'"
              (click)="saveFavorite()"
              [attr.aria-label]="saveButtonLabel()"
            >
              @switch (saveState()) {
                @case ('saving') {
                  <span class="loading loading-spinner loading-xs"></span>
                  Guardando...
                }
                @case ('saved') {
                  ✓ Guardado
                }
                @default {
                  ★ Guardar favorito
                }
              }
            </button>

          </div>

          <!-- Toast de guardado exitoso -->
          @if (saveState() === 'saved') {
            <div
              class="toast toast-center"
              role="status"
              aria-live="polite"
            >
              <div class="alert alert-success shadow-lg">
                <span>✓ Fusión guardada en favoritos</span>
              </div>
            </div>
          }

          <!-- Error al guardar -->
          @if (saveState() === 'error') {
            <app-error-banner
              message="No se pudo guardar la fusión. Intenta de nuevo."
              (retry)="saveFavorite()"
            />
          }

        </section>
      }

    </div>
  `,
})
export class FusionComponent {
  private readonly pokeApi      = inject(PokeApiService);
  private readonly fusionSvc    = inject(FusionLogicService);
  private readonly firestoreSvc = inject(FirestoreService);
  private readonly destroyRef   = inject(DestroyRef);

  // ─── Estado ────────────────────────────────────────────────────────────────

  selectedPokemons = signal<[Pokemon | null, Pokemon | null, Pokemon | null]>([null, null, null]);
  fusionResult     = signal<Fusion | null>(null);
  loadingState     = signal<LoadingState>('idle');
  errorMessage     = signal<string>('');
  saveState        = signal<SaveState>('idle');
  isRandomizing    = signal(false);

  // ─── Computed ──────────────────────────────────────────────────────────────

  canFuse = computed(() =>
    this.selectedPokemons().every((p) => p !== null)
  );

  saveButtonLabel = computed(() => {
    const state = this.saveState();
    if (state === 'saving') return 'Guardando fusión...';
    if (state === 'saved')  return 'Fusión ya guardada';
    return 'Guardar en favoritos';
  });

  readonly slots = [
    { id: 1, index: 0 },
    { id: 2, index: 1 },
    { id: 3, index: 2 },
  ] as const;

  // ─── Handlers de búsqueda ──────────────────────────────────────────────────

  onPokemonSelected(pokemon: Pokemon, index: number): void {
    this.selectedPokemons.update((current) => {
      const updated = [...current] as [Pokemon | null, Pokemon | null, Pokemon | null];
      updated[index] = pokemon;
      return updated;
    });
    this.fusionResult.set(null);
    this.saveState.set('idle');
    this.loadingState.set('idle');
  }

  onPokemonCleared(index: number): void {
    this.selectedPokemons.update((current) => {
      const updated = [...current] as [Pokemon | null, Pokemon | null, Pokemon | null];
      updated[index] = null;
      return updated;
    });
    this.fusionResult.set(null);
    this.saveState.set('idle');
  }

  // ─── Fusionar ──────────────────────────────────────────────────────────────

  fuse(): void {
    if (!this.canFuse()) return;

    const pokemons = this.selectedPokemons() as [Pokemon, Pokemon, Pokemon];
    this.loadingState.set('loading');
    this.errorMessage.set('');

    try {
      const result = this.fusionSvc.fuse(pokemons);
      this.fusionResult.set(result);
      this.loadingState.set('success');
      this.saveState.set('idle');
    } catch {
      this.loadingState.set('error');
      this.errorMessage.set('Ocurrió un error al generar la fusión. Intenta de nuevo.');
    }
  }

  refuse(): void {
    this.saveState.set('idle');
    this.fuse();
  }

  // ─── Aleatorizar ───────────────────────────────────────────────────────────

  randomize(): void {
    this.isRandomizing.set(true);
    this.loadingState.set('loading');
    this.fusionResult.set(null);
    this.saveState.set('idle');

    this.pokeApi
      .getRandomPokemons(3)
      .pipe(
        catchError(() => {
          this.loadingState.set('error');
          this.errorMessage.set('No se pudieron cargar los Pokémon aleatorios. Verifica tu conexión.');
          this.isRandomizing.set(false);
          return of([] as Pokemon[]);
        }),
        finalize(() => this.isRandomizing.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((pokemons) => {
        if (pokemons.length !== 3) return;
        this.selectedPokemons.set(pokemons as [Pokemon, Pokemon, Pokemon]);
        setTimeout(() => this.fuse(), 0);
      });
  }

  // ─── Guardar favorito ──────────────────────────────────────────────────────

  async saveFavorite(): Promise<void> {
    const fusion = this.fusionResult();
    if (!fusion || this.saveState() === 'saving') return;

    this.saveState.set('saving');

    try {
      await this.firestoreSvc.saveFusion(fusion);
      this.saveState.set('saved');
      setTimeout(() => {
        if (this.saveState() === 'saved') this.saveState.set('idle');
      }, 3000);
    } catch {
      this.saveState.set('error');
    }
  }
}