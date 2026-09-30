import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly nombreUsuario = signal('');
  isLoggingOut = false;

  async ngOnInit(): Promise<void> {
    await this.auth.ensureLoaded();
    this.nombreUsuario.set(this.auth.nombreMostrar());
  }

  async logout(): Promise<void> {
    const { isConfirmed } = await Swal.fire({
      title: '¿Cerrar sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#870fa2',
    });

    if (!isConfirmed) return;

    this.isLoggingOut = true;

    try {
      await this.auth.cerrarSesion();
      await this.router.navigate(['/']);
    } catch {
      this.isLoggingOut = false;
      Swal.fire('Error', 'No se pudo cerrar sesión', 'error');
    }
  }
}