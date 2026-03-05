import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  template: `
    <div
      class="alert alert-error shadow-lg"
      role="alert"
      aria-live="assertive"
    >
      <div class="flex items-start gap-3 w-full">

        <!-- Ícono -->
        <span class="text-xl shrink-0" aria-hidden="true">⚠️</span>

        <!-- Mensaje -->
        <div class="flex flex-col gap-1 flex-1">
          <span class="font-semibold text-sm">Algo salió mal</span>
          <span class="text-sm opacity-90">{{ message() }}</span>
        </div>

        <!-- Botón retry -->
        @if (showRetry()) {
          <button
            class="btn btn-sm btn-ghost shrink-0"
            (click)="retry.emit()"
            aria-label="Reintentar la operación"
          >
            ↺ Reintentar
          </button>
        }

      </div>
    </div>
  `,
})
export class ErrorBannerComponent {
  message   = input.required<string>();
  showRetry = input<boolean>(true);

  retry = output<void>();
}