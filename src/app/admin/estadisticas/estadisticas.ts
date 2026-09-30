import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { SupabaseService } from '../../services/supabase.service';
import {
  CLASIFICACION,
  COLOR_ESTADO,
  ESTADO,
  ICONO_CLASIFICACION,
  PLAZO_DIAS_HABILES,
  TODAS_CLASIFICACIONES,
  type Clasificacion,
  type Estado,
} from '../../core/models/pqrs.types';
import { aClasificacion, aEstado, diasHabilesEntre, normalizar } from '../../core/utils/pqrs.utils';
import type { TableRow } from '../../core/models/database.types';

type Solicitud = TableRow<'requests'>;

interface Radicado {
  numero: string;
  tipo: string;
  estado: string;
  color: string;
  fecha: string;
  diasHabiles: number;
  diasCalendario: number;
  plazo: number;
  vencido: boolean;
}

interface KpiTiempo {
  tipo: Clasificacion;
  icono: string;
  promedio: number;
  limite: number;
  pendientes: number;
  vencidos: number;
}

/**
 * Reporte de cumplimiento de la Ley 1755 de 2015.
 *
 * Antes leía `requests.updated_at`, columna que NO existe en la base de datos.
 * El valor era siempre `undefined`, así que la fecha de cierre caía siempre en
 * `new Date()` y los radicados ya solucionados seguían acumulando días: el
 * reporte de cumplimiento estaba permanentemente sobreestimado. La fecha real
 * de respuesta es `request_responses.created_at`.
 */
