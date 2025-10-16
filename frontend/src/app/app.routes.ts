import { Routes } from '@angular/router';
import { authGuard, hrGuard, guestGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  // Redirect root to dashboard
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Public routes (only accessible when not authenticated)
  {
    path: 'login',
    loadComponent: () => import('@features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },

  // Protected routes (require authentication)
  {
    path: '',
    loadComponent: () => import('@layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('@features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('@features/auth/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'fichajes',
        loadComponent: () => import('@features/fichajes/fichajes.component').then(m => m.FichajesComponent)
      },
      {
        path: 'vacaciones',
        loadComponent: () => import('@features/vacaciones/vacaciones.component').then(m => m.VacacionesComponent)
      },
      // HR Administration Routes
      {
        path: 'rrhh',
        loadComponent: () => import('@features/rrhh/rrhh-dashboard.component').then(m => m.RrhhDashboardComponent),
        canActivate: [hrGuard]
      },
      {
        path: 'rrhh/aprobaciones',
        loadComponent: () => import('@features/vacaciones/aprobaciones/aprobaciones-rrhh.component').then(m => m.AprobacionesRrhhComponent),
        canActivate: [hrGuard]
      },
      {
        path: 'rrhh/usuarios',
        loadComponent: () => import('@features/usuarios/usuarios.component').then(m => m.UsuariosComponent),
        canActivate: [hrGuard]
      },
      // Legacy route - redirect to new RRHH structure
      {
        path: 'usuarios',
        redirectTo: '/rrhh/usuarios',
        pathMatch: 'full'
      }
    ]
  },

  // 404 - Not Found
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
