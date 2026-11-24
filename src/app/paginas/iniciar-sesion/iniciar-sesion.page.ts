
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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
  cargando: boolean = false;

  anioActual: number = new Date().getFullYear();

  constructor(
    private router: Router
  ) { }

  ngOnInit() { }

  alternarContrasena() {
    this.contrasenaVisible = !this.contrasenaVisible;
  }

  async iniciarSesion() {

    this.mensaje = '';

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

      const respuesta = await window.iglesia.auth.login({
        usuario: this.usuario.trim(),
        contrasena: this.contrasena
      });

      console.log('Respuesta del servidor local:', respuesta);

      if (!respuesta || !respuesta.success) {
        this.mensaje = respuesta?.message || 'Usuario o contraseña incorrectos.';
        return;
      }

      console.log('Usuario autenticado:', respuesta.user);

      // Acceso correcto: navegar al módulo principal.
      await this.router.navigateByUrl('/principal', {
        replaceUrl: true
      });

    } catch (error) {

      console.error('Error de autenticación:', error);

      this.mensaje = 'No se pudo conectar con la base de datos local.';

    } finally {

      this.cargando = false;

    }

  }

}
