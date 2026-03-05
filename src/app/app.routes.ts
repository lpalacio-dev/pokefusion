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
    // Cualquier ruta desconocida redirige a fusion
    path: '**',
    redirectTo: 'fusion',
  },
];