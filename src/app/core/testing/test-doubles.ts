import { Provider, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';

/**
 *dobles de prueba para los servicios que tocan la red.
 *
 * Sin esto los `should create` de los specs ejecutan `ngOnInit`, que consulta
 * la base real de producción desde el runner de tests. El cliente de Supabase
 * es público, pero eso no significa que los tests deban pegarle a la base.
 */

/**
 * Builder encadenable que siempre resuelve una respuesta vacía.
 * `client.from('requests').select('*').eq('id', x)` -> `{ data: [], error: null }`.
 */
function consultaVacia(): unknown {
  const p = new Proxy(
    () => p,
    {
      get(_objetivo, propiedad) {
        if (propiedad === 'then') {
          return (resolver: (valor: unknown) => void) =>
            resolver({ data: [], error: null, count: 0, status: 200 });
        }
        if (propiedad === 'single' || propiedad === 'maybeSingle') {
          return () => p;
        }
        return p;
      },
    },
  );
  return p;
}

export const supabaseStub = {
  client: consultaVacia(),
  signIn: async () => ({ data: null, error: null }),
  signUp: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null }),
  getSession: async () => ({ data: { session: null }, error: null }),
  selectEthnicGroup: async () => [],
  selectDocumentTypes: async () => [],
  selectDepartments: async () => [],
  selectCities: async () => [],
  getPerfil: async () => null,
  documentoYaExiste: async () => false,
  insertarPQRS: async () => ({ ref_number: 'PQR-000000000-000', request_id: null }),
  consultarPQRS: async () => null,
} as unknown as SupabaseService;

export const authStub = {
  sesion: signal<unknown>(null),
  perfil: signal<unknown>(null),
  rol: signal<unknown>(null),
  cargando: signal(false),
  estaAutenticado: signal(false),
  email: signal(''),
  idUsuario: signal<string | null>('00000000-0000-0000-0000-000000000000'),
  nombreMostrar: signal('Usuario de prueba'),
  ensureLoaded: async () => {},
  tieneRol: () => false,
  rutaInicio: () => '/dashboard',
  refrescar: async () => {},
  cerrarSesion: async () => {},
} as unknown as AuthService;

export const notificationStub = {
  enviar: async () => {},
} as unknown as NotificationService;

/** Proveedores de test que aíslan la red. Combinar con `provideRouter([])`. */
export function provideNetworkStubs(): Provider[] {
  return [
    { provide: SupabaseService, useValue: supabaseStub },
    { provide: AuthService, useValue: authStub },
    { provide: NotificationService, useValue: notificationStub },
  ];
}