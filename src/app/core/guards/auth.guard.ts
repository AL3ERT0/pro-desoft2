import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Bloquea rutas que requieren sesión.
 *
 * NOTA DE SEGURIDAD: un guard de Angular se ejecuta en el navegador. Evitar que
 * un usuario sin sesión entre a la ruta, no evita que lea los datos: eso lo
 * resuelven las políticas RLS. Este guard solo mejora la UX y evita renderizar
 * componentes a los que no corresponde.
 */
export const authGuard: CanActivateFn = async (_route, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ensureLoaded();

  if (auth.estaAutenticado()) return true;

  return router.createUrlTree([`/`], {
    queryParams: { redireccion: estado.url },
  });
};