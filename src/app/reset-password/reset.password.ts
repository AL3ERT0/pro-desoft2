import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../services/supabase.service';
import { environment } from '../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './reset.password.html',
  styleUrls: ['./reset.password.scss'],
})
export class ResetPasswordComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  newPassword = '';
  confirmPassword = '';
  loading = false;

  /** Estado del enlace recibido por correo, para no finalizar si el token falla. */
  readonly enlaceValido = signal<boolean | null>(null);

  async ngOnInit(): Promise<void> {
    // El token viaja en el fragmento de la URL. El router usa
    // `withHashLocation()`, así que llega dentro del hash y no como query string.
    const hash = window.location.hash || window.location.search;
    const parametros = new URLSearchParams(hash.replace(/^[#?]/, ''));

    const accessToken = parametros.get('access_token');
    const refreshToken = parametros.get('refresh_token');

    if (!accessToken || !refreshToken) {
      this.enlaceValido.set(false);
      return;
    }

    const { error } = await this.supabase.client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // No se registra el token: `console.log` de un access_token filtra la
    // sesión completa en la consola del navegador.
    this.enlaceValido.set(error === null);
  }

  async resetPassword(): Promise<void> {
    if (!this.newPassword || !this.confirmPassword) {
      Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
      return;
    }

    if (this.newPassword.length < 8) {
      Swal.fire('Error', 'La contraseña debe tener mínimo 8 caracteres', 'error');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
      return;
    }

    this.loading = true;
    try {
      const { error } = await this.supabase.client.auth.updateUser({
        password: this.newPassword,
      });

      if (error) {
        Swal.fire('Error', 'No se pudo actualizar la contraseña', 'error');
      } else {
        Swal.fire({
          icon: 'success',
          title: '¡Contraseña actualizada!',
          text: 'Ya puedes iniciar sesión con tu nueva contraseña.',
          confirmButtonColor: '#870fa2',
        });
        await this.router.navigate(['/']);
      }
    } catch {
      Swal.fire('Error', 'Ocurrió un error inesperado', 'error');
    } finally {
      this.loading = false;
    }
  }

  /** Enlace que ya se usó: lleva a pedir uno nuevo en lugar de a la portada. */
  irARecuperar(): void {
    window.location.href = environment.passwordRecoveryRedirectTo;
  }
}