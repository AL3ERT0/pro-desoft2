import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from './auth.service';

/**
 * Cierre de sesión en un solo punto.
 *
 * Antes `admin`, `funcionario` y `dashboard` tenían cada una su propio `logout()`
 * con tres variantes del diálogo (distinto texto, y solo `dashboard` llevaba
 * estado de "cerrando" y `try/catch`). Cualquier ajuste hadía que repetirse tres
 * veces y era fácil olvidar una.
 *
 * Aquí vive el diálogo, el estado de carga, la llamada a `AuthService` y la
 * navegación, para que los componentes solo inyecten el servicio.
 */
@Injectable({ providedIn: 'root' })
export class LogoutService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Evita dobles clics mientras el diálogo o la llamada a Supabase están vivos. */
  readonly enCurso = signal(false);

  /** `true` si la sesión se cerró; `false` si el usuario canceló. */
  async cerrar(): Promise<boolean> {
    if (this.enCurso()) return false;
    this.enCurso.set(true);

    try {
      const { isConfirmed } = await Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Estás seguro de que deseas salir?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#870fa2',
        cancelButtonColor: '#aaa',
      });

      if (!isConfirmed) return false;

      await this.auth.cerrarSesion();

      // `replaceUrl` deja la ruta privada fuera del historial: si no, el botón
      // "atrás" del navegador volvería a la sesión anterior y el guard la
      // rechazaría, dejando al usuario en la landing con la URL del panel.
      await this.router.navigateByUrl('/', { replaceUrl: true });
      return true;
    } catch {
      Swal.fire('Error', 'No se pudo cerrar sesión', 'error');
      return false;
    } finally {
      this.enCurso.set(false);
    }
  }
}