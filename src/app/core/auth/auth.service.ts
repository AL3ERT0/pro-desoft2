import { Injectable, computed, inject, signal } from '@angular/core';
import type { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from '../../services/supabase.service';
import { ROL, type Rol } from '../models/pqrs.types';
import type { TableRow } from '../models/database.types';

export type Perfil = TableRow<'profiles'>;

/**
 * Fuente única de verdad de "quién está conectado y qué rol tiene".
 *
 * Antes, cuatro componentes (`admin`, `funcionario`, `dashboard`, `mis-pqrs`)
 * llamaban `getSession()` por separado y cada uno implementaba su propio
 * fallback para el nombre (tres variantes distintas). Además el rol solo se
 * consultaba en el login, así que un cambio de rol hecho desde `usuarios` no se
 * reflejaba hasta que el usuario volviera a iniciar sesión.
 *
 * IMPORTANTE — esto NO es control de acceso:
 * los guards corren en el cliente y se pueden bypassear. La autorización real
 * debe vivir en las políticas RLS de Postgres.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);

  private readonly _sesion = signal<Session | null>(null);
  private readonly _perfil = signal<Perfil | null>(null);
  private readonly _rol = signal<Rol | null>(null);
  private readonly _cargando = signal(true);

  readonly sesion = this._sesion.asReadonly();
  readonly perfil = this._perfil.asReadonly();
  readonly rol = this._rol.asReadonly();
  readonly cargando = this._cargando.asReadonly();

  readonly estaAutenticado = computed(() => this._sesion() !== null);
  readonly email = computed(() => this._sesion()?.user?.email ?? '');
  readonly idUsuario = computed(() => this._sesion()?.user?.id ?? null);

  /** Nombre listo para mostrar: "Nombre Apellido", con fallback al correo. */
  readonly nombreMostrar = computed(() => {
    const desdePerfil = [this._perfil()?.name, this._perfil()?.surname]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (desdePerfil) return desdePerfil;

    const metadata = this._sesion()?.user?.user_metadata;
    const desdeMetadata = [metadata?.['full_name'], metadata?.['full_surname']]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (desdeMetadata) return desdeMetadata;

    return this.email();
  });

  private cargaEnCurso: Promise<void> | null = null;
  private usuarioEnCurso: string | null = null;

  constructor() {
    this.supabase.client.auth.onAuthStateChange((_evento, sesion) => {
      this._sesion.set(sesion);
      const usuario = sesion?.user ?? null;

      if (!usuario) {
        this.usuarioEnCurso = null;
        this._perfil.set(null);
        this._rol.set(null);
        return;
      }

      if (usuario.id !== this.usuarioEnCurso) {
        this.usuarioEnCurso = usuario.id;
        void this.cargarPerfil(usuario);
      }
    });
  }

  /**
   * Resuelve la sesión antes de que un guard decida. Memoizado: varias rutas
   * navegadas en paralelo comparten la misma promesa.
   */
  async ensureLoaded(): Promise<void> {
    if (!this._cargando()) return this.cargaEnCurso ?? Promise.resolve();

    this.cargaEnCurso ??= (async () => {
      const { data } = await this.supabase.client.auth.getSession();
      const usuario = data.session?.user ?? null;

      this._sesion.set(data.session);
      if (usuario) {
        this.usuarioEnCurso = usuario.id;
        await this.cargarPerfil(usuario);
      } else {
        this._perfil.set(null);
        this._rol.set(null);
      }
      this._cargando.set(false);
    })();

    return this.cargaEnCurso;
  }

  /**
   * Una sola consulta trae perfil y rol: `role:profile_roles(name)` es un
   * embedded resource, no un segundo round-trip.
   */
  private async cargarPerfil(usuario: User): Promise<void> {
    const { data } = await this.supabase.client
      .from('profiles')
      .select(
        'id, name, surname, dni, dni_type_id, sex, age, ethnic_group_id, city_id, role_id, created_at, role:profile_roles(name)',
      )
      .eq('id', usuario.id)
      .maybeSingle();

    if (!data) {
      // Perfil sin fila: puede ocurrir si el trigger de auth.users no lo creó.
      this._perfil.set(null);
      this._rol.set(this.aRol(usuario.user_metadata?.['role']));
      return;
    }

    const { role, ...perfil } = data as typeof data & { role: { name: string } | null };
    this._perfil.set(perfil);
    this._rol.set(this.aRol(role?.name) ?? this.aRol(usuario.user_metadata?.['role']));
  }

  private aRol(valor: unknown): Rol | null {
    if (typeof valor !== 'string') return null;
    const limpio = valor.trim().toLowerCase();
    if (limpio === ROL.ADMIN.toLowerCase()) return ROL.ADMIN;
    if (limpio === ROL.FUNCIONARIO.toLowerCase()) return ROL.FUNCIONARIO;
    if (limpio === ROL.USUARIO.toLowerCase()) return ROL.USUARIO;
    return null;
  }

  tieneRol(roles: readonly Rol[]): boolean {
    const actual = this._rol();
    return actual !== null && roles.includes(actual);
  }

  /** Ruta de inicio según el rol. Punto único de decisión tras login y logout. */
  rutaInicio(): string {
    switch (this._rol()) {
      case ROL.ADMIN:
        return '/admin';
      case ROL.FUNCIONARIO:
        return '/funcionario';
      case ROL.USUARIO:
        return '/dashboard';
      default:
        return '/';
    }
  }

  /** Fuerza la relectura del perfil; usar tras cambiar el rol de un usuario. */
  async refrescar(): Promise<void> {
    const { data } = await this.supabase.client.auth.getSession();
    const usuario = data.session?.user ?? null;

    this._sesion.set(data.session);
    this.usuarioEnCurso = usuario?.id ?? null;
    if (usuario) {
      await this.cargarPerfil(usuario);
    } else {
      this._perfil.set(null);
      this._rol.set(null);
    }
    this._cargando.set(false);
  }

  async cerrarSesion(): Promise<void> {
    await this.supabase.signOut();
    this._sesion.set(null);
    this._perfil.set(null);
    this._rol.set(null);
    this.usuarioEnCurso = null;
    this.cargaEnCurso = null;
  }
}