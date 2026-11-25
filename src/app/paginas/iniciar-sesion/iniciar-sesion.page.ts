import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { IglesiaSqliteService } from '../../servicios/iglesia-sqlite';

@Component({
  selector: 'app-iniciar-sesion',
  templateUrl: './iniciar-sesion.page.html',
  styleUrls: ['./iniciar-sesion.page.scss'],
  standalone: false
})
export class IniciarSesionPage implements OnInit {

  usuario: string = '';
  contrasena: string = '';

  contrasenaVisible: boolean = false;
  mensaje: string = '';
  mensajeExito: string = '';

  cargando: boolean = false;
  importando: boolean = false;

  anioActual: number = new Date().getFullYear();

  get iglesiaEsMovil(): boolean {
  return Capacitor.isNativePlatform();
}

  constructor(
    private router: Router,
    private iglesiaSqlite: IglesiaSqliteService
  ) {}

  ngOnInit() {}

  alternarContrasena() {
    this.contrasenaVisible = !this.contrasenaVisible;
  }

  // =====================================================
  // INICIAR SESIÓN
  // =====================================================

  async iniciarSesion() {

    this.mensaje = '';
    this.mensajeExito = '';

    if (!this.usuario.trim()) {
      this.mensaje = 'Por favor, ingresa tu usuario.';
      return;
    }

    if (!this.contrasena) {
      this.mensaje = 'Por favor, ingresa tu contraseña.';
      return;
    }

    this.cargando = true;

    try {

      let respuesta: any;

      if (Capacitor.isNativePlatform()) {

        respuesta = await this.iglesiaSqlite.autenticarUsuario(
          this.usuario.trim(),
          this.contrasena
        );

      } else {

        if (!window.iglesia?.auth?.login) {
          throw new Error(
            'El servicio de autenticación de Windows no está disponible.'
          );
        }

        respuesta = await window.iglesia.auth.login({
          usuario: this.usuario.trim(),
          contrasena: this.contrasena
        });

      }

      if (!respuesta || !respuesta.success) {
        this.mensaje =
          respuesta?.message || 'Usuario o contraseña incorrectos.';
        return;
      }

      console.log('Usuario autenticado:', respuesta.user);

      await this.router.navigateByUrl('/principal', {
        replaceUrl: true
      });

    } catch (error) {

      console.error('Error de autenticación:', error);

      this.mensaje = Capacitor.isNativePlatform()
        ? 'No se pudo acceder a la base de datos del dispositivo.'
        : 'No se pudo conectar con la base de datos local.';

    } finally {

      this.cargando = false;

    }
  }

  // =====================================================
  // IMPORTAR RESPALDO DESDE EL INICIO DE SESIÓN
  // =====================================================

  async importarRespaldo(event: Event) {

    this.mensaje = '';
    this.mensajeExito = '';

    const elemento = event.target as HTMLInputElement;
    const archivo = elemento.files?.[0];

    if (!archivo) {
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      this.mensaje = 'Esta opción está disponible en dispositivos móviles.';
      elemento.value = '';
      return;
    }

    if (!archivo.name.toLowerCase().endsWith('.json')) {
      this.mensaje = 'Selecciona un archivo de respaldo con extensión .json.';
      elemento.value = '';
      return;
    }

    this.importando = true;

    try {

      const resultado = await this.iglesiaSqlite.importarArchivo(archivo);

      if (!resultado || !resultado.success) {
        throw new Error(
          resultado?.message || 'No se pudo importar el respaldo.'
        );
      }

      this.usuario = 'admin';

      this.mensajeExito =
        'Respaldo importado correctamente. Ya puedes iniciar sesión con tus credenciales de Windows.';

      console.log('Respaldo importado:', resultado);

    } catch (error: any) {

      console.error('Error al importar respaldo:', error);

      this.mensaje = error?.message ||
        'No se pudo importar el respaldo.';

    } finally {

      this.importando = false;
      elemento.value = '';

    }
  }

}