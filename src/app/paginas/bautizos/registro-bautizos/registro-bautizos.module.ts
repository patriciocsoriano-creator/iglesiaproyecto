import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { RegistroBautizosPageRoutingModule } from './registro-bautizos-routing.module';

import { RegistroBautizosPage } from './registro-bautizos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegistroBautizosPageRoutingModule
  ],
  declarations: [RegistroBautizosPage]
})
export class RegistroBautizosPageModule {}
