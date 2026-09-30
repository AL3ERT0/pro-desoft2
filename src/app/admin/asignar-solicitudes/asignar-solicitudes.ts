import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../core/auth/auth.service';
import { ESTADO } from '../../core/models/pqrs.types';
import type { TableRow } from '../../core/models/database.types';

type Solicitud = TableRow<'requests'> & { func_id?: string | null };

@Component({
  selector: 'app-asignar-solicitudes',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './asignar-solicitudes.html',
  styleUrls: ['./asignar-solicitudes.scss'],
})
export class AsignarSolicitudesComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly notification = inject(NotificationService);
  private readonly auth = inject(AuthService);

  readonly solicitudes = signal<Solicitud[]>([]);
  readonly funcionarios = signal<TableRow<'profiles'>[]>([]);
  readonly cargando = signal(true);
  readonly asignandoId = signal<string | null>(null);

  /** Nombre legible de un funcionario, para los rótulos de la interfaz. */
  nombreDe(funcionario: TableRow<'profiles'>): string {
    const nombre = [funcionario.name, funcionario.surname].filter(Boolean).join(' ').trim();
    return nombre || funcionario.dni || 'Funcionario sin nombre';
  }

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const [solicitudes, funcionarios] = await Promise.all([
        this.cargarSolicitudes(),
        this.cargarFuncionarios(),
      ]);
      this.solicitudes.set(solicitudes);
      this.funcionarios.set(funcionarios);
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargarSolicitudes(): Promise<Solicitud[]> {
    const { data, error } = await this.supabase.client
      .from('requests')
      .select('*')
      .is('func_id', null)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  private async cargarFuncionarios(): Promise<TableRow<'profiles'>[]> {
    const { data: rol, error: errorRol } = await this.supabase.client
      .from('profile_roles')
      .select('id')
      .eq('name', 'Funcionario')
      .maybeSingle();

    if (errorRol || !rol) throw new Error(errorRol?.message ?? 'No se encontró el rol Funcionario');

    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('role_id', rol.id)
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async asignarSolicitud(solicitud: Solicitud): Promise<void> {
    const funcionarioId = solicitud.func_id;

    if (!funcionarioId) {
      await Swal.fire('Error', 'Seleccione un funcionario', 'error');
      return;
    }

    this.asignandoId.set(solicitud.id);

    try {
      await this.auth.ensureLoaded();
      const asignador = this.auth.nombreMostrar() || this.auth.email();

      const { error } = await this.supabase.client
        .from('requests')
        .update({
          func_id: funcionarioId,
          status: ESTADO.ASIGNADA,
          quien_asigno_solicitud: asignador,
        })
        .eq('id', solicitud.id);

      if (error) throw new Error(error.message);

      /**
       * El nombre del ciudadano salía de `solicitud.nombre`, columna que NO
       * existe en `requests`: siempre caía al correo, así que la notificación
       * llegaba con el email donde debía ir el nombre.
       */
      const destinatario = await this.nombreSolicitante(solicitud);

      await this.notification.enviar('cambio_estado', solicitud.email ?? '', {
        id: solicitud.ref_number ?? '',
        nombre: destinatario,
        estado: ESTADO.ASIGNADA,
      });

      await Swal.fire('¡Asignada!', 'Solicitud asignada correctamente a un funcionario', 'success');
      await this.cargar();
    } catch (error) {
      console.error('[AsignarSolicitudesComponent.asignarSolicitud]', error);
      await Swal.fire(
        'Error',
        `No se pudo asignar la solicitud: ${(error as Error).message}`,
        'error',
      );
    } finally {
      this.asignandoId.set(null);
    }
  }

  /** `requests` no guarda el nombre; hay que leerlo de `profiles`. */
  private async nombreSolicitante(solicitud: Solicitud): Promise<string> {
    if (!solicitud.profile_id) return solicitud.email ?? '';
    const perfil = await this.supabase.getPerfil(solicitud.profile_id);
    const nombre = [perfil?.name, perfil?.surname].filter(Boolean).join(' ').trim();
    return nombre || solicitud.email || '';
  }
}