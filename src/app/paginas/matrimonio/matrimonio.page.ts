
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-matrimonio',
  templateUrl: './matrimonio.page.html',
  styleUrls: ['./matrimonio.page.scss'],
  standalone: false,
})
export class MatrimonioPage {

  constructor(
    private router: Router
  ) {}

  irRegistro(): void {
    this.router.navigate(['/matrimonio/registro-matrimonio']);
  }

  irListado(): void {
    this.router.navigate(['/matrimonio/listado-matrimonio']);
  }

}