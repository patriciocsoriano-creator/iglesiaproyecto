import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { RegistroMatrimonioPageRoutingModule } from './registro-matrimonio-routing.module';

import { RegistroMatrimonioPage } from './registro-matrimonio.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegistroMatrimonioPageRoutingModule
  ],
  declarations: [RegistroMatrimonioPage]
})
export class RegistroMatrimonioPageModule {}
