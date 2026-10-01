import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { SupabaseService, BUCKET_PQRS } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../core/auth/auth.service';
import {
  CLASIFICACION,
  TODAS_CLASIFICACIONES,
  type Clasificacion,
} from '../../core/models/pqrs.types';
import type { TableRow } from '../../core/models/database.types';
import { ChromeBannerComponent, ChromeContactComponent, ChromeFooterComponent } from '../../shared/chrome';

type Solicitud = TableRow<'requests'> & { archivos: TableRow<'request_paths'>[] };

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ChromeBannerComponent, ChromeContactComponent, ChromeFooterComponent],
  templateUrl: './solicitudes.html',
  styleUrls: ['./solicitudes.scss'],
})
export class SolicitudesComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly notification = inject(NotificationService);
  private readonly auth = inject(AuthService);

  readonly solicitudes = signal<Solicitud[]>([]);
  readonly cargando = signal(true);
  readonly modalOpen = signal(false);
  readonly enviandoRespuesta = signal(false);

  readonly selectedSolicitud = signal<Solicitud | null>(null);
  readonly remitente = signal<TableRow<'profiles'> | null>(null);
  respuesta = '';

  readonly reclasificacionOpen = signal(false);
  nuevaClasificacion: Clasificacion | '' = '';

  readonly clasificaciones = TODAS_CLASIFICACIONES;

  async ngOnInit(): Promise<void> {
    await this.cargarSolicitudes();
  }

  // ── Reclasificación ──────────────────────────────────────────────────────

  openReclasificacion(): void {
    const actual = this.selectedSolicitud();
    this.nuevaClasificacion =
      (actual?.clasificacion_funcionario as Clasificacion | null) ??
      (actual?.clasificacion_usuario as Clasificacion | null) ??
      CLASIFICACION.PETICION;
    this.reclasificacionOpen.set(true);
  }

  closeReclasificacion(): void {
    this.reclasificacionOpen.set(false);
    this.nuevaClasificacion = '';
  }

  async guardarReclasificacion(): Promise<void> {
    const solicitud = this.selectedSolicitud();
    if (!solicitud || !this.nuevaClasificacion) {
      await Swal.fire('Atención', 'Debes seleccionar una clasificación', 'warning');
      return;
    }

    const { error } = await this.supabase.client
      .from('requests')
      .update({
        clasificacion_funcionario: this.nuevaClasificacion,
        pendiente_reclasificacion: false,
      })
      .eq('id', solicitud.id);

    if (error) {
      await Swal.fire('Error', 'No se pudo guardar la reclasificación: ' + error.message, 'error');
      return;
    }

    const { nombre } = this.datosRemitente(solicitud);

    await this.notification.enviar('cambio_clasificacion', solicitud.email ?? '', {
      id: solicitud.ref_number ?? '',
      nombre,
      clasificacion: this.nuevaClasificacion,
    });

    this.closeReclasificacion();
    await Swal.fire('Listo', 'Solicitud reclasificada correctamente', 'success');
    await this.cargarSolicitudes();
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  async openModal(solicitud: Solicitud): Promise<void> {
    this.selectedSolicitud.set(solicitud);
    this.respuesta = '';
    this.modalOpen.set(true);

    const remitente = solicitud.profile_id
      ? await this.supabase.getPerfil(solicitud.profile_id)
      : null;
    this.remitente.set( remitente);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.selectedSolicitud.set(null);
    this.remitente.set(null);
    this.respuesta = '';
    this.reclasificacionOpen.set(false);
  }

  // ── Datos ────────────────────────────────────────────────────────────────

  /**
   * Una sola consulta con `request_paths` embebido, en lugar de una por
   * solicitud. Con 500 asignaciones esto era 501 round-trips.
   */
  private async cargarSolicitudes(): Promise<void> {
    this.cargando.set(true);

    try {
      await this.auth.ensureLoaded();
      const funcionarioId = this.auth.idUsuario();

      if (!funcionarioId) {
        this.solicitudes.set([]);
        return;
      }

      const { data, error } = await this.supabase.client
        .from('requests')
        .select('*, request_paths(*)')
        .eq('func_id', funcionarioId)
        .order('created_at', { ascending: true });

      if (error) {
        await Swal.fire('Error', 'No se pudieron cargar las solicitudes', 'error');
        return;
      }

      // El ORM tipa el embed como objeto único aunque la relación sea 1:N, así
      // que se normaliza aquí en vez de asumir `[]`.
      this.solicitudes.set(
        (data ?? []).map((fila) => {
          const embebido = fila.request_paths;
          const archivos: TableRow<'request_paths'>[] = Array.isArray(embebido)
            ? embebido
            : embebido
              ? [embebido]
              : [];
          return { ...(fila as TableRow<'requests'>), archivos };
        }),
      );
    } catch (error) {
      console.error('[SolicitudesComponent.cargarSolicitudes]', error);
      await Swal.fire('Error', 'Error inesperado al cargar las solicitudes', 'error');
    } finally {
      this.cargando.set(false);
    }
  }

  /** `requests` no tiene columna `nombre`; se arma desde `profiles` o el email. */
  private datosRemitente(solicitud: Solicitud): { nombre: string; correo: string } {
    const remitente = this.remitente();
    const nombre =
      [remitente?.name, remitente?.surname].filter(Boolean).join(' ').trim() ||
      solicitud.email ||
      '';
    return { nombre, correo: solicitud.email ?? '' };
  }

  // ── Adjuntos ─────────────────────────────────────────────────────────────

  async descargarArchivo(ruta: TableRow<'request_paths'>): Promise<void> {
    if (!ruta.filepath) return;

    const { data, error } = await this.supabase.client.storage
      .from(BUCKET_PQRS)
      .download(ruta.filepath);

    if (error) {
      await Swal.fire('Error', `No se pudo descargar ${ruta.filename}: ${error.message}`, 'error');
      return;
    }

    const url = URL.createObjectURL(data);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = ruta.filename ?? ruta.filepath.split('/').pop() ?? 'adjunto';
    enlace.click();
    // El revoke inmediato puede.cancelar la descarga en algunos navegadores;
    // se difiere un tick.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  // ── Respuesta ────────────────────────────────────────────────────────────

  async responder(): Promise<void> {
    const solicitud = this.selectedSolicitud();
    const texto = this.respuesta.trim();

    if (!solicitud) return;

    if (!texto) {
      await Swal.fire('Campo vacío', 'Escribe una respuesta antes de enviar.', 'warning');
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: '¿Enviar respuesta?',
      html: `<p style="text-align:left">Radicado: <strong>${solicitud.ref_number}</strong></p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4f46e5',
    });

    if (!isConfirmed) return;

    this.enviandoRespuesta.set(true);

    try {
      const { error: errorRespuesta } = await this.supabase.client
        .from('request_responses')
        .insert({ request_id: solicitud.id, response: texto });

      if (errorRespuesta) {
        throw new Error(errorRespuesta.message);
      }

      const { error: errorEstado } = await this.supabase.client
        .from('requests')
        .update({ status: 'Solucionada' })
        .eq('id', solicitud.id);

      if (errorEstado) {
        // La respuesta ya quedó guardada: avisar en vez de fallar en silencio.
        await Swal.fire(
          'Atención',
          'La respuesta se guardó, pero no se pudo actualizar el estado de la solicitud. ' +
            'Revísala manualmente.',
          'warning',
        );
      }

      const { nombre, correo } = this.datosRemitente(solicitud);
      await this.notification.enviar('solicitud_respondida', correo, {
        id: solicitud.ref_number ?? '',
        nombre,
        respuesta: texto,
      });

      await Swal.fire('Enviado ✓', 'Respuesta enviada correctamente.', 'success');
      this.closeModal();
      await this.cargarSolicitudes();
    } catch (error) {
      console.error('[SolicitudesComponent.responder]', error);
      await Swal.fire('Error', `No se pudo enviar la respuesta: ${(error as Error).message}`, 'error');
    } finally {
      this.enviandoRespuesta.set(false);
    }
  }
}