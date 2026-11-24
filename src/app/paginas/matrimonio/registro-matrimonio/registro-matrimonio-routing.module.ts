import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegistroMatrimonioPage } from './registro-matrimonio.page';

const routes: Routes = [
  {
    path: '',
    component: RegistroMatrimonioPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroMatrimonioPageRoutingModule {}
