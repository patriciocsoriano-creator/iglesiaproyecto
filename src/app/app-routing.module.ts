
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then(m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'iniciar-sesion',
    pathMatch: 'full'
  },
  {
    path: 'iniciar-sesion',
    loadChildren: () =>
      import('./paginas/iniciar-sesion/iniciar-sesion.module')
        .then(m => m.IniciarSesionPageModule)
  },
  {
    path: 'principal',
    loadChildren: () =>
      import('./paginas/principal/principal.module')
        .then(m => m.PrincipalPageModule)
  },
  {
    path: 'sacramentos',
    loadChildren: () =>
      import('./paginas/sacramentos/sacramentos.module')
        .then(m => m.SacramentosPageModule)
  },
  {
    path: 'bautizos',
    loadChildren: () =>
      import('./paginas/bautizos/bautizos.module')
        .then(m => m.BautizosPageModule)
  },
  {
    path: 'mantenimiento',
    loadChildren: () => import('./paginas/mantenimiento/mantenimiento.module').then( m => m.MantenimientoPageModule)
  },
  {
    path: 'inscripcion-comunion',
    loadChildren: () => import('./paginas/comunion/inscripcion-comunion/inscripcion-comunion.module').then( m => m.InscripcionComunionPageModule)
  },
  {
    path: 'listado-comunion',
    loadChildren: () => import('./paginas/comunion/listado-comunion/listado-comunion.module').then( m => m.ListadoComunionPageModule)
  },
  {
    path: 'comunion',
    loadChildren: () => import('./paginas/comunion/comunion.module').then( m => m.ComunionPageModule)
  },
  {
    path: 'confirmacion',
    loadChildren: () => import('./paginas/confirmacion/confirmacion.module').then( m => m.ConfirmacionPageModule)
  },
  {
    path: 'matrimonio',
    loadChildren: () => import('./paginas/matrimonio/matrimonio.module').then( m => m.MatrimonioPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      useHash: true
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
