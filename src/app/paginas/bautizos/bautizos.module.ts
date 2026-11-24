import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { BautizosPageRoutingModule } from './bautizos-routing.module';

import { BautizosPage } from './bautizos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BautizosPageRoutingModule
  ],
  declarations: [BautizosPage]
})
export class BautizosPageModule {}
