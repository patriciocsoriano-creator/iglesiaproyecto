import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListadoComunionPage } from './listado-comunion.page';

const routes: Routes = [
  {
    path: '',
    component: ListadoComunionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ListadoComunionPageRoutingModule {}
