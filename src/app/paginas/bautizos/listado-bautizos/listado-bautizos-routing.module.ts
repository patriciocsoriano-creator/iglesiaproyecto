import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListadoBautizosPage } from './listado-bautizos.page';

const routes: Routes = [
  {
    path: '',
    component: ListadoBautizosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ListadoBautizosPageRoutingModule {}
