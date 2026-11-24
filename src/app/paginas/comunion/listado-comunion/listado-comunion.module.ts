import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { ListadoComunionPageRoutingModule } from './listado-comunion-routing.module';

import { ListadoComunionPage } from './listado-comunion.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ListadoComunionPageRoutingModule
  ],
  declarations: [ListadoComunionPage]
})
export class ListadoComunionPageModule {}
