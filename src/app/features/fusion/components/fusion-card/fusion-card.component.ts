import { Component, input, output } from '@angular/core';

import { Fusion } from '@core/models';
import { getBadgeClass } from '@core/services/type-colors';
import { CapitalizePipe } from '@shared/pipes/capitalize.pipe';
import { FusionStatsComponent } from '../fusion-stats/fusion-stats.component';

@Component({
  selector: 'app-fusion-card',
  standalone: true,
  imports: [CapitalizePipe, FusionStatsComponent],
  template: `
    <article
      class="card bg-base-200 shadow-2xl border border-base-300 w-full max-w-md mx-auto
             animate-[fadeInUp_0.4s_ease-out]"
      aria-label="Resultado de la fusión: {{ fusion().name }}"
    >
      <div class="card-body gap-4">

        <!-- Header: nombre + tipos -->
        <div class="flex flex-col items-center gap-2 text-center">
          <h2 class="card-title text-3xl font-extrabold text-primary tracking-wide">
            {{ fusion().name }}
          </h2>

          <div class="flex gap-2 flex-wrap justify-center" role="list" aria-label="Tipos">
            @for (type of fusion().types; track $index) {
              <span
                role="listitem"
                class="badge badge-md font-semibold"
                [class]="typeBadgeClass(type)"
              >
                {{ type | capitalize }}
              </span>
            }
          </div>
        </div>

        <!-- Sprites collage de los 3 padres -->
        <div
          class="flex justify-center items-end gap-1 py-2"
          role="img"
          [attr.aria-label]="'Sprites de los padres: ' + fusion().parents.join(', ')"
        >
          @for (url of fusion().spriteUrls; track url; let i = $index) {
            <div class="flex flex-col items-center gap-1">
              <img
                [src]="url"
                [alt]="'Sprite de ' + (fusion().parents[i] | capitalize)"
                class="w-20 h-20 object-contain drop-shadow-lg
                       transition-transform hover:scale-110"
                loading="lazy"
              />
              <span class="text-xs text-base-content/50 truncate max-w-[5rem]">
                {{ fusion().parents[i] | capitalize }}
              </span>
            </div>
          }
        </div>

        <div class="divider my-0 text-xs text-base-content/40">STATS</div>

        <!-- Stats -->
        <app-fusion-stats [stats]="fusion().stats" />

        <div class="divider my-0 text-xs text-base-content/40">MOVIMIENTOS</div>

        <!-- Moves -->
        <div class="flex gap-2 flex-wrap justify-center" role="list" aria-label="Movimientos">
          @for (move of fusion().moves; track $index) {
            <span
              role="listitem"
              class="badge badge-outline badge-accent badge-md font-medium"
            >
              {{ move | capitalize }}
            </span>
          }
        </div>

        <!-- Acciones del card (solo en modo favorito) -->
        @if (showDelete()) {
          <div class="card-actions justify-end mt-2">
            <button
              class="btn btn-ghost btn-sm text-error"
              (click)="delete.emit()"
              [attr.aria-label]="'Eliminar fusión ' + fusion().name"
            >
              🗑 Eliminar
            </button>
          </div>
        }

      </div>
    </article>
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class FusionCardComponent {
  fusion     = input.required<Fusion>();
  showDelete = input<boolean>(false);

  delete = output<void>();

  typeBadgeClass(type: string): string {
    return getBadgeClass(type);
  }
}