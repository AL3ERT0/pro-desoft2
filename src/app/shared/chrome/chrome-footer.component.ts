import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Pie de pagina con el logo, el aviso de derechos y el enlace a GOV.CO.
 *
 * `home.html` usa una variante distinta (logo de 60px, boton transparente), por
 * eso no se migro a este componente: unificarlo seria un cambio de diseno, no
 * una refactorizacion.
 */
@Component({
  selector: 'app-chrome-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="footer-brand">
        <div class="footer-logo-box">
          <img src="/assets/gov-logo.png" alt="GOV.CO" class="footer-logo-img" />
        </div>
        <div class="footer-copy">
          <p>&copy; 2026 PQRSync. Todos los derechos reservados.</p>
        </div>
        <a href="https://www.gov.co/" target="_blank" class="gov-btn">Conoce GOV.CO aquí</a>
      </div>
    </footer>
  `,
})
export class ChromeFooterComponent {}