import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfirmacionPage } from './confirmacion.page';

const routes: Routes = [
  {
    path: '',
    component: ConfirmacionPage
  },  {
    path: 'registro-confirmacion',
    loadChildren: () => import('./registro-confirmacion/registro-confirmacion.module').then( m => m.RegistroConfirmacionPageModule)
  },
  {
    path: 'listado-confirmacion',
    loadChildren: () => import('./listado-confirmacion/listado-confirmacion.module').then( m => m.ListadoConfirmacionPageModule)
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfirmacionPageRoutingModule {}
