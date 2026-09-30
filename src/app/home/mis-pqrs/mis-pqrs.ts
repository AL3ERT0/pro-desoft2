import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../core/auth/auth.service';
import { COLOR_ESTADO, type Estado } from '../../core/models/pqrs.types';
import { aEstado } from '../../core/utils/pqrs.utils';
import Swal from 'sweetalert2';
import type { TableRow } from '../../core/models/database.types';

@Component({
  selector: 'app-mis-pqrs',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './mis-pqrs.html',
  styleUrl: './mis-pqrs.scss',
})
export class MisPqrsComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly solicitudes = signal<TableRow<'requests'>[]>([]);
  readonly cargando = signal(true);

  readonly modalOpen = signal(false);
  readonly cargandoDetalle = signal(false);
  readonly solicitudSeleccionada = signal<TableRow<'requests'> | null>(null);
  readonly respuestaDetalle = signal<TableRow<'request_responses'> | null>(null);

  /** Evita mostrar una lista vacía si `profile_id` fuera nulo. */
  private readonly puedeConsultar = computed(() => this.auth.estaAutenticado());

  async ngOnInit(): Promise<void> {
    try {
      await this.auth.ensureLoaded();
      const usuarioId = this.auth.idUsuario();

      if (!usuarioId) {
        this.cargando.set(false);
        return;
      }

      const { data, error } = await this.supabase.client
        .from('requests')
        .select('*')
        .eq('profile_id', usuarioId)
        .order('created_at', { ascending: false });

      if (error) {
        await Swal.fire('Error', 'No se pudieron cargar tus solicitudes', 'error');
        return;
      }

      this.solicitudes.set(data ?? []);
    } catch (error) {
      console.error('[MisPqrsComponent.ngOnInit]', error);
      await Swal.fire('Error', 'Error inesperado al cargar', 'error');
    } finally {
      this.cargando.set(false);
    }
  }

  async verDetalle(solicitud: TableRow<'requests'>): Promise<void> {
    this.solicitudSeleccionada.set(solicitud);
    this.respuestaDetalle.set(null);
    this.modalOpen.set(true);
    this.cargandoDetalle.set(true);

    const { data } = await this.supabase.client
      .from('request_responses')
      .select('*')
      .eq('request_id', solicitud.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    this.respuestaDetalle.set(data);
    this.cargandoDetalle.set(false);
  }

  cerrarModal(): void {
    this.modalOpen.set(false);
    this.solicitudSeleccionada.set(null);
    this.respuestaDetalle.set(null);
  }

  /**
   * Antes comparaba contra 'resuelto' y 'en proceso', valores que la base de
   * datos nunca escribe: todos los estados salían con el color morado por
   * defecto. Ahora se resuelve contra el enum real.
   */
  colorEstado(estado: string | null | undefined): string {
    const canonical = aEstado(estado);
    return canonical ? COLOR_ESTADO[canonical as Estado] : '#94a3b8';
  }

  volver(): void {
    void this.router.navigate(['/dashboard']);
  }
}