import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-chrome-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="contact-section">
      <h3>Contacto</h3>
      <div class="contact-grid">
        <div class="contact-card">
          <div class="contact-icon">📧</div>
          <h4>Correo Electrónico</h4>
          <p>pqrs&#64;entidad.gov.co</p>
        </div>
        <div class="contact-card">
          <div class="contact-icon">📞</div>
          <h4>Teléfono</h4>
          <p>(2) 241-3890</p>
        </div>
        <div class="contact-card">
          <div class="contact-icon">📍</div>
          <h4>Dirección</h4>
          <p>Cra. 5 #12-34, Buenaventura, Valle del Cauca</p>
        </div>
        <div class="contact-card">
          <div class="contact-icon">🕐</div>
          <h4>Horario de atención</h4>
          <p>Lunes a Viernes 8:00am - 5:00pm</p>
        </div>
      </div>
    </section>
  `,
})
export class ChromeContactComponent {}