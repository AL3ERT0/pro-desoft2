import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/auth/auth.service';
import { LogoutService } from '../core/auth/logout.service';
import { ChromeBannerComponent, ChromeContactComponent, ChromeFooterComponent } from '../shared/chrome';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, ChromeBannerComponent, ChromeContactComponent, ChromeFooterComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly logout = inject(LogoutService);

  readonly nombreUsuario = signal('');

  async ngOnInit(): Promise<void> {
    await this.auth.ensureLoaded();
    this.nombreUsuario.set(this.auth.nombreMostrar());
  }
}