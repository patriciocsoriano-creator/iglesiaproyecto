import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { RegistroConfirmacionPageRoutingModule } from './registro-confirmacion-routing.module';

import { RegistroConfirmacionPage } from './registro-confirmacion.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegistroConfirmacionPageRoutingModule
  ],
  declarations: [RegistroConfirmacionPage]
})
export class RegistroConfirmacionPageModule {}
