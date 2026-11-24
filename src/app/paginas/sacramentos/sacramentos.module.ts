import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { SacramentosPageRoutingModule } from './sacramentos-routing.module';

import { SacramentosPage } from './sacramentos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SacramentosPageRoutingModule
  ],
  declarations: [SacramentosPage]
})
export class SacramentosPageModule {}
