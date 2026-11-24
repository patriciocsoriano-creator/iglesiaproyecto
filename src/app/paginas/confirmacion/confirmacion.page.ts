
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-confirmacion',
  templateUrl: './confirmacion.page.html',
  styleUrls: ['./confirmacion.page.scss'],
  standalone: false,
})
export class ConfirmacionPage implements OnInit {

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {
  }

  // =========================================
  // ABRIR REGISTRO DE CONFIRMACIÓN
  // =========================================

  abrirRegistro(): void {
    this.router.navigate(['/confirmacion/registro-confirmacion']);
  }

  // =========================================
  // ABRIR LISTADO DE CONFIRMACIONES
  // =========================================

  abrirListado(): void {
    this.router.navigate(['/confirmacion/listado-confirmacion']);
  }

  // =========================================
  // REGRESAR A SACRAMENTOS
  // =========================================

  regresar(): void {
    this.router.navigate(['/sacramentos']);
  }

}