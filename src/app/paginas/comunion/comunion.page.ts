
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-comunion',
  templateUrl: './comunion.page.html',
  styleUrls: ['./comunion.page.scss'],
  standalone: false
})
export class ComunionPage {

  constructor(private router: Router) {}

  abrirRegistro() {
    this.router.navigateByUrl('/comunion/inscripcion-comunion');
  }

  abrirListado() {
    this.router.navigate(['/listado-comunion']);
  }

  regresar() {
    this.router.navigateByUrl('/sacramentos');
  }
}