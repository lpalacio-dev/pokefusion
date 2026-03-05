import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div
      class="flex flex-col items-center justify-center gap-3 py-12"
      role="status"
      aria-live="polite"
      [attr.aria-label]="message()"
    >
      <span class="loading loading-spinner loading-lg text-primary"></span>
      @if (message()) {
        <p class="text-base-content/60 text-sm animate-pulse">{{ message() }}</p>
      }
    </div>
  `,
})
export class LoadingSpinnerComponent {
  message = input<string>('Cargando...');
}