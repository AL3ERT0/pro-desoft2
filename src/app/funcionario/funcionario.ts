import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import { LogoutService } from '../core/auth/logout.service';
import { ChromeBannerComponent, ChromeContactComponent, ChromeFooterComponent } from '../shared/chrome';

@Component({
  selector: 'app-funcionario',
  standalone: true,
  imports: [RouterModule, CommonModule, ChromeBannerComponent, ChromeContactComponent, ChromeFooterComponent],
  templateUrl: './funcionario.html',
  styleUrl: './funcionario.scss',
})
export class FuncionarioComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly logout = inject(LogoutService);

  readonly nombreFuncionario = signal('Funcionario');

  async ngOnInit(): Promise<void> {
    await this.auth.ensureLoaded();
    this.nombreFuncionario.set(this.auth.nombreMostrar() || 'Funcionario');
  }

  irA(ruta: string): void {
    void this.router.navigate([ruta]);
  }
}