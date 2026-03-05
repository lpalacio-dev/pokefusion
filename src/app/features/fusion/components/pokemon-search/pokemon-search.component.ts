import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ElementRef,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  of,
  Subject,
  takeUntil,
} from 'rxjs';

import { PokeApiService } from '@core/services';
import { Pokemon } from '@core/models';
import { CapitalizePipe } from '@shared/pipes/capitalize.pipe';

@Component({
  selector: 'app-pokemon-search',
  standalone: true,
  imports: [ReactiveFormsModule, CapitalizePipe],
  template: `
    <div class="form-control w-full" #container>

      <!-- Label -->
      <label [for]="inputId()" class="label pb-1">
        <span class="label-text font-semibold text-base-content">
          {{ label() }}
        </span>
        @if (selected()) {
          <span class="label-text-alt text-success">✓ Seleccionado</span>
        }
      </label>

      <!-- Input wrapper -->
      <div class="relative">
        <input
          [id]="inputId()"
          [formControl]="searchControl"
          type="text"
          [placeholder]="placeholder()"
          class="input input-bordered w-full pr-10"
          [class.input-success]="selected()"
          [class.input-primary]="isOpen() && !selected()"
          autocomplete="off"
          [attr.aria-label]="label()"
          aria-haspopup="listbox"
          [attr.aria-expanded]="isOpen()"
          [attr.aria-controls]="dropdownId()"
          [attr.aria-activedescendant]="activeDescendant()"
          (keydown)="onKeydown($event)"
          (blur)="onBlur()"
        />

        <!-- Sprite del pokémon seleccionado -->
        @if (selected()) {
          <img
            [src]="selected()!.spriteUrl"
            [alt]="'Sprite de ' + (selected()!.name | capitalize)"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 object-contain"
            aria-hidden="true"
          />
        }

        <!-- Clear button -->
        @if (selected()) {
          <button
            type="button"
            class="absolute right-10 top-1/2 -translate-y-1/2 btn btn-xs btn-ghost btn-circle"
            (click)="clearSelection()"
            aria-label="Limpiar selección"
          >
            ✕
          </button>
        }
      </div>

      <!-- Dropdown de resultados -->
      @if (isOpen()) {
        <ul
          [id]="dropdownId()"
          role="listbox"
          [attr.aria-label]="'Resultados para ' + searchControl.value"
          class="absolute z-50 mt-1 w-full bg-base-200 border border-base-300
                 rounded-box shadow-xl max-h-64 overflow-y-auto"
        >

          <!-- Loading -->
          @if (isSearching()) {
            <li class="p-3 flex justify-center" role="option" aria-selected="false">
              <span class="loading loading-spinner loading-sm text-primary"></span>
            </li>
          }

          <!-- Sin resultados -->
          @if (!isSearching() && results().length === 0) {
            <li class="p-4 text-center text-base-content/50 text-sm" role="option" aria-selected="false">
              No se encontraron Pokémon
            </li>
          }

          <!-- Resultados -->
          @for (pokemon of results(); track pokemon.id; let i = $index) {
            <li
              [id]="optionId(i)"
              role="option"
              [attr.aria-selected]="activeIndex() === i"
              class="flex items-center gap-3 px-4 py-2 cursor-pointer
                     transition-colors hover:bg-base-300"
              [class.bg-base-300]="activeIndex() === i"
              (mousedown)="selectPokemon(pokemon)"
            >
              <!-- Sprite miniatura -->
              <img
                [src]="pokemon.spriteUrl"
                [alt]="'Sprite de ' + (pokemon.name | capitalize)"
                class="w-10 h-10 object-contain shrink-0"
              />

              <!-- Info -->
              <div class="flex flex-col min-w-0">
                <span class="font-medium text-sm truncate">
                  {{ pokemon.name | capitalize }}
                </span>
                <div class="flex gap-1 flex-wrap">
                  @for (type of pokemon.types; track type) {
                    <span class="badge badge-xs badge-outline">{{ type }}</span>
                  }
                </div>
              </div>

              <!-- ID -->
              <span class="text-xs text-base-content/40 ml-auto shrink-0">
                #{{ pokemon.id }}
              </span>
            </li>
          }

        </ul>
      }

    </div>
  `,
  host: { class: 'relative block' },
})
export class PokemonSearchComponent implements OnInit, OnDestroy {
  private readonly pokeApi = inject(PokeApiService);
  private readonly destroy$ = new Subject<void>();

  // ─── Inputs / Outputs ──────────────────────────────────────────────────────
  label       = input<string>('Pokémon');
  placeholder = input<string>('Buscar por nombre...');
  inputId     = input<string>('pokemon-search');

  pokemonSelected = output<Pokemon>();
  pokemonCleared  = output<void>();

  // ─── Estado interno ────────────────────────────────────────────────────────
  searchControl = new FormControl('', { nonNullable: true });

  results     = signal<Pokemon[]>([]);
  isSearching = signal(false);
  isOpen      = signal(false);
  activeIndex = signal(-1);
  selected    = signal<Pokemon | null>(null);

  // ─── Computed IDs para aria ────────────────────────────────────────────────
  dropdownId = computed(() => `${this.inputId()}-listbox`);
  optionId   = (index: number) => `${this.inputId()}-option-${index}`;
  activeDescendant = computed(() =>
    this.activeIndex() >= 0 ? this.optionId(this.activeIndex()) : undefined
  );

  // ─── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          // No buscar si hay pokémon seleccionado o query muy corto
          if (this.selected() || query.trim().length < 2) {
            this.isOpen.set(false);
            this.results.set([]);
            return of([]);
          }

          this.isSearching.set(true);
          this.isOpen.set(true);
          this.activeIndex.set(-1);

          return this.pokeApi.searchPokemon(query).pipe(
            catchError(() => {
              this.isSearching.set(false);
              return of([]);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((pokemon) => {
        this.results.set(pokemon);
        this.isSearching.set(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Acciones ──────────────────────────────────────────────────────────────

  selectPokemon(pokemon: Pokemon): void {
    this.selected.set(pokemon);
    this.searchControl.setValue(pokemon.name, { emitEvent: false });
    this.isOpen.set(false);
    this.results.set([]);
    this.activeIndex.set(-1);
    this.pokemonSelected.emit(pokemon);
  }

  clearSelection(): void {
    this.selected.set(null);
    this.searchControl.setValue('', { emitEvent: false });
    this.results.set([]);
    this.isOpen.set(false);
    this.pokemonCleared.emit();
  }

  // ─── Navegación por teclado ────────────────────────────────────────────────

  onKeydown(event: KeyboardEvent): void {
    if (!this.isOpen()) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set(
          Math.min(this.activeIndex() + 1, this.results().length - 1)
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.set(Math.max(this.activeIndex() - 1, 0));
        break;

      case 'Enter':
        event.preventDefault();
        if (this.activeIndex() >= 0) {
          this.selectPokemon(this.results()[this.activeIndex()]);
        }
        break;

      case 'Escape':
        this.isOpen.set(false);
        this.activeIndex.set(-1);
        break;
    }
  }

  onBlur(): void {
    // Pequeño delay para que mousedown en opción se ejecute antes del blur
    setTimeout(() => this.isOpen.set(false), 150);
  }
}