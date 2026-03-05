import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div
      class="flex flex-col items-center justify-center gap-4 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      <!-- Ícono / Ilustración -->
      <div class="text-6xl select-none" aria-hidden="true">
        {{ icon() }}
      </div>

      <!-- Título -->
      <h2 class="text-xl font-bold text-base-content">
        {{ title() }}
      </h2>

      <!-- Descripción -->
      @if (description()) {
        <p class="text-base-content/60 text-sm max-w-xs">
          {{ description() }}
        </p>
      }

      <!-- CTA opcional -->
      @if (actionLabel()) {
        <button
          class="btn btn-primary btn-sm mt-2"
          (click)="action.emit()"
          [attr.aria-label]="actionLabel()"
        >
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  icon        = input<string>('🔍');
  title       = input.required<string>();
  description = input<string>('');
  actionLabel = input<string>('');

  action = output<void>();
}