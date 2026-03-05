/**
 * Interfaces que representan la forma RAW de la respuesta de PokeAPI.
 * Solo mapeamos los campos que realmente usamos.
 * No se exportan fuera de core/services — son detalles de implementación.
 */

export interface PokeApiListResponse {
  count: number;
  results: PokeApiNamedResource[];
}

export interface PokeApiNamedResource {
  name: string;
  url: string;
}

export interface PokeApiPokemon {
  id: number;
  name: string;
  types: PokeApiTypeSlot[];
  stats: PokeApiStatSlot[];
  moves: PokeApiMoveSlot[];
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: {
        front_default: string | null;
      };
    };
  };
}

export interface PokeApiTypeSlot {
  slot: number;
  type: PokeApiNamedResource;
}

export interface PokeApiStatSlot {
  base_stat: number;
  stat: PokeApiNamedResource;
}

export interface PokeApiMoveSlot {
  move: PokeApiNamedResource;
}