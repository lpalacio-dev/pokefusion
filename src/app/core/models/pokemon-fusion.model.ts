import { Timestamp } from '@angular/fire/firestore';
import { PokemonStat } from './pokemon-stat.model';

export interface Fusion {
  id?: string;
  name: string;
  types: string[];
  stats: PokemonStat[];
  moves: string[];
  parents: string[];
  spriteUrls: string[];
  createdAt: Timestamp | Date;
}