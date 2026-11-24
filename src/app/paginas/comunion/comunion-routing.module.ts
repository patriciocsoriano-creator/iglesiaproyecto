import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ComunionPage } from './comunion.page';

const routes: Routes = [
  {
    path: '',
    component: ComunionPage
  },
  {
    path: 'inscripcion-comunion',
    loadChildren: () =>
      import('./inscripcion-comunion/inscripcion-comunion.module')
        .then(m => m.InscripcionComunionPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComunionPageRoutingModule {}