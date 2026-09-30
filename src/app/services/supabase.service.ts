import { Injectable, inject } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import type { Database, TableInsert, TableRow } from '../core/models/database.types';
import type { Clasificacion, Estado } from '../core/models/pqrs.types';

/** Bucket de Supabase Storage. El nombre lleva espacio y es case-sensitive. */
export const BUCKET_PQRS = 'pqrs files';

export type ArchivoAdjunto = {
  ruta: string;
  nombre: string;
  file: File;
};

export type TicketPQRS = {
  clasificacion_usuario: Clasificacion;
  status: Estado;
  profile_id: string | null;
  phone: string;
  email: string;
  request: string;
  destination: string;
  ref_number: string;
  accept_terms: boolean;
  archivos: ArchivoAdjunto[];
};

export type TipoCatalogo = 'departments' | 'document_types' | 'ethnic_groups';

/**
 * Acceso a Supabase.
 *
 * El cliente es público por diseño (la publishable key viaja en el bundle), así
 * que este servicio NO es una frontera de seguridad: lo es RLS en Postgres.
 * Aquí solo se centraliza el acceso a datos para que exista un único lugar donde
 * cambiar un esquema o una consulta.
 *
 * Nota: varias pantallas siguen consultando `client.from(...)` directamente.
 * Pendiente moverlas a un `RequestsRepository` (Fase 2).
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient<Database>;

  constructor() {
    this.client = createClient<Database>(
      environment.supabase.url,
      environment.supabase.publishableKey,
    );
  }

  // ── Autenticación ────────────────────────────────────────────────────────

  async signIn(email: string, password: string) {
    return await this.client.auth.signInWithPassword({ email, password });
  }

  async signUp(datos: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    numeroDocumento: string;
    tipoDocumentoId: string;
    sexo: string;
    edad: number;
    grupoEtnicoId: string;
    ciudadId: string;
  }) {
    return await this.client.auth.signUp({
      email: datos.email,
      password: datos.password,
      options: {
        data: {
          full_name: datos.nombre,
          full_surname: datos.apellido,
          dni: datos.numeroDocumento,
          dni_type_id: datos.tipoDocumentoId,
          sex: datos.sexo,
          age: datos.edad,
          ethnic_group_id: datos.grupoEtnicoId,
          city_id: datos.ciudadId,
          role: 'Usuario',
        },
      },
    });
  }

  async signOut() {
    return await this.client.auth.signOut();
  }

  async getSession() {
    return await this.client.auth.getSession();
  }

  // ── Catálogos ────────────────────────────────────────────────────────────

  private async listarCatalogo(tabla: TipoCatalogo) {
    return await this.client
      .from(tabla)
      .select('id, name')
      .order('name', { ascending: true });
  }

  async selectEthnicGroup() {
    return await this.listarCatalogo('ethnic_groups');
  }

  async selectDocumentTypes() {
    return await this.listarCatalogo('document_types');
  }

  async selectDepartments() {
    return await this.listarCatalogo('departments');
  }

  async selectCities(departmentId: string) {
    return await this.client
      .from('cities')
      .select('id, name')
      .eq('department_id', departmentId)
      .order('name', { ascending: true });
  }

  // ── Perfiles ─────────────────────────────────────────────────────────────

  /** Perfil por id de usuario. `id` es el mismo UUID de `auth.users.id`. */
  async getPerfil(id: string): Promise<TableRow<'profiles'> | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseService.getPerfil]', error.message);
      return null;
    }
    return data;
  }

  /**
   * Verifica si un documento ya está registrado.
   *
   * ATENCIÓN: el registro no escribe `profiles.dni`; solo guarda el documento en
   * `user_metadata`. Si el trigger que crea el perfil no lo puebla, esta
   * comprobación siempre devuelve `false` y se permiten documentos duplicados.
   * Pendiente: confirmar qué columna indexa el trigger.
   */
  async documentoYaExiste(dni: string): Promise<boolean> {
    const { data } = await this.client
      .from('profiles')
      .select('id')
      .eq('dni', dni)
      .maybeSingle();
    return data !== null;
  }

  // ── PQRS ─────────────────────────────────────────────────────────────────

  /**
   * Radica una PQRS. Sube los adjuntos al Storage y persiste la solicitud más
   * sus archivos en `request_paths`.
   *
   @todo Sin transaccionalidad: si el insert de `requests` falla después de
   * subir los archivos, quedan huérfanos en el bucket. Resolver en una Edge
   * Function con cleanup (Fase 2).
   */
  async insertarPQRS(ticket: TicketPQRS): Promise<{ ref_number: string; request_id: string }> {
    const archivosSubidos = await Promise.all(
      ticket.archivos.map(async (archivo) => {
        const { data, error } = await this.client.storage
          .from(BUCKET_PQRS)
          .upload(archivo.ruta, archivo.file, { upsert: false });

        if (error) {
          throw new Error(`No se pudo adjuntar "${archivo.nombre}": ${error.message}`);
        }
        return { filepath: data.path, filename: archivo.nombre };
      }),
    );

    const nuevaSolicitud: TableInsert<'requests'> = {
      clasificacion_usuario: ticket.clasificacion_usuario,
      status: ticket.status,
      profile_id: ticket.profile_id,
      phone: ticket.phone || null,
      email: ticket.email,
      request: ticket.request,
      destination: ticket.destination,
      ref_number: ticket.ref_number,
      accept_terms: ticket.accept_terms,
    };

    const { data: requestData, error: requestError } = await this.client
      .from('requests')
      .insert(nuevaSolicitud)
      .select('id')
      .single();

    if (requestError || !requestData) {
      throw new Error(`No se pudo registrar la solicitud: ${requestError?.message ?? 'sin id'}`);
    }

    if (archivosSubidos.length > 0) {
      const { error: pathsError } = await this.client.from('request_paths').insert(
        archivosSubidos.map((archivo) => ({
          filepath: archivo.filepath,
          filename: archivo.filename,
          request_id: requestData.id,
        })),
      );

      if (pathsError) {
        throw new Error(`No se pudieron registrar los adjuntos: ${pathsError.message}`);
      }
    }

    return { ref_number: ticket.ref_number, request_id: requestData.id };
  }

  /**
   * Consulta pública por número de radicado.
   *
   * Proyecta solo las columnas que la pantalla muestra. Antes devolvía `select('*')`,
   * con lo que cualquiera con un radicado (que solo tiene 3 dígitos aleatorios)
   * podía leer `phone`, `email`, `request` y los datos del funcionario asignado.
   * @returns La fila, o `null` si no existe o hay error.
   */
  async consultarPQRS(
    radicado: string,
  ): Promise<Pick<TableRow<'requests'>, 'id' | 'clasificacion_usuario' | 'status' | 'created_at'> | null> {
    const { data, error } = await this.client
      .from('requests')
      .select('id, clasificacion_usuario, status, created_at')
      .eq('ref_number', radicado)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseService.consultarPQRS]', error.message);
      return null;
    }
    return data;
  }
}