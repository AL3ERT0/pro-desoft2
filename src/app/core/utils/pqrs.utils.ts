import { CLASIFICACION, ESTADO, type Clasificacion, type Estado } from '../models/pqrs.types';

/**
 * Quita acentos y pasa a minúsculas para comparar valores que vienen de la BD
 * contra las constantes de dominio sin depender de cómo se escribieron.
 * "Asignada en área" y "asignada en area" colapsan al mismo valor.
 */
export function normalizar(texto: string | null | undefined): string {
  return (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Devuelve el estado canónico, o null si la BD tiene un valor desconocido. */
export function aEstado(valor: string | null | undefined): Estado | null {
  const n = normalizar(valor);
  return Object.values(ESTADO).find((e) => normalizar(e) === n) ?? null;
}

/** Devuelve la clasificación canónica, o null si la BD tiene un valor desconocido. */
export function aClasificacion(valor: string | null | undefined): Clasificacion | null {
  const n = normalizar(valor);
  return Object.values(CLASIFICACION).find((c) => normalizar(c) === n) ?? null;
}

/**
 * Días hábiles transcurridos entre dos fechas, excluyendo sábados, domingos y
 * los festivos del calendario laboral colombiano (Ley 1755 de 2015, Art. 6).
 *
 * No cuenta el día inicial: el plazo legal corre "dentro de los quince días
 * siguientes" a la radicación.
 */
export function diasHabilesEntre(desde: Date, hasta: Date): number {
  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) return 0;

  const cursor = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const fin = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  if (fin <= cursor) return 0;

  let dias = 0;
  while (cursor < fin) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6 && !esFestivo(cursor)) {
      dias++;
    }
  }
  return dias;
}

/**
 * Feriados de fecha fija: no se trasladan aunque caigan en domingo.
 * Mes y día, 1-indexados.
 */
const FERIADOS_FIJOS: ReadonlyMap<string, readonly number[]> = new Map([
  ['1', [1]], //       Año Nuevo
  ['5', [1]], //       Día del Trabajo
  ['7', [20]], //      Independencia
  ['8', [7]], //       Batalla de Boyacá
  ['12', [8, 25]], //  Inmaculada Concepción, Navidad
]);

/**
 * Feriados que la ley traslada al siguiente lunes cuando no caen en lunes.
 * 19 de abril (San Pedro) no se traslada cuando cae entre el 22 y el 28 de abril
 * ni entre el 1 y el 6 de mayo, por eso se maneja aparte.
 */
const FERIADOS_TRASLADABLES: ReadonlyMap<string, readonly number[]> = new Map([
  ['1', [6]], //     Día de los Reyes Magos
  ['3', [22]], //    San José
  ['6', [29]], //    San Pedro y San Pablo
  ['10', [12]], //   Día de la Raza
  ['11', [1]], //    Día de Todos los Santos
  ['11', [11]], //   Independencia de Cartagena
]);

/** Lunes de Semana Santa: 19 días antes del Domingo de Resurrección. */
function lunesDeSemanaSanta(anio: number): Date {
  const pascua = calculoPascua(anio);
  return new Date(pascua.getFullYear(), pascua.getMonth(), pascua.getDate() - 19);
}

export function esFestivo(fecha: Date): boolean {
  const dia = fecha.getDate();
  const mes = String(fecha.getMonth() + 1);
  const esLunes = fecha.getDay() === 1;

  if (FERIADOS_FIJOS.get(mes)?.includes(dia)) return true;

  const trasladables = FERIADOS_TRASLADABLES.get(mes);
  if (trasladables?.includes(dia)) {
    // San Pedro solo se traslada si no cae en la semana de San Jorge.
    const esSanPedro = mes === '4' && dia === 19;
    if (esSanPedro && esSemanaDeSanJorge(fecha)) return true;
    return !esLunes;
  }

  return esMismoDia(fecha, lunesDeSemanaSanta(fecha.getFullYear()));
}

/** Semana de San Jorge: 22–28 de abril y 1–6 de mayo. */
function esSemanaDeSanJorge(fecha: Date): boolean {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  return (mes === 4 && dia >= 22 && dia <= 28) || (mes === 5 && dia >= 1 && dia <= 6);
}

/** Algoritmo de Meeus/Jones/Butcher para el Domingo de Resurrección. */
function calculoPascua(anio: number): Date {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anio, mes - 1, dia);
}

function esMismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}