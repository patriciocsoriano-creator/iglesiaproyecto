import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { InscripcionComunionPageRoutingModule } from './inscripcion-comunion-routing.module';

import { InscripcionComunionPage } from './inscripcion-comunion.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InscripcionComunionPageRoutingModule
  ],
  declarations: [InscripcionComunionPage]
})
export class InscripcionComunionPageModule {}
