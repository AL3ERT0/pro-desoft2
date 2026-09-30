/**
 * Vocabulario de dominio. Antes de existir, estos valores vivían como strings
 * sueltos repetidos en 6+ archivos, lo que ya había activado dos bugs:
 *  - `mis-pqrs.getEstadoColor` buscaba 'resuelto'/'en proceso', valores que
 *    la BD nunca escribió, así que todos los estados salían del color por defecto.
 *  - `estadisticas` usaba plazos de 15/15/15/10 mientras `pqrs-config` decía
 *    15/15/15/30, para los mismos cuatro tipos.
 *
 * Si la BD cambia un valor, se cambia aquí y el compilador encuentra los usos.
 */

/** Nombres exactos en la tabla `profile_roles`. */
export const ROL = {
  USUARIO: 'Usuario',
  FUNCIONARIO: 'Funcionario',
  ADMIN: 'Admin',
} as const;
export type Rol = (typeof ROL)[keyof typeof ROL];

/** Estados exactos escritos en `requests.status`. */
export const ESTADO = {
  RADICADA: 'Radicada',
  ASIGNADA: 'Asignada en area',
  SOLUCIONADA: 'Solucionada',
} as const;
export type Estado = (typeof ESTADO)[keyof typeof ESTADO];

/** Valores exactos escritos en `requests.clasificacion_usuario`. */
export const CLASIFICACION = {
  PETICION: 'Petición',
  QUEJA: 'Queja',
  RECLAMO: 'Reclamo',
  SUGERENCIA: 'Sugerencia',
} as const;
export type Clasificacion = (typeof CLASIFICACION)[keyof typeof CLASIFICACION];

/** Prefijo de radicado por tipo, usado en `PQR_CONFIGS`. */
export const RADICADO_PREFIX = {
  PETICION: 'PQRS-P',
  QUEJA: 'PQRS-Q',
  RECLAMO: 'PQRS-R',
  SUGERENCIA: 'PQRS-S',
} as const;

export const TODAS_CLASIFICACIONES: readonly Clasificacion[] = [
  CLASIFICACION.PETICION,
  CLASIFICACION.QUEJA,
  CLASIFICACION.RECLAMO,
  CLASIFICACION.SUGERENCIA,
];

export const COLOR_ESTADO: Record<Estado, string> = {
  [ESTADO.RADICADA]: '#870fa2',
  [ESTADO.ASIGNADA]: '#f59e0b',
  [ESTADO.SOLUCIONADA]: '#22c55e',
};

export const ICONO_CLASIFICACION: Record<Clasificacion, string> = {
  [CLASIFICACION.PETICION]: '📩',
  [CLASIFICACION.QUEJA]: '⚠️',
  [CLASIFICACION.RECLAMO]: '🛠️',
  [CLASIFICACION.SUGERENCIA]: '💡',
};

/**
 * Días hábiles de respuesta según la Ley 1755 de 2015 (Art. 14).
 *
 * @todo La sugerencia NO es un derecho de petición sujeto a plazo en la Ley 1755,
 *   así que 15 días es una decisión de política interna, no un requisito legal.
 *   Antes el valor era 30 en `pqrs-config.ts` y 10 en `estadisticas.ts`.
 *   Requiere confirmación de la oficina jurídica antes de publicar el reporte.
 */
export const PLAZO_DIAS_HABILES: Record<Clasificacion, number> = {
  [CLASIFICACION.PETICION]: 15,
  [CLASIFICACION.QUEJA]: 15,
  [CLASIFICACION.RECLAMO]: 15,
  [CLASIFICACION.SUGERENCIA]: 15,
};