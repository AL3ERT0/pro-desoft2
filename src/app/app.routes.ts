import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ROL } from './core/models/pqrs.types';

/**
 * Mapa de acceso por rol.
 *
 * PÚBLICO — el ciudadano puede radially sin cuenta: por eso las cuatro páginas
 * de formulario no llevan `authGuard`. Si hay sesión, el formulario adjunta el
 * `profile_id`; si no, la radicación queda anónima.
 *
 * RLS debe permitir `INSERT` anónimo en `requests` y `SELECT` por `ref_number`
 * para que esto siga funcionando una vez se cierren las políticas.
 */
export const routes: Routes = [
  // ── Público ──────────────────────────────────────────────────────────────
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'peticiones',
    loadComponent: () => import('./home/pages/peticiones/peticiones').then((m) => m.PeticionesComponent),
  },
  {
    path: 'quejas',
    loadComponent: () => import('./home/pages/quejas/quejas').then((m) => m.QuejasComponent),
  },
  {
    path: 'reclamos',
    loadComponent: () => import('./home/pages/reclamos/reclamos').then((m) => m.ReclamosComponent),
  },
  {
    path: 'sugerencias',
    loadComponent: () => import('./home/pages/sugerencias/sugerencias').then((m) => m.SugerenciasComponent),
  },
  {
    path: 'consultar',
    loadComponent: () => import('./home/consultar/consultar').then((m) => m.ConsultarComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset.password').then((m) => m.ResetPasswordComponent),
  },

  // ── Ciudadano autenticado ────────────────────────────────────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard],
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'mis-pqrs',
    canActivate: [authGuard, roleGuard],
    loadComponent: () => import('./home/mis-pqrs/mis-pqrs').then((m) => m.MisPqrsComponent),
  },

  // ── Administrador ────────────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: [ROL.ADMIN] },
    loadComponent: () => import('./admin/admin').then((m) => m.AdminComponent),
  },
  {
    path: 'admin/usuarios',
    canActivate: [authGuard, roleGuard],
    data: { roles: [ROL.ADMIN] },
    loadComponent: () =>
      import('./admin/usuarios/usuarios').then((m) => m.UsuariosComponent),
  },
  {
    path: 'admin/solicitudes',
    canActivate: [authGuard, roleGuard],
    data: { roles: [ROL.ADMIN] },
    loadComponent: () =>
      import('./admin/asignar-solicitudes/asignar-solicitudes').then((m) => m.AsignarSolicitudesComponent),
  },
  {
    path: 'admin/estadisticas',
    canActivate: [authGuard, roleGuard],
    data: { roles: [ROL.ADMIN] },
    loadComponent: () =>
      import('./admin/estadisticas/estadisticas').then((m) => m.EstadisticasComponent),
  },

  // ── Funcionario ──────────────────────────────────────────────────────────
  {
    path: 'funcionario',
    canActivate: [authGuard, roleGuard],
    data: { roles: [ROL.FUNCIONARIO] },
    loadComponent: () => import('./funcionario/funcionario').then((m) => m.FuncionarioComponent),
  },
  {
    path: 'funcionario/solicitudes',
    canActivate: [authGuard, roleGuard],
    data: { roles: [ROL.FUNCIONARIO] },
    loadComponent: () =>
      import('./funcionario/solicitudes/solicitudes').then((m) => m.SolicitudesComponent),
  },

  { path: '**', redirectTo: '' },
];