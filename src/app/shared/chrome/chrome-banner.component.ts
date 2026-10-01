import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Banner superior con el logo de GOV.CO.
 *
 * Antes cada pantalla repetia este markup; `admin.html`, `dashboard.html` y
 * `funcionario.html` lo envolvian ademas en un `<div class="top-banner-logo">`
 * que solo tenia estilos en `home.scss`, asi que en esas pantallas era un
 * envoltorio inerte. El parcial global de chrome (`src/styles.scss`) define
 * `.top-banner` y `.top-banner-logo-img`, por eso este componente no lleva
 * `styles`: no debe emitir CSS propio.
 */
@Component({
  selector: 'app-chrome-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="top-banner">
      <img src="/assets/gov-logo.png" alt="GOV.CO" class="top-banner-logo-img" />
    </div>
  `,
})
export class ChromeBannerComponent {}