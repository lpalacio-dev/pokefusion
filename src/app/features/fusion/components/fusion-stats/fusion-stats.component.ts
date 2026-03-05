import { Component, input, computed } from '@angular/core';
import { PokemonStat } from '@core/models';
import { CapitalizePipe } from '@shared/pipes/capitalize.pipe';

/** Valor máximo de stat en Pokémon (Blissey HP = 255) — usado para normalizar las barras. */
const MAX_STAT = 255;

/** Mapeo de nombre de stat API → etiqueta corta para la UI */
const STAT_LABELS: Record<string, string> = {
  'hp':              'HP',
  'attack':          'ATK',
  'defense':         'DEF',
  'special-attack':  'SpA',
  'special-defense': 'SpD',
  'speed':           'SPD',
};

/** Color de la barra según el valor del stat */
function statProgressClass(base: number): string {
  if (base >= 120) return 'progress-success';
  if (base >= 80)  return 'progress-warning';
  return 'progress-error';
}

@Component({
  selector: 'app-fusion-stats',
  standalone: true,
  imports: [CapitalizePipe],
  template: `
    <div class="flex flex-col gap-2" role="list" aria-label="Stats de la fusión">
      @for (stat of stats(); track stat.name) {
        <div
          role="listitem"
          class="flex items-center gap-2"
        >
          <!-- Etiqueta corta -->
          <span
            class="text-xs font-bold text-base-content/70 w-9 shrink-0 text-right"
            [title]="stat.name | capitalize"
          >
            {{ statLabel(stat.name) }}
          </span>

          <!-- Valor numérico -->
          <span class="text-xs font-mono w-7 shrink-0 text-right text-base-content">
            {{ stat.base }}
          </span>

          <!-- Barra de progreso -->
          <progress
            class="progress flex-1 h-2"
            [class]="progressClass(stat.base)"
            [value]="stat.base"
            [max]="maxStat"
            [attr.aria-label]="(stat.name | capitalize) + ': ' + stat.base + ' de ' + maxStat"
            [attr.aria-valuenow]="stat.base"
            [attr.aria-valuemin]="0"
            [attr.aria-valuemax]="maxStat"
          ></progress>
        </div>
      }
    </div>
  `,
})
export class FusionStatsComponent {
  stats = input.required<PokemonStat[]>();

  readonly maxStat = MAX_STAT;

  statLabel(name: string): string {
    return STAT_LABELS[name] ?? name.slice(0, 3).toUpperCase();
  }

  progressClass(base: number): string {
    return statProgressClass(base);
  }
}