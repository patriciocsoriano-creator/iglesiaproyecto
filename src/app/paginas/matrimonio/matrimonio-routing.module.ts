import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MatrimonioPage } from './matrimonio.page';

const routes: Routes = [
  {
    path: '',
    component: MatrimonioPage
  },  {
    path: 'registro-matrimonio',
    loadChildren: () => import('./registro-matrimonio/registro-matrimonio.module').then( m => m.RegistroMatrimonioPageModule)
  },
  {
    path: 'listado-matrimonio',
    loadChildren: () => import('./listado-matrimonio/listado-matrimonio.module').then( m => m.ListadoMatrimonioPageModule)
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MatrimonioPageRoutingModule {}
