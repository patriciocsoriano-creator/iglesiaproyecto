import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { ListadoBautizosPageRoutingModule } from './listado-bautizos-routing.module';

import { ListadoBautizosPage } from './listado-bautizos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ListadoBautizosPageRoutingModule
  ],
  declarations: [ListadoBautizosPage]
})
export class ListadoBautizosPageModule {}
