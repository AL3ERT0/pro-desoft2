import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../core/auth/auth.service';
import type { TableRow } from '../../core/models/database.types';
import { ChromeBannerComponent, ChromeContactComponent, ChromeFooterComponent } from '../../shared/chrome';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ChromeBannerComponent, ChromeContactComponent, ChromeFooterComponent],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.scss'],
})
export class UsuariosComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  readonly usuarios = signal<TableRow<'profiles'>[]>([]);
  readonly roles = signal<TableRow<'profile_roles'>[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal(false);

  /** Roles tal como estaban al cargar, para detectar cambios reales. */
  private readonly rolesOriginales = new Map<string, string | null>();

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      const [roles, perfiles] = await Promise.all([
        this.cargarRoles(),
        this.cargarUsuarios(),
      ]);
      this.roles.set(roles);
      this.usuarios.set(perfiles);
      this.rolesOriginales.clear();
      for (const perfil of perfiles) {
        this.rolesOriginales.set(perfil.id, perfil.role_id);
      }
    } catch (error) {
      console.error('[UsuariosComponent.cargar]', error);
      await Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargarRoles(): Promise<TableRow<'profile_roles'>[]> {
    const { data, error } = await this.supabase.client
      .from('profile_roles')
      .select('id, name')
      .order('name');

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /**
   * Usa el RPC `get_all_profiles` en lugar de `select('*')` sobre `profiles`:
   * deja de pedir el DNI de todos los ciudadanos al navegador de cada admin.
   *
   * @todo Confirmar qué columnas expone el RPC. Si devuelve `profiles` tal
   *   cual, sigue filtrando el DNI al cliente y conviene projectionarlo en SQL.
   */
  private async cargarUsuarios(): Promise<TableRow<'profiles'>[]> {
    const { data, error } = await this.supabase.client.rpc('get_all_profiles');

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  nombreCompleto(perfil: TableRow<'profiles'>): string {
    const nombre = [perfil.name, perfil.surname].filter(Boolean).join(' ').trim();
    return nombre || perfil.dni || 'Sin nombre';
  }

  nombreRol(rol: string | null | undefined): string {
    const encontrado = this.roles().find((r) => r.id === rol);
    return encontrado?.name ?? 'Sin rol';
  }

  async guardarCambios(): Promise<void> {
    const modificados = this.usuarios().filter(
      (perfil) => perfil.role_id !== this.rolesOriginales.get(perfil.id),
    );

    if (modificados.length === 0) {
      await Swal.fire('Sin cambios', 'No has modificado ningún rol.', 'info');
      return;
    }

    this.guardando.set(true);
    const errores: string[] = [];

    try {
      for (const perfil of modificados) {
        const { error } = await this.supabase.client
          .from('profiles')
          .update({ role_id: perfil.role_id })
          .eq('id', perfil.id);

        if (error) {
          errores.push(this.nombreCompleto(perfil));
        } else {
          this.rolesOriginales.set(perfil.id, perfil.role_id);
        }
      }

      // Si el admin cambió su propio rol, su sesión deja de ser válida.
      const propio = modificados.find((p) => p.id === this.auth.idUsuario());
      if (propio && propio.role_id !== null) {
        await this.auth.refrescar();
        await Swal.fire({
          icon: 'warning',
          title: 'Cambiaste tu propio rol',
          text: 'Tu sesión se actualizó. Si perdiste permisos, vuelve a iniciar sesión.',
        });
        return;
      }

      if (errores.length > 0) {
        await Swal.fire(
          'Error parcial',
          `No se pudo actualizar: ${errores.join(', ')}`,
          'warning',
        );
      } else {
        await Swal.fire({
          icon: 'success',
          title: '¡Guardado!',
          text: `Se actualizaron ${modificados.length} usuario(s) correctamente.`,
          timer: 1800,
          showConfirmButton: false,
        });
      }
    } finally {
      this.guardando.set(false);
    }
  }
}