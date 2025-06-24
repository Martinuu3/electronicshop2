import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/statistics',
    pathMatch: 'full'
  },
  {
    path: 'categories',
    loadComponent: () => import('./components/categories/categories.component').then(m => m.CategoriesComponent)
  },
  {
    path: 'statistics',
    loadComponent: () => import('./components/statistics/statistics.component').then(m => m.StatisticsComponent)
  }
];