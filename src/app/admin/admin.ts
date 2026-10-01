import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import { LogoutService } from '../core/auth/logout.service';
import { ChromeBannerComponent, ChromeContactComponent, ChromeFooterComponent } from '../shared/chrome';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterModule, CommonModule, ChromeBannerComponent, ChromeContactComponent, ChromeFooterComponent],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss'],
})
export class AdminComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly logout = inject(LogoutService);

  /** El guard ya garantiza sesión y rol; aquí solo se refleja el estado. */
  readonly nombreAdmin = signal('Administrador');

  async ngOnInit(): Promise<void> {
    await this.auth.ensureLoaded();
    this.nombreAdmin.set(this.auth.nombreMostrar() || 'Administrador');
  }

  irA(ruta: string): void {
    void this.router.navigate([ruta]);
  }
}