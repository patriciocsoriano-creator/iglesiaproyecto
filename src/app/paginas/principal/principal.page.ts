
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-principal',
  templateUrl: './principal.page.html',
  styleUrls: ['./principal.page.scss'],
  standalone: false
})
export class PrincipalPage {

  constructor(
    private alertController: AlertController,
    private router: Router
  ) {}

  async abrirModulo(modulo: string) {

     // Abrir la ventana de Sacramentos.
    if (modulo === 'Sacramentos') {
      await this.router.navigateByUrl('/sacramentos');
      return;
    }

    if (modulo === 'Mantenimiento'){
      await this.router.navigateByUrl('/mantenimiento');
      return;
    }

    const alert = await this.alertController.create({
      header: modulo,
      message: 'Este módulo estará disponible próximamente.',
      buttons: ['Aceptar'],
      cssClass: 'alerta-iglesia'
    });

    await alert.present();
  }

}
