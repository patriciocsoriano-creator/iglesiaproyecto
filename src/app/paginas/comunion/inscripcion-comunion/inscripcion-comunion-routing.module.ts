import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InscripcionComunionPage } from './inscripcion-comunion.page';

const routes: Routes = [
  {
    path: '',
    component: InscripcionComunionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InscripcionComunionPageRoutingModule {}
