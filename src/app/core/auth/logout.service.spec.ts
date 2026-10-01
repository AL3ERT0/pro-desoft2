import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { LogoutService } from './logout.service';
import { AuthService } from './auth.service';

describe('LogoutService', () => {
  let service: LogoutService;
  let cerrarSesion: ReturnType<typeof vi.fn>;
  let navegar: ReturnType<typeof vi.fn>;
  let fire: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    cerrarSesion = vi.fn().mockResolvedValue(undefined);
    navegar = vi.fn().mockResolvedValue(true);
    fire = vi.spyOn(Swal, 'fire');

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { cerrarSesion } },
        { provide: Router, useValue: { navigateByUrl: navegar } },
      ],
    });

    service = TestBed.inject(LogoutService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('cierra la sesión y regresa a la portada', async () => {
    fire.mockResolvedValue({ isConfirmed: true } as never);

    await expect(service.cerrar()).resolves.toBe(true);
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
  });

  it('reemplaza la entrada del historial en vez de apilar', async () => {
    fire.mockResolvedValue({ isConfirmed: true } as never);

    await service.cerrar();

    // Sin replaceUrl el botón "atrás" volvería a la ruta privada, el guard la
    // rechazaría por sesión cerrada y el usuario caería en la portada con un
    // ?redireccion= en la URL.
    expect(navegar).toHaveBeenCalledWith('/', { replaceUrl: true });
  });

  it('no cierra la sesión si el usuario cancela', async () => {
    fire.mockResolvedValue({ isConfirmed: false } as never);

    await expect(service.cerrar()).resolves.toBe(false);
    expect(cerrarSesion).not.toHaveBeenCalled();
    expect(navegar).not.toHaveBeenCalled();
  });

  it('libera el estado enCurso y avisa cuando falla el cierre', async () => {
    fire.mockResolvedValue({ isConfirmed: true } as never);
    cerrarSesion.mockRejectedValue(new Error('red caída'));

    await expect(service.cerrar()).resolves.toBe(false);

    // Una llamada al diálogo y otra al aviso de error.
    expect(fire).toHaveBeenCalledTimes(2);
    expect(service.enCurso()).toBe(false);
  });

  it('ignora un segundo clic mientras el cierre está en curso', async () => {
    fire.mockResolvedValue({ isConfirmed: true } as never);
    service.enCurso.set(true);

    await expect(service.cerrar()).resolves.toBe(false);
    expect(fire).not.toHaveBeenCalled();
    expect(cerrarSesion).not.toHaveBeenCalled();
  });
});