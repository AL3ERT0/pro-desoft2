import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-funcionario',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './funcionario.html',
  styleUrl: './funcionario.scss',
})
export class FuncionarioComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly nombreFuncionario = signal('Funcionario');

  async ngOnInit(): Promise<void> {
    await this.auth.ensureLoaded();
    this.nombreFuncionario.set(this.auth.nombreMostrar() || 'Funcionario');
  }

  irA(ruta: string): void {
    void this.router.navigate([ruta]);
  }

  async logout(): Promise<void> {
    const { isConfirmed } = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Se cerrará tu sesión actual.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#870fa2',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, salir',
    });

    if (isConfirmed) {
      await this.auth.cerrarSesion();
      await this.router.navigate(['/']);
    }
  }
}