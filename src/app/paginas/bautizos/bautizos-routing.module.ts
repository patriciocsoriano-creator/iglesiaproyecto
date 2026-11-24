import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BautizosPage } from './bautizos.page';

const routes: Routes = [
  {
    path: '',
    component: BautizosPage
  },  {
    path: 'registro-bautizos',
    loadChildren: () => import('./registro-bautizos/registro-bautizos.module').then( m => m.RegistroBautizosPageModule)
  },
  {
    path: 'listado-bautizos',
    loadChildren: () => import('./listado-bautizos/listado-bautizos.module').then( m => m.ListadoBautizosPageModule)
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BautizosPageRoutingModule {}
