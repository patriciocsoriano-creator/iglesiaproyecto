import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { ComunionPageRoutingModule } from './comunion-routing.module';

import { ComunionPage } from './comunion.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComunionPageRoutingModule
  ],
  declarations: [ComunionPage]
})
export class ComunionPageModule {}
