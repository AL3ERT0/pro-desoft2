/**
 * Tipos del esquema Postgres, verificados contra la base de datos real el
 * 2026-09-30 (columnas confirmadas una a una contra PostgREST).
 *
 * REGENERAR:  supabase gen types typescript --project-id <ref> > src/app/core/models/database.types.ts
 *
 * Si el comando falla por falta de token, exporta el esquema desde el SQL Editor
 * con la extensión `pg_get_viewdef` sobre `information_schema` y actualiza a mano.
 * No edites las definiciones a mano esperando que persistan: el siguiente
 * `gen types` las sobrescribe.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Uuid = string;

/**
 * Los `Relationships` de abajo son los que el ORM necesita para resolver
 * embeddings anidados (`request_paths(*)`, `profiles!inner(...)`). Los nombres
 * siguen la convención `<tabla>_<columna>_fkey` de Postgres: no se leyeron del
 * catálogo, así que un `supabase gen types` puede corregirlos. Si el embed
 * falla en runtime, el nombre de la constraint es lo primero que hay que
 * revisar.
 */

export type Database = {
  public: {
    Tables: {
      profile_roles: {
        Row: { id: Uuid; name: string };
        Insert: { id?: Uuid; name: string };
        Update: { id?: Uuid; name?: string };
        Relationships: [];
      };

      profiles: {
        Row: {
          id: Uuid;
          name: string | null;
          surname: string | null;
          dni: string | null;
          dni_type_id: Uuid | null;
          sex: string | null;
          age: number | null;
          ethnic_group_id: Uuid | null;
          city_id: Uuid | null;
          role_id: Uuid | null;
          created_at: string | null;
        };
        Insert: {
          id: Uuid;
          name?: string | null;
          surname?: string | null;
          dni?: string | null;
          dni_type_id?: Uuid | null;
          sex?: string | null;
          age?: number | null;
          ethnic_group_id?: Uuid | null;
          city_id?: Uuid | null;
          role_id?: Uuid | null;
          created_at?: string | null;
        };
        Update: {
          id?: Uuid;
          name?: string | null;
          surname?: string | null;
          dni?: string | null;
          dni_type_id?: Uuid | null;
          sex?: string | null;
          age?: number | null;
          ethnic_group_id?: Uuid | null;
          city_id?: Uuid | null;
          role_id?: Uuid | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'profile_roles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_dni_type_id_fkey';
            columns: ['dni_type_id'];
            isOneToOne: false;
            referencedRelation: 'document_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_city_id_fkey';
            columns: ['city_id'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_ethnic_group_id_fkey';
            columns: ['ethnic_group_id'];
            isOneToOne: false;
            referencedRelation: 'ethnic_groups';
            referencedColumns: ['id'];
          },
        ];
      };

      departments: {
        Row: { id: Uuid; name: string };
        Insert: { id?: Uuid; name: string };
        Update: { id?: Uuid; name?: string };
        Relationships: [];
      };

      cities: {
        Row: { id: Uuid; name: string; department_id: Uuid | null };
        Insert: { id?: Uuid; name: string; department_id?: Uuid | null };
        Update: { id?: Uuid; name?: string; department_id?: Uuid | null };
        Relationships: [
          {
            foreignKeyName: 'cities_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
            referencedColumns: ['id'];
          },
        ];
      };

      document_types: {
        Row: { id: Uuid; name: string };
        Insert: { id?: Uuid; name: string };
        Update: { id?: Uuid; name?: string };
        Relationships: [];
      };

      ethnic_groups: {
        Row: { id: Uuid; name: string };
        Insert: { id?: Uuid; name: string };
        Update: { id?: Uuid; name?: string };
        Relationships: [];
      };

      requests: {
        Row: {
          id: Uuid;
          clasificacion_usuario: string | null;
          status: string | null;
          profile_id: Uuid | null;
          func_id: Uuid | null;
          phone: string | null;
          email: string | null;
          request: string | null;
          destination: string | null;
          ref_number: string | null;
          accept_terms: boolean | null;
          quien_asigno_solicitud: string | null;
          clasificacion_funcionario: string | null;
          pendiente_reclasificacion: boolean | null;
          created_at: string | null;
        };
        /**
         * NOTA: la tabla NO tiene columna `updated_at`. Para el tiempo de
         * respuesta hay que usar `request_responses.created_at`.
         * NOTA: la tabla NO tiene columna `nombre`; el nombre del ciudadano
         * vive en `profiles.name` + `profiles.surname`.
         */
        Insert: {
          id?: Uuid;
          clasificacion_usuario?: string | null;
          status?: string | null;
          profile_id?: Uuid | null;
          func_id?: Uuid | null;
          phone?: string | null;
          email?: string | null;
          request?: string | null;
          destination?: string | null;
          ref_number?: string | null;
          accept_terms?: boolean | null;
          quien_asigno_solicitud?: string | null;
          clasificacion_funcionario?: string | null;
          pendiente_reclasificacion?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: Uuid;
          clasificacion_usuario?: string | null;
          status?: string | null;
          profile_id?: Uuid | null;
          func_id?: Uuid | null;
          phone?: string | null;
          email?: string | null;
          request?: string | null;
          destination?: string | null;
          ref_number?: string | null;
          accept_terms?: boolean | null;
          quien_asigno_solicitud?: string | null;
          clasificacion_funcionario?: string | null;
          pendiente_reclasificacion?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'requests_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'requests_func_id_fkey';
            columns: ['func_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'request_paths_request_id_fkey';
            columns: ['id'];
            isOneToOne: false;
            referencedRelation: 'request_paths';
            referencedColumns: ['request_id'];
          },
          {
            foreignKeyName: 'request_responses_request_id_fkey';
            columns: ['id'];
            isOneToOne: false;
            referencedRelation: 'request_responses';
            referencedColumns: ['request_id'];
          },
        ];
      };

      request_paths: {
        Row: { id: Uuid; request_id: Uuid | null; filepath: string | null; filename: string | null };
        Insert: { id?: Uuid; request_id?: Uuid | null; filepath?: string | null; filename?: string | null };
        Update: { id?: Uuid; request_id?: Uuid | null; filepath?: string | null; filename?: string | null };
        Relationships: [
          {
            foreignKeyName: 'request_paths_request_id_fkey';
            columns: ['request_id'];
            isOneToOne: false;
            referencedRelation: 'requests';
            referencedColumns: ['id'];
          },
        ];
      };

      request_responses: {
        Row: { id: Uuid; request_id: Uuid | null; response: string | null; created_at: string | null };
        Insert: { id?: Uuid; request_id?: Uuid | null; response?: string | null; created_at?: string | null };
        Update: { id?: Uuid; request_id?: Uuid | null; response?: string | null; created_at?: string | null };
        Relationships: [
          {
            foreignKeyName: 'request_responses_request_id_fkey';
            columns: ['request_id'];
            isOneToOne: false;
            referencedRelation: 'requests';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      get_all_profiles: {
        Args: Record<never, never>;
        Returns: Database['public']['Tables']['profiles']['Row'][];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];