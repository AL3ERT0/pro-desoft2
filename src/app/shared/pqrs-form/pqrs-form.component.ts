import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { SupabaseService, type TicketPQRS } from '../../services/supabase.service';
import { AuthService } from '../../core/auth/auth.service';
import { ESTADO } from '../../core/models/pqrs.types';
import { type PqrConfig } from '../pqrs-config';
import { NotificationService } from '../../services/notification.service';
import { ChromeBannerComponent, ChromeContactComponent, ChromeFooterComponent } from '../chrome';

const LIMITE_MB = 100;
const LIMITE_BYTES = LIMITE_MB * 1024 * 1024;
const MAX_ARCHIVOS = 4;
const TIPOS_PERMITIDOS = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

@Component({
  selector: 'app-pqr-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ChromeBannerComponent, ChromeContactComponent, ChromeFooterComponent],
  templateUrl: './pqrs-form.component.html',
  styleUrl: './pqrs-form.component.scss',
})
export class PqrFormComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);

  @Input({ required: true }) config!: PqrConfig;

  telefono = '';
  email = '';
  descripcion = '';
  destino = '';
  aceptaTerminos = false;

  readonly archivos = signal<File[]>([]);
  readonly errorArchivos = signal<string[]>([]);
  readonly enviando = signal(false);

  // ── Barra de espacio ──────────────────────────────────────────────────────

  readonly pesoUsadoBytes = computed(() =>
    this.archivos().reduce((total, file) => total + file.size, 0),
  );

  readonly pesoUsadoMB = computed(() => (this.pesoUsadoBytes() / 1024 / 1024).toFixed(2));

  readonly pesoRestanteMBNum = computed(
    () => (LIMITE_BYTES - this.pesoUsadoBytes()) / 1024 / 1024,
  );

  readonly pesoRestanteMB = computed(() => this.pesoRestanteMBNum().toFixed(2));

  readonly porcentajeUsado = computed(() =>
    Math.min(100, (this.pesoUsadoBytes() / LIMITE_BYTES) * 100),
  );

  // ── Archivos ──────────────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nuevos = input.files ? Array.from(input.files) : [];
    if (nuevos.length === 0) return;

    const actuales = this.archivos();

    if (actuales.length + nuevos.length > MAX_ARCHIVOS) {
      Swal.fire('Límite excedido', `Solo puedes subir máximo ${MAX_ARCHIVOS} archivos`, 'error');
      this.limpiarInput(input);
      return;
    }

    const pesoNuevo = nuevos.reduce((total, file) => total + file.size, 0);
    const pesoTotal = this.pesoUsadoBytes() + pesoNuevo;

    if (pesoTotal > LIMITE_BYTES) {
      Swal.fire(
        'Peso excedido',
        `El tamaño total no puede superar ${LIMITE_MB} MB. ` +
          `Te quedan ${this.pesoRestanteMB()} MB disponibles.`,
        'error',
      );
      this.limpiarInput(input);
      return;
    }

    const validos: File[] = [];
    const invalidos: string[] = [];

    for (const file of nuevos) {
      if (TIPOS_PERMITIDOS.includes(file.type)) {
        validos.push(file);
      } else {
        invalidos.push(file.name);
      }
    }

    this.archivos.set([...actuales, ...validos]);
    this.errorArchivos.set(invalidos);

    if (invalidos.length > 0) {
      Swal.fire(
        'Archivo no permitido',
        `No permitidos: ${invalidos.join(', ')}. Solo PDF e imágenes (PNG, JPG, JPEG, WEBP).`,
        'error',
      );
    }

    this.limpiarInput(input);
  }

  private limpiarInput(input: HTMLInputElement): void {
    input.value = '';
  }

  removeFile(indice: number): void {
    this.archivos.set(this.archivos().filter((_, i) => i !== indice));
    this.errorArchivos.set([]);
  }

  // ── Envío ─────────────────────────────────────────────────────────────────

  async onEnviar(): Promise<void> {
    if (this.enviando()) return;

    if (!this.descripcion || !this.destino || !this.aceptaTerminos) {
      Swal.fire(
        'Campos incompletos',
        'Completa todos los campos obligatorios marcados con *',
        'error',
      );
      return;
    }

    await this.auth.ensureLoaded();

    const radicado = this.generarNumeroRadicado();

    const ticket: TicketPQRS = {
      clasificacion_usuario: this.config.tipo_solicitud,
      status: ESTADO.RADICADA,
      profile_id: this.auth.idUsuario(),
      phone: this.telefono,
      email: this.email,
      request: this.descripcion,
      destination: this.destino,
      ref_number: radicado,
      accept_terms: this.aceptaTerminos,
      archivos: this.archivos().map((file) => ({
        ruta: `pqrs/${radicado}/${file.name}`,
        nombre: file.name,
        file,
      })),
    };

    this.enviando.set(true);

    try {
      await this.supabase.insertarPQRS(ticket);
    } catch (error) {
      console.error('[PqrFormComponent.onEnviar]', error);
      Swal.fire(
        'Error',
        'Ocurrió un error inesperado en nuestro sistema. ¡Estamos trabajando para corregirlo!',
        'error',
      );
      return;
    } finally {
      this.enviando.set(false);
    }

    // Notificar DESPUÉS de persistir: antes se enviaba el correo de
    // "solicitud registrada" incluso cuando el insert fallaba, y el ciudadano
    // recibía un radicado que no existía.
    await this.notification.enviar('solicitud_registrada', this.email, {
      id: radicado,
      tipo: this.config.tipo_solicitud,
    });

    Swal.fire(
      `Número: ${radicado}`,
      'Su solicitud fue enviada exitosamente. Conserve el número de radicado: ' +
        'le servirá para consultar la respuesta.',
      'success',
    );

    this.limpiarFormulario();
  }

  /**
   * @todo El radicado se genera en el cliente, así que es falsificable y puede
   *   colisionar (1000 combinaciones por prefijo y día). Debe pasar a una
   *   secuencia de Postgres; ver Fase 2.
   */
  private generarNumeroRadicado(): string {
    const hoy = new Date();
    const fecha =
      `${hoy.getFullYear()}` +
      `${String(hoy.getMonth() + 1).padStart(2, '0')}` +
      `${String(hoy.getDate()).padStart(2, '0')}`;
    const aleatorio = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${this.config.radicadoPrefix}-${fecha}-${aleatorio}`;
  }

  private limpiarFormulario(): void {
    this.telefono = '';
    this.email = '';
    this.descripcion = '';
    this.destino = '';
    this.archivos.set([]);
    this.aceptaTerminos = false;
  }
}