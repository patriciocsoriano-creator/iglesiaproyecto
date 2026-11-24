import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegistroConfirmacionPage } from './registro-confirmacion.page';

const routes: Routes = [
  {
    path: '',
    component: RegistroConfirmacionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroConfirmacionPageRoutingModule {}
