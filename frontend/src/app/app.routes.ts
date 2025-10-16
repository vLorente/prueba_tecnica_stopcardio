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
    loadComponent: () => import('@/app/shared/layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
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
        loadComponent: () => import('@/app/features/rrhh-dashboard/rrhh-dashboard.component').then(m => m.RrhhDashboardComponent),
        canActivate: [hrGuard]
      },
      {
        path: 'rrhh/vacaciones',
        loadComponent: () => import('@/app/features/vacaciones/vacaciones-manage/vacaciones-manage.component').then(m => m.VacacionesManageComponent),
        canActivate: [hrGuard]
      },
      {
        path: 'rrhh/fichajes',
        loadComponent: () => import('@/app/features/fichajes/components/fichajes-manage/fichajes-manage.component').then(m => m.FichajesManageComponent),
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
