import { CLASIFICACION, RADICADO_PREFIX, type Clasificacion } from '../core/models/pqrs.types';

// ─────────────────────────────────────────────
//  PQR CONFIG — fuente única de verdad
//  Aquí cambias textos, íconos, leyes, etc.
//  para las 4 páginas desde un solo lugar.
// ─────────────────────────────────────────────

export interface InfoBadge {
  icon: string;
  title: string;
  description: string;
}

export interface PqrConfig {
  /** Prefijo del radicado: PQRS-P-, PQRS-Q-, etc. */
  radicadoPrefix: string;
  /** Valor guardado en BD, p. ej. 'Petición'. */
  tipo_solicitud: Clasificacion;
  /** Ícono del encabezado del formulario */
  formIcon: string;
  /** Título del formulario: "Nueva Petición", "Nueva Queja"… */
  formTitle: string;
  /** Texto del botón enviar */
  submitLabel: string;
  /** Título del panel informativo lateral */
  infoPanelTitle: string;
  /** Párrafo explicativo del panel informativo */
  infoPanelDescription: string;
  /** Badges del panel informativo */
  infoBadges: InfoBadge[];
  /** Texto legal inferior del panel */
  legalText: string;
  /** URL del botón "Ver ley" */
  legalUrl: string;
  /** Etiqueta del botón "Ver ley" */
  legalLabel: string;
}

const LEY_1755_URL = 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334';
const LEY_1755_LABEL = 'Ver Ley 1755 del 2015';
const LEY_1755_TEXTO = 'Ley 1755 de 2015 · Art. 23 C.P.';

/** Badges comunes a los cuatro derechos; solo cambia el título del primero. */
function badges(primerTitulo: string): InfoBadge[] {
  return [
    {
      icon: '📋',
      title: primerTitulo,
      description: 'Protegido por la Constitución Política de Colombia, Art. 23',
    },
    {
      icon: '⏱️',
      title: 'Tiempo de respuesta',
      description: 'Máximo 15 días hábiles según la Ley 1755 de 2015',
    },
    {
      icon: '🔒',
      title: 'Datos protegidos',
      description: 'Tratamiento conforme a la Ley 1581 de 2012',
    },
  ];
}

export const PQR_CONFIGS: Record<'peticion' | 'queja' | 'reclamo' | 'sugerencia', PqrConfig> = {
  peticion: {
    radicadoPrefix: RADICADO_PREFIX.PETICION,
    tipo_solicitud: CLASIFICACION.PETICION,
    formIcon: '📩',
    formTitle: 'Nueva Petición',
    submitLabel: '📩 Enviar Petición',
    infoPanelTitle: '¿Qué es una petición?',
    infoPanelDescription:
      'Una petición es el derecho que tiene todo ciudadano de presentar solicitudes respetuosas a las autoridades por motivos de interés general o particular.',
    infoBadges: badges('Derecho de petición'),
    legalText: LEY_1755_TEXTO,
    legalUrl: LEY_1755_URL,
    legalLabel: LEY_1755_LABEL,
  },

  queja: {
    radicadoPrefix: RADICADO_PREFIX.QUEJA,
    tipo_solicitud: CLASIFICACION.QUEJA,
    formIcon: '⚠️',
    formTitle: 'Nueva Queja',
    submitLabel: '⚠️ Enviar Queja',
    infoPanelTitle: '¿Qué es una queja?',
    infoPanelDescription:
      'Una queja es la manifestación de protesta, censura o descontento que formula una persona por la conducta irregular de un servidor público.',
    infoBadges: badges('Derecho de queja'),
    legalText: LEY_1755_TEXTO,
    legalUrl: LEY_1755_URL,
    legalLabel: LEY_1755_LABEL,
  },

  reclamo: {
    radicadoPrefix: RADICADO_PREFIX.RECLAMO,
    tipo_solicitud: CLASIFICACION.RECLAMO,
    formIcon: '📢',
    formTitle: 'Nuevo Reclamo',
    submitLabel: '📢 Enviar Reclamo',
    infoPanelTitle: '¿Qué es un reclamo?',
    infoPanelDescription:
      'Un reclamo es el derecho que tiene el ciudadano de exigir, reivindicar o demandar una solución ante la suspensión injustificada o la prestación deficiente de un servicio.',
    infoBadges: badges('Derecho de reclamo'),
    legalText: LEY_1755_TEXTO,
    legalUrl: LEY_1755_URL,
    legalLabel: LEY_1755_LABEL,
  },

  sugerencia: {
    radicadoPrefix: RADICADO_PREFIX.SUGERENCIA,
    tipo_solicitud: CLASIFICACION.SUGERENCIA,
    formIcon: '💡',
    formTitle: 'Nueva Sugerencia',
    submitLabel: '💡 Enviar Sugerencia',
    infoPanelTitle: '¿Qué es una sugerencia?',
    infoPanelDescription:
      'Una sugerencia es la propuesta que presenta un ciudadano para mejorar los procesos, corregir fallas o para reconocer el buen trato recibido.',
    // La sugerencia no es un derecho de petición sujeto a plazo en la Ley 1755,
    // así que sus badges dicen eso explícitamente en vez de inventar un número.
    infoBadges: [
      {
        icon: '📋',
        title: 'Sugerencia constructiva',
        description: 'No es un derecho de petición; se tramita como mejora institucional',
      },
      {
        icon: '⏱️',
        title: 'Tiempo de respuesta',
        description: 'No está sujeta a plazo legal (Ley 1755 de 2015, Art. 14)',
      },
      {
        icon: '🔒',
        title: 'Datos protegidos',
        description: 'Tratamiento conforme a la Ley 1581 de 2012',
      },
    ],
    legalText: LEY_1755_TEXTO,
    legalUrl: LEY_1755_URL,
    legalLabel: LEY_1755_LABEL,
  },
};