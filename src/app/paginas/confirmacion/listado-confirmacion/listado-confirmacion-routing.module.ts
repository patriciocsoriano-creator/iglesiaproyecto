import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListadoConfirmacionPage } from './listado-confirmacion.page';

const routes: Routes = [
  {
    path: '',
    component: ListadoConfirmacionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ListadoConfirmacionPageRoutingModule {}
