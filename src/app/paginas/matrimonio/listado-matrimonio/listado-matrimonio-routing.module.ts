
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListadoMatrimonioPage } from './listado-matrimonio.page';

const routes: Routes = [
  {
    path: '',
    component: ListadoMatrimonioPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ListadoMatrimonioPageRoutingModule {}
