import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { ListadoConfirmacionPageRoutingModule } from './listado-confirmacion-routing.module';

import { ListadoConfirmacionPage } from './listado-confirmacion.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ListadoConfirmacionPageRoutingModule
  ],
  declarations: [ListadoConfirmacionPage]
})
export class ListadoConfirmacionPageModule {}
