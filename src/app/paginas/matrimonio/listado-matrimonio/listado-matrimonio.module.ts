import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { ListadoMatrimonioPageRoutingModule } from './listado-matrimonio-routing.module';

import { ListadoMatrimonioPage } from './listado-matrimonio.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ListadoMatrimonioPageRoutingModule
  ],
  declarations: [ListadoMatrimonioPage]
})
export class ListadoMatrimonioPageModule {}
