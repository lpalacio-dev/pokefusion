import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'fusion',
    pathMatch: 'full',
  },
  {
    path: 'fusion',
    loadComponent: () =>
      import('./features/fusion/fusion.component').then(
        (m) => m.FusionComponent
      ),
    title: 'PokéFusion — Crea tu fusión',
  },
  {
    path: 'favorites',
    loadComponent: () =>
      import('./features/favorites/favorites.component').then(
        (m) => m.FavoritesComponent
      ),
    title: 'PokéFusion — Mis favoritos',
  },
  {
    // Cualquier ruta desconocida redirige a fusion
    path: '**',
    redirectTo: 'fusion',
  },
];