import { Pipe, PipeTransform } from '@angular/core';

/**
 * Capitaliza la primera letra de cada palabra en un string.
 * Útil para nombres de Pokémon y tipos que llegan en minúsculas desde PokeAPI.
 *
 * Uso: {{ 'charizard' | capitalize }}  →  'Charizard'
 *      {{ 'fire spin' | capitalize }}   →  'Fire Spin'
 */
@Pipe({
  name: 'capitalize',
  standalone: true,
  pure: true,
})
export class CapitalizePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';

    return value
      .split(/[\s-]+/)           // split por espacios o guiones (ej: "mr-mime")
      .map((word) =>
        word.length > 0
          ? word[0].toUpperCase() + word.slice(1).toLowerCase()
          : ''
      )
      .join(' ');
  }
}