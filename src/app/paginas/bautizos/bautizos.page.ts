
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bautizos',
  templateUrl: './bautizos.page.html',
  styleUrls: ['./bautizos.page.scss'],
  standalone: false
})
export class BautizosPage {

  constructor(private router: Router) {}

  abrirRegistro() {
    this.router.navigateByUrl('/bautizos/registro-bautizos');
  }

  abrirListado() {
    this.router.navigateByUrl('/bautizos/listado-bautizos');
  }

  regresar() {
    this.router.navigateByUrl('/sacramentos');
  }
}
