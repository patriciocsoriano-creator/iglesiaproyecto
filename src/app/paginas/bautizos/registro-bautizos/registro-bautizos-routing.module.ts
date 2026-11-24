import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegistroBautizosPage } from './registro-bautizos.page';

const routes: Routes = [
  {
    path: '',
    component: RegistroBautizosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroBautizosPageRoutingModule {}
