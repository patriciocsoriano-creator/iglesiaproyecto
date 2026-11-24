import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SacramentosPage } from './sacramentos.page';

const routes: Routes = [
  {
    path: '',
    component: SacramentosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SacramentosPageRoutingModule {}
