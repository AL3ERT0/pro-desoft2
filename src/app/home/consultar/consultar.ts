import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { SupabaseService } from '../../services/supabase.service';
import type { TableRow } from '../../core/models/database.types';

@Component({
  selector: 'app-consultar',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './consultar.html',
  styleUrl: './consultar.scss',
})
export class ConsultarComponent {
  private readonly supabase = inject(SupabaseService);

  numeroRadicado = '';
  readonly consultando = signal(false);

  readonly ticket = signal<
    (Pick<TableRow<'requests'>, 'id' | 'clasificacion_usuario' | 'status' | 'created_at'> & {
      respuesta: Pick<TableRow<'request_responses'>, 'response' | 'created_at'> | null;
    }) | null
  >(null);

  async consultarPQRS(): Promise<void> {
    const radicado = this.numeroRadicado.trim();

    if (!radicado) {
      await Swal.fire('Error', 'Ingresa el número de radicado', 'error');
      return;
    }

    this.consultando.set(true);

    try {
      const solicitud = await this.supabase.consultarPQRS(radicado);

      if (!solicitud) {
        this.ticket.set(null);
        await Swal.fire('Error', 'No se encontró el PQRS con ese número de radicado', 'error');
        return;
      }

      const { data: respuesta } = await this.supabase.client
        .from('request_responses')
        .select('response, created_at')
        .eq('request_id', solicitud.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      this.ticket.set({ ...solicitud, respuesta: respuesta ?? null });
    } catch (error) {
      console.error('[ConsultarComponent.consultarPQRS]', error);
      await Swal.fire('Error', 'Error inesperado al consultar el PQRS', 'error');
    } finally {
      this.consultando.set(false);
    }
  }
}