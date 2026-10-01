import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../core/auth/auth.service';
import { LogoutService } from '../core/auth/logout.service';
import { environment } from '../../environments/environment';
import Swal from 'sweetalert2';
import { ChromeBannerComponent, ChromeContactComponent, ChromeFooterComponent } from '../shared/chrome';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule, ChromeBannerComponent, ChromeContactComponent, ChromeFooterComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {

  // Control de modales
  mostrarLogin = false;
  mostrarRegister = false;

  // Login
  email = '';
  password = '';
  loadingLogin = false;

  // Register
  nombre = '';
  apellido = '';
  tipoDocumento = '';
  numeroDocumento = '';
  sexo = '';
  edad: number | null = null;
  grupoEtnico = '';
  departamento = '';
  ciudad = '';
  emailReg = '';
  confirmEmailReg = '';
  passwordReg = '';
  confirmPasswordReg = '';
  loadingRegister = false;

  // Opciones para selects
  gruposEtnicos: { id: string; name: string }[] = [];
  tiposDocumento: { id: string; name: string }[] = [];
  departamentos: { id: string; name: string }[] = [];
  ciudades: { id: string; name: string }[] = [];

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    // Expuestos al template: el header cambia según haya sesión o no, para que
    // volver atrás desde un panel no parezca un cierre de sesión.
    readonly auth: AuthService,
    readonly logout: LogoutService,
  ) {}

  async ngOnInit() {
    // La portada puede cargar con una sesión ya abierta (por ejemplo al volver
    // atrás desde un panel): sin esto el header mostraría "Iniciar Sesión".
    await this.auth.ensureLoaded();

    await this.showDepartments();
    await this.showEthnicGroups();
    await this.showDocumentTypes();
  }

  abrirLogin() {
    this.mostrarLogin = true;
    this.mostrarRegister = false;
  }

  abrirRegister() {
    this.mostrarRegister = true;
    this.mostrarLogin = false;
  }

  cerrarModales() {
    this.mostrarLogin = false;
    this.mostrarRegister = false;
  }

  abrirNormativa() {
    window.location.href = 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334';
  }

  async forgotPassword() {
    const { value: correo } = await Swal.fire({
      title: 'Recuperar contraseña',
      input: 'email',
      inputLabel: 'Ingresa tu correo electrónico',
      inputPlaceholder: 'correo@ejemplo.com',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Enviar',
      confirmButtonColor: '#870fa2',
    });

    if (correo) {
      const { error } = await this.supabase.client.auth.resetPasswordForEmail(correo, {
        redirectTo: environment.passwordRecoveryRedirectTo,
      });

      if (error) {
        Swal.fire('Error', 'No se pudo enviar el correo de recuperación', 'error');
      } else {
        Swal.fire({
          icon: 'success',
          title: '¡Correo enviado!',
          text: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
          confirmButtonColor: '#870fa2'
        });
      }
    }
  }

  async login(): Promise<void> {
    if (!this.email || !this.password) {
      Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
      return;
    }

    this.loadingLogin = true;

    try {
      const { error } = await this.supabase.signIn(this.email, this.password);

      if (error) {
        Swal.fire('Error', 'Correo o contraseña incorrectos', 'error');
        return;
      }

      // `refrescar` lee el perfil y el rol desde la BD en una sola consulta,
      // en lugar de deducir el rol de lo que el cliente acaba de escribir.
      await this.auth.refrescar();

      if (!this.auth.rol()) {
        await this.auth.cerrarSesion();
        Swal.fire(
          'Error',
          'Tu cuenta no tiene un rol asignado. Contacta a la administración.',
          'error',
        );
        return;
      }

      this.cerrarModales();
      await this.router.navigateByUrl(this.auth.rutaInicio());
    } catch {
      Swal.fire('Error', 'Ocurrió un error inesperado', 'error');
    } finally {
      this.loadingLogin = false;
    }
  }
  async register() {
    if (!this.nombre || !this.apellido || !this.tipoDocumento || !this.numeroDocumento ||
        !this.sexo || !this.edad || !this.grupoEtnico || !this.ciudad ||
        !this.emailReg || !this.confirmEmailReg || !this.passwordReg || !this.confirmPasswordReg) {
      Swal.fire('Campos incompletos', 'Todos los campos son obligatorios', 'error');
      return;
    }

    if (this.emailReg !== this.confirmEmailReg) {
      Swal.fire('Error', 'Los correos electrónicos no coinciden', 'error');
      return;
    }

    if (this.edad < 18) {
      Swal.fire('No permitido', 'El sistema no permite el registro de menores de edad', 'error');
      return;
    }

    if (this.edad > 120) {
      Swal.fire('No permitido', 'Esa edad no está en el rango válido', 'error');
      return;
    }

    if (this.passwordReg.length < 8) {
      Swal.fire('Contraseña débil', 'La contraseña debe tener mínimo 8 caracteres', 'error');
      return;
    }

    if (this.passwordReg !== this.confirmPasswordReg) {
      Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
      return;
    }

    const documentoDuplicado = await this.supabase.documentoYaExiste(this.numeroDocumento);
    if (documentoDuplicado) {
      Swal.fire('Error', 'Ya existe un usuario registrado con ese numero de documento', 'error');
      return;
    }

    this.loadingRegister = true;
    try {
      const { error } = await this.supabase.signUp({
        email: this.emailReg,
        password: this.passwordReg,
        nombre: this.nombre,
        apellido: this.apellido,
        numeroDocumento: this.numeroDocumento,
        tipoDocumentoId: this.tipoDocumento,
        sexo: this.sexo,
        edad: this.edad as number,
        grupoEtnicoId: this.grupoEtnico,
        ciudadId: this.ciudad,
      });

      if (error) {
        Swal.fire('Error', `No se pudo completar el registro: ${error.message}`, 'error');
        return;
      }

      Swal.fire({
        icon: 'success',
        title: '¡Registro exitoso!',
        text: 'Se ha registrado un perfil con su cuenta de usuario',
      });
      this.abrirLogin();
    } catch {
      Swal.fire('Error', 'Ha ocurrido un error inesperado. Vuelva a intentarlo', 'error');
    } finally {
      this.loadingRegister = false;
    }
  }

  async showDepartments(): Promise<void> {
    const { data, error } = await this.supabase.selectDepartments();
    if (error) {
      Swal.fire('Error', 'No se pudieron cargar los departamentos', 'error');
      return;
    }
    this.departamentos = data ?? [];
  }

  async onDepartmentChange(departmentId: string): Promise<void> {
    this.ciudad = '';
    this.ciudades = [];

    if (!departmentId) return;

    const { data, error } = await this.supabase.selectCities(departmentId);
    if (error) {
      Swal.fire('Error', 'No se pudieron cargar las ciudades', 'error');
      return;
    }
    this.ciudades = data ?? [];
  }

  async showEthnicGroups(): Promise<void> {
    const { data } = await this.supabase.selectEthnicGroup();
    this.gruposEtnicos = data ?? [];
  }

  async showDocumentTypes(): Promise<void> {
    const { data } = await this.supabase.selectDocumentTypes();
    this.tiposDocumento = data ?? [];
  }
}
