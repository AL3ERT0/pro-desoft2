import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ROL, type Rol } from '../models/pqrs.types';

/**
 * Restringe una ruta a ciertos roles, declarados en `data.roles` de la ruta:
 *
 *   { path: 'admin', canActivate: [authGuard, roleGuard],
 *     data: { roles: [ROL.ADMIN] } }
 *
 * Si el usuario está autenticado pero sin el rol, se le manda a su panel en vez
 * de a la portada: es menos confuso que un 404 y no filtra la existencia de la ruta.
 *
 * Misma advertencia que en `authGuard`: control de acceso del lado del cliente,
 * no una frontera de seguridad. Ver RLS.
 */
export const roleGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ensureLoaded();

  if (!auth.estaAutenticado()) return router.createUrlTree(['/']);

  const permitidos = (route.data?.['roles'] as Rol[] | undefined) ?? [];

  // Sin `data.roles` la ruta solo exige sesión.
  if (permitidos.length === 0) return true;

  if (auth.tieneRol(permitidos)) return true;

  return router.createUrlTree([auth.rutaInicio()]);
};

/** Atajo legible para declarar rutas: `roles: [ROL.ADMIN]`. */
export { ROL };