@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.scss',
})
export class EstadisticasComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly cargando = signal(true);
  readonly radicados = signal<Radicado[]>([]);
  readonly kpiTiempos = signal<KpiTiempo[]>([]);
  readonly errorCarga = signal<string | null>(null);

  private readonly solicitudes = signal<Solicitud[]>([]);
  /** `requests.id` → fecha de la respuesta más reciente. */
  private readonly fechaRespuesta = signal<ReadonlyMap<string, string>>(new Map());

  readonly totales = computed(() => {
    const conteo = {
      [CLASIFICACION.PETICION]: 0,
      [CLASIFICACION.QUEJA]: 0,
      [CLASIFICACION.RECLAMO]: 0,
      [CLASIFICACION.SUGERENCIA]: 0,
      total: 0,
    };
    for (const solicitud of this.solicitudes()) {
      const tipo = aClasificacion(solicitud.clasificacion_usuario);
      if (tipo) {
        conteo[tipo]++;
        conteo.total++;
      }
    }
    return conteo;
  });

  /** Tarjetas del encabezado, en orden fijo y con su ícono. */
  readonly resumenTipos = computed(() =>
    TODAS_CLASIFICACIONES.map((tipo) => ({
      tipo,
      icono: ICONO_CLASIFICACION[tipo],
      cantidad: this.totales()[tipo],
    })),
  );

  /** Estados presentes en la BD, para no iterar un catálogo fijo inventado. */
  readonly estados = computed(() => {
    const conteo = new Map<Estado, number>();
    for (const solicitud of this.solicitudes()) {
      const estado = aEstado(solicitud.status);
      if (estado) conteo.set(estado, (conteo.get(estado) ?? 0) + 1);
    }
    return [...conteo.entries()].map(([estado, count]) => ({
      label: estado,
      count,
      color: COLOR_ESTADO[estado],
    }));
  });

  readonly tablaDetalle = computed(() =>
    TODAS_CLASIFICACIONES.map((tipo) => {
      const delTipo = this.solicitudes().filter(
        (s) => aClasificacion(s.clasificacion_usuario) === tipo,
      );
      const porEstado = (estado: Estado) =>
        delTipo.filter((s) => aEstado(s.status) === estado).length;

      return {
        tipo,
        total: delTipo.length,
        radicadas: porEstado(ESTADO.RADICADA),
        asignadas: porEstado(ESTADO.ASIGNADA),
        solucionadas: porEstado(ESTADO.SOLUCIONADA),
      };
    }),
  );

  async ngOnInit(): Promise<void> {
    try {
      const [solicitudes, respuestas] = await Promise.all([
        this.cargarSolicitudes(),
        this.cargarFechasRespuesta(),
      ]);

      this.solicitudes.set(solicitudes);
      this.fechaRespuesta.set(respuestas);
      this.construirRadicados();
      this.construirKpis();
    } catch (error) {
      console.error('[EstadisticasComponent.ngOnInit]', error);
      this.errorCarga.set('No se pudieron cargar las estadísticas');
      await Swal.fire('Error', this.errorCarga() ?? 'Error desconocido', 'error');
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargarSolicitudes(): Promise<Solicitud[]> {
    const { data, error } = await this.supabase.client.from('requests').select('*');
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /** Reduce las respuestas a `request_id` → fecha más reciente. */
  private async cargarFechasRespuesta(): Promise<ReadonlyMap<string, string>> {
    const { data, error } = await this.supabase.client
      .from('request_responses')
      .select('request_id, created_at');

    if (error) throw new Error(error.message);

    const fechas = new Map<string, string>();
    for (const respuesta of data ?? []) {
      if (!respuesta.request_id || !respuesta.created_at) continue;
      const previa = fechas.get(respuesta.request_id);
      if (!previa || respuesta.created_at > previa) {
        fechas.set(respuesta.request_id, respuesta.created_at);
      }
    }
    return fechas;
  }

  private construirRadicados(): void {
    const fechas = this.fechaRespuesta();
    const ahora = new Date();

    const radicados = this.solicitudes().map((solicitud): Radicado => {
      const radicada = solicitud.created_at ? new Date(solicitud.created_at) : null;
      const cerrada = fechas.get(solicitud.id);
      const estado = aEstado(solicitud.status);
      const tipo = aClasificacion(solicitud.clasificacion_usuario);

      const fechaCierre = cerrada ? new Date(cerrada) : null;
      const referencia = fechaCierre ?? ahora;

      const diasHabiles = radicada ? diasHabilesEntre(radicada, referencia) : 0;
      const diasCalendario = radicada
        ? Math.max(0, Math.floor((referencia.getTime() - radicada.getTime()) / 86_400_000))
        : 0;

      const plazo = tipo ? PLAZO_DIAS_HABILES[tipo] : 0;
      const respondida = estado === ESTADO.SOLUCIONADA && fechaCierre !== null;

      return {
        numero: solicitud.ref_number ?? 'SIN RADICADO',
        tipo: solicitud.clasificacion_usuario ?? 'N/A',
        estado: solicitud.status ?? 'N/A',
        color: estado ? COLOR_ESTADO[estado] : '#94a3b8',
        fecha: radicada ? radicada.toLocaleDateString('es-CO') : 'N/A',
        diasHabiles,
        diasCalendario,
        plazo,
        vencido: !respondida && plazo > 0 && diasHabiles > plazo,
      };
    });

    // Vencidos primero: es lo que una oficina de PQRSD necesita ver antes que nada.
    radicados.sort(
      (a, b) => Number(b.vencido) - Number(a.vencido) || b.diasHabiles - a.diasHabiles,
    );

    this.radicados.set(radicados);
  }

  private construirKpis(): void {
    const radicados = this.radicados();

    this.kpiTiempos.set(
      TODAS_CLASIFICACIONES.map((tipo) => {
        const delTipo = radicados.filter((r) => normalizar(r.tipo) === normalizar(tipo));
        const cerrados = delTipo.filter((r) => r.estado === ESTADO.SOLUCIONADA);

        const promedio = cerrados.length
          ? Math.round((cerrados.reduce((suma, r) => suma + r.diasHabiles, 0) / cerrados.length) * 10) /
            10
          : 0;

        return {
          tipo,
          icono: ICONO_CLASIFICACION[tipo],
          promedio,
          limite: PLAZO_DIAS_HABILES[tipo],
          pendientes: delTipo.length - cerrados.length,
          vencidos: delTipo.filter((r) => r.vencido).length,
        };
      }),
    );
  }

  volver(): void {
    void this.router.navigate(['/admin']);
  }
}