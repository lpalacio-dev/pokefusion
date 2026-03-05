/**
 * Mapeo de tipo Pokémon → clase DaisyUI badge.
 * Se usa en FusionCardComponent y PokemonSearchComponent.
 * Exportado desde core para que sea la única fuente de verdad.
 */
export const TYPE_BADGE_CLASS: Record<string, string> = {
  normal:   'badge-ghost',
  fire:     'badge-error',
  water:    'badge-info',
  electric: 'badge-warning',
  grass:    'badge-success',
  ice:      'badge-info',
  fighting: 'badge-error',
  poison:   'badge-secondary',
  ground:   'badge-warning',
  flying:   'badge-accent',
  psychic:  'badge-secondary',
  bug:      'badge-success',
  rock:     'badge-ghost',
  ghost:    'badge-secondary',
  dragon:   'badge-accent',
  dark:     'badge-neutral',
  steel:    'badge-ghost',
  fairy:    'badge-primary',
};

/** Devuelve la clase badge para un tipo dado. Fallback a badge-ghost. */
export function getBadgeClass(type: string): string {
  return TYPE_BADGE_CLASS[type.toLowerCase()] ?? 'badge-ghost';
}