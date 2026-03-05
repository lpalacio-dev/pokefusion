import { PokemonStat } from './pokemon-stat.model';

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  stats: PokemonStat[];
  moves: string[];
  spriteUrl: string;
}