import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, switchMap } from 'rxjs';

import { Pokemon } from '@core/models';
import {
  PokeApiListResponse,
  PokeApiPokemon,
} from './poke-api.interfaces';

/** Total de Pokémon disponibles en PokeAPI (Gen 1–9). */
const TOTAL_POKEMON = 1025;

/** URL base de PokeAPI v2. */
const BASE_URL = 'https://pokeapi.co/api/v2';

/**
 * Sprite de fallback cuando PokeAPI no devuelve imagen.
 * Usamos el sprite oficial de bulbasaur como placeholder reconocible.
 */
const FALLBACK_SPRITE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png';

@Injectable({ providedIn: 'root' })
export class PokeApiService {
  private readonly http = inject(HttpClient);

  /**
   * Busca Pokémon cuyo nombre contenga el query.
   * Carga los primeros 200 resultados de la lista y filtra localmente.
   * El componente debe aplicar debounceTime(300) antes de llamar este método.
   *
   * @param query - string parcial del nombre (mínimo 2 caracteres recomendado)
   * @returns Observable con array de Pokemon que coinciden
   */
  searchPokemon(query: string): Observable<Pokemon[]> {
    const normalizedQuery = query.trim().toLowerCase();

    return this.http
      .get<PokeApiListResponse>(`${BASE_URL}/pokemon?limit=200&offset=0`)
      .pipe(
        map((response) =>
          response.results
            .filter((p) => p.name.includes(normalizedQuery))
            .slice(0, 10) // máximo 10 sugerencias en el autocomplete
        ),
        switchMap((matches) =>
          // Fetch en paralelo solo los que coinciden
          forkJoin(
            matches.map((m) => this.getPokemonByName(m.name))
          )
        )
      );
  }

  /**
   * Obtiene un Pokémon por nombre o ID y lo mapea al modelo interno.
   *
   * @param nameOrId - nombre exacto o ID numérico del Pokémon
   * @returns Observable<Pokemon>
   */
  getPokemonByName(nameOrId: string | number): Observable<Pokemon> {
    return this.http
      .get<PokeApiPokemon>(`${BASE_URL}/pokemon/${nameOrId}`)
      .pipe(map((raw) => this.mapToPokemon(raw)));
  }

  /**
   * Obtiene N Pokémon aleatorios en paralelo.
   * Los IDs se generan aleatoriamente entre 1 y TOTAL_POKEMON,
   * garantizando que no se repitan.
   *
   * @param count - cantidad de Pokémon a obtener (default: 3)
   * @returns Observable<Pokemon[]>
   */
  getRandomPokemons(count = 3): Observable<Pokemon[]> {
    const ids = this.uniqueRandomIds(count, 1, TOTAL_POKEMON);
    return forkJoin(ids.map((id) => this.getPokemonByName(id)));
  }

  // ─── Helpers privados ───────────────────────────────────────────────────────

  /**
   * Mapea la respuesta RAW de PokeAPI al modelo interno Pokemon.
   * Extrae solo los campos necesarios y aplica fallbacks defensivos.
   */
  private mapToPokemon(raw: PokeApiPokemon): Pokemon {
    return {
      id: raw.id,
      name: raw.name,

      // Tipos ordenados por slot (slot 1 = tipo primario)
      types: raw.types
        .sort((a, b) => a.slot - b.slot)
        .map((t) => t.type.name),

      // Los 6 stats base en el orden que devuelve la API
      // (hp, attack, defense, special-attack, special-defense, speed)
      stats: raw.stats.map((s) => ({
        name: s.stat.name,
        base: s.base_stat,
      })),

      // Solo los primeros 2 moves para la fusión
      moves: raw.moves.slice(0, 2).map((m) => m.move.name),

      // Preferimos el artwork oficial; fallback al sprite frontal; fallback al placeholder
      spriteUrl:
        raw.sprites.other?.['official-artwork']?.front_default ??
        raw.sprites.front_default ??
        FALLBACK_SPRITE,
    };
  }

  /**
   * Genera un array de N enteros únicos aleatorios en el rango [min, max].
   */
  private uniqueRandomIds(count: number, min: number, max: number): number[] {
    const ids = new Set<number>();
    while (ids.size < count) {
      ids.add(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return Array.from(ids);
  }
}