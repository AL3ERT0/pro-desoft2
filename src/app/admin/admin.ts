import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss'],
})
export class AdminComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** El guard ya garantiza sesión y rol; aquí solo se refleja el estado. */
  readonly nombreAdmin = signal('Administrador');

  async ngOnInit(): Promise<void> {
    await this.auth.ensureLoaded();
    this.nombreAdmin.set(this.auth.nombreMostrar() || 'Administrador');
  }

  async logout(): Promise<void> {
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

    if (isConfirmed) {
      await this.auth.cerrarSesion();
      await this.router.navigate(['/']);
    }
  }

  irA(ruta: string): void {
    void this.router.navigate([ruta]);
  }
}