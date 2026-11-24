
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-sacramentos',
  templateUrl: './sacramentos.page.html',
  styleUrls: ['./sacramentos.page.scss'],
  standalone: false
})
export class SacramentosPage {

  constructor(
    private router: Router,
    private alertController: AlertController
  ) {}

  async abrirSacramento(nombre: string) {

    if (nombre === 'Bautizos') {
      await this.router.navigateByUrl('/bautizos');
      return;
    }

    if (nombre === 'Primeras Comuniones') {
    await this.router.navigateByUrl('/comunion');
    return;
    }

    if (nombre === 'Confirmaciones') {
    await this.router.navigateByUrl('/confirmacion');
    return;
    }

    if (nombre === 'Matrimonios') {
    await this.router.navigateByUrl('/matrimonio');
    return;
    }


    const alert = await this.alertController.create({
      header: nombre,
      message: 'Este módulo estará disponible próximamente.',
      buttons: ['Aceptar'],
      cssClass: 'alerta-iglesia'
    });

    await alert.present();
  }

  regresarMenu() {
    this.router.navigateByUrl('/principal');
  }

}
