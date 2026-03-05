import { Injectable } from '@angular/core';
import { Fusion, Pokemon, PokemonStat } from '@core/models';

/**
 * Servicio puro de lógica de fusión.
 * No depende de HTTP ni de Firebase — solo recibe Pokémon y devuelve una Fusión.
 * Esto lo hace fácilmente testeable de forma unitaria.
 */
@Injectable({ providedIn: 'root' })
export class FusionLogicService {

  /**
   * Fusiona 3 Pokémon en uno nuevo.
   * Cada llamada puede producir un resultado diferente (moves y nombre son parcialmente aleatorios).
   *
   * @param pokemons - exactamente 3 Pokémon
   * @returns Fusion con nombre, tipos, stats y moves derivados
   */
  fuse(pokemons: [Pokemon, Pokemon, Pokemon]): Fusion {
    return {
      name:       this.buildName(pokemons),
      types:      this.deriveTypes(pokemons),
      stats:      this.averageStats(pokemons),
      moves:      this.pickMoves(pokemons),
      parents:    pokemons.map((p) => p.name),
      spriteUrls: pokemons.map((p) => p.spriteUrl),
      createdAt:  new Date(),
    };
  }

  // ─── Nombre ─────────────────────────────────────────────────────────────────

  /**
   * Construye el nombre de la fusión combinando sílabas de los 3 padres:
   *   - Segmento INICIAL  del pokémon 1
   *   - Segmento CENTRAL  del pokémon 2
   *   - Segmento FINAL    del pokémon 3
   *
   * Algoritmo de segmentación: split por vocales, manteniendo al menos
   * un carácter por segmento para evitar nombres vacíos.
   */
  private buildName(pokemons: [Pokemon, Pokemon, Pokemon]): string {
    const [p1, p2, p3] = pokemons.map((p) => p.name.toLowerCase());

    const seg1 = this.getSegment(p1, 'start');
    const seg2 = this.getSegment(p2, 'middle');
    const seg3 = this.getSegment(p3, 'end');

    const raw = `${seg1}${seg2}${seg3}`;

    // Capitalizar primera letra y limitar a 12 caracteres
    return raw.charAt(0).toUpperCase() + raw.slice(1, 12);
  }

  /**
   * Divide el nombre en sílabas aproximadas (grupos consonante+vocal)
   * y extrae el segmento pedido.
   */
  private getSegment(name: string, position: 'start' | 'middle' | 'end'): string {
    // Eliminar guiones (ej: "mr-mime" → "mrmime")
    const clean = name.replace(/-/g, '');

    // Dividir en sílabas: cualquier grupo que termine en vocal
    const syllables = clean.match(/[^aeiou]*[aeiou]+[^aeiou]*/gi) ?? [clean];

    if (syllables.length === 1) {
      // Nombre muy corto: devolver mitad del string según posición
      const half = Math.ceil(clean.length / 2);
      if (position === 'start')  return clean.slice(0, half);
      if (position === 'end')    return clean.slice(half);
      return clean.slice(Math.floor(clean.length / 4), Math.ceil(clean.length * 3 / 4));
    }

    if (position === 'start')  return syllables[0];
    if (position === 'end')    return syllables[syllables.length - 1];

    // middle: sílaba del centro
    const midIndex = Math.floor(syllables.length / 2);
    return syllables[midIndex];
  }

  // ─── Tipos ──────────────────────────────────────────────────────────────────

  /**
   * Deriva los tipos de la fusión:
   * 1. Aplana todos los tipos de los 3 padres
   * 2. Cuenta la frecuencia de cada tipo
   * 3. Devuelve los 2 más frecuentes (o 1 si todos son únicos)
   */
  private deriveTypes(pokemons: [Pokemon, Pokemon, Pokemon]): string[] {
    const allTypes = pokemons.flatMap((p) => p.types);

    const frequency = allTypes.reduce<Record<string, number>>((acc, type) => {
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])   // mayor frecuencia primero
      .slice(0, 2)                    // máximo 2 tipos
      .map(([type]) => type);
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  /**
   * Calcula el promedio de cada stat base entre los 3 padres.
   * Usa el orden de stats del primer pokémon como referencia
   * (PokeAPI siempre devuelve los 6 stats en el mismo orden).
   */
  private averageStats(pokemons: [Pokemon, Pokemon, Pokemon]): PokemonStat[] {
    const [p1, p2, p3] = pokemons;

    return p1.stats.map((stat, index) => {
      const bases = [
        stat.base,
        p2.stats[index]?.base ?? 0,
        p3.stats[index]?.base ?? 0,
      ];
      const average = bases.reduce((sum, v) => sum + v, 0) / bases.length;

      return {
        name: stat.name,
        base: Math.round(average),
      };
    });
  }

  // ─── Moves ──────────────────────────────────────────────────────────────────

  /**
   * Selecciona 2 moves para la fusión:
   *   - 1 move aleatorio del pokémon 1
   *   - 1 move aleatorio del pokémon 2
   *
   * Al llamar fuse() de nuevo con los mismos padres, los moves pueden cambiar,
   * lo que da variedad al botón "Re-fusionar".
   */
  private pickMoves(pokemons: [Pokemon, Pokemon, Pokemon]): string[] {
    const pickRandom = (moves: string[]): string =>
      moves[Math.floor(Math.random() * moves.length)] ?? 'tackle';

    return [
      pickRandom(pokemons[0].moves),
      pickRandom(pokemons[1].moves),
    ];
  }
}